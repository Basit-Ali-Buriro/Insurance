# Insurance Records Management System

A modern, desktop-based Insurance Policy Management System (PMS) built with **Electron**, **React**, and **Vite**. Designed for insurance professionals to efficiently manage policies, proposals, team records, and business operations.

## ✨ Features

- **Policy Management**: Register and track insurance policies with comprehensive details
- **Proposal Tracking**: Manage client proposals from creation to approval
- **Business Analytics**: Real-time KPI dashboard with business figures and performance metrics
- **Team Management**: Recruitment, team structure, and role-based access control
- **License Management**: Track license renewals and software licensing
- **Secure Authentication**: Login system with role-based access (Admin, Developer, User)
- **Data Backup & Restore**: Full database backup and recovery functionality
- **Notifications**: Real-time alerts for system events
- **Area Management**: Organize territories and business areas
- **Premium Security**: Password management and security credentials
- **Modern UI**: Material Design 3-inspired interface with dark/light theme support

## 🛠 Tech Stack

- **Frontend**: React 18 + JSX
- **Build Tool**: Vite
- **Desktop**: Electron (with IPC communication)
- **Styling**: Tailwind CSS + PostCSS
- **Database**: SQLite (with encryption support)
- **Bundler**: Electron Builder
- **Runtime**: Node.js

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Basit-Ali-Buriro/Insurance.git
cd Insurance
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

This will start:
- Vite dev server (React frontend on `http://localhost:5173`)
- Electron main process

### 4. Build for Production
```bash
npm run build
```

### 5. Package as Executable
```bash
npm run electron:build
```

The packaged application will be in the `release/` directory.

## 📁 Project Structure

```
├── src/                           # React frontend
│   ├── pages/                    # Application pages
│   │   ├── Dashboard.jsx         # Main analytics dashboard
│   │   ├── PolicyRegister.jsx    # Policy management
│   │   ├── ProposerRegister.jsx  # Proposal handling
│   │   ├── LoginPage.jsx         # Authentication
│   │   ├── Settings.jsx          # User settings & backups
│   │   ├── UsersPage.jsx         # User management
│   │   ├── ShowTeam.jsx          # Team structure
│   │   ├── SMRecruitment.jsx     # Sales manager recruitment
│   │   ├── SSMRecruitment.jsx    # Senior sales manager recruitment
│   │   ├── SRRegister.jsx        # Sales representative register
│   │   ├── AreaManager.jsx       # Area/territory management
│   │   ├── BusinessFigure.jsx    # Business statistics
│   │   ├── LicenseRenewalPage.jsx # License tracking
│   │   └── Notifications.jsx     # System notifications
│   ├── components/               # Reusable UI components
│   │   ├── AppShell.jsx          # Main layout wrapper
│   │   ├── Sidebar.jsx           # Navigation sidebar
│   │   ├── DataTable.jsx         # Data display table
│   │   ├── DonutChart.jsx        # Chart visualization
│   │   ├── KpiCard.jsx           # KPI display card
│   │   ├── Modal.jsx             # Modal dialog
│   │   ├── SearchableDropdown.jsx # Dropdown select
│   │   └── Toast.jsx             # Notification toasts
│   ├── lib/
│   │   └── api.js                # API communication layer
│   ├── App.jsx                   # Main app component
│   ├── main.jsx                  # React entry point
│   └── index.css                 # Global styles
│
├── main/                          # Electron main process
│   ├── main.js                   # Electron main entry
│   ├── preload.js                # Preload script (IPC bridge)
│   ├── ipcHandlers.js            # IPC event handlers
│   ├── database.js               # SQLite database layer
│   ├── licenseManager.js         # License management
│   ├── crypto.js                 # Encryption utilities
│   └── logger.js                 # Logging service
│
├── assets/                        # Static assets
│   ├── logo.svg                  # Application logo
│   ├── icon.ico                  # Windows icon
│   └── icon.png                  # Icon assets
│
├── vite.config.js                # Vite configuration
├── tailwind.config.js            # Tailwind CSS config
├── postcss.config.js             # PostCSS configuration
└── package.json                  # Dependencies & scripts
```

## 🔐 Security Features

- **Password Encryption**: Secure password hashing and verification
- **Database Encryption**: SQLite database encryption support
- **Session Management**: Secure user session handling
- **Role-Based Access Control (RBAC)**: Different permission levels for user roles
- **Secure IPC Communication**: Validated inter-process communication

## 📝 Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build optimized production bundle
npm run preview          # Preview production build
npm run electron:build   # Package as Windows executable
npm run license:gen      # Generate product licenses
```

## 🗄 Database

The application uses **SQLite** with encryption support. Database files are stored in the application's data directory:
- Windows: `%APPDATA%/Insurance/`
- macOS: `~/Library/Application Support/Insurance/`
- Linux: `~/.config/Insurance/`

## 📞 Developer Support

### Subhash Prem (Software Architect)
- **Phone**: 0333-7104578 / 0315-2967527
- **Email**: premlalwani291@gmail.com

### Basit Ali (Full Stack Developer)
- **Phone**: 0324-3859337
- **Email**: basit.web24@gmail.com

## 📄 License

© 2026 Lalwani Software Solutions. All rights reserved.

## 🤝 Contributing

For bug reports and feature requests, please contact the development team.

## 📦 Release Information

- **Current Version**: 1.0.1
- **Latest Executable**: Available in the `release/` directory
- **Build Status**: Successfully tested on Windows 10/11

---

**Last Updated**: June 2026  
**Repository**: [https://github.com/Basit-Ali-Buriro/Insurance](https://github.com/Basit-Ali-Buriro/Insurance)
