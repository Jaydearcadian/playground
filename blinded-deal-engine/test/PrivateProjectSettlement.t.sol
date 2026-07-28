// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PrivateProjectSettlement} from "../src/PrivateProjectSettlement.sol";
import {MockUSDT} from "../src/MockUSDT.sol";

interface Vm {
    function prank(address) external;
    function startPrank(address) external;
    function stopPrank() external;
    function warp(uint256) external;
    function expectRevert(bytes calldata) external;
}

contract PrivateProjectSettlementTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    PrivateProjectSettlement private settlement;
    MockUSDT private token;

    address private constant CUSTOMER = address(0xC0570);
    address private constant VERIFIER = address(0xA11CE);
    address private constant DESIGNER = address(0xD3516);
    address private constant WRITER = address(0xB0B);
    address private constant REPLACEMENT = address(0xCAFE);

    uint256 private constant UNIT = 1e6;

    function setUp() public {
        settlement = new PrivateProjectSettlement();
        token = new MockUSDT();
        token.mint(CUSTOMER, 3_000 * UNIT);
    }

    function testEndToEndSettlementAndRefund() public {
        uint64 dealDeadline = uint64(block.timestamp + 7 days);

        vm.prank(CUSTOMER);
        uint256 dealId = settlement.createDeal(
            address(token),
            VERIFIER,
            3_000 * UNIT,
            dealDeadline,
            keccak256("launch-campaign-v1")
        );

        vm.startPrank(CUSTOMER);
        settlement.inviteProvider(
            dealId,
            DESIGNER,
            800 * UNIT,
            uint64(block.timestamp + 3 days),
            keccak256("designer-private-terms")
        );
        settlement.inviteProvider(
            dealId,
            WRITER,
            500 * UNIT,
            uint64(block.timestamp + 3 days),
            keccak256("writer-private-terms")
        );
        token.approve(address(settlement), 3_000 * UNIT);
        settlement.fundDeal(dealId);
        vm.stopPrank();

        vm.prank(DESIGNER);
        settlement.acceptObligation(dealId, 0);
        vm.prank(WRITER);
        settlement.acceptObligation(dealId, 1);

        bytes32 designHash = keccak256("encrypted-design-v1");
        bytes32 copyHash = keccak256("encrypted-copy-v1");
        vm.prank(DESIGNER);
        settlement.submitDeliverable(dealId, 0, designHash);
        vm.prank(WRITER);
        settlement.submitDeliverable(dealId, 1, copyHash);

        vm.prank(CUSTOMER);
        settlement.approveDeliverable(dealId, 0);
        vm.prank(VERIFIER);
        settlement.approveDeliverable(dealId, 0);
        vm.prank(CUSTOMER);
        settlement.approveDeliverable(dealId, 1);
        vm.prank(VERIFIER);
        settlement.approveDeliverable(dealId, 1);

        vm.prank(DESIGNER);
        settlement.claimPayment(dealId, 0);
        vm.prank(WRITER);
        settlement.claimPayment(dealId, 1);

        assertEq(token.balanceOf(DESIGNER), 800 * UNIT, "designer not paid");
        assertEq(token.balanceOf(WRITER), 500 * UNIT, "writer not paid");

        vm.prank(CUSTOMER);
        settlement.finalizeDeal(dealId);

        assertEq(token.balanceOf(CUSTOMER), 1_700 * UNIT, "surplus not refunded");
        (, , , , , , , , , PrivateProjectSettlement.DealState state) = settlement.deals(dealId);
        assertEq(uint256(state), uint256(PrivateProjectSettlement.DealState.Settled), "deal not settled");
    }

    function testExpiredProviderCanBeReplacedWithoutResettingDeal() public {
        uint64 dealDeadline = uint64(block.timestamp + 10 days);

        vm.prank(CUSTOMER);
        uint256 dealId = settlement.createDeal(
            address(token),
            VERIFIER,
            3_000 * UNIT,
            dealDeadline,
            keccak256("replacement-demo")
        );

        uint64 providerDeadline = uint64(block.timestamp + 1 days);
        vm.startPrank(CUSTOMER);
        settlement.inviteProvider(
            dealId,
            WRITER,
            500 * UNIT,
            providerDeadline,
            keccak256("original-writer-terms")
        );
        token.approve(address(settlement), 3_000 * UNIT);
        settlement.fundDeal(dealId);
        vm.stopPrank();

        vm.warp(uint256(providerDeadline) + 1);

        vm.prank(CUSTOMER);
        settlement.replaceExpiredProvider(
            dealId,
            0,
            REPLACEMENT,
            uint64(block.timestamp + 2 days),
            keccak256("replacement-writer-terms")
        );

        vm.expectRevert(bytes("NOT_PROVIDER"));
        vm.prank(WRITER);
        settlement.acceptObligation(dealId, 0);

        vm.prank(REPLACEMENT);
        settlement.acceptObligation(dealId, 0);

        (address provider, , , , , , PrivateProjectSettlement.ObligationState state) = settlement.obligations(dealId, 0);
        assertEq(provider, REPLACEMENT, "provider not replaced");
        assertEq(uint256(state), uint256(PrivateProjectSettlement.ObligationState.Accepted), "replacement not accepted");
    }

    function testCannotPayWithOnlyOneApproval() public {
        vm.prank(CUSTOMER);
        uint256 dealId = settlement.createDeal(
            address(token),
            VERIFIER,
            1_000 * UNIT,
            uint64(block.timestamp + 4 days),
            keccak256("two-party-approval")
        );

        vm.startPrank(CUSTOMER);
        settlement.inviteProvider(
            dealId,
            DESIGNER,
            1_000 * UNIT,
            uint64(block.timestamp + 2 days),
            keccak256("design-terms")
        );
        token.approve(address(settlement), 1_000 * UNIT);
        settlement.fundDeal(dealId);
        vm.stopPrank();

        vm.prank(DESIGNER);
        settlement.acceptObligation(dealId, 0);
        vm.prank(DESIGNER);
        settlement.submitDeliverable(dealId, 0, keccak256("design"));
        vm.prank(CUSTOMER);
        settlement.approveDeliverable(dealId, 0);

        vm.expectRevert(bytes("NOT_APPROVED"));
        vm.prank(DESIGNER);
        settlement.claimPayment(dealId, 0);
    }

    function assertEq(uint256 actual, uint256 expected, string memory message) internal pure {
        require(actual == expected, message);
    }

    function assertEq(address actual, address expected, string memory message) internal pure {
        require(actual == expected, message);
    }
}
