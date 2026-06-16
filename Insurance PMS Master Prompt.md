# 🧾 MASTER ENGINEERING PROMPT

## Insurance Policy Records Management System

### Desktop Application — Complete Production Specification

-----

## 🔷 1. Project Overview

You are a senior full-stack desktop application engineer with enterprise-level experience. Build a fully offline, standalone **Insurance Policy Records Management System** as a Windows desktop application using the following tech stack:

|Tool                            |Purpose                                                            |
|--------------------------------|-------------------------------------------------------------------|
|**Electron.js + React.js**      |Application framework                                              |
|**Tailwind CSS + shadcn/ui**    |Styling and UI components                                          |
|**SQLite via better-sqlite3**   |Database                                                           |
|**electron-builder**            |Installer → Windows `.exe`                                         |
|**bcrypt**                      |Password hashing                                                   |
|**Recharts**                    |Charts and graphs                                                  |
|**pdfkit**                      |PDF export                                                         |
|**exceljs**                     |Excel export                                                       |
|**archiver**                    |Backup (zip)                                                       |
|**Node.js crypto (AES-256-CBC)**|Data encryption, license key, config encryption                    |
|**`https://wa.me/` links**      |WhatsApp messaging (browser-based, internet required at click time)|
|**nodemailer**                  |Email (internet required — license delivery to developer only)     |
|**node-machine-id**             |Hardware fingerprint for license binding                           |
|**winston**                     |Logging                                                            |
|**Electron native dialogs**     |File/image handling, stored in `userData` folder                   |


> **Offline Rule:** The application must be fully self-contained and offline for all core operations. Internet is required **only** for WhatsApp reminder button clicks and license key email/WhatsApp delivery to developer.

The final deliverable must function as an **enterprise-grade offline Insurance ERP system**.

-----

## 🔷 2. User Roles

### 👨‍💻 Developer (Super Admin)

- Hardcoded default credentials stored securely in the database at first launch
- Has access to **all pages** including an exclusive **Users** page
- Can view and modify all admin (client) credentials
- The Users page and its sidebar button must be completely **hidden from Admin** — not rendered in the DOM at all

### 👤 Admin (Client/End User)

- Credentials set by Developer before shipping `.exe` to client
- Accesses all pages **except** the Users page
- Manages all day-to-day insurance office operations
- No system-level overrides

-----

## 🔷 3. Login Page

- First screen shown on every app launch before anything else
- Fields: **Username**, **Password** (masked with show/hide toggle)
- Login button with loading spinner during authentication
- bcrypt-based password verification against encrypted SQLite database
- **Failed login:** inline error message (“Invalid credentials, please try again”)
- **Successful login:** redirect to Dashboard
- No “Forgot Password” for Admin — only Developer can reset via Users page
- Design: professional centered layout with software name and logo, clean dark theme

-----

## 🔷 4. Application Shell — Main Layout

After login, render the persistent application shell.

### 🧭 Left Sidebar (always visible)

- **Top:** Software logo and name
- **Below logo:** Logged-in user’s display name and role badge
- **Navigation buttons** (icon + label) in this exact order:
1. Dashboard
1. Proposer Register
1. Policy Register
1. SR Register
1. SM Recruitment
1. SSM Recruitment
1. Area Manager
1. Show Team
1. Business Figure
1. Notifications *(with live unread count badge)*
1. Settings
1. Users *(rendered only when logged-in role is Developer)*
- **Bottom:** Logout button

### 📄 Main Content Area

- Renders active page based on sidebar selection
- Smooth page transition animations
- Breadcrumb at top of every page showing current location

-----

## 🔷 5. Dashboard

The dashboard is the central KPI and analytics hub of the system, structured in clearly defined rows.

-----

### 🟦 Row 1 — Core KPI Cards

Four cards displayed horizontally:

|Card           |Value                                    |Behavior                                  |
|---------------|-----------------------------------------|------------------------------------------|
|Total Policies |Count of all records in Policy Register  |Clickable → navigates to Policy Register  |
|Total Proposals|Count of all records in Proposer Register|Clickable → navigates to Proposer Register|
|Total SRs      |Count of all SR records                  |Clickable → navigates to SR Register      |
|Total SMs      |Count of all SM records                  |Clickable → navigates to SM Recruitment   |


> Each card shows a **trend indicator** (up/down arrow with percentage change vs previous month).

-----

### 🟦 Row 2 — Performance and Alert Widgets

Three widgets displayed horizontally:

#### Widget 1 — Total SSMs

- Count of all SSM records
- Clickable → navigates to SSM Recruitment
- Shows trend indicator

#### Widget 2 — Policies Due Soon (Smart Widget)

- Main metric displayed prominently: total count of policies due within the default range
- **Default range:** 30 days
- Three toggle buttons inside the widget: **7 Days / 15 Days / 30 Days** (only one active at a time)
- Widget updates count dynamically when toggle changes
- Breakdown shown below main count:
  - Due in 7 Days: X
  - Due in 15 Days: X
  - Due in 30 Days: X
- Clicking the widget navigates to Policy Register filtered by selected due date range

#### Widget 3 — Financial KPIs

- **Current Month Premium:** total premium collected in current month with % change vs last month
- **Current Year Premium (YTD):** total premium collected year to date

-----

### 🟦 Row 3 — Monthly Premium Bar Chart

- Bar chart showing premium collected per month for the current year (January to December)
- Built with **Recharts**
- Hover tooltips showing exact premium value per month
- Months with no data show as zero bars

-----

### 🟦 Row 4 — Target Performance Donut Charts

Two donut charts displayed side by side:

#### Monthly Target %

- Shows percentage of monthly premium target achieved vs remaining
- Admin sets the monthly target **directly on the dashboard** via an inline editable input field next to the chart title
- Clicking the target value makes it editable — admin types new value and presses Enter to save
- Target value saved to the **Config table** in the encrypted SQLite database
- Chart updates immediately after saving

#### Yearly Target %

- Same behavior as Monthly Target but for the full year
- Admin sets yearly target via inline editable input on the dashboard
- Both targets persist across sessions (saved in Config table)

-----

### 🟦 Row 5 — Insights Row

Three widgets displayed horizontally:

|Widget             |Description                                                                                                                                            |
|-------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
|**Renewals Widget**|Count of policies whose Last Paid Date is over 11 months ago (approaching renewal). Clickable → navigates to Policy Register filtered by renewal status|
|**Top SM**         |SM name and code with highest total business in the current month, shows their total business figure                                                   |
|**Top SR**         |SR name and code with highest total business in the current month, shows their total business figure                                                   |

-----

### 🔘 Dashboard Action Buttons

- **Download Report (PDF):** generates summary of current month’s policies, SR/SM/SSM list, and total business using pdfkit
- **Download Backup:** creates encrypted `.zip` of entire SQLite database and images folder using archiver, saved to user-selected folder via Electron native file dialog

-----

## 🔷 6. Proposer Register

Form to register a new proposal.

|Field                            |Type                                            |
|---------------------------------|------------------------------------------------|
|Proposal No                      |Text input (unique)                             |
|Policy Holder Name               |Text input                                      |
|Amount / Premium                 |Number input (decimal)                          |
|PR No                            |Text input                                      |
|PR Date                          |Date picker                                     |
|Amount Type                      |Dropdown (Cash / Cheque)                        |
|Position / Requirements of Policy|Textarea                                        |
|SR Code                          |Searchable dropdown (pulls from SR Register)    |
|SM Code                          |Searchable dropdown (pulls from SM Recruitment) |
|SSM Code                         |Searchable dropdown (pulls from SSM Recruitment)|
|Status                           |Dropdown (OK / Not OK)                          |

- Validate all required fields on submit with inline field-level errors
- Proposal No must be unique
- **When status is set to OK:** confirmation dialog — *“Convert this proposal to a Policy Record?”*
  - If confirmed: system auto-creates a new entry in Policy Register pre-filled with matching fields (Holder Name, Premium, SR/SM/SSM codes) and navigates user to Policy Register to complete remaining fields
  - Proposal is flagged as `converted_to_policy = 1` and cannot be converted again
- On success: show success toast
- Table view: searchable, paginated (10 per page), Edit and Delete actions per row

-----

## 🔷 7. Policy Register

Form to register a new insurance policy.

|Field             |Type                                            |
|------------------|------------------------------------------------|
|Policy Number     |Text input (unique)                             |
|Policy Holder Name|Text input                                      |
|CNIC              |Text input                                      |
|Address           |Textarea                                        |
|Contact No 1      |Text input                                      |
|Contact No 2      |Text input                                      |
|Premium           |Number input (decimal)                          |
|Issue Date        |Date picker                                     |
|Due Date          |Date picker                                     |
|Table Term        |Text input                                      |
|Last Paid Date    |Date picker                                     |
|SR Code           |Searchable dropdown (pulls from SR Register)    |
|SM Code           |Searchable dropdown (pulls from SM Recruitment) |
|SSM Code          |Searchable dropdown (pulls from SSM Recruitment)|

- Policy Number must be unique
- **2nd Year Premium Logic:** when the admin updates the Last Paid Date of a policy to a date that falls in the **next calendar year** after the previously recorded Last Paid Date, the system detects this as a 2nd year payment. The premium amount is automatically added to the running `second_year_premium` total of the assigned SR, SM, and SSM. The previous Last Paid Date is stored in `previous_paid_date` before overwriting to enable year comparison
- On success: show success toast
- Table view: searchable by Name, Policy Number, SR/SM/SSM Code — paginated (10 per page) with Edit and Delete actions

-----

## 🔷 8. SR Register

Form to register a new Sales Representative.

|Field                   |Type                                               |
|------------------------|---------------------------------------------------|
|SR Code                 |Text input (unique, auto-suggested)                |
|SR Name                 |Text input                                         |
|Address                 |Textarea                                           |
|CNIC                    |Text input                                         |
|Contact 1               |Text input                                         |
|Contact 2               |Text input                                         |
|SM Code                 |Searchable dropdown (pulls from SM Recruitment)    |
|SSM Code                |Searchable dropdown (pulls from SSM Recruitment)   |
|Area Manager Name       |Searchable dropdown (pulls from Area Manager table)|
|CNIC Picture            |Image upload                                       |
|Matric Certificate      |Image upload                                       |
|Intermediate Certificate|Image upload                                       |
|Degree Certificate      |Image upload                                       |
|Nominee CNIC Picture    |Image upload                                       |
|Status                  |Dropdown (Active / Inactive)                       |
|No of Policies          |Read-only, auto-calculated from Policy Register    |

- SR Code must be unique
- Images stored in `app.getPath('userData')/images/sr/[sr_code]/`
- Table view: searchable, filterable by Status, paginated (10 per page) with Edit, Delete, and View Documents actions

-----

## 🔷 9. SM Recruitment

Form to register a new Sales Manager.

|Field                   |Type                                                                                     |
|------------------------|-----------------------------------------------------------------------------------------|
|SM Code                 |Text input (unique, auto-suggested)                                                      |
|SM Name                 |Text input                                                                               |
|Address                 |Textarea                                                                                 |
|CNIC                    |Text input                                                                               |
|Contact No 1            |Text input                                                                               |
|Contact No 2            |Text input                                                                               |
|SSM Code                |Searchable dropdown (pulls from SSM Recruitment)                                         |
|Area Manager Name       |Searchable dropdown (pulls from Area Manager table)                                      |
|CNIC Picture            |Image upload                                                                             |
|Nominee CNIC Picture    |Image upload                                                                             |
|Matric Certificate      |Image upload                                                                             |
|Intermediate Certificate|Image upload                                                                             |
|Degree Certificate      |Image upload                                                                             |
|Status                  |Dropdown (Active / Inactive)                                                             |
|No of SRs               |Read-only, auto-calculated (count of SRs assigned to this SM)                            |
|Total Business          |Read-only, auto-calculated (sum of all premiums of all policies of all SRs under this SM)|

- SM Code must be unique
- Images stored in `app.getPath('userData')/images/sm/[sm_code]/`
- Table view: searchable, filterable by Status, paginated (10 per page) with Edit, Delete, and View Documents actions

-----

## 🔷 10. SSM Recruitment

Form to register a new Senior Sales Manager.

|Field                   |Type                                                                        |
|------------------------|----------------------------------------------------------------------------|
|SSM Code                |Text input (unique, auto-suggested)                                         |
|SSM Name                |Text input                                                                  |
|Address                 |Textarea                                                                    |
|CNIC                    |Text input                                                                  |
|Contact No 1            |Text input                                                                  |
|Contact No 2            |Text input                                                                  |
|Area Manager Name       |Searchable dropdown (pulls from Area Manager table)                         |
|CNIC Picture            |Image upload                                                                |
|Nominee CNIC Picture    |Image upload                                                                |
|Matric Certificate      |Image upload                                                                |
|Intermediate Certificate|Image upload                                                                |
|Degree Certificate      |Image upload                                                                |
|Status                  |Dropdown (Active / Inactive)                                                |
|No of SRs               |Read-only, auto-calculated (all SRs under all SMs under this SSM)           |
|No of SMs               |Read-only, auto-calculated (SMs assigned to this SSM)                       |
|Total Business          |Read-only, auto-calculated (sum of all premiums across entire SSM hierarchy)|

- SSM Code must be unique
- Images stored in `app.getPath('userData')/images/ssm/[ssm_code]/`
- Table view: searchable, filterable by Status, paginated (10 per page) with Edit, Delete, and View Documents actions

-----

## 🔷 11. Area Manager

Form to register a new Area Manager.

|Field         |Type                                                                                  |
|--------------|--------------------------------------------------------------------------------------|
|AM Code       |Text input (unique, auto-suggested)                                                   |
|AM Name       |Text input                                                                            |
|Address       |Textarea                                                                              |
|CNIC          |Text input                                                                            |
|Contact No 1  |Text input                                                                            |
|Contact No 2  |Text input                                                                            |
|Status        |Dropdown (Active / Inactive)                                                          |
|No of SSMs    |Read-only, auto-calculated                                                            |
|No of SMs     |Read-only, auto-calculated                                                            |
|No of SRs     |Read-only, auto-calculated                                                            |
|Total Business|Read-only, auto-calculated (sum of all premiums across entire hierarchy under this AM)|

- AM Code must be unique
- Table view: searchable, filterable by Status, paginated (10 per page) with Edit and Delete actions

-----

## 🔷 12. Show Team

Unified page for viewing and managing all SR, SM, and SSM records in one place.

### Controls

- Search bar (searches by Name or Code in real time)
- Dropdown filter: **All / SR / SM / SSM**
- Pagination (10 records per page)

### Table View

- Dynamically changes columns based on filter selection
- Common columns always shown: Code, Name, CNIC, Contact, Status, Assigned Hierarchy (SM/SSM/AM as applicable)

### Actions Per Row

#### ✏️ Edit

- Opens a pre-filled modal or dedicated edit page with the full form for that record type
- All fields editable
- Saves instantly on confirm
- All related auto-calculated KPIs update immediately after save

#### 🗑️ Delete

- Confirmation popup: *“Are you sure you want to delete this record? This action cannot be undone.”*
- On confirm: deletes record permanently
- All related KPIs and hierarchy counts update automatically after deletion

#### 📄 View Documents

- Opens a modal showing all uploaded images (CNIC pic, certificates, nominee pic) as thumbnails
- Each image has a download button

-----

## 🔷 13. Business Figure

A dedicated page for viewing business performance figures filtered by date range and role type.

### Date Range Selector

- **From Date** and **To Date** pickers
- **Generate** button to trigger all calculations and table render
- **Reset** button to return to current month default
- Page auto-loads current month data on first open

### Role Filter Toggle Buttons

> Only **one** button can be active at a time. When selected, all others are deselected. There is **no ALL view**.

- **SR**
- **SM**
- **SSM**

-----

### SR View — Columns

|Column          |Description                                                                      |
|----------------|---------------------------------------------------------------------------------|
|SR Code         |SR’s unique code                                                                 |
|SR Name         |SR’s full name                                                                   |
|Total Business  |Sum of all premiums of policies assigned to this SR within date range            |
|No of Policies  |Count of policies assigned to this SR within date range                          |
|SM Code         |SM assigned to this SR                                                           |
|2nd Year Premium|Sum of all 2nd year premium payments for policies under this SR within date range|

-----

### SM View — Columns

|Column          |Description                                                                          |
|----------------|-------------------------------------------------------------------------------------|
|SM Code         |SM’s unique code                                                                     |
|SM Name         |SM’s full name                                                                       |
|Total Business  |Sum of all premiums of all policies of all SRs under this SM within date range       |
|No of Policies  |Count of all policies under this SM’s SRs within date range                          |
|No of SRs Added |Count of SRs registered in the system within selected date range under this SM       |
|SSM Code        |SSM assigned to this SM                                                              |
|2nd Year Premium|Sum of all 2nd year premium payments for all policies under this SM within date range|

-----

### SSM View — Columns

|Column           |Description                                                                       |
|-----------------|----------------------------------------------------------------------------------|
|SSM Code         |SSM’s unique code                                                                 |
|SSM Name         |SSM’s full name                                                                   |
|Total Business   |Sum of all premiums across all SMs and SRs under this SSM within date range       |
|No of Policies   |Count of all policies in this SSM’s hierarchy within date range                   |
|No of SRs Added  |Count of SRs registered within selected date range under this SSM’s hierarchy     |
|No of SMs Added  |Count of SMs registered within selected date range under this SSM                 |
|Area Manager Name|Area Manager assigned to this SSM                                                 |
|2nd Year Premium |Sum of all 2nd year premium payments across entire SSM hierarchy within date range|

-----

### 2nd Year Premium Logic

- When admin updates the Last Paid Date of a policy to a date in the **next calendar year** after the previously recorded Last Paid Date, the system detects this as a 2nd year payment
- The premium amount is added to the running `second_year_premium` total of the assigned SR, SM, and SSM
- In the Business Figure page, only payments whose detection date falls **within the selected date range** are included in the 2nd Year Premium column

### Common Features (all three views)

- Real-time search bar filtering within current results
- Pagination (10 records per page)
- Sortable by Total Business descending by default
- **Grand Total row pinned at bottom** showing: Total Business, Total Policies, Total 2nd Year Premium — updates dynamically when date range or search changes

### Export

- **Download as PDF** (pdfkit): full business figure report for selected date range and active role filter
- **Download as Excel** (exceljs): separate sheet per role (SR sheet, SM sheet, SSM sheet)

-----

## 🔷 14. Notifications

### Background Logic (silent, on every app launch)

- Query all policies whose Due Date is within 30 days from today
- Count updates sidebar notification badge in real time
- Policy removed from notification list when its Last Paid Date is updated past the due date
- License expiry warning (within 30 days of expiry) also contributes to the sidebar notification badge count

### Notifications Page

Each notification card displays:

- Policy Holder Name
- Policy Number
- Contact No 1
- Due Date
- Days remaining (e.g. *“Due in 12 days”*)
- Assigned SR Code and Name
- **Send WhatsApp Reminder** button:
  - Opens `https://wa.me/[contact]?text=` in system browser with pre-filled message:
  
  > *“Assalam o Alaikum [Name], your insurance policy installment (Policy No: [XXXXX]) is due on [Date]. Please make the payment at your earliest. Thank you.”*
  - Requires internet at time of click
  - Card marked **“Reminder Sent”** with timestamp after click

-----

## 🔷 15. Settings

Available to both Admin and Developer.

- Update Display Name
- Update Username (must remain unique)
- Update Password (requires current password verification, new password + confirm password fields)
- All changes saved to encrypted SQLite database
- Success and error toasts on save

-----

## 🔷 16. Users Page *(Developer Only)*

- Table of all user accounts: User ID, Name, Username, Status (Active / Inactive)
- Developer can **add** new user (Name, Username, Password, Status)
- Developer can **edit** existing user name, username, status, or reset password
- Developer can **delete** user accounts (Developer account itself cannot be deleted)
- This page’s sidebar button and route must **not exist anywhere in the DOM** when logged-in role is Admin

-----

## 🔷 17. Software License, Validation and Expiry Notification System

> This entire system operates **silently and invisibly** to the client during normal operation.

-----

### 17A. On First Launch After Installation

- App reads machine’s unique hardware fingerprint using `node-machine-id`
- Generates a unique **AES-256-CBC encrypted license key** using Node.js `crypto`:
  - Input: hardware ID + install timestamp + secret developer salt (hardcoded in main process only)
  - Output: AES-256-CBC encrypted string
- A **1-year expiry timestamp** stored in an AES-256-CBC encrypted hidden config file inside `app.getPath('userData')` — never stored in SQLite database
- License key + machine ID + install date + expiry date automatically sent to developer via:
  - **Email** using nodemailer to developer’s hardcoded email address
  - **WhatsApp** using `https://wa.me/[developer_number]?text=` with all details pre-filled
  - If no internet on first install, app **retries silently** on every subsequent launch until delivery confirmed

-----

### 17B. On Every App Launch — Silent Validation Check

#### ✅ State 1 — Valid (more than 30 days remaining)

- App launches completely normally
- Dashboard shows **“Valid”** green badge on validation status card
- Client never sees any license UI

#### ⚠️ State 2 — Expiring Soon (within 30 days of expiry)

- App launches normally — all features fully accessible
- **Non-dismissable warning banner** at top of every page:
  - At 30 days: *“Your software license expires in 30 days. Please contact your software provider to renew.”*
  - At 7 days: banner turns urgent red — *“Your software license expires in 7 days. Immediate renewal required.”*
- Dashboard validation card updates to **“Expiring in X days”** in orange (30 days) or red (7 days)
- License expiry warning added to sidebar notification badge count
- **At the 30-day mark:** license key + machine ID + expiry date automatically re-sent to developer via email and WhatsApp as advance renewal alert
- **At the 7-day mark:** alert sent again to developer as final reminder

#### 🔒 State 3 — Expired

- Login screen completely replaced with **License Renewal Screen**:
  - Software name and logo
  - Message: *“Your software license has expired. Please contact your software provider.”*
  - Single activation key input field
  - Submit button
  - **Nothing else accessible**
- Client contacts developer, developer provides renewal key
- App validates entered key against current machine’s hardware fingerprint
- **If valid:** resets expiry for another year, resumes normal operation
- **If invalid:** shows *“Invalid Key. Please contact your software provider.”* — remains locked

-----

### 17C. License Security Rules

- Config file storing expiry must be **AES-256-CBC encrypted** — plain text not acceptable
- License key must be **hardware-bound** — key valid for Machine A must fail on Machine B
- System must be completely silent and invisible during normal operation
- Activation key input must give no hint about key format or structure
- All license operations logged to local encrypted log file via winston

-----

## 🔷 18. Database Schema

```sql
Users (
  user_id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT CHECK(role IN ('developer','admin')) NOT NULL,
  status        TEXT CHECK(status IN ('active','inactive')) DEFAULT 'active',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
)

Area_Managers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  am_code    TEXT UNIQUE NOT NULL,
  am_name    TEXT NOT NULL,
  address    TEXT,
  cnic       TEXT NOT NULL,
  contact_1  TEXT,
  contact_2  TEXT,
  status     TEXT CHECK(status IN ('active','inactive')) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

SSM (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  ssm_code            TEXT UNIQUE NOT NULL,
  ssm_name            TEXT NOT NULL,
  address             TEXT,
  cnic                TEXT NOT NULL,
  contact_1           TEXT,
  contact_2           TEXT,
  am_id               INTEGER REFERENCES Area_Managers(id),
  cnic_pic            TEXT,
  nominee_cnic_pic    TEXT,
  matric_cert         TEXT,
  intermediate_cert   TEXT,
  degree_cert         TEXT,
  status              TEXT CHECK(status IN ('active','inactive')) DEFAULT 'active',
  second_year_premium REAL DEFAULT 0.0,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
)

SM (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  sm_code             TEXT UNIQUE NOT NULL,
  sm_name             TEXT NOT NULL,
  address             TEXT,
  cnic                TEXT NOT NULL,
  contact_1           TEXT,
  contact_2           TEXT,
  ssm_id              INTEGER REFERENCES SSM(id),
  am_id               INTEGER REFERENCES Area_Managers(id),
  cnic_pic            TEXT,
  nominee_cnic_pic    TEXT,
  matric_cert         TEXT,
  intermediate_cert   TEXT,
  degree_cert         TEXT,
  status              TEXT CHECK(status IN ('active','inactive')) DEFAULT 'active',
  second_year_premium REAL DEFAULT 0.0,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
)

SR (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  sr_code             TEXT UNIQUE NOT NULL,
  sr_name             TEXT NOT NULL,
  address             TEXT,
  cnic                TEXT NOT NULL,
  contact_1           TEXT,
  contact_2           TEXT,
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
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
)

Proposer_Register (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_no         TEXT UNIQUE NOT NULL,
  holder_name         TEXT NOT NULL,
  premium             REAL NOT NULL,
  pr_no               TEXT,
  pr_date             DATE,
  amount_type         TEXT CHECK(amount_type IN ('cash','cheque')),
  requirements        TEXT,
  sr_id               INTEGER REFERENCES SR(id),
  sm_id               INTEGER REFERENCES SM(id),
  ssm_id              INTEGER REFERENCES SSM(id),
  status              TEXT CHECK(status IN ('ok','not_ok')) DEFAULT 'not_ok',
  converted_to_policy INTEGER DEFAULT 0,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
)

Policy_Register (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_no          TEXT UNIQUE NOT NULL,
  holder_name        TEXT NOT NULL,
  cnic               TEXT NOT NULL,
  address            TEXT,
  contact_1          TEXT,
  contact_2          TEXT,
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
)

Notifications (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_id        INTEGER REFERENCES Policy_Register(id),
  triggered_date   DATE,
  whatsapp_sent    INTEGER DEFAULT 0,
  whatsapp_sent_at DATETIME,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
)

Config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
)
```

### Performance Indexes

```sql
CREATE INDEX idx_policy_no   ON Policy_Register(policy_no);
CREATE INDEX idx_due_date    ON Policy_Register(due_date);
CREATE INDEX idx_issue_date  ON Policy_Register(issue_date);
CREATE INDEX idx_last_paid   ON Policy_Register(last_paid_date);
CREATE INDEX idx_sr_code     ON SR(sr_code);
CREATE INDEX idx_sm_code     ON SM(sm_code);
CREATE INDEX idx_ssm_code    ON SSM(ssm_code);
CREATE INDEX idx_am_code     ON Area_Managers(am_code);
CREATE INDEX idx_proposal_no ON Proposer_Register(proposal_no);
```

-----

## 🔷 19. Database and Data Security — 2-Layer Protection

### Layer 1 — Application-Level AES-256-CBC Column Encryption

All sensitive columns are encrypted before writing to the database and decrypted after reading, using Node.js built-in `crypto` module. The encryption key is hardcoded inside the **Electron main process only** — never exposed to the renderer process or any user-facing code.

**Columns to encrypt:**

|Table            |Encrypted Columns                                          |
|-----------------|-----------------------------------------------------------|
|Policy_Register  |holder_name, cnic, address, contact_1, contact_2, policy_no|
|Proposer_Register|holder_name, pr_no                                         |
|SR               |sr_name, cnic, address, contact_1, contact_2               |
|SM               |sm_name, cnic, address, contact_1, contact_2               |
|SSM              |ssm_name, cnic, address, contact_1, contact_2              |
|Area_Managers    |am_name, cnic, address, contact_1, contact_2               |
|Users            |name, username *(password separately bcrypt hashed)*       |


> If anyone manually edits a value in the database, decryption fails and the app logs a data integrity error — the tampered record is flagged in the UI as **“Data Error”** without crashing the app.

-----

### Layer 2 — Hidden and Disguised Database File Location

- Store `.db` file inside `app.getPath('userData')` — hidden system path deep inside `C:\Users\[username]\AppData\Roaming\`
- Rename file to a non-obvious name such as `sysconfig.dat` instead of `insurance.db`
- Regular users and clients will never locate this file through normal browsing
- Even if located, Layer 1 encryption makes all data completely unreadable

```javascript
const DB_PATH = path.join(
  app.getPath('userData'),
  'appdata',
  'sysconfig.dat'
);
```

### Attack Vector Summary

|Attack Vector           |Result                                                |
|------------------------|------------------------------------------------------|
|Open `.db` in DB Browser|Sees only encrypted binary strings — nothing readable |
|Manually edit a value   |Decryption fails — record flagged as Data Error       |
|Delete the `.db` file   |App recreates empty database — attacker loses all data|
|Copy `.db` to another PC|Still encrypted — only your app can read it           |
|Hex-edit the `.db` file |Decryption fails — integrity error logged silently    |

-----

## 🔷 20. Non-Functional Requirements

|Requirement          |Specification                                                                                                                                                                                                                                                            |
|---------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|**Performance**      |All queries return in under 300ms for up to 10,000 records                                                                                                                                                                                                               |
|**Offline First**    |Zero internet dependency for all core features. Internet needed only for WhatsApp reminder clicks and license delivery to developer                                                                                                                                      |
|**Installer**        |Single `.exe` via electron-builder. Standard Next→Next→Finish wizard. All dependencies auto-initialized on first launch with no user intervention                                                                                                                        |
|**Image Storage**    |All uploaded images stored in organized subfolders inside `app.getPath('userData')/images/` — included in Download Backup                                                                                                                                                |
|**Error Handling**   |All DB operations wrapped in try/catch. Errors logged via winston. Raw technical errors never shown to user                                                                                                                                                              |
|**Screen Support**   |UI renders cleanly at 1280×720 and above                                                                                                                                                                                                                                 |
|**Theme**            |Professional dark theme as default. Clean modern typography. Must look and feel like a premium enterprise-grade commercial product                                                                                                                                       |
|**Logging**          |All critical actions logged to local encrypted log file — login attempts, record creation/deletion, status changes, 2nd year premium updates, target saves, license checks, developer alerts                                                                             |
|**Data Integrity**   |Any record whose encrypted value fails decryption is flagged in UI as “Data Error” rather than crashing the app                                                                                                                                                          |
|**First Launch Init**|App must silently: create DB, create all tables with indexes, insert Developer credentials (bcrypt hashed), initialize encrypted config file, set monthly/yearly targets to zero in Config, create images folder structure, and trigger license key delivery to developer|

-----

## 🔷 21. Final System Expectations

The delivered system must function as a complete **enterprise-grade offline Insurance ERP** with:

- ✅ KPI-driven smart dashboard with editable targets and live trend indicators
- ✅ Full hierarchical team management (SR → SM → SSM → Area Manager)
- ✅ Complete CRUD system across all modules with encrypted data storage
- ✅ Business analytics and performance reporting with date-range filtering
- ✅ Real-time due date alerts with WhatsApp reminder integration
- ✅ Role-based access control with Developer and Admin separation
- ✅ Hardware-bound software license with silent expiry management and automatic developer alerts
- ✅ Production-ready Electron Windows desktop application packaged as a single `.exe` installer