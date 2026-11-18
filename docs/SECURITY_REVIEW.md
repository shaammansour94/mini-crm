# Pre-publication security and submission review

Review date: **2026-11-18 (Asia/Dubai)**. Scope: this local checkout, its reachable
Git history, the AQARY brief, and the additional employer requirements supplied
by the user. The public repository is required; pnpm is optional. npm and the
existing package-lock remain unchanged.

## Repository connection follow-up

On 2026-11-18, at the user's request, `origin` was set to
`https://github.com/shaammansour94/aqary-mini-crm.git`. Anonymous GitHub API
metadata confirmed the repository is public (`private: false`). `git ls-remote`
succeeded and returned no refs, indicating the remote has no published branch
refs yet. The connection/public-visibility part of SUB-01 is resolved; reviewing,
committing, and pushing the implementation remains outstanding. No staging,
commit, push, visibility change, or history rewrite was performed.

The file/history counts and initial-remote observations below describe the
original review snapshot, before this connection follow-up.

## Findings by severity

| ID | Severity / scope | Finding | Status |
| --- | --- | --- | --- |
| DEP-01 | High, dependency advisory | Locked picomatch 2.3.2/4.0.7 falls within GHSA-fc5q-39xc-vjpf (ReDoS). npm propagates this into 20 high affected package records. | Open upstream risk; advisory lists no patched version. No safe minimal version-only fix identified. |
| SUB-01 | High, submission blocker rather than a security vulnerability | Public remote is now connected and verified; the application implementation largely remains untracked/uncommitted and the remote has no refs. | Remote/visibility gap resolved in the follow-up below. Reviewed commits and a push remain outstanding; no push performed. |
| DEP-02 | Moderate, dependency advisory | A locked minimatch version is affected by GHSA-g3hv-75wg-m249 (pattern-amplification DoS), producing 2 moderate affected package records. | Open; the advisory lists 11.0.1 as patched, but the affected ts-morph/shadcn branch uses a different major. No unverified override or forced downgrade applied. |
| DEPLOY-01 | Medium, public-hosting limitation | Fixed public demo accounts, no login rate limiting, synchronous password hashing, and no application-level body byte limit. | Documented local-demo boundary. This is not an observed authorization bypass; public production hosting requires additional controls. |
| PRIV-01 | Low, public metadata consideration | The existing commit stores a non-GitHub-noreply author email in normal Git metadata. | Review whether that identity is intended to be public. No email value is copied here, and no history rewrite was performed. |

No confirmed critical application vulnerability, high-severity first-party
application flaw, or verified credential leak was identified within the checks
below. This statement does **not** close the open high dependency advisory.

## Dependency evidence and remediation decision

Executed `npm audit --json` against the locked dependency tree. Result:

```text
critical: 0
high:     20
moderate: 2
low:      0
total:    22 affected package records
```

These are propagated package findings, not 22 independent vulnerabilities.
The two underlying advisories are:

- [GHSA-fc5q-39xc-vjpf / CVE-2026-112366](https://github.com/advisories/GHSA-fc5q-39xc-vjpf): picomatch <=4.0.7, high; upstream listed **no patched version** at review.
- [GHSA-g3hv-75wg-m249 / CVE-2026-118764](https://github.com/advisories/GHSA-g3hv-75wg-m249): minimatch >=7.0.0 <11.0.1, moderate; fixed in 11.0.1.

The affected graph comes through shadcn/registry tooling, ESLint, ts-morph,
Vitest/Vite, and their glob helpers. shadcn is currently in `dependencies`, so
these must not all be described as devDependency-only. Source review found no
application endpoint passing request-controlled input to glob libraries. The
17 generated server trace manifests inspected did not list separate picomatch
or minimatch package files. This is reachability triage, not proof that every
bundle or future usage is safe.

npm's proposed remediation involved major-version downgrades of shadcn,
eslint-config-next, and Vitest. `npm audit fix --force` was not used: those changes
would disrupt the selected stack and do not constitute a verified targeted fix.
No direct dependency, transitive override, installed package, package manager,
or lockfile was changed in this review. Reassess upstream patches and validate a
separate dependency remediation plan before treating the audit as resolved.
An offline audit was not used as evidence of a clean dependency tree.

## Git, files, and private-data inspection

- Inspected all locally reachable refs: **1 commit, 17 unique historical blobs**.
- Reflogs reference the same commit. Git fsck also identified 107 unreachable
  objects; their blobs and tree paths were scanned separately with no secret-pattern
  or sensitive-filename matches. No object was removed or history rewritten.
- Pattern-scanned **167 current non-ignored candidate files**, including untracked
  source, tests, documentation, and the Postman collection. Also checked the
  relative .claude/.windsurf skill symlinks; their targets were not absolute
  workstation paths.
- No historical `.env`, SQLite database, private-key file, generated/runtime
  artifact, or verified token/credential match was found in tracked content.
- `.env`, `dev.db`, database journal/WAL/SHM sidecars, `src/generated/prisma`,
  `node_modules`, `.next`, coverage, and TypeScript build-info are excluded by
  the current ignore rules. The public `.env.example` is intentionally allowed.
- The local `.env` contains a DATABASE_URL setting and was not copied into this
  report. No environment values, session cookies, password hashes, or database
  contents were published by the scan.
- Six documentation files under `.agents/skills` matched credential-in-URL
  patterns; manual triage identified sample connection strings/placeholders.
  They are not verified real credentials. Public demo/test passwords in seed,
  README, login UI, tests, and Postman are intentional and now explicitly labeled
  demo-only in README.
- No absolute workstation user paths were found in the scanned candidate files.
  The app screenshots previously captured fictional demo records.
- There is no configured remote, so no remote Git history or actual GitHub
  visibility could be inspected. No commits, staging, pushing, or rewriting occurred.

The secret scan used targeted patterns (private keys, common provider tokens,
credential URLs, and suspicious assignments), not a comprehensive commercial
scanner or an entropy-based guarantee. Repeat review against the final staged
files/history before publication. Files currently ignored could still be added
with `git add -f`; ignore rules are not access controls.

## Authentication, authorization, input, and errors

- Passwords: random per-password salt, scrypt hash, timing-safe comparison.
- Sessions: random 32-byte token, only its SHA-256 hash stored, eight-hour expiry;
  lookup rechecks expiry and reads the role from the associated database user.
- Login rotates/replaces the cookie's old server session; logout deletes the
  server session and expires the cookie. Roles come from the database; the login
  response intentionally includes name/role. Password hashes and session-token
  hashes are not returned in API payloads.
- Cookies: HttpOnly, SameSite=Lax, host-only, explicit expiry. Secure defaults on
  in production; COOKIE_SECURE=false is an intentional local HTTP override that
  must not be copied unchanged to a public HTTPS deployment.
- Protected APIs perform authentication server-side. Admin schema writes have an
  explicit role check. The page and proxy independently deny Agent builder access.
- Strict input shapes, bounded field definitions/value lengths, option/type/core
  invariants, and shared visibility rules are enforced against the persisted schema.
  Query page/pageSize and search limits are validated. Total body bytes/key count
  are not separately capped at the application boundary.
- Mutations reject a mismatched Origin against request protocol/Host. Missing
  Origin is allowed for Postman/non-browser clients; there is no separate CSRF
  token. SameSite cookies supplement origin checks. Reverse-proxy deployment must
  preserve trusted protocol/Host handling.
- Application database access uses Prisma queries; raw SQL in tests reads a static
  migration or uses a parameter for record lookup. No request-controlled unsafe SQL,
  app-level eval, or dangerouslySetInnerHTML usage was found.
- Expected failures use 400/401/403/404/422. Unexpected errors return a generic 500
  message; full errors are logged server-side, not returned to clients. All demo
  leads are intentionally shared between both roles; tenant isolation is not claimed.

## Executed HTTP checks

Against the local running server, without modifying leads or saved configuration:

| Check | Observed |
| --- | --- |
| Unauthenticated GET/POST leads, GET/PUT lead detail, GET/PUT schema, POST logout | 401 for all seven operations |
| Agent login | 200 |
| Agent read saved schema | 200 |
| Agent direct PUT saved schema | 403 |
| Agent direct builder page | 403 |
| Authenticated mutation from an external Origin | 403 |
| Replay the same cookie after successful logout | 401 |
| Local HTTP session cookie | HttpOnly, SameSite=Lax, explicit expiry; Secure absent as expected in local development |

No token/cookie values were written into this report. The temporary review
session was revoked by logout.

## Quality checks

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: passed, **44 tests across 9 files**.
- `npm run build`: passed (Next.js 16.4.6 production build).

A passing build or test suite does not negate the dependency advisory findings.

## Publication handoff

1. Review the final source, docs, screenshot content, and staged diff; include
   source, migrations/seed, `.env.example`, package-lock, Postman, and checks.
2. Commit the reviewed implementation with meaningful history. Preserve exclusions
   for local env/database/runtime files; do not force-add them.
3. The owner must create/use a **public** GitHub repository and supply its actual
   URL. Verify access in an anonymous/signed-out browser. package.json private:true
   concerns npm publishing and does not make a GitHub repository private.
4. Add the real 3–5 minute walkthrough link and verify README setup from a clean
   checkout. A video link and a public repository URL are not yet verified here.
5. Keep the high/moderate dependency advisories disclosed and reassess remediation;
   do not describe this local demo as production-hardened or audit-clean.

No repository was published, no package-manager migration was made, and no Git
history was rewritten. The requested minimal-fix rule did not require speculative
application changes: no confirmed critical/high first-party flaw was found, and
the high upstream issue has no listed patched release for a safe version-only fix.
