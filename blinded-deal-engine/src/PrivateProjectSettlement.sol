// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20Like {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract PrivateProjectSettlement {
    enum DealState {
        None,
        Open,
        Active,
        Settled,
        Cancelled
    }

    enum ObligationState {
        None,
        Invited,
        Accepted,
        Submitted,
        Approved,
        Paid,
        Expired
    }

    struct Deal {
        address customer;
        address verifier;
        address token;
        uint64 deadline;
        uint32 obligationCount;
        uint32 paidCount;
        uint256 totalBudget;
        uint256 allocatedBudget;
        uint256 fundedAmount;
        bytes32 masterTermsHash;
        DealState state;
    }

    struct Obligation {
        address provider;
        uint64 deadline;
        uint8 approvals;
        uint256 payment;
        bytes32 privateTermsHash;
        bytes32 deliverableHash;
        ObligationState state;
    }

    uint256 public nextDealId = 1;
    bool private locked;

    mapping(uint256 => Deal) public deals;
    mapping(uint256 => mapping(uint256 => Obligation)) public obligations;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasApproved;

    event DealCreated(uint256 indexed dealId, address indexed customer, address indexed token, uint256 totalBudget);
    event DealFunded(uint256 indexed dealId, uint256 amount);
    event ObligationInvited(uint256 indexed dealId, uint256 indexed obligationId, address indexed provider, uint256 payment);
    event ObligationAccepted(uint256 indexed dealId, uint256 indexed obligationId, address indexed provider);
    event DeliverableSubmitted(uint256 indexed dealId, uint256 indexed obligationId, bytes32 deliverableHash);
    event DeliverableApproved(uint256 indexed dealId, uint256 indexed obligationId, address indexed approver, uint8 approvals);
    event ProviderReplaced(uint256 indexed dealId, uint256 indexed obligationId, address indexed oldProvider, address newProvider);
    event ProviderPaid(uint256 indexed dealId, uint256 indexed obligationId, address indexed provider, uint256 amount);
    event DealSettled(uint256 indexed dealId, uint256 refundedAmount);
    event DealCancelled(uint256 indexed dealId, uint256 refundedAmount);

    modifier nonReentrant() {
        require(!locked, "REENTRANCY");
        locked = true;
        _;
        locked = false;
    }

    modifier onlyCustomer(uint256 dealId) {
        require(msg.sender == deals[dealId].customer, "NOT_CUSTOMER");
        _;
    }

    function createDeal(
        address token,
        address verifier,
        uint256 totalBudget,
        uint64 deadline,
        bytes32 masterTermsHash
    ) external returns (uint256 dealId) {
        require(token != address(0) && verifier != address(0), "ZERO_ADDRESS");
        require(totalBudget > 0, "ZERO_BUDGET");
        require(deadline > block.timestamp, "BAD_DEADLINE");
        require(masterTermsHash != bytes32(0), "EMPTY_TERMS");

        dealId = nextDealId++;
        deals[dealId] = Deal({
            customer: msg.sender,
            verifier: verifier,
            token: token,
            deadline: deadline,
            obligationCount: 0,
            paidCount: 0,
            totalBudget: totalBudget,
            allocatedBudget: 0,
            fundedAmount: 0,
            masterTermsHash: masterTermsHash,
            state: DealState.Open
        });

        emit DealCreated(dealId, msg.sender, token, totalBudget);
    }

    function inviteProvider(
        uint256 dealId,
        address provider,
        uint256 payment,
        uint64 deadline,
        bytes32 privateTermsHash
    ) external onlyCustomer(dealId) returns (uint256 obligationId) {
        Deal storage deal = deals[dealId];
        require(deal.state == DealState.Open || deal.state == DealState.Active, "DEAL_CLOSED");
        require(provider != address(0), "ZERO_PROVIDER");
        require(payment > 0, "ZERO_PAYMENT");
        require(deadline > block.timestamp && deadline <= deal.deadline, "BAD_DEADLINE");
        require(privateTermsHash != bytes32(0), "EMPTY_TERMS");
        require(deal.allocatedBudget + payment <= deal.totalBudget, "BUDGET_EXCEEDED");

        obligationId = deal.obligationCount++;
        obligations[dealId][obligationId] = Obligation({
            provider: provider,
            deadline: deadline,
            approvals: 0,
            payment: payment,
            privateTermsHash: privateTermsHash,
            deliverableHash: bytes32(0),
            state: ObligationState.Invited
        });
        deal.allocatedBudget += payment;

        emit ObligationInvited(dealId, obligationId, provider, payment);
    }

    function fundDeal(uint256 dealId) external onlyCustomer(dealId) nonReentrant {
        Deal storage deal = deals[dealId];
        require(deal.state == DealState.Open, "NOT_OPEN");
        require(deal.allocatedBudget > 0, "NO_OBLIGATIONS");
        require(deal.fundedAmount == 0, "ALREADY_FUNDED");
        require(IERC20Like(deal.token).transferFrom(msg.sender, address(this), deal.totalBudget), "TRANSFER_FAILED");

        deal.fundedAmount = deal.totalBudget;
        deal.state = DealState.Active;
        emit DealFunded(dealId, deal.totalBudget);
    }

    function acceptObligation(uint256 dealId, uint256 obligationId) external {
        Deal storage deal = deals[dealId];
        Obligation storage obligation = obligations[dealId][obligationId];
        require(deal.state == DealState.Active, "DEAL_NOT_ACTIVE");
        require(msg.sender == obligation.provider, "NOT_PROVIDER");
        require(obligation.state == ObligationState.Invited, "NOT_INVITED");
        require(block.timestamp <= obligation.deadline, "EXPIRED");

        obligation.state = ObligationState.Accepted;
        emit ObligationAccepted(dealId, obligationId, msg.sender);
    }

    function submitDeliverable(uint256 dealId, uint256 obligationId, bytes32 deliverableHash) external {
        Deal storage deal = deals[dealId];
        Obligation storage obligation = obligations[dealId][obligationId];
        require(deal.state == DealState.Active, "DEAL_NOT_ACTIVE");
        require(msg.sender == obligation.provider, "NOT_PROVIDER");
        require(obligation.state == ObligationState.Accepted, "NOT_ACCEPTED");
        require(block.timestamp <= obligation.deadline, "EXPIRED");
        require(deliverableHash != bytes32(0), "EMPTY_DELIVERABLE");

        obligation.deliverableHash = deliverableHash;
        obligation.state = ObligationState.Submitted;
        emit DeliverableSubmitted(dealId, obligationId, deliverableHash);
    }

    function approveDeliverable(uint256 dealId, uint256 obligationId) external {
        Deal storage deal = deals[dealId];
        Obligation storage obligation = obligations[dealId][obligationId];
        require(deal.state == DealState.Active, "DEAL_NOT_ACTIVE");
        require(msg.sender == deal.customer || msg.sender == deal.verifier, "NOT_APPROVER");
        require(obligation.state == ObligationState.Submitted, "NOT_SUBMITTED");
        require(!hasApproved[dealId][obligationId][msg.sender], "ALREADY_APPROVED");

        hasApproved[dealId][obligationId][msg.sender] = true;
        obligation.approvals += 1;
        if (obligation.approvals == 2) {
            obligation.state = ObligationState.Approved;
        }

        emit DeliverableApproved(dealId, obligationId, msg.sender, obligation.approvals);
    }

    function replaceExpiredProvider(
        uint256 dealId,
        uint256 obligationId,
        address newProvider,
        uint64 newDeadline,
        bytes32 newPrivateTermsHash
    ) external onlyCustomer(dealId) {
        Deal storage deal = deals[dealId];
        Obligation storage obligation = obligations[dealId][obligationId];
        require(deal.state == DealState.Active, "DEAL_NOT_ACTIVE");
        require(block.timestamp > obligation.deadline, "NOT_EXPIRED");
        require(
            obligation.state == ObligationState.Invited ||
            obligation.state == ObligationState.Accepted,
            "CANNOT_REPLACE"
        );
        require(newProvider != address(0), "ZERO_PROVIDER");
        require(newDeadline > block.timestamp && newDeadline <= deal.deadline, "BAD_DEADLINE");
        require(newPrivateTermsHash != bytes32(0), "EMPTY_TERMS");

        address oldProvider = obligation.provider;
        obligation.provider = newProvider;
        obligation.deadline = newDeadline;
        obligation.privateTermsHash = newPrivateTermsHash;
        obligation.deliverableHash = bytes32(0);
        obligation.approvals = 0;
        obligation.state = ObligationState.Invited;

        emit ProviderReplaced(dealId, obligationId, oldProvider, newProvider);
    }

    function claimPayment(uint256 dealId, uint256 obligationId) external nonReentrant {
        Deal storage deal = deals[dealId];
        Obligation storage obligation = obligations[dealId][obligationId];
        require(deal.state == DealState.Active, "DEAL_NOT_ACTIVE");
        require(msg.sender == obligation.provider, "NOT_PROVIDER");
        require(obligation.state == ObligationState.Approved, "NOT_APPROVED");
        require(deal.fundedAmount >= obligation.payment, "INSUFFICIENT_ESCROW");

        obligation.state = ObligationState.Paid;
        deal.paidCount += 1;
        deal.fundedAmount -= obligation.payment;
        require(IERC20Like(deal.token).transfer(msg.sender, obligation.payment), "TRANSFER_FAILED");

        emit ProviderPaid(dealId, obligationId, msg.sender, obligation.payment);
    }

    function finalizeDeal(uint256 dealId) external onlyCustomer(dealId) nonReentrant {
        Deal storage deal = deals[dealId];
        require(deal.state == DealState.Active, "DEAL_NOT_ACTIVE");
        require(deal.obligationCount > 0 && deal.paidCount == deal.obligationCount, "OBLIGATIONS_INCOMPLETE");

        uint256 refund = deal.fundedAmount;
        deal.fundedAmount = 0;
        deal.state = DealState.Settled;
        if (refund > 0) {
            require(IERC20Like(deal.token).transfer(deal.customer, refund), "REFUND_FAILED");
        }

        emit DealSettled(dealId, refund);
    }

    function cancelAndRefund(uint256 dealId) external onlyCustomer(dealId) nonReentrant {
        Deal storage deal = deals[dealId];
        require(deal.state == DealState.Open || deal.state == DealState.Active, "DEAL_CLOSED");
        require(block.timestamp > deal.deadline, "DEADLINE_NOT_REACHED");

        uint256 refund = deal.fundedAmount;
        deal.fundedAmount = 0;
        deal.state = DealState.Cancelled;
        if (refund > 0) {
            require(IERC20Like(deal.token).transfer(deal.customer, refund), "REFUND_FAILED");
        }

        emit DealCancelled(dealId, refund);
    }
}
