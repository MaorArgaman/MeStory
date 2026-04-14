# MeStory Testing Workflow
## תהליך עבודה: Claude Code ↔ Claude Cowork

---

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TESTING CYCLE                                   │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
    │   CLAUDE CODE    │         │  CLAUDE COWORK   │         │   CLAUDE CODE    │
    │                  │         │                  │         │                  │
    │  1. Write STD    │────────▶│  2. Run Tests    │────────▶│  4. Fix Bugs     │
    │     (Expected    │         │     (Fill Actual │         │                  │
    │      Results)    │         │      Results)    │         │                  │
    └──────────────────┘         └────────┬─────────┘         └────────┬─────────┘
                                          │                            │
                                          ▼                            │
                                 ┌──────────────────┐                  │
                                 │  3. Report Bugs  │                  │
                                 │   (BUG_REPORTS)  │──────────────────┘
                                 └──────────────────┘
                                          │
                                          ▼
                                 ┌──────────────────┐
                                 │  5. Verify Fixes │◀─────────────────┐
                                 │  (Claude Cowork) │                  │
                                 └────────┬─────────┘                  │
                                          │                            │
                                     ┌────┴────┐                       │
                                     │ Pass?   │                       │
                                     └────┬────┘                       │
                                    Yes   │   No                       │
                                     ▼    └────────────────────────────┘
                              ┌──────────────────┐
                              │  6. Mark Verified│
                              │     & Close      │
                              └──────────────────┘
```

---

## Phase 1: Test Preparation (Claude Code)

### Files Created:
- `CLAUDE_COWORK_TESTING_STRATEGY.md` - Strategic document
- `STD_MeStory_Testing.csv` - Test cases with expected results
- `BUG_REPORTS.md` - Bug report template

### Checklist:
- [x] Define all test cases with unique IDs
- [x] Write expected results for each test
- [x] Define test preconditions
- [x] Assign priority levels
- [x] Categorize by agent/sub-agent

---

## Phase 2: Test Execution (Claude Cowork)

### Process:
1. **Open STD_MeStory_Testing.csv**
2. **For each test case:**
   - Read test steps
   - Execute on target environment
   - Record actual result
   - Compare to expected result
   - Mark Status: PASS/FAIL/BLOCKED/SKIP

### Status Values:
| Status | Meaning | Action |
|--------|---------|--------|
| PASS | Test passed | Mark green, continue |
| FAIL | Test failed | Create bug report |
| BLOCKED | Cannot execute | Note reason, skip |
| SKIP | Not applicable | Note reason |
| N/A | Not relevant | Mark and move on |

### Filling Actual Results:
```csv
Test_ID,Expected_Result,Actual_Result,Status
E2E-001,"User registered successfully","User registered, but no email sent",FAIL
E2E-002,"Login successful","Login successful",PASS
```

---

## Phase 3: Bug Reporting (Claude Cowork)

### When a test FAILS:
1. Open `BUG_REPORTS.md`
2. Create new bug entry using template
3. Assign Bug ID: BUG-XXXX (sequential)
4. Fill all required fields
5. Add to STD: Update `Bug_ID` column

### Bug Severity Guide:
| Severity | Criteria |
|----------|----------|
| Critical | System crash, data loss, security breach, complete feature failure |
| High | Major feature broken, workaround difficult/impossible |
| Medium | Feature partially broken, workaround available |
| Low | Cosmetic issue, minor inconvenience |

### Example Bug Report:
```markdown
## BUG-0001: Email Not Sent After Registration

**Test ID:** E2E-001
**Severity:** Critical
**Status:** Open
**Found by:** Claude Cowork
**Date Found:** 2026-04-13

### Description
After completing registration, verification email is not sent to user.

### Steps to Reproduce
1. Navigate to /register
2. Fill valid registration details
3. Click Register
4. Check email inbox

### Expected Result
Verification email received within 1 minute

### Actual Result
No email received after 10 minutes. Console shows:
"Error: SMTP connection failed"

### Evidence
- Console Error: SMTP_CONNECTION_TIMEOUT
- Network: POST /api/auth/register returns 200 but email not sent

### Environment
- Browser: Chrome 120
- Device: Desktop
- User Type: New registration
```

---

## Phase 4: Bug Fixing (Claude Code)

### Input:
- Read `BUG_REPORTS.md`
- Identify all "Open" bugs
- Prioritize by severity

### Process:
1. **Analyze bug report**
   - Reproduce the issue
   - Identify root cause

2. **Implement fix**
   - Write code fix
   - Add/update tests if needed

3. **Update bug report**
   ```markdown
   **Status:** Fixed
   **Fixed by:** Claude Code
   **Date Fixed:** 2026-04-14

   ### Fix Notes
   Fixed SMTP configuration in server/config.ts.
   Email service now uses correct credentials.
   Commit: abc123
   ```

4. **Commit changes**
   - Reference bug ID in commit message
   - Example: `git commit -m "Fix: Email not sent after registration (BUG-0001)"`

---

## Phase 5: Verification (Claude Cowork)

### Process:
1. **Pull latest changes**
2. **Re-run failed test**
3. **Verify fix works**
4. **Check for regression**

### Update Bug Report:
```markdown
### Verification (Claude Cowork)
- [x] Fix verified - email now sent successfully
- [x] No regression - other auth flows work
- [x] Related scenarios tested - password reset email also works

**Status:** Verified
**Date Verified:** 2026-04-14
```

### Update STD:
- Change Status to PASS
- Clear Bug_ID or add note "Fixed in v1.x"

---

## Phase 6: Closure & Reporting

### Final Report Structure:
```markdown
# Test Execution Report

## Summary
- Total Tests: 200
- Passed: 185
- Failed: 10
- Blocked: 3
- Skipped: 2

## Bug Summary
- Critical: 2 (Fixed: 2)
- High: 5 (Fixed: 5)
- Medium: 3 (Fixed: 3)
- Low: 0

## Coverage by Category
| Category | Total | Passed | Failed | Coverage |
|----------|-------|--------|--------|----------|
| E2E | 40 | 38 | 2 | 95% |
| CRUD | 28 | 28 | 0 | 100% |
| GUI | 30 | 29 | 1 | 97% |
| Auth | 20 | 20 | 0 | 100% |
...

## Release Recommendation
✅ Ready for release after all Critical/High bugs fixed
```

---

## Communication Protocol

### Claude Cowork → Claude Code

**Format:** Bug Reports in `BUG_REPORTS.md`

**When to escalate immediately:**
- Critical bugs found
- Security vulnerabilities
- Data integrity issues
- System crashes

### Claude Code → Claude Cowork

**Format:** Updates in bug report "Fix Notes" section

**Notification:**
- Bug fixed and ready for verification
- Need more information from bug report
- Won't fix (with justification)

---

## File Structure

```
MeStory/
└── docs/
    ├── CLAUDE_COWORK_TESTING_STRATEGY.md  # Strategy document
    ├── STD_MeStory_Testing.csv            # Test cases (main file)
    ├── BUG_REPORTS.md                     # Bug tracking
    ├── TESTING_WORKFLOW.md                # This file
    └── reports/
        ├── test_execution_2026-04-13.md   # Daily reports
        └── final_report_v1.0.md           # Release report
```

---

## Quick Reference Commands

### For Claude Cowork:
```
# Start test cycle
"Run tests from STD_MeStory_Testing.csv, category E2E, priority Critical"

# Report status
"Provide test execution summary"

# Create bug
"Report bug for test E2E-001 with severity Critical"
```

### For Claude Code:
```
# Review bugs
"Read BUG_REPORTS.md and list all Open bugs"

# Fix specific bug
"Fix BUG-0001: Email not sent after registration"

# Verify fixes
"Mark BUG-0001 as fixed with commit abc123"
```

---

## Appendix: Test Data Requirements

### Users:
- Guest (not logged in)
- FREE user (verified, 0 credits)
- FREE user (with credits)
- STANDARD user
- PREMIUM user
- ADMIN user

### Books:
- Empty book (no chapters)
- Book with 5 chapters (content)
- Book with design
- Published free book
- Published paid book
- Book with 100 reviews

### Environment:
- Working payment sandbox (PayPal)
- Working email service
- AI services enabled
- Storage service configured

---

*Document Version: 1.0*
*Last Updated: 2026-04-13*
