# TaskFlow — Role-Based Team Task Management System

A production-ready full-stack role-based Task Management application built for organizations to manage teams, delegate tasks, track real-time progress across Kanban stages, collaborate via comments, and receive task event notifications.

---

## 🚀 Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | **.NET 10 / ASP.NET Core Web API** | Clean REST API with controllers, JWT Authentication, and BCrypt hashing |
| **Database** | **MySQL 8.0** | Relational database (`TaskManagement`) using Pomelo Entity Framework Core |
| **ORM** | **EF Core 9.0 (Pomelo MySQL)** | Code-first & Scaffolded entity models with foreign key constraints |
| **Frontend** | **React 19 + Vite 8** | Fast client-side SPA with declarative state management |
| **Styling** | **Tailwind CSS v4** | Clean, modern, responsive UI with accessible status badges and modals |
| **HTTP Client**| **Axios** | Interceptor-based API client with automatic JWT token injection |
| **Icons** | **Lucide React** | Clean, modern UI iconography |

---

## 👥 User Roles & Capabilities

| Role | Permissions & Capabilities |
| :--- | :--- |
| **Admin** | Full system access. Create and manage teams, assign members to teams, create and assign tasks to managers and users, view all organization metrics. |
| **Manager** | Create and assign tasks to team members, manage team members, change task statuses, collaborate via comments. |
| **User** | View assigned tasks, transition task status (`To Do` ➔ `In Progress` ➔ `Done`), post comments, receive assignment & status notifications. |

---

## 🔑 Sample Credentials & Quick Demo Login

The application includes an automated **"1-Click Quick Demo Sign In"** on the Login screen and a **"Seed Sample Data"** button in the header.

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `Admin@123` |
| **Manager** | `manager@example.com` | `Manager@123` |
| **User 1** | `user1@example.com` | `User@123` |
| **User 2** | `user2@example.com` | `User@123` |

---

## 🛠️ Getting Started & Setup Instructions

### Prerequisites
- [.NET SDK 10.0 or 8.0+](https://dotnet.microsoft.com/download)
- [Node.js (v18+ or v20+)](https://nodejs.org/)
- [MySQL Server 8.0+](https://dev.mysql.com/downloads/installer/) running on `localhost:3306`

### 1. Database Configuration
Ensure MySQL is running and the connection string in `Backend/MyApp/appsettings.json` matches your local MySQL setup:
```json
"ConnectionStrings": {
  "DefaultConnection": "server=localhost;database=TaskManagement;user=root;password=YOUR_PASSWORD"
}
```

### 2. Run the Backend (.NET Web API)
```powershell
cd "Backend/MyApp"
dotnet restore
dotnet build
dotnet run --launch-profile http
```
> The API will start on: **`http://localhost:5005`**

### 3. Run the Frontend (React + Vite)
```powershell
cd "Frontend/vite-project"
npm.cmd install
npm.cmd run dev
```
> The web application will launch on: **`http://localhost:5173`**

---

## 📮 API Documentation & Endpoints

You can import the included Postman Collection:  
**[`TaskFlow_Postman_Collection.json`](./TaskFlow_Postman_Collection.json)**

### Authentication & Authorization
- `POST /api/auth/register` — Register a new account (`Name`, `Email`, `Password`, `Role`)
- `POST /api/auth/login` — Sign in and receive JWT token + user profile
- `GET  /api/auth/me` — Retrieve current authenticated user profile (`Bearer` token)
- `GET  /api/auth/users` — List all registered users (filter by `?role=...`)

### Tasks Management
- `GET    /api/tasks` — List tasks with filters (`status`, `priority`, `search`, `deadlineFilter`, `teamId`, `assignedTo`)
- `GET    /api/tasks/{id}` — Get task details with collaborative comments & assignee info
- `POST   /api/tasks` — Create task (Admin & Manager) + triggers `TaskAssigned` notification
- `PUT    /api/tasks/{id}` — Update task details + triggers notifications on change
- `PATCH  /api/tasks/{id}/status` — Quick status transition (`To Do`, `In Progress`, `Done`) + triggers `TaskStatusUpdated` notification
- `DELETE /api/tasks/{id}` — Remove task

### Comments & Task Collaboration
- `GET  /api/tasks/{taskId}/comments` — Retrieve all comments for a task
- `POST /api/tasks/{taskId}/comments` — Post a new comment

### Teams & Member Assignment
- `GET    /api/teams` — List teams with member count & assigned task count
- `POST   /api/teams` — Create a new team
- `GET    /api/team-members/{teamId}` — List all members belonging to a team
- `POST   /api/add-team-member` — Assign a user to a team
- `DELETE /api/team-members/{teamId}/{userId}` — Remove a member from a team

### Notifications & Dashboard
- `GET /api/notifications` — Get user notifications (newest first)
- `PUT /api/notifications/{id}/read` — Mark notification as read
- `PUT /api/notifications/read-all` — Mark all notifications as read
- `GET /api/dashboard/stats` — Dashboard KPIs (Total, To Do, In Progress, Done, Overdue)
- `POST /api/seed` — Seed default demo data (users, teams, tasks, comments, notifications)

---

## 📁 Repository Structure

```
Assessment Project/
├── Backend/
│   └── MyApp/
│       ├── Controllers/
│       │   ├── AuthController.cs          # Register, Login, Users, JWT
│       │   ├── TasksController.cs         # Task CRUD, filters, notifications
│       │   ├── CommentsController.cs      # Collaboration comments
│       │   ├── TeamsController.cs         # Team management
│       │   ├── TeamMembersController.cs   # Assign members to teams
│       │   ├── NotificationsController.cs # Notification triggers & state
│       │   ├── DashboardController.cs     # KPI metrics & aggregations
│       │   └── SeedController.cs          # 1-Click sample data generator
│       ├── Models/
│       │   ├── AppDbContext.cs            # EF Core MySQL DbContext
│       │   ├── User.cs, Task.cs, Team.cs  # Entity models
│       │   ├── Comment.cs, Notification.cs
│       │   └── AuthModel.cs               # Strongly-typed DTOs
│       ├── Program.cs                     # Middleware, CORS, JWT Auth setup
│       └── appsettings.json               # MySQL connection string & JWT key
│
├── Frontend/
│   └── vite-project/
│       ├── src/
│       │   ├── api/
│       │   │   └── axios.js               # Axios instance with JWT interceptor
│       │   ├── context/
│       │   │   └── AuthContext.jsx        # Auth state & role helpers
│       │   ├── components/
│       │   │   ├── Navbar.jsx             # Top bar with role pill & actions
│       │   │   ├── NotificationDropdown.jsx # Real-time notification bell
│       │   │   ├── TaskModal.jsx          # Task create/edit dialog
│       │   │   ├── TaskDetailModal.jsx    # Details & comments thread
│       │   │   ├── TeamModal.jsx          # Create team modal
│       │   │   └── AddMemberModal.jsx     # Assign user to team modal
│       │   ├── pages/
│       │   │   ├── Login.jsx              # Sign in + 1-Click demo buttons
│       │   │   ├── Register.jsx           # Sign up with role selector
│       │   │   ├── Dashboard.jsx          # Kanban board, stats, filters
│       │   │   └── Teams.jsx              # Teams & members management
│       │   ├── App.jsx                    # Root router & layout
│       │   ├── App.css                    # Tailwind CSS imports
│       │   └── main.jsx
│       └── package.json
│
├── TaskFlow_Postman_Collection.json       # Ready-to-import Postman Collection
└── README.md
```
