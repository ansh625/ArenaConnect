# ArenaConnect 🏆

ArenaConnect is a production-grade, monolithic sports tournament management platform designed to simplify event publishing, discovery, and profile management. Built using a robust backend pipeline, it serves dynamic roles for both tournament **Organizers** and **Players** via a responsive interface.

🌐 **Live Application:** [arenaconnect.onrender.com](https://onrender.com)

---

## 🚀 Key Architectural Improvements (Production-Ready Migration)
During the transition from development to cloud production, the application architecture was heavily optimized to ensure stable cross-platform performance:
*   **Secure Credential Sandboxing:** Moved all hardcoded database credentials, API access keys, and third-party communication passcodes out of the codebase and into sandboxed environment variables (`process.env`) to prevent token-scraping vulnerabilities.
*   **Bypassing Ephemeral Storage Blocks:** Cloud hosts (like Render) feature read-only or ephemeral file systems that wipe local folders on restarts. Relocation profiles were redesigned to utilize the host operating system's temporary directory (`os.tmpdir()`) to catch incoming binaries before streaming them safely to permanent cloud storage.
*   **Cross-Platform File-System Compliance:** Replaced fragile string concatenation path builders (`+ "/public/"`) with Node.js native `path.join()` structures, enabling the server to initialize smoothly on both local Windows machines and Linux production cloud instances.

---

## 🛠️ Tech Stack
*   **Frontend Layer:** HTML5, Bootstrap 5.3, JQuery 3.7, AngularJS 1.8 (Client-side template looping)
*   **Backend Layer:** Node.js, Express.js (Monolithic routing engine)
*   **Database Layer:** PostgreSQL (Relational storage cluster mapping)
*   **Asset Management:** Express-FileUpload, Cloudinary v2 API (Cloud image hosting)
*   **Communications:** NodeMailer SMTP Relay Server (Secure automated mail dispatch)

---

## 📂 Project Structure
```text
project-root/
│
├── server.js               # Express application entry point & API router
├── package.json            # Dependencies and start scripts configuration
├── .gitignore              # Security rule file to ignore node_modules and .env
│
└── public/                 # Static asset wrapper folder served by Express
    ├── index.html          # Dynamic marketing home directory + Auth Modals
    ├── DashOrganizer.html  # Event coordinator panel
    ├── profileOrganizer.html# Organizer professional profile form
    ├── publish-tournaments.html # Tournament compilation engine
    ├── DashPlayer.html     # Athlete discovery hub
    ├── profilePlayer.html  # Player registration profile form
    ├── tournament-finder.html # AngularJS interactive asynchronous finder view
    └── Styling/            # Dedicated presentation layer folder (.css files)
```

---

## 💾 Database Schema Mappings
To deploy this application successfully, ensure your PostgreSQL instance contains the following two relational table entities:

### 1. `users` Table
```sql
CREATE TABLE users (
    email VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    usertype VARCHAR(50) NOT NULL, -- 'Organizer' or 'Player'
    created_at DATE DEFAULT CURRENT_DATE,
    status INT DEFAULT 1
);
```

### 2. `organizers` Table
```sql
CREATE TABLE organizers (
    email VARCHAR(255) PRIMARY KEY REFERENCES users(email),
    organization VARCHAR(255),
    contact VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    proof VARCHAR(100),
    ppic TEXT,                     -- Cloudinary secure storage URL link string
    sports TEXT,                   -- Multi-select list stored as comma-separated values
    prev TEXT,
    website TEXT,
    insta TEXT
);
```

---

## 🔌 API Endpoints Reference

### 🔐 Authentication & Session Gates
*   `GET /check-user` - Live query validation verifying email string availability.
*   `POST /signup-process` - Registers a unique account into the relational database.
*   `POST /login-process` - Compares inputs to return an authoritative session status indicator payload.

### 💼 Organizer Interfaces
*   `GET /search-user` - Fetches and auto-populates saved profile datasets.
*   `POST /save` - Processes multi-part registration rows and uploads images to Cloudinary.
*   `POST /update` - Mutates active record tables while retaining asset history configurations.
*   `POST /publish-tournament` - Compiles newly submitted sports tournaments directly to the cluster.

### 🏅 Player & Finder Operations
*   `GET /showCities` - Extracts indexed active cities from database columns for filter selectors.
*   `GET /showGames` - Extracts games list to support clean AngularJS dropdown iteration blocks.
*   `GET /showRecords` - Returns filtered tournament card arrays matching search inputs.

### ✉️ Utility Dispatches
*   `POST /settings-update` - Reusable route to securely mutate passwords for active accounts.
*   `POST /contact` - Processes guest input fields and triggers safe external NodeMailer communications.

---

## ⚙️ Local Configuration & Deployment
1. **Clone the repository:**
   ```bash
   git clone https://github.com
   cd ArenaConnect
   ```
2. **Install node dependencies:**
   ```bash
   npm install
   ```
3. **Environment Setup:** Create a secure environment text file named `.env` in the root folder and input your private configuration tags:
   ```env
   PORT=2002
   DATABASE_URL=your_postgresql_connection_string
   CLOUD_NAME=your_cloudinary_cloud_name
   CLOUD_API_KEY=your_cloudinary_api_key
   CLOUD_API_SECRET=your_cloudinary_api_secret
   EMAIL_USER=projectzkz25@gmail.com
   EMAIL_PASS=your_gmail_app_password
   ```
4. **Boot up the server local development loop:**
   ```bash
   node server.js
   ```

---

## 👩‍💻 Author
**Anshpreet Kaur**
*   **Role:** Full Stack Developer (MERN / PERN Stack Engineer)
*   **LinkedIn:** [linkedin.com/in/anshpreet-k](https://linkedin.com)
*   **GitHub:** [github.com/ansh625](https://github.com)

---
License: This project is open-source and licensed under the MIT License.
