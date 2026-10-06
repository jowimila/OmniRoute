# Agent Skills Safety Audit Report

**Date**: 2026-10-06  
**Scope**: `/skills/` directory — 45 auto-generated Agent Skills  
**Result**: **CLEAR** — No safety vulnerabilities found

## Executive Summary

All 45 Agent Skills in the OmniRoute project are **safe**. They are pure documentation (SKILL.md files, auto-generated from CLI/API sources) with no bundled executable code.

## Audit Coverage

### Verification Performed
- ✓ Dangerous pattern detection (eval, exec, shell injection, rm -rf, git force-push)
- ✓ Hardcoded credential search (0 real secrets found)
- ✓ Authorization & authentication documentation review
- ✓ Security warning presence on sensitive operations
- ✓ Specification & package integrity check

### Findings by Category

| Category | Result | Details |
|----------|--------|---------|
| **Hardcoded Credentials** | ✓ CLEAR | 0 real secrets. 4 placeholder examples (`"sk-..."`, `'admin-password'`) are documented as setup examples, not vulnerabilities. |
| **Dangerous Patterns** | ✓ CLEAR | 0 instances of eval(), exec(), subprocess without guards, rm -rf, git force-push, etc. |
| **Auth & Security** | ✓ CLEAR | Bearer tokens documented correctly. Environment variables recommended. OIDC documented. |
| **Sensitive Operations** | ✓ CLEAR | Backup, key rotation, and auth operations have proper documentation and safety flags. |
| **Package Integrity** | ✓ CLEAR | All 45 skills conform to SKILL.md format. No broken references. Auto-generated (no manual drift). |

## Skill Inventory

- **CLI tools**: 13 skills (command reference)
- **API auth**: 1 skill (Bearer token + OIDC)
- **API data/config**: 28 skills (all authenticated)
- **Cloud services**: 3 skills (cloud agent control)
- **Total**: 45 skills

## Key Observations

1. **All skills are auto-generated** from `src/lib/agentSkills/generator.ts` — no manual editing risk or drift.

2. **No bundled scripts** — These are documentation-only. Runtime safety depends on the underlying CLI/API implementation in `src/` and `open-sse/` (separate audit scope).

3. **Standard placeholder patterns** — Examples use `"sk-..."` and `'admin-password'` which are conventional documentation notation. Not a security risk.

4. **Comprehensive security documentation** — Sensitive operations (backup/restore, key rotation, OAuth) are well-explained with appropriate warnings.

## Recommendations

**No action required.** Skills are safe to use as-is.

### Optional Documentation Improvements (Not Security-Critical)

For enhanced clarity on placeholder notation, consider:
- Replace `"sk-..."` → `"<your-sk-openai-key>"` (angle brackets make intent more obvious)
- Replace `'admin-password'` → `'<your-admin-password>'`

However, these are style preferences, not security issues.

## Audit Methodology

- **Framework**: Agent Skills Maintenance Audit rubric + safety checklist
- **Approach**: Static inspection + regex pattern scanning + manual spot-checks of sensitive skills (auth, backup, keys)
- **Standards**: SKILL.md format (auto-generated documentation)

---

**Audit performed by**: Claude Code  
**Session**: https://claude.ai/code/session_01PipyoBqV7dX5gUHFeimPqe
