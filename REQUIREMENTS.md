# AssetFlow - Enterprise Asset & Resource Management System

## 📋 System Overview

**AssetFlow** is a centralized ERP platform for tracking, allocating, and maintaining physical assets and shared resources across organizations. The system enables structured asset lifecycles, resource booking, and real-time visibility into asset status, location, and condition.

---

## 🎯 Core Requirements by Screen

### 1. Login / Signup Screen

**Purpose**: Authenticate users with realistic, non-self-elevating account creation.

#### Requirements:
| Component | Description |
|-----------|-------------|
| **Signup** | Creates Employee account only - NO role selection allowed |
| **Login** | Email & password authentication |
| **Password Recovery** | Forgot password functionality |
| **Session Management** | Session validation and timeout handling |

#### Validations:
- ✅ Email format validation
- ✅ Password strength requirements
- ✅ Session timeout enforcement
- ❌ No self-assignment of admin/manager roles

#### Role Assignment Flow:
```
Signup → Employee (default) → Admin promotes to Dept Head/Asset Manager
```

---

### 2. Dashboard / Home Screen

**Purpose**: Real-time operational snapshot for every role.

#### KPI Cards Required:
| Metric | Description |
|--------|-------------|
| Assets Available | Count of assets in Available state |
| Assets Allocated | Count of currently allocated assets |
| Maintenance Today | Maintenance requests scheduled/completed today |
| Active Bookings | Currently active resource bookings |
| Pending Transfers | Transfer requests awaiting approval |
| Upcoming Returns | Assets due for return within next 7 days |

#### Quick Actions:
- Register Asset
- Book Resource
- Raise Maintenance Request

#### Overdue Returns:
- ⚠️ **Highlighted separately** from upcoming returns
- Past Expected Return Date triggers red flag
- Fed to Notifications system

---

### 3. Organization Setup Screen (Admin Only - 3 Tabs)

**Purpose**: Maintain master data that everything else depends on.

#### Tab A - Department Management

| Field | Requirement |
|-------|-------------|
| Name | Required, unique |
| Department Head | Assign from existing employees |
| Parent Department | Optional, for hierarchy |
| Status | Active / Inactive |

**Validations:**
- ✅ Department Head must exist in Employee Directory
- ✅ Cannot delete department with active assets/employees
- ✅ Parent department cannot be self-referential

#### Tab B - Asset Category Management

| Field | Requirement |
|-------|-------------|
| Name | Required, unique |
| Optional Fields | Category-specific (e.g., warranty period for Electronics) |

**Validations:**
- ✅ Category name uniqueness
- ✅ Optional fields must be relevant to category

#### Tab C - Employee Directory

| Field | Requirement |
|-------|-------------|
| Name | Required |
| Email | Required, unique, valid format |
| Department | Required |
| Role | Employee / Department Head / Asset Manager |
| Status | Active / Inactive |

**Role Assignment Rules:**
- Admin **only** promotes employees to Department Head or Asset Manager
- No self-assignment of roles

**Validations:**
- ✅ Email uniqueness across system
- ✅ Department must be active
- ❌ Cannot delete employee with active allocations

---

### 4. Asset Registration & Directory Screen

**Purpose**: Centralized asset registration, search, and tracking.

#### Asset Registration Fields:

| Field | Requirement | Details |
|-------|-------------|---------|
| Name | Required | Descriptive asset name |
| Category | Required | From Asset Category Management |
| Asset Tag | Auto-generated | Format: AF-{XXXX} |
| Serial Number | Required | Manufacturer serial |
| Acquisition Date | Required | Purchase date |
| Acquisition Cost | Optional | For ranking/reports only |
| Condition | Required | New/Good/Fair/Poor |
| Location | Required | Physical location description |
| Photo/Documents | Optional | Upload capability |
| Shared/Bookable | Boolean | Flag for resource booking |

#### Lifecycle States:
```
Available → Allocated, Reserved, Under Maintenance, Lost, Retired, Disposed
Under Maintenance ↔ Available
Allocated → Available
```

#### Search/Filter Options:
- Asset Tag
- Serial Number
- QR Code
- Category
- Status
- Department
- Location

#### Asset History Tracking:
- ✅ Allocation history
- ✅ Maintenance history

**Validations:**
- ✅ Asset Tag auto-generation uniqueness
- ✅ Category must exist
- ✅ Serial Number uniqueness
- ✅ Status transitions follow lifecycle rules

---

### 5. Asset Allocation & Transfer Screen

**Purpose**: Manage asset assignment with explicit conflict rules.

#### Allocation Requirements:

| Field | Requirement |
|-------|-------------|
| Asset | Required |
| Employee | Required |
| Department | Auto-populated from employee |
| Expected Return Date | Optional but recommended |

#### Transfer Workflow:
```
Requested → Approved → Re-allocated (history auto-updated)
```

#### Return Flow:
```
Return → Condition Check-in Notes → Asset status reverts to Available
```

#### Conflict Rules:
| Scenario | System Action |
|----------|---------------|
| Asset already allocated to someone else | **Block**, show "currently held by [Employee]" |
| User attempts allocation | Offer "Transfer Request" button instead |
| No conflict | Allocation proceeds |

#### Overdue Allocations:
- ⚠️ Past Expected Return Date auto-flagged
- Fed to Dashboard + Notifications

**Validations:**
- ✅ Asset must be in Available status for allocation
- ✅ Cannot allocate to inactive employee
- ✅ Expected Return Date > current date
- ✅ Asset Manager/Department Head approval required for transfers
- ✅ Check-in notes required for returns

---

### 6. Resource Booking Screen

**Purpose**: Time-slot booking of shared resources with overlap prevention.

#### Booking Fields:
| Field | Requirement |
|-------|-------------|
| Resource | Required (marked bookable) |
| Date | Required |
| Start Time | Required |
| End Time | Required |
| Booked By | Auto-populated |

#### Booking Statuses:
```
Upcoming → Ongoing → Completed
Cancelled (can be from any state)
```

#### Overlap Validation Examples:
| Scenario | Result |
|----------|--------|
| Room B2 booked 9:00-10:00 | ❌ Request for 9:30-10:30 rejected |
| Room B2 booked 9:00-10:00 | ✅ Request for 10:00-11:00 accepted |
| Room B2 booked 9:00-10:00 | ✅ Request for 8:30-9:00 accepted |

#### Features:
- 📅 Calendar view of existing bookings
- 🔄 Cancel/Reschedule capability
- 🔔 Reminder notification before slot starts

**Validations:**
- ✅ End time > Start time
- ✅ No overlapping bookings for same resource
- ✅ Resource must be marked as bookable
- ✅ Booking duration within allowed limits

---

### 7. Maintenance Management Screen

**Purpose**: Route repairs through approval workflow before work starts.

#### Request Fields:
| Field | Requirement |
|-------|-------------|
| Asset | Required |
| Issue Description | Required |
| Priority | Low/Medium/High/Critical |
| Photo | Optional |

#### Workflow:
```
Pending → Approved/Rejected → Technician Assigned → In Progress → Resolved
```

#### Asset Status Auto-updates:
- On approval: Under Maintenance
- On resolution: Available

#### Maintenance History:
- ✅ Retained per asset
- ✅ Viewable in asset details

**Validations:**
- ✅ Asset must be in Available or Allocated state
- ✅ Approval required before status change to Under Maintenance
- ✅ Rejected requests can be resubmitted
- ✅ Resolution requires notes and technician confirmation

---

### 8. Asset Audit Screen

**Purpose**: Run structured verification cycles instead of single form.

#### Audit Cycle Creation:
| Field | Requirement |
|-------|-------------|
| Scope | Department/Location |
| Date Range | Start and end dates |
| Auditors | One or more (must be employees) |

#### Audit Workflow:
```
Create Cycle → Assign Auditors → Mark Assets → Generate Report → Close Cycle
```

#### Auditor Actions:
| Status | Description |
|--------|-------------|
| Verified | Asset confirmed present and working |
| Missing | Asset not found |
| Damaged | Asset found but damaged |

#### Discrepancy Report:
- 📊 Auto-generated for flagged items
- Includes: Asset, Status, Notes, Timestamp

#### Cycle Closure Effects:
- 🔒 Locks the cycle (no further changes)
- 🔄 Updates affected asset statuses
  - Missing → Lost
  - Damaged → Under Maintenance (if applicable)

**Validations:**
- ✅ All assets in scope must be audited
- ✅ Auditors must be active employees
- ✅ Cannot close cycle with unverified assets
- ✅ Cycle closure is irreversible
- ✅ Audit history retained per cycle

---

### 9. Reports & Analytics Screen

**Purpose**: Actionable operational insight for managers.

#### Required Reports:

| Report | Description |
|--------|-------------|
| Asset Utilization Trends | Most-used vs. idle assets |
| Maintenance Frequency | By asset/category |
| Due Maintenance | Assets due for maintenance or nearing retirement |
| Department-wise Allocation | Summary by department |
| Resource Booking Heatmap | Peak usage windows |

#### Export Features:
- 📤 Exportable reports (CSV/PDF/Excel)

**Validations:**
- ✅ Data must be real-time or near real-time
- ✅ Filters by date range, department, category

---

### 10. Activity Logs & Notifications Screen

**Purpose**: Keep every role informed without digging for updates.

#### Notification Types:
| Event | Recipient |
|-------|-----------|
| Asset Assigned | Assignee |
| Maintenance Approved/Rejected | Requester |
| Booking Confirmed/Cancelled | Booker |
| Booking Reminder | Booker |
| Transfer Approved | Requester |
| Overdue Return Alert | Holder + Manager |
| Audit Discrepancy Flagged | Auditor + Manager |

#### Audit Log:
- 📜 Records: Who did what, when
- 🔍 Searchable and filterable

**Validations:**
- ✅ All actions logged
- ✅ Real-time notification delivery
- ✅ Read/unread status tracking

---

## 👥 Role-Based Access Control

### Admin
- Manages departments, asset categories, audit cycles, employee/role assignment
- Views organization-wide analytics

### Asset Manager
- Registers and allocates assets
- Approves transfers, maintenance requests, audit discrepancy resolution
- Approves asset returns and condition check-in notes

### Department Head
- Views assets allocated to their department
- Approves allocation/transfer requests within their department
- Books shared resources on behalf of the department

### Employee
- Views assets allocated to them
- Books shared resources
- Raises maintenance requests
- Initiates return/transfer requests

---

## 🔄 Basic Workflow

```
1. Admin setup
   ├── Departments
   ├── Asset Categories
   └── Promote employees to Dept Head/Asset Manager

2. Asset Registration
   └── Asset Manager registers asset → Available

3. Asset Allocation
   ├── Allocate to employee/department (if available)
   ├── OR Mark as shared bookable resource
   └── Conflict rule: Block if already allocated

4. Resource Booking
   ├── Employees book by time slot
   └── Overlapping requests rejected automatically

5. Maintenance
   ├── Holder raises request
   ├── Approval required before work begins
   └── Asset flips to Under Maintenance → Available on resolution

6. Transfers & Returns
   ├── Transfer: Requested → Approved → Re-allocated
   └── Return: Mark returned + condition notes → Available

7. Audit Cycles
   ├── Create cycle with scope and auditors
   ├── Mark assets: Verified/Missing/Damaged
   └── Auto-generate discrepancy report → Close cycle

8. Notifications & Logs
   └── All activity tracked through notifications, logs, reports
```

---

## 🧩 Technical Requirements

### Architecture Expectations:
- Clean ERP architecture
- Reusable modules
- Secure role-based workflows
- Responsive UI/UX
- Proper database relationships

### Entity Relationships:
```
Department ─────┐
                ├── Employee ────┐
Asset Category ─┘                ├── Asset Allocation
                                 ├── Resource Booking
Asset ────────────┐             ├── Maintenance Request
                  ├── Allocation─┘
                  ├── Maintenance
                  ├── Audit
                  └── Booking
```

### Data Integrity Rules:
- Cascading updates on department/employee changes
- No orphan records
- Audit trail for all critical operations

---

## 📱 UI/UX Expectations

### Mockup Reference:
https://app.excalidraw.com/l/65VNwvy7c4X/5ceOBMjbDby

### Design Principles:
- Intuitive navigation
- Role-specific views
- Clear visual feedback for actions
- Responsive across devices
- Consistent design language

---

## 🚀 Key Validations Summary

| Module | Key Validations |
|--------|-----------------|
| **Login/Signup** | Email format, no self-role assignment |
| **Organization Setup** | Department uniqueness, employee email uniqueness, valid parent dept |
| **Asset Registration** | Auto-generated unique tag, valid category, status transitions |
| **Allocation** | Asset availability, employee active status, no double-allocation |
| **Resource Booking** | No time overlaps, valid resource, end > start |
| **Maintenance** | Valid asset state, approval required before maintenance |
| **Audit** | All assets in scope audited, auditors valid, no unverified closure |
| **Reports** | Real-time data, exportable formats |
| **Notifications** | All actions logged, real-time delivery |

---

## 📊 Success Criteria

1. ✅ All 10 screens functional with proper role-based access
2. ✅ Conflict prevention in allocations and bookings
3. ✅ Complete audit trail and notification system
4. ✅ Asset lifecycle management with proper state transitions
5. ✅ Real-time dashboard with accurate KPIs
6. ✅ Exportable reports
7. ✅ Clean, responsive UI
8. ✅ Proper ERP architecture with reusable modules
9. ✅ Secure authentication with proper role management
10. ✅ Historical tracking for assets, allocations, maintenance, and audits
