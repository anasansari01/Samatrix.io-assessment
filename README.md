# TaskFlow

A simple project and task management app built as a company assessment. Built with Next.js, TypeScript, PostgreSQL, Drizzle ORM, and Tailwind CSS.

🔗 **Live Demo** — [samatrix-io-assessment.vercel.app](https://samatrix-io-assessment.vercel.app/dashboard)
📁 **Repository** — [github.com/anasansari01/Samatrix.io-assessment](https://github.com/anasansari01/Samatrix.io-assessment)

---

## Tech Stack

- **Framework** — Next.js 16 (App Router)
- **Language** — TypeScript
- **Database** — PostgreSQL
- **ORM** — Drizzle ORM
- **Styling** — Tailwind CSS
- **Auth** — JWT stored in HTTP-only cookies
- **Password Hashing** — bcryptjs

---

## Features

- **Authentication** — Register, login, logout with JWT
- **Projects** — Create, view, edit, delete projects
- **Tasks** — Kanban board (To Do / In Progress / Done) per project
- **Dashboard** — Stats overview + recent projects and tasks
- **Admin Panel** — Manage all users, toggle roles, view system-wide stats
- **RBAC** — Admins see everything; users only see their own data
- **Route Protection** — `proxy.ts` guards all protected and admin routes

---

## Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── layout.tsx          # Admin route guard
│   │   └── page.tsx            # User management + system stats
│   ├── api/
│   │   ├── admin/
│   │   │   ├── stats/route.ts  # GET system-wide stats (admin only)
│   │   │   └── users/route.ts  # GET/PATCH/DELETE users (admin only)
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── me/route.ts
│   │   │   └── register/route.ts
│   │   ├── projects/
│   │   │   ├── [id]/route.ts   # GET/PATCH/DELETE single project
│   │   │   └── route.ts        # GET all / POST new project
│   │   └── tasks/
│   │       ├── [id]/route.ts   # GET/PATCH/DELETE single task
│   │       └── route.ts        # GET all / POST new task
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx          # Shared layout with Navbar
│   │   └── page.tsx            # Stats + recent projects/tasks
│   ├── projects/
│   │   ├── [id]/page.tsx       # Kanban board for a project
│   │   ├── layout.tsx
│   │   └── page.tsx            # Project list
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # Redirects to /dashboard
├── components/
│   └── Navbar.tsx
├── db/
│   ├── index.ts                # Drizzle client
│   └── schema.ts               # users, projects, tasks tables
├── lib/
│   ├── auth.ts                 # JWT helpers, getCurrentUser()
│   └── response.ts             # API response helpers
└── proxy.ts                    # Route protection middleware
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally

### 1. Clone and install

```bash
git clone https://github.com/anasansari01/Samatrix.io-assessment
cd taskflow-assessment
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/taskflow
JWT_SECRET=some-random-secret-key
```

### 3. Set up the database

Create the database first:

```bash
psql -U postgres -c "CREATE DATABASE taskflow;"
```

Then run the migration:

```bash
psql -U postgres -d taskflow -f drizzle/0000_great_tarantula.sql
```

Or use Drizzle to push the schema directly:

```bash
npx drizzle-kit push
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Admin Setup

After registering your account, manually promote yourself to admin in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

Then log out and log back in. You'll have access to `/admin`.

---

## Database Schema

### users
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | varchar | |
| email | varchar | Unique |
| password | varchar | bcrypt hashed |
| role | enum | `user` or `admin` |
| created_at | timestamp | |

### projects
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | varchar | |
| description | text | Nullable |
| status | enum | `active`, `completed`, `archived` |
| owner_id | uuid | FK → users.id |
| created_at | timestamp | |

### tasks
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| title | varchar | |
| description | text | Nullable |
| status | enum | `todo`, `in_progress`, `done` |
| priority | enum | `low`, `medium`, `high` |
| project_id | uuid | FK → projects.id |
| assigned_to | uuid | FK → users.id, nullable |
| created_at | timestamp | |

---

## API Routes

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, sets cookie |
| POST | `/api/auth/logout` | Clears cookie |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Route | Description |
|---|---|---|
| GET | `/api/projects` | List projects (own or all if admin) |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects/[id]` | Get single project |
| PATCH | `/api/projects/[id]` | Update project |
| DELETE | `/api/projects/[id]` | Delete project |

### Tasks
| Method | Route | Description |
|---|---|---|
| GET | `/api/tasks?projectId=` | List tasks for a project |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/[id]` | Get single task |
| PATCH | `/api/tasks/[id]` | Update task (status, priority, etc.) |
| DELETE | `/api/tasks/[id]` | Delete task |

### Admin (admin role only)
| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/stats` | System-wide stats |
| GET | `/api/admin/users` | List all users |
| PATCH | `/api/admin/users` | Toggle user role |
| DELETE | `/api/admin/users` | Delete user |

---

## Scripts

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
npx drizzle-kit push     # Push schema to DB
npx drizzle-kit studio   # Open Drizzle Studio (DB GUI)
```

---

## Author

**Anas Ansari**
GitHub — [@anasansari01](https://github.com/anasansari01)

---

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request if you find a bug or want to improve something.

---

## Support

If you found this project helpful, consider giving it a ⭐ on [GitHub](https://github.com/anasansari01/Samatrix.io-assessment) — it means a lot!
