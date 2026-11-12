# Hospital Appointment and Patient Management System (HAPMS)

Angular 22 frontend and Node.js/Express backend for the university HAPMS IT project. The application features a fully integrated MySQL database, role-based access control, secure authentication, and interconnected real-time appointment dashboards for patients, doctors, nurses, and administrators.

## Run locally

Use Node.js 24.15 or later within the Node 24 release line and npm 11. Ensure XAMPP (Apache and MySQL) is installed and running.

### 1. Database Setup (MySQL)

1. Open MySQL Workbench (or phpMyAdmin in XAMPP).

2. Create a new query tab and execute the provided `hapms_db.sql` script located in the `Database` folder.

3. This script will automatically create the `hapms_db` database, build all necessary tables (User, Department, Doctor, Patient, Appointment, MedicalRecord), enforce foreign key relationships, and insert the initial test accounts.

### 2. Start the Backend Server

From the project folder, open a terminal and navigate to the backend directory:

```
cd hapms-backend
npm install
node server.js

```

The Express backend API will start on http://localhost:3000. It handles all MySQL database queries, securely hashes passwords, and processes appointment availability logic.

### 3. Start the Frontend Application

Open a new terminal window and navigate to the frontend directory:

```
cd hapms-frontend
npm install
npm start

```

Open http://localhost:4200 to reach the login page.

## Demo Login Credentials

The system seeds four test accounts for presentation grading. All roles sign in through the same secure login page. The backend authenticates the user against the `UserTable` and routes them to the correct dashboard based on their role.

**Shared demo password** — `password123`

| User role | Demo email address | Dashboard route | 
| ----- | ----- | ----- | 
| Patient | `patient@hapms.demo` | `/patient/dashboard` | 
| Doctor | `doctor@hapms.demo` | `/doctor/dashboard` | 
| Nurse | `nurse@hapms.demo` | `/nurse/dashboard` | 
| Admin | `admin@hapms.demo` | `/admin/dashboard` | 

## Application Architecture

The system utilizes a secure three-tier architecture:

* **Presentation Layer:** Angular 22 frontend providing role-based routing, standalone components, and SCSS styling.

* **Application Layer:** Node.js / Express server managing REST API endpoints, bcrypt password hashing, and business logic.

* **Data Layer:** MySQL relational database ensuring data integrity through strict foreign key constraints, 3NF normalization, and duplicate-booking prevention.

### Key Features & Integration

* **Secure Authentication:** The backend uses `bcrypt` to hash all user passwords before saving them to the database. Real login validation occurs on the server side.

* **Role-Based Dashboards:**

  * **Patients** can register accounts, book consultations (in-person or virtual), and view their appointment history.

  * **Doctors** can view their daily schedule, review patient reasons for visits, and mark appointments as complete.

  * **Nurses** can view departmental schedules and update appointment statuses to "Checked-In" or "In Triage".

  * **Administrators** can oversee the system, add new staff accounts, and hard-delete or restore users.

* **Double-Booking Prevention:** The database schema enforces a unique composite constraint (`DoctorID`, `AppointmentDate`, `AppointmentTime`) directly on the `AppointmentTable` to structurally prevent overlapping schedules.

* **Interconnected Data:** Because the frontend is fully integrated with the Express/MySQL backend, an appointment booked by a patient instantly appears on the designated doctor and nurse dashboards. Status updates made by a nurse reflect immediately across all portals.

## Build for Production

```
npm run build
npm test -- --watch=false

```

The build produces browser assets under `dist/hapms-frontend/browser`.