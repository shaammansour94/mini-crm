# Verification

## Automated checks

Executed with the already installed Node.js 26.13.1 and existing dependency versions:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

All four scripts pass. The automated suite contains **44 passing tests across nine files**.

The test suite includes schema invariants, date-range boundaries (1970–9999), and value validation; real Route Handlers, cookie sessions, and temporary SQLite persistence; and a DOM interaction that changes Status to Lost, checks the required Loss reason error, then changes status to hide it and submit without that error. Persistence is verified with a newly constructed Prisma client after rename, reorder, removal, and lead update.

Fresh database checks apply the committed migration to a new SQLite file and run the seed twice. Both seed runs report two users, 24 leads, and one form schema. Client generation and the runtime better-sqlite3 adapter are verified through real queries.

## Live acceptance checks

The production server was exercised with real HTTP requests for:

- Unauthenticated lead API access: 401.
- Agent schema read: allowed; direct schema write: 403.
- Agent direct builder page request: 403.
- Admin schema save; create, fetch, and update a lead.
- Rename/reorder a custom field while retaining its value.
- Remove that field, edit the lead, and confirm its old value remains in storage.
- Lost without Loss reason: 422 with `errors.loss_reason`.
- Search by email combined with status and pagination: accurate matching total.
- Nonexistent lead: 404.
- Logout: subsequent protected request returns 401.

Temporary schema changes were restored and the test-created lead was removed afterward.

Browser checks use the actual application in an isolated headless Chrome profile. Desktop and 390px screenshots are genuine running-app captures. The leads and builder documents remain 390px wide on mobile; table overflow is contained. The conditional Loss reason renders when Status becomes Lost. Pointer dragging reordered field rows. A custom field appeared in the draft preview before save and in Create lead after save; the original schema was restored afterward. No browser runtime exceptions were observed.

## Optional builder enhancements

Automated tests cover bounded Undo/Redo, grouping and branching, stable field
IDs, dirty state, failed saves preserving Undo/Redo and warning state, successful
saves clearing history/warnings, navigation cancellation/confirmation, and a
cancelable Navigation API history traversal.

A browser check against the running app confirmed Undo/Redo, sidebar-link and
Sign out warnings, Stay preserving the draft, browser Back cancellation, and
Leave discarding the draft and continuing navigation. The persisted schema was
compared before/after and was unchanged; no form configuration was saved by
that check. No browser runtime exceptions were observed.

Browser Back support depends on Navigation API availability and cancelable
traversals. See README for the supported behavior and browser limitations.

## SCHEMA-05: removed field values remain in SQLite

Reproduce the focused integration test:

```bash
npm run test -- tests/api-persistence.test.ts -t SCHEMA-05
```

The test uses a temporary SQLite database, authenticated real Route Handlers,
and a custom dropdown with the stable ID `property_type`. It saves `Apartment`
on a new lead, removes the field through the schema-save API, and confirms it
is absent from the saved active schema. It then opens a separate **read-only
native SQLite connection** using Node.js `node:sqlite` and executes:

```sql
SELECT "values" FROM "Lead" WHERE "id" = ?;
```

The stored JSON still contains `"property_type": "Apartment"`. The test also
updates the lead using only active fields, opens another SQLite connection,
and asserts that both the updated name and the retained property value are
stored. No field is re-added to prove retention. The temporary database is
removed after the test; application/demo data is untouched.

Result: **PASS**, including direct storage inspection immediately after removal
and after a later lead edit. This is a backend integration test, not a claim
that the Form Builder was clicked manually in this check.

For manual verification in the local demo, use the actual stable field ID shown
in Field Properties, which the UI generates independently of the label. Find
the lead ID and run the same parameterized query in a SQLite tool, or inspect
`Lead.values` in Prisma Studio. Looking only at the rendered form is insufficient.

## Reviewer checklist

1. Run README setup commands from a fresh checkout and sign in using both demo roles.
2. In Admin Form Builder, add each of the six types, select rows, reorder with both drag handles and Up/Down, and edit properties.
3. Preview a draft before saving; another lead form should still use the saved definition.
4. Save, refresh, and verify the saved fields and order appear in Create and Edit.
5. Create a lead with a custom value, rename/reorder its field, and confirm the old value stays attached to the stable ID.
6. Remove the custom field, edit the lead, and inspect SQLite `Lead.values` to confirm the old value remains.
7. Mark Loss reason required with Status = Lost. Test Lost and other statuses, both in UI and by direct API request.
8. Edit a preexisting lead after adding a required field; current visible rules should apply.
9. Combine name/email search, status filter, and multiple pages. Changing filters resets the page.
10. Stop and restart the server using the same database; records and configuration remain.
11. Test 390px screens, keyboard focus, reorder buttons, builder tabs, form errors, and retry behavior.
12. Run all four quality scripts, review the included walkthrough, and publish/share the reviewed repository.

## Remaining handoff

The silent 4:07 walkthrough is included at [videos/aqary-demo.mp4](videos/aqary-demo.mp4) and linked from README; see [walkthrough notes](WALKTHROUGH.md). Review and commit the source and video, then publish/share the public repository with reviewers.
