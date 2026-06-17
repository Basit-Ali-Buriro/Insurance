# Developer Setup & Packaging Guide

Welcome to the **Insurance Records Management System** development environment. This guide outlines how to set up the codebase, run the development environment, customize accounts, and build clean production installers for clients.

---

## 📋 Prerequisites

Before starting, make sure you have the following installed:
1. **Node.js (LTS Version)**: Download and install from [nodejs.org](https://nodejs.org/).
2. **Git** (Optional but recommended).

---

## 🚀 Getting Started

### 1. Extract the Source Code
Unzip the source folder into a clean workspace directory.

### 2. Install Dependencies
Open your command prompt or terminal in the root of the project folder and run:
```bash
npm install
```
> [!NOTE]
> This command will download all dependencies and automatically trigger an `electron-rebuild`. This compiles the native C++ database and cryptography modules (`better-sqlite3` and `bcrypt`) specifically for your operating system.

### 3. Run the App in Development Mode
Launch the Vite development server and the Electron application shell:
```bash
npm run dev
```

---

## 🔑 Default Credentials

When running the application for the first time, a local database is generated and seeded with the following default accounts:

| Role | Username | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Developer** | `developer` | `Dev@1234` | Full access + Developer/Build settings |
| **Admin** | `admin` | `Admin@1234` | Standard administration workspace |

---

## 📦 Packaging Workflow (Pure UI)

To ship a pre-seeded installer to a client with their credentials pre-loaded:

### 1. Create the Client Accounts
* Log in as `developer` or `admin`.
* Go to the **Users** management section.
* Register the custom user accounts that your client will use to log in.

### 2. Wipe Testing Data
* Go to **Settings** $\rightarrow$ scroll down to **Developer System Operations**.
* Click **Reset Database**.
* This will safely wipe all test data (policies, SM/SR structures, notifications) while keeping the newly created user accounts intact.

### 3. Build the Installer Setup
* Still in the Developer System Operations section, click **Build & Package App**.
* The application will automatically:
  1. Copy your active database (containing the client accounts) to the installer template.
  2. Compile the React frontend assets.
  3. Package the standalone desktop application.
  4. Create a zipped installer archive.

### 4. Locate the Zip File
Once the build is complete, you will find the ready-to-ship installer in the root folder of the project:
* 📁 **ZIP Archive (Share this)**: `Insurance_Setup_Exe.zip`
* 📁 **Raw Executable**: `release/Insurance Records Management System Setup 1.0.1.exe`

---

## 🛠️ Troubleshooting

### Vite Hot-Reload Loop / Black Screen
If the Electron app goes black or starts reloading continuously:
1. Close the Electron window.
2. In the terminal, run `npm run dev -- --force` to clear Vite's module cache.
3. Reloading is prevented automatically as the `release`, `dist`, and `sysconfig.dat` folders are configured to be ignored by Vite's watcher.

### Port In-Use Error
The app is configured to load `http://127.0.0.1:5173`. Make sure no other local process is running on port `5173`. If a port conflict occurs, terminate the conflicting process and restart the dev server.
