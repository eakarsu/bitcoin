# Security policy

Report vulnerabilities privately to the repository owner, preferably through
a private GitHub security advisory. Include the affected commit, request path,
tenant and role assumptions, and a minimal reproducer without real credentials.

Treat authentication, tenant membership, risk limits, approval independence,
provider signatures, journal corrections, source licensing, and kill-switch
logic as security-sensitive. Never commit `.env`, JWT/provider secrets, bank or
broker credentials, customer data, or production exports. Production must keep
`ENABLE_LEGACY_DEMO_SURFACES=false`.

This repository is a paper-trading system and is not approved for custody or
live execution. See `RUNBOOK.md` for incident and release gates.
