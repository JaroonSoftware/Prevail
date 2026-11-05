# Prevail program permissions (TLM reference)

## Implemented and isolated
- /permissions: TLM-style per-role/per-menu view/add/edit/delete matrix; role management; role member list.
- Only active database administrator roles may use the new permission management APIs. JWT role claims are not used to grant administrative access.
- New roles start without permissions; disabling view denies all dependent actions; users and permission management are admin-only.
- Current administrator cannot deactivate/demote their own role or delete it. Roles with assigned users cannot be deleted.
- Existing user type selector prefers active configured roles after installation, otherwise retains its original enum behavior.
- Existing pages, API authorization, and navigation filtering have NOT been switched to the new policy.

## Database installation (not executed)
Review sql/2026-11-04_program_permissions.sql. Back up the database and verify current user.type values, active administrator accounts, and column constraints before applying.
The SQL creates prevail_role and prevail_role_permission and changes user.type to VARCHAR(80) for custom roles. It seeds existing role names and legacy menu visibility; username-restricted menus require administrator review. No runtime DDL is performed.

## Activation requiring approval
Automatic approval review rejected a global change to api/onload.php that would enforce a generated endpoint map. Missing endpoint mappings could interrupt production workflows. No equivalent bypass was applied.
Before activation, review an explicit map of every endpoint and action, including POST searches (view), GET delivery issue operations (edit), AI imports (add), payment operations, print endpoints, and shared lookup dependencies.
Then enable route guards, sidebar filtering, and action controls using PermissionProvider/PermissionGuard, and backend checks together. Validate each role using a staging database and test direct API calls, stale tokens, disabled roles, read-only users, and administrative recovery before production rollout.

## Validation completed
- PHP lint and JSX parse.
- Isolated SQLite policy tests: role matrix, view dependency, admin-only functions, inactive/unknown roles, fresh DB role resolution, actual role insert/update SQL, new roles denied by default.
- No production database/schema modifications or permission changes were executed.
