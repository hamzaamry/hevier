# GitHub project board and labels

How the issue tracker, the board and [ROADMAP.md](../ROADMAP.md) fit together, and
how to set them up once. Nothing here is applied by the repo itself: the owner
runs the steps. The commands below were checked against `gh ... --help` but not run.

## The three pieces

- **`ROADMAP.md`** is the plan. It has the order and the reasons. Items have IDs (`R-01`).
- **Issues** are the work. One issue is one pull request sized chunk. Issue forms are in `.github/ISSUE_TEMPLATE/`.
- **The board** (a GitHub Project) is the queue. It shows which issues are ready, started or done.

An item from the roadmap becomes one or more issues. All of them carry the same
`Roadmap ID`, so you can filter the board by it.

## One-time setup

### 1. Labels

Labels come from [`.github/labels.json`](../.github/labels.json).

```bash
node scripts/apply-labels.mjs --repo hamzaamry/hevier           # prints the gh commands, changes nothing
node scripts/apply-labels.mjs --repo hamzaamry/hevier | sh      # creates or updates the labels
```

`gh label create --force` updates the colour and description of a label that
already exists and never deletes one. The issue forms use `bug`, `feature`,
`task` and `needs-triage`, so apply labels before you rely on the forms.

GitHub's default labels `enhancement`, `documentation`, `invalid` and `question`
are not used here. Delete them in the web UI once nothing uses them.

### 2. The project

Create a Project (the new kind, "Projects v2") for the repo owner. In the web UI:
the owner's profile or organisation, Projects, New project, Board. Or with the CLI,
which needs the `project` scope first:

```bash
gh auth refresh -s project
gh project create --owner hamzaamry --title "Hevier roadmap"
gh project link <number> --owner hamzaamry --repo hamzaamry/hevier
```

### 3. Fields

| Field | Type | Values |
|---|---|---|
| Status | single select | Backlog, Ready, In progress, In review, Done |
| Area | single select | mobile, sync, shared, catalogue, web, ci, docs |
| Size | single select | S, M, L |
| Roadmap ID | text | `R-01` and so on, copied from `ROADMAP.md` |

A new project already has a `Status` field with the options Todo, In Progress and
Done. Edit its options in the web UI (project settings, Status). The CLI can only
create new fields, so it covers the other three:

```bash
gh project field-create <number> --owner hamzaamry --name Area --data-type SINGLE_SELECT --single-select-options "mobile,sync,shared,catalogue,web,ci,docs"
gh project field-create <number> --owner hamzaamry --name Size --data-type SINGLE_SELECT --single-select-options "S,M,L"
gh project field-create <number> --owner hamzaamry --name "Roadmap ID" --data-type TEXT
```

What the statuses mean:

| Status | Meaning |
|---|---|
| Backlog | Triaged and wanted, not scheduled |
| Ready | Scoped, size set, nothing blocks it, someone can start |
| In progress | A branch exists |
| In review | A pull request is open |
| Done | Merged or closed |

Sizes match the roadmap: `S` a few hours, `M` one to three days, `L` a week or
more. An `L` issue should be split before it goes to Ready.

### 4. Views

- **Board**, grouped by Status, hide Done after 30 days. This is the daily view.
- **Roadmap table**, sorted by Roadmap ID, columns Status, Area, Size, Roadmap ID.
- **By area**, grouped by Area, to see where the work piles up.
- **Triage**, filter on label `needs-triage`.

### 5. Built-in workflows

In the project settings, Workflows:

- Auto-add to project: items from `hamzaamry/hevier` (issues and pull requests).
- Item added to project: set Status to Backlog.
- Item closed, and pull request merged: set Status to Done.
- Move cards to Ready, In progress and In review by hand. Check the workflow list in your project settings: GitHub adds options over time and may offer one for linked pull requests.

### 6. Repo settings worth turning on

- Private vulnerability reporting (Settings, Code security). The "Security problem" link in `.github/ISSUE_TEMPLATE/config.yml` needs it.
- Require the `check` job of the `Check` workflow before merging to `main`. This is the owner's call.

## Day to day

1. A new issue arrives with `needs-triage`. Set Area, Size and Roadmap ID, add area and type labels, then remove `needs-triage`. A product question gets `needs-decision`. A non-goal gets `non-goal` and a polite close, with a link to the roadmap.
2. When someone starts, they make the branch from the issue so the pull request links to it: `gh issue develop <number> --checkout`.
3. The pull request uses the template, links the issue (`Closes #123`) and, when it finishes a roadmap item, updates the status in `ROADMAP.md` in the same pull request.
4. Commit messages are `type(scope): subject`, five words or fewer ([AGENTS.md](../AGENTS.md)).

## Labels

Kept in step with `.github/labels.json`.

| Label | Color | Use |
|---|---|---|
| `bug` | `#d73a4a` | Something does not work |
| `feature` | `#1d76db` | A new capability or a change in behaviour |
| `task` | `#c5def5` | A defined piece of work, usually from the roadmap |
| `docs` | `#0075ca` | README, guides, research and science notes |
| `roadmap` | `#5319e7` | Has a roadmap ID (R-xx) in ROADMAP.md |
| `area:mobile` | `#0e8a16` | The Expo app in apps/mobile |
| `area:sync` | `#0e8a16` | Hevier Sync, the PC program in apps/sync |
| `area:shared` | `#0e8a16` | The sync protocol in packages/shared |
| `area:catalogue` | `#0e8a16` | The exercise catalogue in packages/catalogue |
| `area:web` | `#0e8a16` | The landing page in apps/web |
| `area:ci` | `#0e8a16` | Build, checks, hooks and release |
| `security` | `#b60205` | Could expose or send data to the wrong place |
| `data-safety` | `#b60205` | Could lose or corrupt user data (restore, sync, migrations) |
| `a11y` | `#bfdadc` | Accessibility: TalkBack, targets, font size, colour |
| `android-native` | `#fbca04` | Kotlin modules, widgets, notification, config plugins |
| `ios` | `#fbca04` | Anything about running Hevier on iOS |
| `performance` | `#fef2c0` | Slow, heavy or battery hungry |
| `science` | `#d4c5f9` | Training numbers, studies and how the app explains them |
| `design` | `#f9d0c4` | Look, copy and the design system |
| `dependencies` | `#ededed` | Package updates and licences |
| `needs-triage` | `#ffffff` | New, not looked at yet |
| `needs-decision` | `#e99695` | Waiting on a product call from the owner |
| `blocked` | `#000000` | Waiting on another item or on something outside the repo |
| `good first issue` | `#7057ff` | Small, clear and safe for a first pull request |
| `help wanted` | `#008672` | Extra hands welcome |
| `non-goal` | `#cccccc` | Listed as a non-goal in ROADMAP.md |
| `duplicate` | `#cfd3d7` | Already reported |
| `wontfix` | `#ffffff` | Will not be done |

## Why there is no CODEOWNERS file

CODEOWNERS asks named people to review changes to named paths. Today the repo has
one maintainer, so every pull request would ask the same person, and the file
would need a verified GitHub handle for each owner. Add one when there is a second
reviewer. These paths are the ones to protect first, because a mistake there can
lose or leak user data:

```
/apps/mobile/db/migrations/   @owner
/apps/mobile/lib/sync/        @owner
/apps/sync/                   @owner
/packages/shared/             @owner
/apps/mobile/modules/         @owner
```
