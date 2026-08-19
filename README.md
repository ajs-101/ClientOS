# ClientOS v2 — AISE / TPX

Full rebuild per COO's meeting notes: real Dashboard summary, Employee/Task
profiles with status bars + comment threads, notifications with auto-escalation,
a second password lock on Credentials, and Internal Projects.

## 1. First-time setup (do this before `npm run dev`)

```bash
npm install
```

Open `.env` in the project root. Firebase and Cloudinary values are already
filled in from your existing project. You only need to fill in two lines:

```
VITE_CRED_PASSPHRASE=REPLACE_WITH_YOUR_OWN_PASSPHRASE
ANTHROPIC_API_KEY=REPLACE_WITH_YOUR_ANTHROPIC_API_KEY
```

**Important about `VITE_CRED_PASSPHRASE`:** your previous `.env` never had
this value set, which means every credential you already saved in the
Credentials vault was encrypted using an empty/undefined passphrase. Once you
set a real passphrase here, any **old** saved credentials will no longer
decrypt correctly (they'll show garbled text). You will need to re-enter
those old credential entries once, after which they'll encrypt correctly
under the new passphrase going forward. This only affects credentials saved
before today — everything else (clients, notes, files, calendar) is
unaffected.

Then run:

```bash
npm run dev
```

## 2. All access passwords in this build

| Area | Password | Notes |
|---|---|---|
| AISE workspace | `AISEofficial` | unchanged |
| TPX workspace | `TPXofficial` | unchanged |
| Podcast profile | `getitdone` | Shakaib |
| Website profile | `thecreators` | Saif & Sami |
| Email Marketing profile | `corethings` | Ali |
| Development profile | `automationguy` | Abdul Rehman |
| Admin Overview | `Deadman101!` | also unlocks Credentials (second lock) |

All five employee passwords and both workspace passwords are shared and
identical inside both AISE and TPX, per your instructions. To change any of
them, edit `src/config/employeeProfiles.js` (employee profiles) or
`src/config/orgs.js` (workspace passwords).

## 3. What's new, page by page

- **Dashboard (`/`)** — real summary view now: overdue count, due-this-week
  count, tasks needing attention, active client count, plus two live panels
  (Overdue / Coming up this week) pulling from both client deadlines and
  employee tasks together.
- **Clients (`/clients`)** — this is your old Dashboard, renamed. Same client
  folder grid, same "Run check" AI feature, unchanged.
- **Employees (`/employees`)** — the 5-profile picker. Click a profile, enter
  its password, land on that profile's task board.
- **Inside a profile** — add tasks, set a red/yellow/green status bar, open a
  task to add threaded comments, see a recent activity feed, and click
  **AI Overview** for a Claude-generated summary of that profile's workload.
  A notification bell in the header shows anything relevant the moment you
  log in.
- **Admin Overview (`/admin-overview`)** — only reachable via the Admin card
  password. See every profile's tasks in one place, filter by profile, edit
  any task's status, send a manual reminder to any profile, and run a
  **cross-team AI digest**.
- **Internal Projects (`/internal-projects`)** — same task/status/comment
  pattern as employee profiles, but for internal (non-client) work. Reachable
  once any profile password has been entered this session.
- **Credentials (`/credentials`)** — now has a second password gate
  (`Deadman101!`, the Admin password) on top of the workspace password.
  Deleting a saved credential is now possible too.

## 4. Auto-escalation & notifications — how it actually works

There's no background server running a clock. Instead, every time the
Dashboard, an Employee Profile, or Admin Overview loads, the app checks all
tasks for that workspace: any task still yellow/green whose due date has
passed gets flipped to red automatically, and a notification is created for
**both** the assigned profile and Admin. This is a "check on page load"
model, not real-time — if nobody opens the app for a few days, the flip
happens the next time someone does. That's a reasonable tradeoff for an
internal tool without paying for a scheduled server function, but flagging
it so it's a known limitation, not a surprise.

## 5. Firestore composite indexes you will need to create

Same issue as before — Firestore requires a manual index the first time a
query combines a filter with a sort, or two different filtered fields with a
sort. You will very likely hit **console errors with a direct "create index"
link** the first time you use each of these. Click the link in the error,
click **Create Index**, wait 1-5 minutes, refresh. This only needs doing
once per index, ever. Expect to do this for:

- `clients` — filter `orgId` + sort `createdAt` (Clients page)
- `notes` — filter `clientId` + sort `createdAt` (Client folder notes)
- `activityLog` — filter `orgId` + filter `profile` + sort `createdAt`
- `notifications` — filter `orgId` + filter `targetProfile` + sort `createdAt`
- `taskComments` — filter `taskId` + sort `createdAt`
- `internalProjectComments` — filter `taskId` + sort `createdAt`

Dashboard, Admin Overview, and Internal Projects deliberately avoid
`orderBy` on filtered queries (sorting is done in JavaScript after the data
loads instead), so those should not need new indexes.

## 6. New Firestore collections this version adds

```
employeeTasks         { orgId, profile, title, description, dueDate, status, createdAt }
taskComments           { taskId, orgId, author, text, createdAt }
internalProjects       { orgId, title, description, dueDate, status, createdBy, createdAt }
internalProjectComments{ taskId, orgId, author, text, createdAt }
notifications          { orgId, targetProfile, type, message, relatedTaskId, read, createdAt }
activityLog             { orgId, profile, message, createdAt }
```

These are created automatically the first time each feature is used —
nothing to set up manually in Firebase Console beyond the indexes above.

## 7. Testing locally before you deploy

Run `npm run dev` and test in this order, since later pieces depend on
earlier ones existing:

1. Workspace picker → loading screen → Dashboard (should show 0s everywhere
   on a fresh database, that's correct)
2. Clients → add a test client
3. Calendar → add a test deadline
4. Employees → unlock each of the 5 profiles once, add one task to each,
   change its status, add a comment
5. Set a task's due date to yesterday, reload the page, confirm it auto-flips
   to red and a notification appears in the bell icon
6. Admin Overview → confirm you can see and edit tasks from all 4 non-admin
   profiles, send a test reminder, run the digest
7. Credentials → confirm the second password gate works, add and delete a
   test credential
8. Internal Projects → add a test project, confirm status + comments work

Note: the two "AI Overview" / "digest" buttons and the "Run check" button on
Clients will **not** work under plain `npm run dev` — Netlify Functions only
run through `netlify dev` or on the deployed site. Everything else works
fine locally.

## 8. Deploying

Same as before — commit, push to your existing GitHub repo, Netlify
auto-rebuilds. If this is a fresh deploy, remember to add all ten `.env`
values into Netlify's Environment Variables dashboard before the first real
deploy, same as previous projects.

```bash
git add .
git commit -m "v2: dashboard rebuild, employee profiles, notifications, internal projects"
git push
```
