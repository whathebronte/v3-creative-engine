# docs/security/

Security audit findings and implemented controls.

| File | Description |
|---|---|
| `SECURITY_AUDIT_REPORT.md` | Full security audit: findings, risk ratings, remediation status |
| `SECURITY_MEASURES.md` | Security controls implemented: Firestore rules, Storage rules, API key handling, CORS |

## Quick Reference

- **Firestore rules:** `firestore.rules` (root)
- **Storage rules:** `storage.rules` (root)
- **API keys:** stored in `functions/.env` (not committed) and Firebase Config
- **CORS:** handled in Cloud Functions with `cors` + `helmet` middleware
