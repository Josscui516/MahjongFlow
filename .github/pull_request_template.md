## Related issue and scope

Relates to #<!-- one primary issue number -->

<!-- Keep exactly one primary issue reference. Use a closing keyword only when every
issue acceptance criterion has passed and the issue is already in Testing. -->

- Scope classification: <!-- P0 / P1 / Post-MVP -->
- Requirement IDs: <!-- e.g. P0-MTG-001, P0-TASK-003 -->

## Summary and rationale

<!-- Explain what changed, why it is needed, and the user-visible outcome. -->

## Changes

- <!-- Change 1 -->
- <!-- Change 2 -->

## Acceptance scenarios

- [ ] <!-- Scenario and current result -->
- [ ] <!-- Scenario and current result -->

## Test evidence

| Check             | Command or method                   | Result                         |
| ----------------- | ----------------------------------- | ------------------------------ |
| Lint              | <!-- command or N/A with reason --> | <!-- Pass / Fail / Not run --> |
| Typecheck         | <!-- command or N/A with reason --> | <!-- Pass / Fail / Not run --> |
| Automated tests   | <!-- command or N/A with reason --> | <!-- Pass / Fail / Not run --> |
| Production build  | <!-- command or N/A with reason --> | <!-- Pass / Fail / Not run --> |
| Manual acceptance | <!-- scenarios exercised -->        | <!-- Pass / Fail / Not run --> |

## Permission, privacy, and sensitive-data impact

<!-- Describe affected roles, allow/deny behavior, participant-data exposure, and checks performed. Write "None" only with a reason. -->

- [ ] Frontend route or UI visibility is appropriate.
- [ ] Server-side authorisation is enforced where applicable.
- [ ] Supabase RLS allow and deny paths are covered where applicable.
- [ ] Evidence uses only fictional or anonymised data.

## Database and migration impact

<!-- List timestamped migrations, constraints, indexes, RLS policies, deployment order, rollback or recovery steps, seed-data impact, and generated database types. Write "Not applicable" with a reason when there is no database impact. -->

## UI states

<!-- Describe loading, empty, success, validation-error, permission-denied, and system-error states, or explain why each is not applicable. -->

## Risks and rollback

<!-- Describe known risks, monitoring, safe rollback steps, and any irreversible operation. -->

## Screenshots or recording

<!-- Add evidence using fictional data when the change affects UI. Otherwise explain why visual evidence is not applicable. -->

## Author checklist

- [ ] The linked issue has clear acceptance criteria, dependencies, priority, and scope IDs.
- [ ] This Pull Request addresses one primary issue and contains no unrelated formatting or debug output.
- [ ] I reviewed the complete diff and documented every test actually run.
- [ ] Documentation and `.env.example` were updated when required.
- [ ] No credentials, real environment values, production data, or real participant information are included.
- [ ] Database, RLS, rollback, generated-type, and deployment impacts are fully documented or explicitly not applicable.
- [ ] Loading, empty, success, and error states are implemented or explicitly not applicable.
- [ ] The Pull Request is ready for non-author review; author self-review is not counted as team approval.
