# Keystone

A team project management system. Manage projects, tasks, and teammates — with roles, live activity, and invite-only workspaces.



## What This System Does

Keystone is a web app where a team can organize their work. It has:

- **Workspaces** — each team has its own workspace. Everything (projects, tasks, members) lives inside a workspace.
- **Roles** — every member has one role: **Owner**, **Admin**, or **Member**. Each role sees and does different things.
- **Projects** — a workspace has many projects. Each project has many tasks.
- **Tasks** — tasks have a title, description, status, priority, assignee, and due date. They also have comments.
- **Activity feed** — shows a live log of what's happening in the workspace.
- **Invites** — new people join a workspace by invite only. No public signup to a team.
- **Password reset** — users can reset their password through email.



## The Three Roles

| Role | What they can do |
|---|---|
| **Owner** | Exactly one per workspace. Full control. Can transfer ownership, delete workspace, manage everything. |
| **Admin** | One per workspace. Creates projects and tasks, invites members, promotes a member to admin (which swaps their own role). |
| **Member** | Works on tasks assigned to them. Can update status and comment on their own tasks. |



## How to Use the System — Simple Steps

### 1. Create an account

- Open the app.
- Click **Get Started** or **Register**.
- Enter your name, email, and a password (8 characters minimum).
- If you are the **first user ever**, a workspace is created for you and you become its Owner.
- If you are **not** the first user, your account is created but you don't belong to any workspace yet. You will see a message telling you to ask an Owner or Admin to invite you.

### 2. Log in

- Go to the login page.
- Enter your email and password.
- You are redirected to your dashboard based on your role (`/owner`, `/admin`, or `/member`).

### 3. Join a workspace

If you're not in any workspace yet:

- Ask an Owner or Admin of a workspace to invite your email.
- You'll receive an email with an invite link.
- Click the link, set up your credentials (if you're new), and you'll be added to the workspace automatically.

### 4. Create a project (Owner / Admin only)

- Go to **Projects** in the sidebar.
- Click **New project**.
- Enter a name, optional description, initial status, and a due date (optional).
- Click **Create**.

### 5. Create a task (Owner / Admin only)

- Open a project.
- Click **Add task**.
- Fill in the title, description, status, priority, assignee, and due date.
- Save.
- The task appears in the Kanban board under the correct column.

### 6. Work on a task (any role)

- Open a task to see its details.
- If you are the **assignee**, you can:
  - Change its status (drag it between columns on the board, or change it in the task detail page).
  - Post comments.
- Owners and Admins can edit any task — title, description, priority, assignee, due date.
- Members can only change status on tasks assigned to them.

### 7. Invite teammates (Owner / Admin only)

- Go to **Team** in the sidebar.
- Click **Invite member**.
- Pick a registered user from the list.
- They receive an email with an invite link.
- The first person you invite becomes **Admin**. Everyone after that becomes a **Member**.

### 8. See what's happening (everyone)

- Go to **Activity** in the sidebar.
- You'll see a chronological list of everything that happened in the workspace — tasks created, status changes, comments, invites, and more.
- New activity appears live without refreshing.

### 9. Manage your profile

- Click your avatar in the top-right corner.
- Choose **Profile**.
- Update your name, email, or password.

### 10. Manage your workspace (Owner only)

- Go to **Workspace → Settings**.
- Rename the workspace.
- Transfer ownership to another member.
- Delete the workspace (only allowed when it has no projects, tasks, or other members).

---

## System Requirements

To run Keystone on your machine:

- **Node.js** version 18 or newer
- **PostgreSQL** database
- A terminal

---

## How to Run It Locally

### 1. Clone the project

```bash
git clone https://github.com/Talha001936/KeyStone.git
cd KeyStone
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your environment file

Copy the example file:

```bash
cp .env.example .env.local
```

Open `.env.local` in any editor and fill in your own values:

```
DATABASE_URL=postgresql://user:password@localhost:5432/keystone
SESSION_SECRET=some-random-string-at-least-32-characters-long
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- **DATABASE_URL** — your own PostgreSQL connection string
- **SESSION_SECRET** — any random text, at least 32 characters long
- **NEXT_PUBLIC_APP_URL** — leave as `http://localhost:3000` for local use

SMTP settings are optional. If you don't set them, emails are printed to the terminal instead of sent.

### 4. Set up the database

Create a new PostgreSQL database:

```bash
createdb keystone
```

Then create the tables (schema). If the project includes a schema file, run it:

```bash
psql keystone < schema.sql
```

### 5. Start the app

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Environment Variables Reference

| Variable | Required | What it's for |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Signs login sessions (32+ characters) |
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL used in invite and reset links |
| `SMTP_HOST` | No | Mail server host (for sending invites / resets) |
| `SMTP_PORT` | No | Mail server port (usually 587) |
| `SMTP_USER` | No | Mail server username |
| `SMTP_PASS` | No | Mail server password |
| `SMTP_SECURE` | No | `true` for port 465, otherwise `false` |
| `MAIL_FROM` | No | Display name and address for outgoing emails |

If SMTP variables are not set, invite and reset emails are printed to the server console instead of being sent.

---

## Tips

- **Invite-only** — nobody can join a workspace unless an Owner or Admin invites them.
- **One Owner, one Admin** — each workspace always has exactly one Owner and at most one Admin.
- **Role changes are swaps** — promoting someone to Admin makes the current Admin a Member.
- **Real-time** — task updates, comments, and activity appear live.
- **Sessions last 7 days** — after that, log in again.

---

## Tech Stack

- **Next.js** (App Router) for the frontend and backend
- **PostgreSQL** for the database
- **Tailwind CSS** and **Base UI** for the interface
- **Framer Motion** for animations
- **Node.js crypto** for password hashing and session signing

---

## License

Free to use and modify for personal or team projects.
