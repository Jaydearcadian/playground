# Private Project Settlement

A Nimiq Pay Mini App prototype for confidential multi-provider work coordination and conditional settlement.

## MVP claim

A customer funds one project, invites multiple providers into role-specific sub-deals, receives immutable deliverable commitments, requires customer-plus-verifier approval, pays approved providers, replaces expired providers without resetting the project, and receives unused escrow back.

This MVP provides application-level commercial privacy. It does not claim public-chain transaction anonymity.

## Contract lifecycle

1. `createDeal`
2. `inviteProvider` for each obligation
3. Customer approves the token and calls `fundDeal`
4. Provider calls `acceptObligation`
5. Provider hashes the encrypted artefact and calls `submitDeliverable`
6. Customer and verifier independently call `approveDeliverable`
7. Provider calls `claimPayment`
8. Customer calls `finalizeDeal` after all obligations are paid
9. Unallocated escrow is returned automatically

An invited or accepted provider whose deadline expires can be replaced through `replaceExpiredProvider` without disturbing other obligations.

## Verification model

The contract verifies process integrity, not subjective quality:

- the accepted private terms are committed by hash;
- a non-empty deliverable commitment is submitted before the deadline;
- the customer and appointed verifier approve the same commitment;
- the provider can claim only once;
- the project cannot finalise until every obligation has been paid.

The browser helper in `app/src/evidence.ts` computes:

- SHA-256 of the deliverable bytes;
- SHA-256 of canonical metadata including deal, obligation, version and file hash.

## Run contracts

```bash
cd blinded-deal-engine
forge test -vv
```

## Mini App

```bash
cd blinded-deal-engine/app
npm install
npm run dev
```

The Mini App will use Nimiq Pay's injected EVM provider for user-approved contract interactions. The app scaffold is intentionally minimal until the contract ABI and deployment are stable.

## Three-day scope lock

- one customer;
- three service-provider obligations;
- one verifier;
- one ERC-20 settlement token;
- one EVM test network;
- browser-side evidence hashing;
- customer-plus-verifier approval;
- provider replacement after expiry;
- surplus refund.

Deferred: shielded settlement, arbitrary legal contracts, native NIM/EVM atomic swaps, custom ZK circuits, provider marketplace, decentralised arbitration and dynamic bidding.
