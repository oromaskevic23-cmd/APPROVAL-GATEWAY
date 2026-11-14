# Security hardening v0.2 — APPROVAL-GATEWAY

Local persistent SQLite replay store compatible with the reference consumePermit has/add interface. Unique insert rejects duplicate consumption across connections to one database. Node 22.16.0 reports node:sqlite experimental. No distributed transaction, external execution atomicity or backup rollback resistance is claimed.

## Evidence

Local Node.js v22.16.0: 5/5 new tests passed, zero failures. Source Git blob SHA-1: `a81148b083ab6c808198c359b1417f65d7be67aa`; test Git blob SHA-1: `41f5af3c70a11025e99f5721131b0dd1d9000896`. Both match files retrieved from GitHub. Reproduce: `node --test test/replay-store.test.mjs`. No GitHub Actions run or independent QA is claimed.

## Integration boundary

Additive laboratory module; existing v0.1 APIs remain intact. Not automatically wired into a deployed service. Preserve AI Passport, Enterprise Skills, Guardian Core, Approval Gateway, Audit Ledger, federated orchestrators, HANTER, CYBER HAK, Architect Veto Protocol, Owner Kill Switch, Public/Private Boundary and CRYPTO IMPERIAL Ecosystem Boundary. No agent may bypass a veto or grant itself root authority. Real iPhone enrollment, authenticated command processing, durable state authority, resource enforcement and independent security acceptance remain pending. FREE_ONLY; no production credentials or services.
