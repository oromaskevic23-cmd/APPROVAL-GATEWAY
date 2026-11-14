<p align="center"><img src="assets/branding/banner.svg" alt="APPROVAL GATEWAY — Authorization & Execution Control" width="100%"/></p>

# APPROVAL GATEWAY

**Authorization & Execution Control · IMPERIAL Core**

*No execution without authority.*

Verifies Ed25519-signed laboratory execution permits, exact target digest, current veto epoch, scope, expiry and single-use consumption in a single synchronous process.

**Status: LOCAL TESTED REFERENCE / INDEPENDENT QA PENDING.** No production deployment, certification or real Owner enrollment is claimed.

## Quick start

Node.js 22+; no external dependencies or paid services.

```sh
npm test
```

API: `permitBytes(payload); consumePermit(envelope, trustedKeys, expected, state, used, now)`.

- [Architecture and release gates](ARCHITECTURE.md)
- [Threat model](THREAT_MODEL.md)
- [Security policy](SECURITY.md)
- [Source](src/index.mjs) · [Tests](test/reference.test.mjs) · [Local test evidence](evidence/LOCAL_TEST_EVIDENCE.md)
- [Authorship](AUTHORS.md) · [Roadmap](ROADMAP.md)

## Limitations

No approval issuer, real Owner enrollment, Face ID, database transactions, distributed replay protection or external execution. Trusted state and used-set are supplied by a laboratory host.

## Related components

[ZERO TRUST](https://github.com/oromaskevic23-cmd/ZERO-TRUST) · [GUARDIAN CORE](https://github.com/oromaskevic23-cmd/GUARDIAN-CORE) · [APPROVAL GATEWAY](https://github.com/oromaskevic23-cmd/APPROVAL-GATEWAY) · [AUDIT LEDGER](https://github.com/oromaskevic23-cmd/AUDIT-LEDGER) · [CYBER HAK](https://github.com/oromaskevic23-cmd/CYBER-HAK-Public)

## Founder and authorship

<p align="center"><img src="https://raw.githubusercontent.com/oromaskevic23-cmd/oromaskevic23-cmd/main/assets/alexander-romaskevich-portrait-20261110.jpg" alt="Alexander Romaskevich" width="160"/></p>

**Alexander Nikolaevich Romaskevich (RomaskevicH)** — Founder • Owner • CEO, IMPERIAL Core. Architect / Final Architectural Decision Authority.

Public source visibility is not a license grant. See [LICENSE](LICENSE).

**Architecture Before Implementation. Evidence Before Trust.**
