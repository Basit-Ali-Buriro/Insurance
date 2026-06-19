# Insurance Policy Management System — Change Requests

---

## Change 1: Add "Son/Daughter/Wife of" Column

Add a new database column named `relation` with the label **"Son/Daughter/Wife of"** to the following tables/entities:

- Policy Register
- SR (Sales Representative)
- SM (Sales Manager)
- SSM (Senior Sales Manager)
- AM (Area Manager)

**Show this field in:**
- Data viewer table for each of the above
- Add form for each
- Edit form for each
- Save to database

---

## Change 2: Passport Size Picture Upload for SR, SM, SSM

In the Documents Upload and View section for **SR, SM, and SSM**, add an option to upload and view a **Passport Size Picture**. Treat it like other document uploads but label it clearly as **"Passport Size Picture"**.

---

## Change 3: Rename License Fields & Add Registration No

- Rename `license_no` → `registration_no` in the database, forms, and data viewer. Label it **"Registration No"** everywhere. Do NOT use "License No" anywhere.
- Rename `license_date` → `registration_date` in the database, forms, and data viewer. Label it **"Registration Date"** everywhere. Do NOT use "License Date" anywhere.
- Apply to: **SR, SM, SSM, and AM**

---

## Change 4: Fix & Rebuild 2nd Year Premium Logic (Complete Rebuild)

> **Remove the current 2nd year premium implementation entirely and rebuild from scratch.**

### Business Logic

- When a policy is registered → its premium counts as **Business** for the SR. The year of the **Issue Date** is Year 1.
- When that policy's payment is made for the **2nd time** (tracked via **Last Paid** date, where Last Paid year = Issue Date year + 1) → the premium counts as **2nd Year Premium** for that SR.

**Example:**
- Issue Date = any date in 2025 → first payment in 2025 → **Business**
- Last Paid = any date in 2026 → **2nd Year Premium**

### Hierarchy Rollup

| Role | 2nd Year Premium Calculation |
|------|------------------------------|
| SR | Sum of premiums where Last Paid year = Issue Date year + 1 |
| SM | Sum of 2nd Year Premiums of all SRs under that SM |
| SSM | Sum of 2nd Year Premiums of all SMs under that SSM |
| AM | Sum of 2nd Year Premiums of all SSMs under that AM |

---

## Change 5: Change Date Format to dd/mm/yyyy Everywhere

Change the date format from `mm/dd/yyyy` to **`dd/mm/yyyy`** in:

- All forms (Add, Edit, View)
- All data viewers / tables
- Database storage (update all parsing and formatting logic)
- PDF exports
- Excel exports

> Apply this everywhere in the system without exception.

---

## Change 6: Fix Dashboard Renewal Count Mismatch

There are two boxes on the Dashboard showing renewal policy counts — they display **different numbers**. Investigate the root cause (likely different query logic, date ranges, or filters), fix both to use the same consistent logic, and ensure they display the same correct count.

---

## Change 7: Remove Total Business & 2nd Year Premium from Show Team Page

In the **Show Team** page, remove the following columns for **all roles**:

- Total Business
- 2nd Year Premium

---

## Change 8: Fix PDF Report Headings & Role Labels

### Headings
- **Dashboard Report PDF** → Remove "Insurance Policy Management System". Keep only **"Dashboard Report"**
- **Business Figure Report PDF** → Remove "Insurance Policy Management System". Keep only **"Business Figure Report"**

### Role Name Format
Write role names in **bold** and in **full form**:

| Short Form | Full Form |
|------------|-----------|
| SR | **Sales Representative (SR)** |
| SM | **Sales Manager (SM)** |
| SSM | **Senior Sales Manager (SSM)** |
| AM | **Area Manager (AM)** |

---

## Change 9: Fix Excel Export — Include ALL Columns

On every page with an Excel export feature, ensure the export includes **all columns** shown in the data viewer. Audit every export function and align exported columns with the full column list displayed in the UI. No columns should be missing or truncated.

---

## Change 10: Add Total Business Column to SR Page

Add a **Total Business** column to the SR page:

- Display in SR data viewer
- Save to the SR database table
- **Total Business** = Sum of premiums of all policies registered under that SR

---

## Change 11: Rename "SR Register" to "SR Recruitment"

Rename all occurrences of **"SR Register"** to **"SR Recruitment"** across the entire system:

- Navigation menu
- Page titles & headings
- Breadcrumbs
- PDF & Excel exports
- Any other labels

---

## Change 12: Reorder Data Viewer Columns

Reorder columns in each data viewer to exactly match the order below. Use the **exact heading labels** as specified.

### Proposal Register
| # | Column |
|---|--------|
| 1 | Serial No |
| 2 | Proposal No |
| 3 | Name |
| 4 | Contact 1 |
| 5 | Premium |
| 6 | Premium Type |
| 7 | PR No |
| 8 | PR Date |
| 9 | SR code |
| 10 | SM code |
| 11 | SSM code |
| 12 | Requirements |
| 13 | Status |
| 14 | Converted |
| 15 | Actions |

### Policy Register
| # | Column |
|---|--------|
| 1 | Serial No |
| 2 | Policy No |
| 3 | Name |
| 4 | Son/Daughter/Wife of |
| 5 | CNIC |
| 6 | Address |
| 7 | Contact 1 |
| 8 | Contact 2 |
| 9 | Premium |
| 10 | Issue Date |
| 11 | Due Date |
| 12 | Last paid |
| 13 | SR code |
| 14 | SM code |
| 15 | SSM code |
| 16 | table and term |
| 17 | Actions |

### SR Recruitment
| # | Column |
|---|--------|
| 1 | Serial No |
| 2 | SR code |
| 3 | Name |
| 4 | Son/Daughter/Wife of |
| 5 | CNIC |
| 6 | Contact 1 |
| 7 | Contact 2 |
| 8 | Address |
| 9 | SM code |
| 10 | SSM code |
| 11 | AM code |
| 12 | Registration No |
| 13 | Registration Date |
| 14 | No of policies |
| 15 | Total Business |
| 16 | 2nd year premium |
| 17 | Status |
| 18 | Actions |

### SM Recruitment
| # | Column |
|---|--------|
| 1 | Serial No |
| 2 | SM code |
| 3 | Name |
| 4 | Son/Daughter/Wife of |
| 5 | CNIC |
| 6 | Contact 1 |
| 7 | Contact 2 |
| 8 | Address |
| 9 | SSM code |
| 10 | AM code |
| 11 | Registration No |
| 12 | Registration Date |
| 13 | No of SR |
| 14 | Total Business |
| 15 | 2nd year premium |
| 16 | Status |
| 17 | Actions |

### SSM Recruitment
| # | Column |
|---|--------|
| 1 | Serial No |
| 2 | SSM code |
| 3 | Name |
| 4 | Son/Daughter/Wife of |
| 5 | CNIC |
| 6 | Contact 1 |
| 7 | Contact 2 |
| 8 | Address |
| 9 | AM code |
| 10 | Registration No |
| 11 | Registration Date |
| 12 | No of SR's |
| 13 | No of SM's |
| 14 | Total Business |
| 15 | 2nd year premium |
| 16 | Status |
| 17 | Actions |

### AM
| # | Column |
|---|--------|
| 1 | Serial No |
| 2 | AM code |
| 3 | Name |
| 4 | Son/Daughter/Wife of |
| 5 | CNIC |
| 6 | Contact 1 |
| 7 | Contact 2 |
| 8 | Address |
| 9 | Registration No |
| 10 | Registration Date |
| 11 | No of SR's |
| 12 | No of SM's |
| 13 | No of SSM's |
| 14 | Total Business |
| 15 | 2nd year premium |
| 16 | Status |
| 17 | Actions |

---

## Change 13: Remove Duplicate Email in Developer Contact Settings

In **Settings → Developer Contact**, for the contact card of **Subhash Prem**:

- Keep only: `subhashprem4@gmail.com`
- Remove any other email address listed for that contact

---

## Implementation Notes

- Apply all database migrations carefully and ensure backward compatibility.
- Update all related backend queries, API endpoints, and frontend components.
- Test each change individually before moving to the next.
- Date format `dd/mm/yyyy` must be consistent in both display and storage/parsing.
- The 2nd year premium logic must be recalculated dynamically and aggregated correctly at all hierarchy levels (SR → SM → SSM → AM).
