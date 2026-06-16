# 🧾 REDESIGN MASTER ENGINEERING PROMPT

## Insurance Policy & Hierarchy Management ERP
### Desktop Application — Comprehensive Production Specification

This document contains the complete system specifications, database schemas, page descriptions, styling guidelines, and logic updates for rebuilding or redesigning this application.

---

## 🔷 1. Technical Architecture & Stack

The application is a fully offline-first, standalone Windows desktop application designed to run as an enterprise-grade ERP with dual-layer security and hardware-bound license enforcement.

| Technology | Purpose |
| :--- | :--- |
| **Electron.js + React.js** | Core app framework & runtime container. |
| **Tailwind CSS + Vanilla CSS** | Styling system (curated harmonious colors, modern typography). |
| **SQLite (`better-sqlite3`)** | Persistent database storage. |
| **`electron-builder`** | Packaging utility → Generates a single `.exe` NSIS installer. |
| **`bcrypt`** | Password hashing for authentication. |
| **`pdfkit`** | PDF report exports (with bordered tables). |
| **`exceljs`** | Excel workbook exports (with formatted sheets and grand totals). |
| **`archiver`** | Backup compressor (creates encrypted `.zip` files of DB and uploads). |
| **Node.js `crypto` (AES-256-CBC)**| Column-level database encryption and license configuration encryption. |
| **`node-machine-id`** | Generates hardware finger-print for licensing. |
| **`nodemailer`** | Sends licensing emails silently to the developer. |
| **`winston`** | Logs system operations (encapsulated log files). |

> **Offline Rule:** All core features—including database CRUD, team listings, and calculations—must function 100% offline. Internet is required **only** for launching WhatsApp reminder links in the browser and transmitting license key alerts to the developer.

---

## 🔷 2. User Roles

### 👨‍💻 Developer (Super Admin)
- Hardcoded default credentials auto-inserted at first database initialize.
- Access to **all pages**, including a developer-exclusive **Users** page.
- Can create, edit, or delete Admin (Client) user accounts.
- **Security Constraint:** The **Users** page and its sidebar route must be completely omitted from the DOM if the logged-in user is not a Developer (preventing any bypass via CSS).

### 👤 Admin (Client)
- Credentials created by the Developer.
- Accesses all operational screens (Dashboard, Registers, Teams, Settings).
- Restricted from viewing or accessing the Users list.

---

## 🔷 3. Core Database Schema & Migrations

The database is encrypted at a column level (Layer 1) and stored as a disguised file `.dat` in the hidden app data path (Layer 2).

### SQLite Table Definitions (`better-sqlite3`)

```sql
-- 1. Users Table
CREATE TABLE IF NOT EXISTS Users (
  user_id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,                       -- AES-256-CBC Encrypted
  username      TEXT UNIQUE NOT NULL,                -- AES-256-CBC Encrypted
  password_hash TEXT NOT NULL,                       -- bcrypt Hashed
  role          TEXT CHECK(role IN ('developer','admin')) NOT NULL,
  status        TEXT CHECK(status IN ('active','inactive')) DEFAULT 'active',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Area Managers Table
CREATE TABLE IF NOT EXISTS Area_Managers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  am_code      TEXT UNIQUE NOT NULL,
  am_name      TEXT NOT NULL,                        -- AES-256-CBC Encrypted
  address      TEXT,                                 -- AES-256-CBC Encrypted
  cnic         TEXT NOT NULL,                        -- AES-256-CBC Encrypted
  contact_1    TEXT,                                 -- AES-256-CBC Encrypted
  contact_2    TEXT,                                 -- AES-256-CBC Encrypted
  status       TEXT CHECK(status IN ('active','inactive')) DEFAULT 'active',
  license_date DATE,                                 -- Format: YYYY-MM-DD
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Senior Sales Managers (SSM) Table
CREATE TABLE IF NOT EXISTS SSM (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  ssm_code            TEXT UNIQUE NOT NULL,
  ssm_name            TEXT NOT NULL,                 -- AES-256-CBC Encrypted
  address             TEXT,                          -- AES-256-CBC Encrypted
  cnic                TEXT NOT NULL,                 -- AES-256-CBC Encrypted
  contact_1           TEXT,                          -- AES-256-CBC Encrypted
  contact_2           TEXT,                          -- AES-256-CBC Encrypted
  am_id               INTEGER REFERENCES Area_Managers(id),
  cnic_pic            TEXT,                          -- Relative upload path
  nominee_cnic_pic    TEXT,                          -- Relative upload path
  matric_cert         TEXT,                          -- Relative upload path
  intermediate_cert   TEXT,                          -- Relative upload path
  degree_cert         TEXT,                          -- Relative upload path
  status              TEXT CHECK(status IN ('active','inactive')) DEFAULT 'active',
  second_year_premium REAL DEFAULT 0.0,
  license_date        DATE,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Sales Managers (SM) Table
CREATE TABLE IF NOT EXISTS SM (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  sm_code             TEXT UNIQUE NOT NULL,
  sm_name             TEXT NOT NULL,                 -- AES-256-CBC Encrypted
  address             TEXT,                          -- AES-256-CBC Encrypted
  cnic                TEXT NOT NULL,                 -- AES-256-CBC Encrypted
  contact_1           TEXT,                          -- AES-256-CBC Encrypted
  contact_2           TEXT,                          -- AES-256-CBC Encrypted
  ssm_id              INTEGER REFERENCES SSM(id),
  am_id               INTEGER REFERENCES Area_Managers(id),
  cnic_pic            TEXT,
  nominee_cnic_pic    TEXT,
  matric_cert         TEXT,
  intermediate_cert   TEXT,
  degree_cert         TEXT,
  status              TEXT CHECK(status IN ('active','inactive')) DEFAULT 'active',
  second_year_premium REAL DEFAULT 0.0,
  license_date        DATE,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Sales Representatives (SR) Table
CREATE TABLE IF NOT EXISTS SR (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  sr_code             TEXT UNIQUE NOT NULL,
  sr_name             TEXT NOT NULL,                 -- AES-256-CBC Encrypted
  address             TEXT,                          -- AES-256-CBC Encrypted
  cnic                TEXT NOT NULL,                 -- AES-256-CBC Encrypted
  contact_1           TEXT,                          -- AES-256-CBC Encrypted
  contact_2           TEXT,                          -- AES-256-CBC Encrypted
  sm_id               INTEGER REFERENCES SM(id),
  ssm_id              INTEGER REFERENCES SSM(id),
  am_id               INTEGER REFERENCES Area_Managers(id),
  cnic_pic            TEXT,
  nominee_cnic_pic    TEXT,
  matric_cert         TEXT,
  intermediate_cert   TEXT,
  degree_cert         TEXT,
  status              TEXT CHECK(status IN ('active','inactive')) DEFAULT 'active',
  second_year_premium REAL DEFAULT 0.0,
  license_date        DATE,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Proposer Register Table
CREATE TABLE IF NOT EXISTS Proposer_Register (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_no         TEXT UNIQUE NOT NULL,
  holder_name         TEXT NOT NULL,                 -- AES-256-CBC Encrypted
  premium             REAL NOT NULL,
  pr_no               TEXT,                          -- AES-256-CBC Encrypted
  pr_date             DATE,
  amount_type         TEXT CHECK(amount_type IN ('cash','cheque')),
  requirements        TEXT,
  sr_id               INTEGER REFERENCES SR(id),
  sm_id               INTEGER REFERENCES SM(id),
  ssm_id              INTEGER REFERENCES SSM(id),
  status              TEXT CHECK(status IN ('ok','not_ok')) DEFAULT 'not_ok',
  converted_to_policy INTEGER DEFAULT 0,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Policy Register Table
CREATE TABLE IF NOT EXISTS Policy_Register (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_no          TEXT UNIQUE NOT NULL,           -- AES-256-CBC Encrypted
  holder_name        TEXT NOT NULL,                  -- AES-256-CBC Encrypted
  cnic               TEXT NOT NULL,                  -- AES-256-CBC Encrypted
  address            TEXT,                           -- AES-256-CBC Encrypted
  contact_1          TEXT,                           -- AES-256-CBC Encrypted
  contact_2          TEXT,                           -- AES-256-CBC Encrypted
  premium            REAL NOT NULL,
  issue_date         DATE NOT NULL,
  due_date           DATE,
  table_term         TEXT,
  last_paid_date     DATE,
  previous_paid_date DATE,
  sr_id              INTEGER REFERENCES SR(id),
  sm_id              INTEGER REFERENCES SM(id),
  ssm_id             INTEGER REFERENCES SSM(id),
  proposal_id        INTEGER REFERENCES Proposer_Register(id),
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS Notifications (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_id        INTEGER REFERENCES Policy_Register(id),
  triggered_date   DATE,
  whatsapp_sent    INTEGER DEFAULT 0,
  whatsapp_sent_at DATETIME,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Second Year Log Table
CREATE TABLE IF NOT EXISTS Second_Year_Log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_id   INTEGER REFERENCES Policy_Register(id),
  sr_id       INTEGER,
  sm_id       INTEGER,
  ssm_id      INTEGER,
  premium     REAL,
  detected_at DATE DEFAULT (date('now'))
);

-- 10. Config Table
CREATE TABLE IF NOT EXISTS Config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### Performance Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_policy_no   ON Policy_Register(policy_no);
CREATE INDEX IF NOT EXISTS idx_due_date    ON Policy_Register(due_date);
CREATE INDEX IF NOT EXISTS idx_issue_date  ON Policy_Register(issue_date);
CREATE INDEX IF NOT EXISTS idx_last_paid   ON Policy_Register(last_paid_date);
CREATE INDEX IF NOT EXISTS idx_sr_code     ON SR(sr_code);
CREATE INDEX IF NOT EXISTS idx_sm_code     ON SM(sm_code);
CREATE INDEX IF NOT EXISTS idx_ssm_code    ON SSM(ssm_code);
CREATE INDEX IF NOT EXISTS idx_am_code     ON Area_Managers(am_code);
CREATE INDEX IF NOT EXISTS idx_proposal_no ON Proposer_Register(proposal_no);
```

---

## 🔷 4. Reusable UI Components & Layout Specs

### 🖥️ Theme and Styling System
- The app defaults to a premium **Dark Theme** utilizing vibrant highlight accents and harmonious gradients.
- Typography uses standard, clean fonts (Inter or Outfit) to replace default browser lettering.
- **Theme Switcher:** An interactive Sun/Moon button toggles between `dark` and `light` themes dynamically. The state persists in `localStorage` and updates a custom `data-theme` attribute on the root HTML tag.
- Tables support vertical and horizontal scrolling wrapping (`.datatable-wrapper`). Column headers (`thead`) must remain sticky when scrolling.

### 🔍 Global Search & Highlighting
- A search input is located on the main top header, querying database tables globally.
- Selecting a matching record (Proposals, Policies, SRs, SMs, SSMs, Area Managers) triggers the following events:
  1. Sets a parameter `?highlight=id` in the history state.
  2. Navigates the user to the correct page.
  3. Locates the matching table row, scrolls it into view, and highlights it with a temporary yellow background animation class (`.highlighted-row`) that fades away after 4 seconds.

### 📁 Upload File Previews & Viewer
- Forms for SSM, SM, and SR enable uploading CNIC and educational certificates.
- Uploads are copied to localized directories: `userData/images/[role]/[code]/`.
- Document previews are accessible via a **Folder icon** in the listings.
- Selecting a file invokes `shell.openPath` via the `app:openFile` IPC handler, opening the document (image or PDF) in the host PC's default system reader.

### 🤝 Cascading Deletions Logic
- To prevent database constraint crashes, child table foreign keys are set to `NULL` prior to executing a parent delete transaction:
  - Deleting an Area Manager nullifies its references in `SSM`, `SM`, and `SR`.
  - Deleting an SSM nullifies its references in `SM`, `SR`, `Proposer_Register`, `Policy_Register`, and `Second_Year_Log`.
  - Deleting an SM nullifies its references in `SR`, `Proposer_Register`, `Policy_Register`, and `Second_Year_Log`.
  - Deleting an SR nullifies its references in `Proposer_Register`, `Policy_Register`, and `Second_Year_Log`.

---

## 🔷 5. Page Implementations

### 1. Dashboard
- **Row 1 & 2 KPI Cards:** Display total policies, proposals, SRs, and SMs with up/down arrows showing percentage changes vs. the previous month.
- **Policies Due Soon Widget:** Shows count of policies due soon. Contains toggles for **7 Days**, **15 Days**, and **30 Days** to adjust the count dynamically.
- **Financial KPIs:** Tracks current month premium volume and year-to-date collections.
- **Monthly Premium Bar Chart:** Displays monthly collection volumes.
- **Target Achieved Donuts:** Displays monthly and yearly target percentages. Admin can click directly on the targets in the dashboard header to edit and save target configurations.
- **Insights Cards:** Shows top SM and top SR this month, and pending renewals.
- **Action Toolbar:** 
  - **Download Report (PDF)** (details below).
  - **Download Backup:** Compresses the SQLite database and image uploads into a `.zip` file.

### 2. Proposer Register
- **Forms & Inputs:** Collects proposal details, requiring unique Proposal Numbers.
- **Conversion Flow:** When the status is set to "OK", a confirmation prompt asks to convert it. Upon conversion, a corresponding record is automatically created in the Policy Register, and the user is redirected and focused on the new policy row.

### 3. Policy Register
- Displays all database columns in the data viewer. `created_at` is hidden.
- **2nd Year Premium Logic:** If the Last Paid Date is updated to a date falling in the next calendar year, the premium amount is logged in `Second_Year_Log` and added to the hierarchy totals.

### 4. Show Team
- Aggregates SRs, SMs, and SSMs in one place. Column names dynamically adapt based on selected filters (All / SR / SM / SSM). Action header is customized as **Documents**.

### 5. Area Manager Register
- Columns include Serial No, AM Code, Name, CNIC, Contacts, Address, Status, License Date, and hierarchical counts (SSMs, SMs, SRs).
- **Total Business:** Sum of premiums for all policies of SRs assigned under the AM.
- **2nd Yr Premium:** Dynamically calculates sum of `Second_Year_Log` records belonging to the AM's SRs.

### 6. Business Figure Reports
- Date range selectors (From/To) and role filter toggles (SR / SM / SSM).
- Pin a Grand Total row showing the sum of Policies, Total Business, and 2nd Year Premium.
- **Export Excel:** Saves a workbook containing individual sheets for SR, SM, and SSM performance, formatting the final total row in bold.

### 7. Settings & Data Integrity
- Form to edit profile credentials and change password.
- **Data Integrity Card:** Contains confirmable buttons to **Reset Database** (clears all operational records, maintaining targets and users) and **Seed Database** (inserts mock operational records for testing).

---

## 🔷 6. Export Engines Specifications

### 📊 Dashboard Executive Summary PDF
The exported PDF is generated on a single page, formatted with three black-bordered tables:
1. **System Statistics Table:**
   - Headers: `Metric Name` | `Count`
   - Content: Total Active Policies, Total Customer Proposals, SSMs, SMs, SRs.
2. **Financial Metrics Table:**
   - Headers: `Financial Period` | `Premium Volume`
   - Content: Current Month, Previous Month, Year-to-Date volumes.
3. **Premium Collection Trend Table:**
   - Headers: `Month/Year` | `Total Premium Collection`
   - Content: Monthly collection volumes for the trailing 12 months.
- **Cursor Fix:** The PDF writer must reset the horizontal cursor position (`doc.x = 50`) before drawing each table heading to prevent heading text from drifting rightward.

### 📈 Business Performance Reports
- **PDF Exporter:** Outputs cells, headers, and total rows wrapped in a black-bordered grid box (`doc.rect().stroke()`).
- **Excel Exporter:** Groups rows in bold headers, adding SUM formulas to the final rows and bolding the grand totals.

---

## 🔷 7. Software License, Verification and Alerting System

The system operates silently to bind the software build to a single client machine.

### 1. Initial Activation Key Delivery
- At first launch, the app reads the machine's hardware ID (`node-machine-id`) and generates a unique activation key using `AES-256-CBC` encryption:
  - Input: `machineId | installTimestamp | salt` (hardcoded salt).
- A **1-year expiry timestamp** is calculated and stored in an encrypted configuration file at `app.getPath('userData')/appdata/.lc`.
- The app silently attempts to transmit the **Machine ID, License Key, Installation Date, and Expiry Date** to the developer:
  - **Email Alert:** Transmitted in the background via `nodemailer` using the SMTP configurations defined at the top of `licenseManager.js`.
  - **WhatsApp Alert:** Opens a pre-filled browser page: `https://wa.me/[developer_number]?text=[message]`.
- **Silent Background Retry:** If there is no internet during installation, the app stores `licenseSent = false` and retries silent email delivery on every subsequent launch until confirmation.

### 2. Renewal Reminders
- On launch, the app checks the remaining license duration.
- **At 30 Days:** Displays a non-dismissable orange warning banner at the top of pages. The license warning is added to the sidebar notification badge count. The app auto-sends a notification email/WhatsApp reminder to the developer (sent exactly once using the `notified30Days = true` flag).
- **At 7 Days:** The warning banner turns urgent red. The app auto-sends a final notification to the developer (sent exactly once using the `notified7Days = true` flag).

### 3. Expiration Lock
- If `daysLeft <= 0`, the app bypasses the login screen entirely and locks the screen with the **License Renewal Page**. No other views or database operations are accessible.
- The user must provide a valid renewal key generated by the developer (validating that the key decodes to match their specific Machine ID).
- Entering a valid key resets the expiry timestamp for another year and resets the flags (`licenseSent`, `notified30Days`, `notified7Days` to `false`) to trigger next year's alerts.

---

## 🔷 8. Data Security and Decryption Failures

### Columns Subject to AES-256-CBC Column-Level Encryption:
- **Policy_Register:** `holder_name`, `cnic`, `address`, `contact_1`, `contact_2`, `policy_no`
- **Proposer_Register:** `holder_name`, `pr_no`
- **SR / SM / SSM / Area_Managers:** `name`/`am_name`/`sm_name`/`ssm_name`, `cnic`, `address`, `contact_1`, `contact_2`
- **Users:** `name`, `username`

> If a value fails database decryption (indicating manual tampering or corrupted records), the decryption function must return a fallback string `"DATA_ERROR"`. The UI must catch this fallback and display a warning label (`"Data Error"`) in the cell, rather than causing a crash or runtime error.
