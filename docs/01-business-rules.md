# AssetFlow — Business Rules Specification (ERP Brain)

This document serves as the single source of truth (SSOT) and "ERP Brain" for the **AssetFlow** platform. Every database constraint, validation schema, API controller, and frontend state flow is derived from these rules.

---

## 1. Core Business Rules

### Category A: Authentication & Authorization

#### BR-AUTH-01: Auto-Role Assignment on Signup
*   **Rule ID**: BR-AUTH-01
*   **Name**: Auto-Role Assignment on Signup
*   **Description**: Every visitor registering on the platform is automatically assigned the role of `EMPLOYEE`. The role input cannot be set or modified by the user during signup.
*   **Priority**: P0 – Mandatory
*   **Actor**: System, Visitor
*   **Trigger**: Successful submission of the signup form.
*   **Preconditions**: 
    *   Email address is unique in the employee database.
    *   Password matches strength requirements.
*   **Validation**: 
    *   Email conforms to RFC 5322 format.
    *   Password length $\ge 8$ characters, containing at least 1 number and 1 special character.
    *   Payload filter: Any request-body parameters specifying `role` are discarded or overridden to `EMPLOYEE`.
*   **State Transition**: Visitor $\rightarrow$ Employee (Status: `ACTIVE`, Role: `EMPLOYEE`).
*   **Permission**: Guest/Public.
*   **Database Constraint**: `Employee.role` column has default value `'EMPLOYEE'`.
*   **API Behaviour**: `POST /api/auth/signup` strips `role` from input, hashes the password using bcrypt, creates the database record, and returns a JWT access and refresh token.
*   **UI Behaviour**: The signup screen renders fields only for `name`, `email`, and `password`. No role selection field is displayed.
*   **Error Messages**: 
    *   `EMAIL_ALREADY_EXISTS` (HTTP 400): "An account with this email address already exists."
    *   `WEAK_PASSWORD` (HTTP 400): "Password must be at least 8 characters long and contain a number and a special character."
*   **Audit Log**: "New account registered: Employee [Email] (ID: [EmployeeID])."
*   **Notification**: None.
*   **Implementation Mapping**: 
    *   **Module**: `features/auth`
    *   **API Endpoint**: `POST /api/auth/signup`
    *   **Database Entity**: `Employee`
    *   **UI Screen**: `/signup`
*   **Test Cases**: 
    *   Submit a signup payload containing `{"role": "ADMIN"}` and verify the created record in the database is forced to `'EMPLOYEE'`.
    *   Submit a signup with a duplicate email and assert an HTTP 400 response with `EMAIL_ALREADY_EXISTS`.
*   **Edge Cases**: If a deactivated employee's email is used to sign up again, the system must block it with a generic message to prevent account reclamation or email scanning.

---

#### BR-AUTH-02: Exclusive Role Promotion by Admin
*   **Rule ID**: BR-AUTH-02
*   **Name**: Exclusive Role Promotion by Admin
*   **Description**: Modifying user roles (promoting an Employee to a Department Head or Asset Manager) can only be executed by an Administrator. This operation is restricted exclusively to the Employee Directory tab of the Organization Setup screen.
*   **Priority**: P0 – Mandatory
*   **Actor**: Admin
*   **Trigger**: Admin selects a role from the employee actions dropdown and clicks "Save".
*   **Preconditions**: 
    *   Target employee is currently `ACTIVE`.
    *   Actor is authenticated and verified as `ADMIN`.
*   **Validation**: 
    *   Target user exists in the database.
    *   The selected role is valid (`ADMIN`, `ASSET_MANAGER`, `DEPT_HEAD`, `EMPLOYEE`).
    *   Admin cannot demote themselves if they are the sole Administrator in the system.
*   **State Transition**: Employee Role: `[OldRole]` $\rightarrow$ `[NewRole]`.
*   **Permission**: Role must be `ADMIN`.
*   **Database Constraint**: Foreign key/Enum constraint on `role` field.
*   **API Behaviour**: `PATCH /api/admin/employees/:id/role` checks requesting user's JWT role. If Admin, updates target's role and invalidates the target user's active refresh tokens to force immediate logout and re-authentication.
*   **UI Behaviour**: Employee Directory table row displays a "Change Role" dropdown. Clicking Save opens a confirmation dialog warning that this will immediately terminate the employee's active sessions.
*   **Error Messages**: 
    *   `UNAUTHORIZED_PROMOTION` (HTTP 403): "Only Administrators can modify user roles."
    *   `CANNOT_DEMOTE_SOLE_ADMIN` (HTTP 400): "You cannot modify your own role because you are the sole Administrator."
*   **Audit Log**: "Admin [AdminEmail] modified role of Employee [TargetEmail] from [OldRole] to [NewRole]."
*   **Notification**: Real-time push notification and database notification sent to target employee: "Your system role has been updated to [NewRole]. Please log in again to apply changes."
*   **Implementation Mapping**: 
    *   **Module**: `features/admin`
    *   **API Endpoint**: `PATCH /api/admin/employees/:id/role`
    *   **Database Entity**: `Employee`
    *   **UI Screen**: `/admin/org-setup` (Employee tab)
*   **Test Cases**: 
    *   Attempt to promote an employee using an `ASSET_MANAGER` token and verify HTTP 403.
    *   Admin changes an employee's role; check that the database updates and that the user's entry in the refresh token database table is purged.
*   **Edge Cases**: Promoting an employee who is currently inactive must be blocked; the Admin must first reactivate the employee.

---

#### BR-AUTH-03: Route-Level Authorization & RBAC Checks
*   **Rule ID**: BR-AUTH-03
*   **Name**: Route-Level Authorization & RBAC Checks
*   **Description**: Every API route and UI navigation path must enforce access controls corresponding to the Permission Matrix. Unauthorized actions must trigger an immediate rejection, a client-side redirect, and an audit warning.
*   **Priority**: P0 – Mandatory
*   **Actor**: Admin, Asset Manager, Department Head, Employee
*   **Trigger**: Navigation to a UI route, or transmission of an HTTP request.
*   **Preconditions**: User possesses a valid JWT access token.
*   **Validation**: User's role (extracted from JWT payload) is checked against the list of authorized roles for that endpoint/route.
*   **State Transition**: None.
*   **Permission**: System-wide check based on active role.
*   **Database Constraint**: None.
*   **API Behaviour**: Express authentication middleware (`authorizeRoles('ADMIN', 'ASSET_MANAGER')`) returns HTTP 403 if the user's role is missing from the whitelist.
*   **UI Behaviour**: Client router wraps private paths. Unauthorized navigation redirects to `/403`. Buttons/Actions for unauthorized tasks (e.g., "Add Asset" for normal employees) are hidden or disabled in the DOM.
*   **Error Messages**: 
    *   `FORBIDDEN_ACTION` (HTTP 403): "You do not have permission to perform this action."
    *   `UNAUTHORIZED_SESSION` (HTTP 401): "Session expired or invalid. Please log in again."
*   **Audit Log**: "Warning: Unauthorized access attempt by [UserEmail] to endpoint [HTTP_METHOD] [RoutePath]."
*   **Notification**: None.
*   **Implementation Mapping**: 
    *   **Module**: `features/auth`
    *   **API Endpoint**: Express Router Middleware
    *   **Database Entity**: None
    *   **UI Screen**: All Protected Screens
*   **Test Cases**: 
    *   Fetch `GET /api/admin/logs` with an `EMPLOYEE` JWT and verify HTTP 403.
    *   Verify that if the JWT expires, the API returns HTTP 401, prompting the client to call the token refresh endpoint automatically.
*   **Edge Cases**: Role changes mid-session. The frontend must intercept HTTP 403 errors and trigger a global state reset/re-check of user metadata.

---

### Category B: Organization Setup

#### BR-ORG-01: Department Hierarchy and Cycle Prevention
*   **Rule ID**: BR-ORG-01
*   **Name**: Department Hierarchy and Cycle Prevention
*   **Description**: Departments can have an optional parent department to construct organizational hierarchy. Circular dependencies (e.g., Department A is the parent of B, and B is set as the parent of A) are strictly blocked.
*   **Priority**: P0 – Mandatory
*   **Actor**: Admin
*   **Trigger**: Creating or updating a department.
*   **Preconditions**: 
    *   Department name is unique.
    *   Parent department exists and is active.
*   **Validation**: 
    *   `parentId` must not equal the department's own `id`.
    *   A recursive graph traversal is executed before saving: the proposed `parentId` must not be a child or descendant of the current department `id`.
*   **State Transition**: None.
*   **Permission**: Role `ADMIN`.
*   **Database Constraint**: Foreign key constraint `parentId` referencing `Department(id)` ON DELETE SET NULL.
*   **API Behaviour**: `POST /api/admin/departments` or `PUT /api/admin/departments/:id` performs a recursive validation query. If a cycle is detected, it rolls back the transaction and returns HTTP 400.
*   **UI Behaviour**: The Parent Department dropdown in the Department modal filters out the department being edited and any of its direct or indirect child departments.
*   **Error Messages**: 
    *   `CYCLIC_DEPARTMENT_HIERARCHY` (HTTP 400): "Cannot set parent department: this assignment would create a circular dependency."
    *   `DUPLICATE_DEPARTMENT_NAME` (HTTP 400): "A department with this name already exists."
*   **Audit Log**: "Department [DeptName] (ID: [ID]) updated with Parent Department [ParentName] by Admin [Email]."
*   **Notification**: None.
*   **Implementation Mapping**: 
    *   **Module**: `features/admin`
    *   **API Endpoint**: `POST /api/admin/departments`, `PUT /api/admin/departments/:id`
    *   **Database Entity**: `Department`
    *   **UI Screen**: `/admin/org-setup` (Department tab)
*   **Test Cases**: 
    *   Create Department A. Create Department B with Parent A. Attempt to update A with Parent B; verify HTTP 400 error.
*   **Edge Cases**: Moving a department with children to a new parent. Verify that child paths are updated correctly without breaking child references.

---

#### BR-ORG-02: Department Deactivation Safeguards
*   **Rule ID**: BR-ORG-02
*   **Name**: Department Deactivation Safeguards
*   **Description**: A department cannot be deactivated (marked `INACTIVE`) if it contains active employees or if it holds active asset allocations assigned directly to the department.
*   **Priority**: P0 – Mandatory
*   **Actor**: Admin
*   **Trigger**: Toggle department status switch to inactive.
*   **Preconditions**: Department exists and is currently `ACTIVE`.
*   **Validation**: 
    *   Count of active employees in department must equal 0:
        $$\text{Count}(\text{Employee.id}) \text{ where } \text{departmentId} = D \text{ and } \text{status} = \text{'ACTIVE'} = 0$$
    *   Count of active allocations directly to department must equal 0:
        $$\text{Count}(\text{Allocation.id}) \text{ where } \text{departmentId} = D \text{ and } \text{returnedAt is NULL} = 0$$
*   **State Transition**: Department Status: `ACTIVE` $\rightarrow$ `INACTIVE`.
*   **Permission**: Role `ADMIN`.
*   **Database Constraint**: None (enforced via database transaction lookup).
*   **API Behaviour**: `PATCH /api/admin/departments/:id/status` queries the employee and allocation counts. If greater than 0, it aborts update and returns HTTP 400.
*   **UI Behaviour**: Deactivation switch displays a warning message. If validation fails, the toggle resets, and a modal displays the active dependencies preventing deactivation.
*   **Error Messages**: 
    *   `DEPARTMENT_HAS_ACTIVE_MEMBERS` (HTTP 400): "Cannot deactivate department: active employees are still assigned to it."
    *   `DEPARTMENT_HAS_ACTIVE_ALLOCATIONS` (HTTP 400): "Cannot deactivate department: assets are still allocated to this department."
*   **Audit Log**: "Deactivation of Department [DeptName] rejected due to active dependencies / succeeded by Admin [Email]."
*   **Notification**: None.
*   **Implementation Mapping**: 
    *   **Module**: `features/admin`
    *   **API Endpoint**: `PATCH /api/admin/departments/:id/status`
    *   **Database Entity**: `Department`, `Employee`, `Allocation`
    *   **UI Screen**: `/admin/org-setup` (Department tab)
*   **Test Cases**: 
    *   Assign employee E1 to Dept D1. Attempt to set D1 status to `INACTIVE`. Verify HTTP 400.
    *   Clear employees and allocations from D1, deactivate D1, check status is `INACTIVE` in database.
*   **Edge Cases**: Active child departments. Deactivating a parent department must also be blocked if it has active child departments.

---

#### BR-ORG-03: Employee Deactivation Safeguards
*   **Rule ID**: BR-ORG-03
*   **Name**: Employee Deactivation Safeguards
*   **Description**: An employee cannot be deactivated (marked `INACTIVE`) if they hold active asset allocations or have upcoming/ongoing resource bookings. Deactivating an employee automatically cancels all their future bookings.
*   **Priority**: P0 – Mandatory
*   **Actor**: Admin
*   **Trigger**: Toggle employee status to inactive in the Employee Directory.
*   **Preconditions**: Employee exists and is active.
*   **Validation**: 
    *   Count of active allocations where `returnedAt IS NULL` is 0.
    *   Active/ongoing bookings count is checked.
*   **State Transition**: 
    *   Employee Status: `ACTIVE` $\rightarrow$ `INACTIVE`.
    *   Upcoming Bookings: `UPCOMING` $\rightarrow$ `CANCELLED`.
*   **Permission**: Role `ADMIN`.
*   **Database Constraint**: None.
*   **API Behaviour**: `PATCH /api/admin/employees/:id/status` verifies active allocations. If 0, it updates employee status, sets any upcoming booking statuses to `CANCELLED`, deletes active sessions, and returns success.
*   **UI Behaviour**: Shows confirmation dialog. If blocked, displays details of active allocations. If successful, displays "Employee deactivated, all future bookings canceled."
*   **Error Messages**: 
    *   `EMPLOYEE_HAS_ACTIVE_ALLOCATIONS` (HTTP 400): "Cannot deactivate employee: they still hold allocated assets."
*   **Audit Log**: "Employee [Email] deactivated by Admin [AdminEmail]. [Count] future bookings automatically cancelled."
*   **Notification**: Emails/notifications sent to managers for cancelled bookings.
*   **Implementation Mapping**: 
    *   **Module**: `features/admin`
    *   **API Endpoint**: `PATCH /api/admin/employees/:id/status`
    *   **Database Entity**: `Employee`, `Allocation`, `Booking`
    *   **UI Screen**: `/admin/org-setup` (Employee tab)
*   **Test Cases**: 
    *   Add allocation to employee, attempt deactivation, assert failure.
    *   Add booking to employee, deactivate employee, assert success, check that the booking status is changed to `CANCELLED` in the database.
*   **Edge Cases**: Employee is a Department Head. Deactivating them leaves the department without a head. Decision: Block deactivation or require the Admin to assign a new Department Head first.

---

#### BR-ORG-04: Asset Category Custom Fields Metadata Schema Definition
*   **Rule ID**: BR-ORG-04
*   **Name**: Asset Category Custom Fields Metadata Schema Definition
*   **Description**: Custom attributes specific to asset categories (e.g. warranty period for Electronics, fuel type for Vehicles) are defined during category creation. These fields are stored as a JSON schema used to validate asset registrations.
*   **Priority**: P1 – Important
*   **Actor**: Admin
*   **Trigger**: Creating or editing an Asset Category.
*   **Preconditions**: Category name is unique.
*   **Validation**: Custom schema fields must contain valid keys: `name`, `type` (`'string' | 'number' | 'boolean'`), and `required` (`true | false`).
*   **State Transition**: None.
*   **Permission**: Role `ADMIN`.
*   **Database Constraint**: None.
*   **API Behaviour**: `POST /api/admin/categories` parses and validates the schema structure, storing it in the `customFieldsSchema` JSONB column.
*   **UI Behaviour**: The Category form features a dynamic builder for adding, naming, and typing custom attributes.
*   **Error Messages**: 
    *   `INVALID_SCHEMA_STRUCTURE` (HTTP 400): "Custom attribute definitions are malformed."
*   **Audit Log**: "Asset Category [CategoryName] schema updated by Admin [Email]."
*   **Notification**: None.
*   **Implementation Mapping**: 
    *   **Module**: `features/admin`
    *   **API Endpoint**: `POST /api/admin/categories`, `PUT /api/admin/categories/:id`
    *   **Database Entity**: `AssetCategory`
    *   **UI Screen**: `/admin/org-setup` (Category tab)
*   **Test Cases**: 
    *   Submit schema `[{"name": "RAM", "type": "string", "required": true}]` and check DB entry.
    *   Submit schema with missing `type` parameter; assert HTTP 400.
*   **Edge Cases**: Updating the schema for a category with existing assets. Decision: Allow updates, but do not retroactively break existing assets; set default values or make new fields optional.

---

### Category C: Asset Registry & Lifecycle

#### BR-ASSET-01: Unique Asset Tag Assignment Format
*   **Rule ID**: BR-ASSET-01
*   **Name**: Unique Asset Tag Assignment Format
*   **Description**: Every asset registered must be assigned a unique system-generated asset tag starting with prefix `AF-` followed by a sequential zero-padded four-digit integer (e.g., `AF-0001`, `AF-0114`).
*   **Priority**: P0 – Mandatory
*   **Actor**: Asset Manager, Admin
*   **Trigger**: Registration of a new asset.
*   **Preconditions**: Asset details are valid.
*   **Validation**: Sequence generation operates inside a database lock to prevent concurrency conflicts.
*   **State Transition**: `[*]` $\rightarrow$ `AVAILABLE`.
*   **Permission**: Role `ASSET_MANAGER` or `ADMIN`.
*   **Database Constraint**: Unique constraint on `assetTag` column in `Asset` table.
*   **API Behaviour**: `POST /api/assets` ignores any user-supplied `assetTag` in the body. It performs a locking read on the maximum existing tag suffix, increments it, formats the string, and commits the transaction.
*   **UI Behaviour**: The asset registration form disables the Asset Tag field and shows "AF-XXXX (Auto-Generated)".
*   **Error Messages**: 
    *   `TAG_GENERATION_ERROR` (HTTP 500): "Failed to auto-generate unique asset tag."
*   **Audit Log**: "Asset [Name] registered with Tag [AssetTag] by Manager [Email]."
*   **Notification**: None.
*   **Implementation Mapping**: 
    *   **Module**: `features/assets`
    *   **API Endpoint**: `POST /api/assets`
    *   **Database Entity**: `Asset`
    *   **UI Screen**: `/assets/new`
*   **Test Cases**: 
    *   Call registration parallelly (simulating multiple managers) and verify all assets receive sequential tags without collision.
*   **Edge Cases**: Suffix exceeding 9999. Decision: Suffix scales dynamically (e.g., `AF-10000`) matching `^AF-\d{4,}$`.

---

#### BR-ASSET-02: Asset Lifecycle Status Transitions
*   **Rule ID**: BR-ASSET-02
*   **Name**: Asset Lifecycle Status Transitions
*   **Description**: Assets must navigate through specific states: `AVAILABLE`, `ALLOCATED`, `RESERVED`, `UNDER_MAINTENANCE`, `LOST`, `RETIRED`, `DISPOSED`. Direct modifications of status are blocked; status changes must be side-effects of validated business actions.
*   **Priority**: P0 – Mandatory
*   **Actor**: System, Asset Manager, Auditor
*   **Trigger**: Allocation, return, booking, maintenance approval, audit closure, or decommissioning.
*   **Preconditions**: Target state transition matches the defined lifecycle state machine.
*   **Validation**: Checks the current status of the asset.
*   **State Transition**: Refer to State Transition Matrix.
*   **Permission**: Enforced by the individual triggering actions.
*   **Database Constraint**: Enum constraint on `status` column in `Asset` table.
*   **API Behaviour**: `PUT /api/assets/:id` blocks updates to the `status` field. Status updates are processed only via nested transaction logic on sub-feature endpoints.
*   **UI Behaviour**: Status is rendered as a color-coded status pill. Control buttons (e.g. "Allocate") are visible/active only if the state allows.
*   **Error Messages**: 
    *   `INVALID_STATE_TRANSITION` (HTTP 400): "Cannot transition asset from [CurrentStatus] to [TargetStatus]."
*   **Audit Log**: "Asset [Tag] status updated from [OldStatus] to [NewStatus] via action [Action]."
*   **Notification**: None.
*   **Implementation Mapping**: 
    *   **Module**: `features/assets`
    *   **API Endpoint**: All mutation endpoints affecting assets.
    *   **Database Entity**: `Asset`
    *   **UI Screen**: `/assets`, `/assets/:id`
*   **Test Cases**: 
    *   Attempt to allocate an asset whose status is `RETIRED` and verify HTTP 400 error.
*   **Edge Cases**: Overlapping states (e.g., an asset is booked but also goes under maintenance). Decision: Maintenance has priority; booking must be cancelled, and asset status changes to `UNDER_MAINTENANCE`.

---

#### BR-ASSET-03: Asset Decommissioning
*   **Rule ID**: BR-ASSET-03
*   **Name**: Asset Decommissioning (Retirement/Disposal)
*   **Description**: An asset can be decommissioned (transitioned to status `RETIRED` or `DISPOSED`) only if its current status is `AVAILABLE`. Active or occupied assets cannot be decommissioned.
*   **Priority**: P0 – Mandatory
*   **Actor**: Asset Manager, Admin
*   **Trigger**: Manager submits decommission form with rationale.
*   **Preconditions**: Asset status is `AVAILABLE`.
*   **Validation**: 
    *   Asset status matches `AVAILABLE`.
    *   No active allocations (`returnedAt IS NULL`) or pending/ongoing bookings exist.
*   **State Transition**: `AVAILABLE` $\rightarrow$ `RETIRED` | `DISPOSED`.
*   **Permission**: Role `ASSET_MANAGER` or `ADMIN`.
*   **Database Constraint**: None.
*   **API Behaviour**: `POST /api/assets/:id/decommission` checks status, updates status to `RETIRED` or `DISPOSED`, and writes decommission metadata (reason, date) to history logs.
*   **UI Behaviour**: "Decommission" action is enabled on the asset details screen only when status is "Available". It displays a modal with decommission category and details.
*   **Error Messages**: 
    *   `ASSET_NOT_DECOMMISSIONABLE` (HTTP 400): "Only Available assets can be decommissioned."
*   **Audit Log**: "Asset [Tag] decommissioned ([Type]) by [Email]. Reason: [Reason]."
*   **Notification**: None.
*   **Implementation Mapping**: 
    *   **Module**: `features/assets`
    *   **API Endpoint**: `POST /api/assets/:id/decommission`
    *   **Database Entity**: `Asset`
    *   **UI Screen**: `/assets/:id`
*   **Test Cases**: 
    *   Attempt to decommission an allocated asset and verify the request is blocked with HTTP 400.
*   **Edge Cases**: Reactivating a retired asset. Decision: Admin can revert a `RETIRED` asset back to `AVAILABLE`. `DISPOSED` assets can never be reactivated.

---

#### BR-ASSET-04: Asset Registration Custom Attributes Validation
*   **Rule ID**: BR-ASSET-04
*   **Name**: Asset Registration Custom Attributes Validation
*   **Description**: Asset registrations must provide metadata matching the JSON schema defined in their target category. Dynamic fields must conform to required fields and types.
*   **Priority**: P1 – Important
*   **Actor**: Asset Manager, Admin
*   **Trigger**: Submitting asset registration or update form.
*   **Preconditions**: Target category exists and possesses a valid schema definition.
*   **Validation**: Metadata fields are validated against the schema defined on the Category record.
*   **State Transition**: None.
*   **Permission**: Role `ASSET_MANAGER` or `ADMIN`.
*   **Database Constraint**: None.
*   **API Behaviour**: `POST /api/assets` loads the category schema, checks the payload `metadata` object against field constraints (using a JSON validator), and rejects if validation fails.
*   **UI Behaviour**: The asset registration form dynamically changes fields according to the selected category (renders numbers, selectors, or checkboxes) and runs validation before submission.
*   **Error Messages**: 
    *   `METADATA_VALIDATION_FAILED` (HTTP 400): "Custom field [FieldName] is required and must be of type [FieldType]."
*   **Audit Log**: None.
*   **Notification**: None.
*   **Implementation Mapping**: 
    *   **Module**: `features/assets`
    *   **API Endpoint**: `POST /api/assets`, `PUT /api/assets/:id`
    *   **Database Entity**: `Asset`, `AssetCategory`
    *   **UI Screen**: `/assets/new`, `/assets/:id/edit`
*   **Test Cases**: 
    *   Register a Laptop with missing custom attribute "Warranty Period" (defined as required in the Category schema); verify validation failure.
*   **Edge Cases**: Missing data in old assets when schema is updated. System sets missing fields to default or null without throwing validation errors unless the old asset is edited.

---

#### BR-ASSET-05: Bookability Flag Enforcement
*   **Rule ID**: BR-ASSET-05
*   **Name**: Bookability Flag Enforcement
*   **Description**: Assets can only be reserved through the Resource Booking Screen if their `isBookable` flag is explicitly set to `true`.
*   **Priority**: P0 – Mandatory
*   **Actor**: Employee, Department Head, Asset Manager, Admin
*   **Trigger**: Creating a booking.
*   **Preconditions**: Target asset exists.
*   **Validation**: `asset.isBookable` is verified as `true`.
*   **State Transition**: None.
*   **Permission**: Role `EMPLOYEE`, `DEPT_HEAD`, `ASSET_MANAGER`, `ADMIN`.
*   **Database Constraint**: None.
*   **API Behaviour**: `POST /api/bookings` checks the asset record. If `isBookable` is false, it rejects with HTTP 400.
*   **UI Behaviour**: The bookings creation interface searches only for assets with `isBookable = true`.
*   **Error Messages**: 
    *   `ASSET_NOT_BOOKABLE` (HTTP 400): "This asset is not registered as a bookable resource."
*   **Audit Log**: None.
*   **Notification**: None.
*   **Implementation Mapping**: 
    *   **Module**: `features/booking`
    *   **API Endpoint**: `POST /api/bookings`
    *   **Database Entity**: `Asset`, `Booking`
    *   **UI Screen**: `/bookings`
*   **Test Cases**: 
    *   Attempt to book a laptop with `isBookable = false` using the API and verify rejection.
*   **Edge Cases**: Modifying `isBookable` from true to false while active bookings exist. Decision: Block modification in `/assets/:id/edit` until all future bookings for that asset are cancelled.

---

### Category D: Asset Allocation & Transfers

#### BR-ALLOC-01: Double-Allocation Prevention
*   **Rule ID**: BR-ALLOC-01
*   **Name**: Double-Allocation Prevention
*   **Description**: An asset cannot be allocated to two employees or departments simultaneously. An active allocation is defined by `returnedAt` being null.
*   **Priority**: P0 – Mandatory
*   **Actor**: Asset Manager, Admin
*   **Trigger**: Asset allocation request.
*   **Preconditions**: 
    *   Asset status is `AVAILABLE`.
    *   No existing active allocations exist:
        $$\nexists a \in \text{Allocation} \text{ such that } a.\text{assetId} = A \text{ and } a.\text{returnedAt} \text{ is NULL}$$
*   **Validation**: Enforce active allocation checks during the transaction.
*   **State Transition**: `AVAILABLE` $\rightarrow$ `ALLOCATED`.
*   **Permission**: Role `ASSET_MANAGER` or `ADMIN`.
*   **Database Constraint**: Partial unique index on `Allocation` where `returnedAt` is null:
    `CREATE UNIQUE INDEX unique_active_allocation ON "Allocation"("assetId") WHERE "returnedAt" IS NULL;`
*   **API Behaviour**: `POST /api/allocations` runs inside a database transaction. It verifies status, inserts the allocation record, and updates the asset status. If the partial index is violated, it rolls back and returns HTTP 400.
*   **UI Behaviour**: The Allocate asset button is visible only for "Available" assets. If the asset is already allocated, the UI replaces the allocate option with a "Request Transfer" action.
*   **Error Messages**: 
    *   `ASSET_ALREADY_ALLOCATED` (HTTP 400): "This asset is currently allocated to another user or department."
*   **Audit Log**: "Asset [Tag] allocated to [Recipient] by Manager [Email]."
*   **Notification**: Notification triggered for the recipient: "Asset [Name] has been allocated to you."
*   **Implementation Mapping**: 
    *   **Module**: `features/allocation`
    *   **API Endpoint**: `POST /api/allocations`
    *   **Database Entity**: `Allocation`, `Asset`
    *   **UI Screen**: `/allocations`
*   **Test Cases**: 
    *   Simulate two concurrent allocation API requests for the same asset; verify the database blocks the second insert and returns HTTP 400.
*   **Edge Cases**: Allocation must reference exactly one recipient: either `employeeId` or `departmentId`, never both and never neither.

---

#### BR-ALLOC-02: Allocation Transfer Request Trigger
*   **Rule ID**: BR-ALLOC-02
*   **Name**: Allocation Transfer Request Trigger
*   **Description**: Attempting to allocate an already allocated asset triggers a block and presents the option to request a transfer. A transfer request can also be initiated directly from the active asset directory.
*   **Priority**: P0 – Mandatory
*   **Actor**: Employee, Department Head, Asset Manager, Admin
*   **Trigger**: Clicking the "Request Transfer" button on an allocated asset.
*   **Preconditions**: 
    *   Asset is currently `ALLOCATED` (contains an active allocation record).
*   **Validation**: 
    *   An active allocation exists to transfer from.
    *   No pending transfer request already exists for this active allocation.
*   **State Transition**: None (Asset remains `ALLOCATED`; `TransferRequest` status is set to `PENDING`).
*   **Permission**: Role `EMPLOYEE`, `DEPT_HEAD`, `ASSET_MANAGER`, `ADMIN`.
*   **Database Constraint**: None.
*   **API Behaviour**: `POST /api/allocations/transfer` inserts a record into `TransferRequest` linked to the active `Allocation.id` with status `'PENDING'` and records the reason.
*   **UI Behaviour**: Displays details of the current holder (e.g. "Held by John Doe in IT"). Shows a "Request Transfer" dialog box requesting the reason for transfer.
*   **Error Messages**: 
    *   `TRANSFER_ALREADY_PENDING` (HTTP 400): "A transfer request is already pending for this asset."
*   **Audit Log**: "Transfer request initiated for Asset [Tag] by [RequestorEmail]."
*   **Notification**: Notification sent to the current holder and the approver.
*   **Implementation Mapping**: 
    *   **Module**: `features/allocation`
    *   **API Endpoint**: `POST /api/allocations/transfer`
    *   **Database Entity**: `TransferRequest`, `Allocation`
    *   **UI Screen**: `/allocations`
*   **Test Cases**: 
    *   Create a transfer request for an allocated laptop; check database entry. Attempt to create another transfer request for the same allocation; verify HTTP 400.
*   **Edge Cases**: The current holder rejects the transfer. Decision: Handle rejection through a Reject state, notifying the requester.

---

#### BR-ALLOC-03: Transfer Request Approval Authority
*   **Rule ID**: BR-ALLOC-03
*   **Name**: Transfer Request Approval Authority
*   **Description**: A transfer request can only be approved/rejected by an Asset Manager or the Department Head of the department holding the asset. On approval, the old allocation is closed, and a new allocation is created automatically.
*   **Priority**: P0 – Mandatory
*   **Actor**: Asset Manager, Department Head, Admin
*   **Trigger**: Clicking "Approve Transfer" in the notifications or transfers inbox.
*   **Preconditions**: 
    *   Transfer request status is `PENDING`.
    *   Approver is an `ASSET_MANAGER`, an `ADMIN`, or is the `DEPT_HEAD` of the department holding the asset:
        $$\text{Approver.role} = \text{'ASSET_MANAGER'} \lor \text{Approver.id} = \text{CurrentHolder.Department.headId}$$
*   **Validation**: 
    *   Target recipient is active.
    *   Asset is still in the same active allocation.
*   **State Transition**: 
    *   `TransferRequest` Status: `PENDING` $\rightarrow$ `APPROVED`.
    *   Old Allocation: `returnedAt` set to current time, notes set to "Transferred".
    *   New Allocation: Created with `returnedAt = NULL` for target recipient.
*   **Permission**: Check role or department head ownership.
*   **Database Constraint**: None.
*   **API Behaviour**: `POST /api/allocations/transfer/:id/approve` executes all state transitions inside a single transaction. Returns HTTP 200 on success.
*   **UI Behaviour**: Approver dashboard displays "Transfer Requests" list. "Approve" button triggers a confirmation modal and completes the allocation transfer.
*   **Error Messages**: 
    *   `UNAUTHORIZED_TRANSFER_APPROVER` (HTTP 403): "You are not authorized to approve transfers for this asset."
*   **Audit Log**: "Transfer of Asset [Tag] from [OldHolder] to [NewHolder] approved by [ApproverEmail]."
*   **Notification**: Notifications sent to both the old holder ("Asset transferred out") and the new holder ("Asset allocated to you").
*   **Implementation Mapping**: 
    *   **Module**: `features/allocation`
    *   **API Endpoint**: `POST /api/allocations/transfer/:id/approve`
    *   **Database Entity**: `TransferRequest`, `Allocation`, `Asset`
    *   **UI Screen**: `/allocations`
*   **Test Cases**: 
    *   Log in as Department Head of Department A. Try to approve a transfer for an asset allocated to Department B; verify HTTP 403.
*   **Edge Cases**: The recipient has been deactivated since the request. Validation must confirm the recipient is active before completing.

---

#### BR-ALLOC-04: Return Flow Check-In Condition Notes
*   **Rule ID**: BR-ALLOC-04
*   **Name**: Return Flow Check-In Condition Notes
*   **Description**: Returning an asset requires closing the active allocation, recording condition check-in notes, and updating the asset's current condition and status to `AVAILABLE`.
*   **Priority**: P0 – Mandatory
*   **Actor**: Asset Manager, Admin
*   **Trigger**: Asset Manager submits return form.
*   **Preconditions**: Asset is `ALLOCATED` (has active allocation).
*   **Validation**: 
    *   Condition notes must be provided.
    *   Condition value must be one of: `EXCELLENT`, `GOOD`, `FAIR`, `DAMAGED`.
*   **State Transition**: 
    *   Allocation: `returnedAt` set to current time, notes set.
    *   Asset: `ALLOCATED` $\rightarrow$ `AVAILABLE`, `condition` updated.
*   **Permission**: Role `ASSET_MANAGER` or `ADMIN`.
*   **Database Constraint**: None.
*   **API Behaviour**: `POST /api/allocations/:id/return` closes the allocation, updates the asset's condition/status, and returns success.
*   **UI Behaviour**: Clicking "Return Asset" opens a modal containing a Condition dropdown and a Condition Notes text field.
*   **Error Messages**: 
    *   `MISSING_RETURN_DETAILS` (HTTP 400): "Condition and check-in notes are required."
*   **Audit Log**: "Asset [Tag] returned by [Holder] in [Condition] condition. Notes: [Notes]."
*   **Notification**: Notify employee: "Your return of asset [Tag] has been processed."
*   **Implementation Mapping**: 
    *   **Module**: `features/allocation`
    *   **API Endpoint**: `POST /api/allocations/:id/return`
    *   **Database Entity**: `Allocation`, `Asset`
    *   **UI Screen**: `/allocations`
*   **Test Cases**: 
    *   Submit return payload with missing check-in notes; verify HTTP 400. Verify status transitions to AVAILABLE in DB.
*   **Edge Cases**: If returned as `DAMAGED`, the system must record the state and prompt the manager with a shortcut to register a maintenance request.

---

#### BR-ALLOC-05: Overdue Allocation Calculation and Alerts
*   **Rule ID**: BR-ALLOC-05
*   **Name**: Overdue Allocation Calculation and Alerts
*   **Description**: Active allocations that exceed their `expectedReturnDate` are automatically flagged as overdue on the dashboard and trigger automated alerts.
*   **Priority**: P0 – Mandatory
*   **Actor**: System, Employee, Asset Manager
*   **Trigger**: Cron job / Daily checker, or dashboard KPI data load.
*   **Preconditions**: Allocation is active (`returnedAt IS NULL`) and `expectedReturnDate` is in the past.
*   **Validation**: 
    $$\text{expectedReturnDate} < \text{CurrentTime}$$
*   **State Transition**: None.
*   **Permission**: System task.
*   **Database Constraint**: None.
*   **API Behaviour**: `GET /api/allocations/overdue` queries the database for allocations matching preconditions. `GET /api/dashboard/kpis` counts these elements.
*   **UI Behaviour**: Dashboard separates overdue returns from regular upcoming returns, rendering them in a distinct KPI card with red warning outlines and showing "X days overdue".
*   **Error Messages**: None.
*   **Audit Log**: None.
*   **Notification**: Daily email / notification sent to the employee and Asset Manager.
*   **Implementation Mapping**: 
    *   **Module**: `features/allocation`
    *   **API Endpoint**: `GET /api/allocations/overdue`, `GET /api/dashboard/kpis`
    *   **Database Entity**: `Allocation`, `Asset`
    *   **UI Screen**: `/dashboard`, `/allocations`
*   **Test Cases**: 
    *   Insert allocation record with `expectedReturnDate` set to yesterday. Query dashboard KPIs; check that overdue returns count equals 1.
*   **Edge Cases**: Handling timezone offsets. All dates must be saved and compared in UTC format.

---

### Category E: Shared Resource Booking

#### BR-BOOK-01: Booking Conflict/Overlap Prevention
*   **Rule ID**: BR-BOOK-01
*   **Name**: Booking Conflict/Overlap Prevention
*   **Description**: A bookable asset cannot have overlapping reservations. A booking request must be blocked if it overlaps with any existing reservation.
*   **Priority**: P0 – Mandatory
*   **Actor**: Employee, Department Head, Asset Manager, Admin
*   **Trigger**: Submitting a booking request.
*   **Preconditions**: 
    *   Target asset is marked `isBookable = true`.
    *   Asset status is not `RETIRED` or `DISPOSED`.
*   **Validation**: 
    *   Start time is in the future.
    *   End time is greater than start time (minimum duration 15 minutes).
    *   Let $S_1, E_1$ be the start and end of an existing reservation. Let $S_2, E_2$ be the requested times. Rejection occurs if:
        $$S_2 < E_1 \quad \text{and} \quad E_2 > S_1$$
*   **State Transition**: None (Asset remains `AVAILABLE` or is flagged as `RESERVED` during active booking slots).
*   **Permission**: Role `EMPLOYEE`, `DEPT_HEAD`, `ASSET_MANAGER`, `ADMIN`.
*   **Database Constraint**: None (Enforced at database layer using row-level transactional locking).
*   **API Behaviour**: `POST /api/bookings` acquires a write lock on the target asset's bookings for the day:
    `SELECT * FROM "Booking" WHERE "assetId" = :assetId AND "status" IN ('UPCOMING', 'ONGOING') FOR UPDATE;`
    Runs overlap checks. If conflict exists, aborts transaction and returns HTTP 409 Conflict.
*   **UI Behaviour**: The reservation calendar displays booked slots. Selecting a conflicting block displays a red validation warning and disables the "Book" button.
*   **Error Messages**: 
    *   `BOOKING_TIME_OVERLAP` (HTTP 409): "This resource is already booked during the selected time window."
*   **Audit Log**: "Booking attempt rejected due to conflict on Asset [Tag] by [Email]."
*   **Notification**: None.
*   **Implementation Mapping**: 
    *   **Module**: `features/booking`
    *   **API Endpoint**: `POST /api/bookings`
    *   **Database Entity**: `Booking`, `Asset`
    *   **UI Screen**: `/bookings`
*   **Test Cases**: 
    *   Mock existing booking for Room A from 09:00 to 10:00. Call create booking endpoint for Room A from 09:30 to 10:30; verify HTTP 409 error.
*   **Edge Cases**: Bookings touching exactly at the minute (e.g., 09:00–10:00 and 10:00–11:00) are valid and must not trigger conflicts.

---

#### BR-BOOK-02: Booking Status and Cancellation Window
*   **Rule ID**: BR-BOOK-02
*   **Name**: Booking Status and Cancellation Window
*   **Description**: Bookings transition through: `UPCOMING`, `ONGOING`, `COMPLETED`, `CANCELLED`. Cancellations or modifications are permitted only if the booking status is `UPCOMING` (has not yet started).
*   **Priority**: P0 – Mandatory
*   **Actor**: Employee (Owner), Asset Manager, Admin
*   **Trigger**: Clicking "Cancel Reservation" or updating booking time.
*   **Preconditions**: Booking exists and is in `UPCOMING` status.
*   **Validation**: 
    *   `booking.status === 'UPCOMING'`.
    *   `booking.startTime` is greater than current time.
*   **State Transition**: `UPCOMING` $\rightarrow$ `CANCELLED`.
*   **Permission**: Booking owner, `ASSET_MANAGER`, or `ADMIN`.
*   **Database Constraint**: Enum constraint on `status` in `Booking` table.
*   **API Behaviour**: `DELETE /api/bookings/:id` or `POST /api/bookings/:id/cancel` validates status and ownership. Updates status to `'CANCELLED'`.
*   **UI Behaviour**: The "Cancel Booking" button is active on the booking card only when status is "Upcoming". It is hidden or disabled for ongoing/completed bookings.
*   **Error Messages**: 
    *   `CANNOT_MODIFY_ACTIVE_BOOKING` (HTTP 400): "Cannot cancel or reschedule a booking that has already started or completed."
*   **Audit Log**: "Booking [ID] cancelled by [Email]."
*   **Notification**: Sends notifications to participants of the cancellation.
*   **Implementation Mapping**: 
    *   **Module**: `features/booking`
    *   **API Endpoint**: `DELETE /api/bookings/:id`
    *   **Database Entity**: `Booking`
    *   **UI Screen**: `/bookings`
*   **Test Cases**: 
    *   Attempt to cancel a booking that started 5 minutes ago; verify HTTP 400. Cancel a booking starting tomorrow; verify success.
*   **Edge Cases**: The system runs a background script every 5 minutes to transition expired bookings to `ONGOING` or `COMPLETED` based on time.

---

#### BR-BOOK-03: Booking Resource Authorization
*   **Rule ID**: BR-BOOK-03
*   **Name**: Booking Resource Authorization
*   **Description**: Employees can book resources on their own behalf. Department Heads can book resources on behalf of their department. Employees cannot book resources for other employees or departments.
*   **Priority**: P1 – Important
*   **Actor**: Employee, Department Head, Admin
*   **Trigger**: Creating a booking.
*   **Preconditions**: Valid auth session.
*   **Validation**: 
    *   If `bookingType` is `'EMPLOYEE'`, `employeeId` must match the token owner's ID.
    *   If `bookingType` is `'DEPARTMENT'`, user role must be `DEPT_HEAD` and `departmentId` must match the token owner's department.
*   **State Transition**: None.
*   **Permission**: Checked dynamically on request payloads.
*   **Database Constraint**: None.
*   **API Behaviour**: `POST /api/bookings` validates token metadata against payload parameters. If mismatch occurs, returns HTTP 403.
*   **UI Behaviour**: The booking form defaults owner details. Department Heads get a toggle: "Book on behalf of Department". Employees only see their own name.
*   **Error Messages**: 
    *   `UNAUTHORIZED_BOOKING_REPRESENTATIVE` (HTTP 403): "You are not authorized to book resources for this target."
*   **Audit Log**: "Booking created for Asset [Tag] by [ActorEmail] on behalf of [Target]."
*   **Notification**: None.
*   **Implementation Mapping**: 
    *   **Module**: `features/booking`
    *   **API Endpoint**: `POST /api/bookings`
    *   **Database Entity**: `Booking`
    *   **UI Screen**: `/bookings`
*   **Test Cases**: 
    *   A normal employee attempts to book a meeting room under a Department ID; verify validation failure (HTTP 403).
*   **Edge Cases**: If an employee changes departments, bookings associated with their old department remain but must be updated or audited.

---

### Category F: Maintenance Approvals

#### BR-MAINT-01: Maintenance Request Workflow and Approval
*   **Rule ID**: BR-MAINT-01
*   **Name**: Maintenance Request Workflow and Approval
*   **Description**: Any employee can raise a maintenance request for an asset. The request enters status `PENDING` and must be approved by an Asset Manager before repair work commences.
*   **Priority**: P0 – Mandatory
*   **Actor**: Employee, Asset Manager, Admin
*   **Trigger**: Employee submits request / Asset Manager approves.
*   **Preconditions**: 
    *   Asset exists.
    *   Asset status is not `RETIRED` or `DISPOSED`.
*   **Validation**: 
    *   Description and priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) must be provided.
*   **State Transition**: 
    *   `MaintenanceRequest` Status: `PENDING` $\rightarrow$ `APPROVED` | `REJECTED`.
*   **Permission**: 
    *   Raise request: Any authenticated employee.
    *   Approve/Reject: `ASSET_MANAGER` or `ADMIN`.
*   **Database Constraint**: Enum constraint on maintenance status.
*   **API Behaviour**: 
    *   `POST /api/maintenance` creates request with status `'PENDING'`.
    *   `PATCH /api/maintenance/:id/status` validates manager role and updates request status.
*   **UI Behaviour**: Employee submits request via a standard form. Asset Managers access the Maintenance Inbox, showing pending items with "Approve" and "Reject" actions.
*   **Error Messages**: 
    *   `UNAUTHORIZED_MAINTENANCE_APPROVER` (HTTP 403): "Only Asset Managers can approve maintenance requests."
*   **Audit Log**: "Maintenance request [ID] for Asset [Tag] approved/rejected by [ManagerEmail]."
*   **Notification**: Notify employee of decision: "Your maintenance request for asset [Tag] has been [Approved/Rejected]."
*   **Implementation Mapping**: 
    *   **Module**: `features/maintenance`
    *   **API Endpoint**: `POST /api/maintenance`, `PATCH /api/maintenance/:id/status`
    *   **Database Entity**: `MaintenanceRequest`
    *   **UI Screen**: `/maintenance`
*   **Test Cases**: 
    *   Verify an employee cannot approve their own maintenance request (assert HTTP 403).
*   **Edge Cases**: Submitting duplicate maintenance requests for an asset already undergoing maintenance. Decision: Block submission if active request exists.

---

#### BR-MAINT-02: Maintenance Asset State Synchronisation
*   **Rule ID**: BR-MAINT-02
*   **Name**: Maintenance Asset State Synchronisation
*   **Description**: Approving a maintenance request transitions the asset's status to `UNDER_MAINTENANCE` and terminates any active allocations. Resolving the request reverts the asset to `AVAILABLE`.
*   **Priority**: P0 – Mandatory
*   **Actor**: System, Asset Manager
*   **Trigger**: Approval or resolution of a maintenance request.
*   **Preconditions**: Request status transition.
*   **Validation**: None.
*   **State Transition**: 
    *   On Approval: Asset Status $\rightarrow$ `UNDER_MAINTENANCE` (Old active allocation `returnedAt` set to current time, check-in notes: "Auto-returned: Maintenance").
    *   On Resolution: Asset Status $\rightarrow$ `AVAILABLE`.
*   **Permission**: Enforced through maintenance endpoints.
*   **Database Constraint**: None.
*   **API Behaviour**: Updates both the request and asset tables inside a database transaction to ensure synchronization.
*   **UI Behaviour**: The asset's badge updates to "Under Maintenance" (orange). All allocation and booking buttons for the asset are disabled.
*   **Error Messages**: None.
*   **Audit Log**: "Asset [Tag] transitioned to [Status] following maintenance action."
*   **Notification**: Notify the employee who was holding the asset that it was returned due to maintenance.
*   **Implementation Mapping**: 
    *   **Module**: `features/maintenance`
    *   **API Endpoint**: `PATCH /api/maintenance/:id/status`, `POST /api/maintenance/:id/resolve`
    *   **Database Entity**: `MaintenanceRequest`, `Asset`, `Allocation`
    *   **UI Screen**: `/maintenance`, `/assets`
*   **Test Cases**: 
    *   Approve request; verify asset status in DB is `UNDER_MAINTENANCE` and active allocation is closed.
*   **Edge Cases**: The asset has upcoming bookings. Decision: The system cancels upcoming bookings within the expected maintenance window and notifies users.

---

#### BR-MAINT-03: Maintenance Assignment and History Tracking
*   **Rule ID**: BR-MAINT-03
*   **Name**: Maintenance Assignment and History Tracking
*   **Description**: Asset Managers can assign a technician (Employee) to approved maintenance requests. Complete maintenance history is retained per asset.
*   **Priority**: P1 – Important
*   **Actor**: Asset Manager, Admin
*   **Trigger**: Assigning a technician to a maintenance task.
*   **Preconditions**: 
    *   Maintenance request is `APPROVED`.
    *   Technician is an active employee.
*   **Validation**: Technician ID exists and is active.
*   **State Transition**: `APPROVED` $\rightarrow$ `ASSIGNED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED`.
*   **Permission**: Role `ASSET_MANAGER` or `ADMIN`.
*   **Database Constraint**: Foreign key `assignedToId` referencing `Employee(id)`.
*   **API Behaviour**: `PATCH /api/maintenance/:id/assign` sets the technician ID and updates status to `ASSIGNED`.
*   **UI Behaviour**: Shows assignment select field on the maintenance request details modal.
*   **Error Messages**: 
    *   `INVALID_TECHNICIAN` (HTTP 400): "Selected technician is not active or does not exist."
*   **Audit Log**: "Maintenance request [ID] assigned to [TechEmail] by Manager [Email]."
*   **Notification**: Sends notifications to the assigned technician.
*   **Implementation Mapping**: 
    *   **Module**: `features/maintenance`
    *   **API Endpoint**: `PATCH /api/maintenance/:id/assign`
    *   **Database Entity**: `MaintenanceRequest`
    *   **UI Screen**: `/maintenance`
*   **Test Cases**: 
    *   Assign maintenance to an inactive employee; verify rejection.
*   **Edge Cases**: Technician reassignment. Reassigning updates the technician field and writes a log to the maintenance history notes.

---

### Category G: Asset Audit Cycles

#### BR-AUDIT-01: Audit Cycle Scope and Auditor Assignment
*   **Rule ID**: BR-AUDIT-01
*   **Name**: Audit Cycle Scope and Auditor Assignment
*   **Description**: Only Administrators can initiate an Audit Cycle. The cycle defines a scope (departments and locations) and assigns auditors (Employees) to execute the verification.
*   **Priority**: P0 – Mandatory
*   **Actor**: Admin
*   **Trigger**: Submitting the "Start Audit Cycle" form.
*   **Preconditions**: 
    *   Departments and locations in scope exist and are active.
    *   Auditors are active employees.
*   **Validation**: 
    *   End date is in the future.
    *   At least one auditor is assigned.
*   **State Transition**: `[*]` $\rightarrow$ `ACTIVE`.
*   **Permission**: Role `ADMIN`.
*   **Database Constraint**: Joins on `AuditAuditor` table.
*   **API Behaviour**: `POST /api/audits` inserts an `AuditCycle` with status `'ACTIVE'` and creates Auditor linkages in the database.
*   **UI Behaviour**: Admin dashboard displays the setup screen with inputs for department scope, location filter, end date, and search/add for auditors.
*   **Error Messages**: 
    *   `MISSING_AUDITORS` (HTTP 400): "You must assign at least one auditor to the cycle."
*   **Audit Log**: "Audit Cycle [ID] created for [Scope] by Admin [Email]."
*   **Notification**: Notify all assigned auditors: "You have been assigned to Audit Cycle [ID]."
*   **Implementation Mapping**: 
    *   **Module**: `features/audit`
    *   **API Endpoint**: `POST /api/audits`
    *   **Database Entity**: `AuditCycle`, `AuditAuditor`
    *   **UI Screen**: `/audits/new`
*   **Test Cases**: 
    *   Create an audit cycle with end date in the past; assert HTTP 400.
*   **Edge Cases**: Deactivating an employee who is an active auditor. Decision: Block deactivation of employees assigned to any active audit cycle.

---

#### BR-AUDIT-02: Audit Discrepancy Generation
*   **Rule ID**: BR-AUDIT-02
*   **Name**: Audit Discrepancy Generation
*   **Description**: During an active cycle, assigned auditors evaluate assets. If an asset is marked as `MISSING` or `DAMAGED`, the system flags it and includes it in the Discrepancy Report.
*   **Priority**: P0 – Mandatory
*   **Actor**: Auditor (Assigned Employee)
*   **Trigger**: Auditor submits status check for an asset.
*   **Preconditions**: 
    *   Audit Cycle status is `ACTIVE`.
    *   Actor is an assigned auditor for that cycle.
*   **Validation**: 
    *   Asset is within the cycle's defined scope.
    *   Verification status must be: `VERIFIED`, `MISSING`, or `DAMAGED`.
*   **State Transition**: None (Asset status is unchanged until cycle closes; Audit item status changes).
*   **Permission**: Checked against `AuditAuditor` mapping.
*   **Database Constraint**: Unique constraint on `AuditItem(auditCycleId, assetId)`.
*   **API Behaviour**: `POST /api/audits/:id/items` inserts or updates the check record. If marked `MISSING` or `DAMAGED`, sets `isDiscrepancy = true` and saves notes.
*   **UI Behaviour**: Auditor mobile-responsive dashboard lists assets in scope. Displays actions: "Verify", "Flag Damaged", "Flag Missing". Opens notes popup for discrepancies.
*   **Error Messages**: 
    *   `UNAUTHORIZED_AUDITOR` (HTTP 403): "You are not assigned as an auditor for this cycle."
*   **Audit Log**: "Asset [Tag] marked [Status] during Audit [CycleID] by [AuditorEmail]."
*   **Notification**: Real-time alerts visible to Asset Managers if discrepancies are flagged.
*   **Implementation Mapping**: 
    *   **Module**: `features/audit`
    *   **API Endpoint**: `POST /api/audits/:id/items`
    *   **Database Entity**: `AuditCycle`, `AuditItem`
    *   **UI Screen**: `/audits/:id`
*   **Test Cases**: 
    *   Log in as non-assigned employee; attempt to submit check data; verify HTTP 403.
*   **Edge Cases**: Multiple auditors review the same asset. The unique constraint ensures the last check updates the status, saving history.

---

#### BR-AUDIT-03: Close Cycle State Transitions
*   **Rule ID**: BR-AUDIT-03
*   **Name**: Close Cycle State Transitions (Missing $\rightarrow$ Lost)
*   **Description**: Closing an audit cycle locks the records. Assets flagged as `MISSING` automatically transition to status `LOST` in the database.
*   **Priority**: P0 – Mandatory
*   **Actor**: Admin
*   **Trigger**: Admin clicks "Close Audit Cycle".
*   **Preconditions**: 
    *   Audit cycle status is `ACTIVE`.
*   **Validation**: Verify that the cycle has not already been closed.
*   **State Transition**: 
    *   `AuditCycle` Status: `ACTIVE` $\rightarrow$ `CLOSED`.
    *   Asset Status: `AVAILABLE` | `ALLOCATED` $\rightarrow$ `LOST` (for missing items).
*   **Permission**: Role `ADMIN`.
*   **Database Constraint**: None.
*   **API Behaviour**: `POST /api/audits/:id/close` updates the cycle status to `CLOSED`, locks items from edits, queries all items marked `MISSING`, and transitions their asset records to `LOST` inside a transaction.
*   **UI Behaviour**: Admin clicks "Close Cycle". System displays a warning modal listing discrepancies. Confirming locks the dashboard view.
*   **Error Messages**: 
    *   `AUDIT_CYCLE_CLOSED` (HTTP 400): "This audit cycle is already closed."
*   **Audit Log**: "Audit Cycle [ID] closed by Admin [Email]. Discrepancy report archived."
*   **Notification**: Generates notification for Asset Manager: "Audit Cycle [ID] closed. [Count] assets marked as LOST."
*   **Implementation Mapping**: 
    *   **Module**: `features/audit`
    *   **API Endpoint**: `POST /api/audits/:id/close`
    *   **Database Entity**: `AuditCycle`, `AuditItem`, `Asset`
    *   **UI Screen**: `/audits/:id`
*   **Test Cases**: 
    *   Submit close request; verify that assets marked as `MISSING` have their status changed to `LOST` in the database.
*   **Edge Cases**: A lost asset is found. Decision: Scanning or updating the asset tag in the registry transitions the status from `LOST` to `AVAILABLE`, generating a recovery audit log.

---

#### BR-AUDIT-04: Audit Discrepancy Resolution Protocol
*   **Rule ID**: BR-AUDIT-04
*   **Name**: Audit Discrepancy Resolution Protocol
*   **Description**: All audit discrepancies (missing/damaged assets) must be resolved by an Asset Manager. The manager selects a resolution action: `CREATE_MAINTENANCE`, `REWRITE_OFF` (Disposed), or `RECONCILED` (Found).
*   **Priority**: P1 – Important
*   **Actor**: Asset Manager, Admin
*   **Trigger**: Manager submits discrepancy resolution form.
*   **Preconditions**: 
    *   Audit cycle is `CLOSED`.
    *   Discrepancy is currently unresolved.
*   **Validation**: Action is one of: `CREATE_MAINTENANCE`, `REWRITE_OFF`, `RECONCILED`.
*   **State Transition**: 
    *   Asset Status: `LOST` $\rightarrow$ `AVAILABLE` (if reconciled), or `AVAILABLE` $\rightarrow$ `UNDER_MAINTENANCE` (if maintenance is initiated), or `AVAILABLE` $\rightarrow$ `DISPOSED` (if written off).
*   **Permission**: Role `ASSET_MANAGER` or `ADMIN`.
*   **Database Constraint**: None.
*   **API Behaviour**: `POST /api/audits/discrepancies/:itemId/resolve` writes the resolution to the DB, updates the item's status, and executes the associated asset status updates.
*   **UI Behaviour**: Displays "Discrepancy Inbox" for managers. Each item row offers a "Resolve" button which displays a modal with resolution choices.
*   **Error Messages**: 
    *   `UNAUTHORIZED_RESOLUTION` (HTTP 403): "Only Asset Managers can resolve discrepancies."
*   **Audit Log**: "Discrepancy for Asset [Tag] resolved as [Action] by Manager [Email]."
*   **Notification**: None.
*   **Implementation Mapping**: 
    *   **Module**: `features/audit`
    *   **API Endpoint**: `POST /api/audits/discrepancies/:itemId/resolve`
    *   **Database Entity**: `AuditItem`, `Asset`
    *   **UI Screen**: `/reports` (Discrepancy Section)
*   **Test Cases**: 
    *   Submit a resolution of `REWRITE_OFF` for a missing asset; verify its status transitions to `DISPOSED` in the database.
*   **Edge Cases**: Attempting to resolve discrepancies before the audit cycle is closed is blocked.

---

#### BR-AUDIT-05: Asset Audit Lockout Mode
*   **Rule ID**: BR-AUDIT-05
*   **Name**: Asset Audit Lockout Mode
*   **Description**: While an asset is part of an active audit cycle scope, it is locked. Deleting, decommissioning, or editing its details is blocked to maintain audit integrity.
*   **Priority**: P1 – Important
*   **Actor**: System, Asset Manager
*   **Trigger**: Attempting to edit, delete, or decommission an asset.
*   **Preconditions**: 
    *   Asset department/location falls under an active audit cycle's scope.
*   **Validation**: 
    *   System checks if an active audit cycle contains the asset's location or department.
*   **State Transition**: None.
*   **Permission**: Enforced system-wide.
*   **Database Constraint**: None.
*   **API Behaviour**: `PUT /api/assets/:id` and `DELETE /api/assets/:id` query active audit scopes. If found, returns HTTP 400.
*   **UI Behaviour**: Edit buttons are disabled in the Asset Directory and Detail view, displaying a tooltip: "Asset is locked due to active audit."
*   **Error Messages**: 
    *   `ASSET_LOCKED_IN_AUDIT` (HTTP 400): "This asset cannot be modified because it is currently undergoing an active audit."
*   **Audit Log**: None.
*   **Notification**: None.
*   **Implementation Mapping**: 
    *   **Module**: `features/assets`
    *   **API Endpoint**: `PUT /api/assets/:id`, `DELETE /api/assets/:id`
    *   **Database Entity**: `Asset`, `AuditCycle`
    *   **UI Screen**: `/assets/:id`
*   **Test Cases**: 
    *   Start audit cycle for Department A. Try to edit a laptop's department assigned to Department A; verify HTTP 400 block.
*   **Edge Cases**: Critical repairs needed. Asset Managers can bypass the lockout exclusively by raising a maintenance request.

---

### Category H: Activity Logs & Notifications

#### BR-NOTIF-01: Real-time Notification Generation
*   **Rule ID**: BR-NOTIF-01
*   **Name**: Real-time Notification Generation
*   **Description**: System events (allocations, transfers, maintenance updates, booking warnings) must generate notifications. Users can view and mark notifications as read.
*   **Priority**: P1 – Important
*   **Actor**: System, User
*   **Trigger**: Triggered by database status changes or scheduled tasks.
*   **Preconditions**: Target user is active.
*   **Validation**: Notification contains message, type, and target redirect route.
*   **State Transition**: Notification: `UNREAD` $\rightarrow$ `READ`.
*   **Permission**: Users can read and update only their own notifications.
*   **Database Constraint**: None.
*   **API Behaviour**: 
    *   Events write records into the `Notification` table.
    *   `GET /api/notifications` returns user notifications.
    *   `PATCH /api/notifications/:id/read` updates status.
*   **UI Behaviour**: Header displays a notification bell showing unread count. Clicking displays a list. Clicking an item redirects to the asset/booking details screen and marks it as read.
*   **Error Messages**: None.
*   **Audit Log**: None.
*   **Notification**: Notification is created.
*   **Implementation Mapping**: 
    *   **Module**: `features/notifications`
    *   **API Endpoint**: `GET /api/notifications`, `PATCH /api/notifications/:id/read`
    *   **Database Entity**: `Notification`
    *   **UI Screen**: Header component, `/notifications`
*   **Test Cases**: 
    *   Allocate asset to Employee A; verify database table `Notification` contains a new unread notification for Employee A.
*   **Edge Cases**: Offline users. Notifications are persisted in the database and loaded upon next login or connection.

---

#### BR-NOTIF-02: Mutation Auditing
*   **Rule ID**: BR-NOTIF-02
*   **Name**: Mutation Auditing (Who did what, when)
*   **Description**: Every database mutation (insert, update, delete) on core tables must be logged in a read-only `AuditLog` table capturing actor, action, payload change diff, timestamp, and IP address.
*   **Priority**: P0 – Mandatory
*   **Actor**: System
*   **Trigger**: Pre-commit hooks or database update operations.
*   **Preconditions**: User session exists (except for system cron actions).
*   **Validation**: None.
*   **State Transition**: None.
*   **Permission**: Reads are restricted to `ADMIN`. Writes are system-only.
*   **Database Constraint**: No update or delete operations are permitted on `AuditLog` records (enforced via database credentials or trigger definitions).
*   **API Behaviour**: Operations wrap data queries with log writes. `GET /api/admin/audit-logs` returns paginated query history.
*   **UI Behaviour**: Admin dashboard displays the system audit history logs. Allows sorting and filtering by user, date, action type, and target entity.
*   **Error Messages**: None.
*   **Audit Log**: Writes to `AuditLog`.
*   **Implementation Mapping**: 
    *   **Module**: `features/notifications`
    *   **API Endpoint**: `GET /api/admin/audit-logs`
    *   **Database Entity**: `AuditLog`
    *   **UI Screen**: `/admin/logs`
*   **Test Cases**: 
    *   Perform an asset edit; query database table `AuditLog` to confirm the action, editor ID, and updated fields are logged.
*   **Edge Cases**: Logging failures. If the audit log save operation fails, the parent transaction must roll back, ensuring database consistency.

---

## 2. Business Rule Matrix

This matrix maps each business rule to its implementation target areas, ensuring traceability.

| Rule ID | Priority | Module | Target API Endpoints | UI Screens | DB Entities |
|---|---|---|---|---|---|
| **BR-AUTH-01** | P0 | `features/auth` | `POST /api/auth/signup` | `/signup` | `Employee` |
| **BR-AUTH-02** | P0 | `features/admin` | `PATCH /api/admin/employees/:id/role` | `/admin/org-setup` | `Employee` |
| **BR-AUTH-03** | P0 | `features/auth` | All Endpoints (Middleware) | All Screens | None |
| **BR-ORG-01** | P0 | `features/admin` | `POST/PUT /api/admin/departments` | `/admin/org-setup` | `Department` |
| **BR-ORG-02** | P0 | `features/admin` | `PATCH /api/admin/departments/:id/status` | `/admin/org-setup` | `Department`, `Employee`, `Allocation` |
| **BR-ORG-03** | P0 | `features/admin` | `PATCH /api/admin/employees/:id/status` | `/admin/org-setup` | `Employee`, `Allocation`, `Booking` |
| **BR-ORG-04** | P1 | `features/admin` | `POST/PUT /api/admin/categories` | `/admin/org-setup` | `AssetCategory` |
| **BR-ASSET-01**| P0 | `features/assets` | `POST /api/assets` | `/assets/new` | `Asset` |
| **BR-ASSET-02**| P0 | `features/assets` | Indirect (State updates) | All Asset Screens | `Asset` |
| **BR-ASSET-03**| P0 | `features/assets` | `POST /api/assets/:id/decommission` | `/assets/:id` | `Asset` |
| **BR-ASSET-04**| P1 | `features/assets` | `POST/PUT /api/assets` | `/assets/new`, `/assets/:id/edit` | `Asset`, `AssetCategory` |
| **BR-ASSET-05**| P0 | `features/booking`| `POST /api/bookings` | `/bookings` | `Asset`, `Booking` |
| **BR-ALLOC-01**| P0 | `features/allocation` | `POST /api/allocations` | `/allocations` | `Allocation`, `Asset` |
| **BR-ALLOC-02**| P0 | `features/allocation` | `POST /api/allocations/transfer` | `/allocations` | `TransferRequest`, `Allocation` |
| **BR-ALLOC-03**| P0 | `features/allocation` | `POST /api/allocations/transfer/:id/approve` | `/allocations` | `TransferRequest`, `Allocation`, `Asset` |
| **BR-ALLOC-04**| P0 | `features/allocation` | `POST /api/allocations/:id/return` | `/allocations` | `Allocation`, `Asset` |
| **BR-ALLOC-05**| P0 | `features/allocation` | `GET /api/allocations/overdue` | `/dashboard`, `/allocations` | `Allocation`, `Asset` |
| **BR-BOOK-01** | P0 | `features/booking`| `POST /api/bookings` | `/bookings` | `Booking`, `Asset` |
| **BR-BOOK-02** | P0 | `features/booking`| `DELETE /api/bookings/:id` | `/bookings` | `Booking` |
| **BR-BOOK-03** | P1 | `features/booking`| `POST /api/bookings` | `/bookings` | `Booking` |
| **BR-MAINT-01**| P0 | `features/maintenance`| `POST /api/maintenance`, `PATCH /api/maintenance/:id/status` | `/maintenance` | `MaintenanceRequest` |
| **BR-MAINT-02**| P0 | `features/maintenance`| `PATCH /api/maintenance/:id/status`, `POST /api/maintenance/:id/resolve` | `/maintenance`, `/assets` | `MaintenanceRequest`, `Asset` |
| **BR-MAINT-03**| P1 | `features/maintenance`| `PATCH /api/maintenance/:id/assign` | `/maintenance` | `MaintenanceRequest` |
| **BR-AUDIT-01**| P0 | `features/audit` | `POST /api/audits` | `/audits/new` | `AuditCycle`, `AuditAuditor` |
| **BR-AUDIT-02**| P0 | `features/audit` | `POST /api/audits/:id/items` | `/audits/:id` | `AuditCycle`, `AuditItem` |
| **BR-AUDIT-03**| P0 | `features/audit` | `POST /api/audits/:id/close` | `/audits/:id` | `AuditCycle`, `AuditItem`, `Asset` |
| **BR-AUDIT-04**| P1 | `features/audit` | `POST /api/audits/discrepancies/:itemId/resolve` | `/reports` | `AuditItem`, `Asset` |
| **BR-AUDIT-05**| P1 | `features/assets` | `PUT/DELETE /api/assets/:id` | `/assets/:id` | `Asset`, `AuditCycle` |
| **BR-NOTIF-01**| P1 | `features/notifications`| `GET /api/notifications`, `PATCH /api/notifications/:id/read` | `/notifications`, Header | `Notification` |
| **BR-NOTIF-02**| P0 | `features/notifications`| `GET /api/admin/audit-logs` | `/admin/logs` | `AuditLog` |

---

## 3. Validation Matrix

This matrix establishes field validations, types, validation regexes, and database indexes.

| Entity | Field | Type / Constraint | Validation Regex / Rules | HTTP Status | Database Index |
|---|---|---|---|---|---|
| **Employee** | `email` | String, Unique, Required | `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$` | 400 Bad Request | Unique Index |
| **Employee** | `password` | String, Hash, Required | Length $\ge 8$, $\ge 1$ number, $\ge 1$ spec character | 400 Bad Request | None |
| **Employee** | `role` | Enum, Required | One of: `ADMIN`, `ASSET_MANAGER`, `DEPT_HEAD`, `EMPLOYEE` | 400 Bad Request | Index |
| **Employee** | `status` | Enum, Required | One of: `ACTIVE`, `INACTIVE` | 400 Bad Request | Index |
| **Department**| `name` | String, Unique, Required | Length $3 \rightarrow 100$ characters | 400 Bad Request | Unique Index |
| **Department**| `parentId` | String, Optional | Must not create cycles, must exist if provided | 400 Bad Request | Index |
| **AssetCategory**| `name` | String, Unique, Required | Length $2 \rightarrow 50$ characters | 400 Bad Request | Unique Index |
| **Asset** | `assetTag` | String, Unique, Required | `^AF-\d{4,}$` (System-generated) | 400 Bad Request | Unique Index |
| **Asset** | `status` | Enum, Required | `AVAILABLE`, `ALLOCATED`, `RESERVED`, `UNDER_MAINTENANCE`, `LOST`, `RETIRED`, `DISPOSED` | 400 Bad Request | Index |
| **Asset** | `metadata` | JSONB, Optional | Verified against `AssetCategory.customFieldsSchema` | 400 Bad Request | Gin Index |
| **Allocation** | `assetId` | String, Required | Must reference active Available asset | 400 Bad Request | Index |
| **Allocation** | `returnedAt` | DateTime, Optional | Must be null on creation; $\ge$ creation time | 400 Bad Request | Partial Index where null |
| **Booking** | `startTime` | DateTime, Required | In future; StartTime < EndTime | 400 Bad Request | Index |
| **Booking** | `endTime` | DateTime, Required | In future; EndTime - StartTime $\ge 15$ mins | 400 Bad Request | Index |
| **Booking** | `status` | Enum, Required | `UPCOMING`, `ONGOING`, `COMPLETED`, `CANCELLED` | 400 Bad Request | Index |
| **MaintenanceRequest** | `priority` | Enum, Required | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | 400 Bad Request | Index |
| **MaintenanceRequest** | `status` | Enum, Required | `PENDING`, `APPROVED`, `REJECTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED` | 400 Bad Request | Index |
| **AuditCycle**| `status` | Enum, Required | `ACTIVE`, `CLOSED` | 400 Bad Request | Index |
| **AuditItem** | `verificationStatus`| Enum, Required | `VERIFIED`, `MISSING`, `DAMAGED` | 400 Bad Request | Unique (Cycle, Asset) |

---

## 4. Permission Matrix

This matrix defines CRUD access level permissions for roles on resources.

| Resource / Action | Admin | Asset Manager | Department Head | Employee |
|---|---|---|---|---|
| **Organization Setup** | Create, Read, Update, Delete | Read Only | Read Only | None |
| **Employee Directory** | Edit Roles / Status | Read Only | Read Only | None |
| **Asset Categories** | Create, Read, Update, Delete | Read Only | Read Only | None |
| **Register Asset** | Yes | Yes | No | No |
| **Edit/Decommission Asset** | Yes | Yes | No | No |
| **View Asset Directory** | Yes | Yes | Yes (Dept Scope) | Yes (Self Scope) |
| **Allocate Asset** | Yes | Yes | No | No |
| **Approve Transfers** | Yes | Yes | Yes (Dept Scope) | No |
| **Request Allocation** | Yes | Yes | Yes | Yes |
| **Book Resources** | Yes | Yes | Yes (Dept Scope) | Yes (Self Scope) |
| **Cancel Booking** | Yes | Yes | Yes (Dept Scope) | Yes (Owner Only) |
| **Approve Maintenance**| Yes | Yes | No | No |
| **Raise Maintenance** | Yes | Yes | Yes | Yes |
| **Create Audit Cycle** | Yes | No | No | No |
| **Execute Audit Item** | Yes (If Auditor) | Yes (If Auditor) | Yes (If Auditor) | Yes (If Auditor) |
| **Close Audit Cycle** | Yes | No | No | No |
| **Resolve Discrepancy**| Yes | Yes | No | No |
| **View Activity Logs** | Yes | No | No | No |
| **Read Notifications** | Yes (Self) | Yes (Self) | Yes (Self) | Yes (Self) |

---

## 5. State Transition Matrix

This matrix details state changes for assets and bookings, outlining triggers, preconditions, and side effects.

### Asset State Transitions

| From State | Triggering Action | Preconditions | To State | Side Effects |
|---|---|---|---|---|
| `[*]` | Asset Registration | Categories & details valid | `AVAILABLE` | Auto-assigns tag `AF-XXXX` |
| `AVAILABLE` | Allocate Asset | Target user/dept active | `ALLOCATED` | Creates `Allocation` record |
| `AVAILABLE` | Book Slot Start | Time window opens | `RESERVED` | Updates active booking state |
| `RESERVED` | Book Slot End | Time window closes | `AVAILABLE` | Marks booking as completed |
| `AVAILABLE` | Approve Maintenance | Manager approval | `UNDER_MAINTENANCE` | Links request to asset |
| `ALLOCATED` | Approve Maintenance | Manager approval | `UNDER_MAINTENANCE` | Closes active allocation |
| `ALLOCATED` | Return Asset | Manager return submit | `AVAILABLE` | Updates condition rating |
| `ALLOCATED` | Close Audit Cycle | Asset was marked MISSING | `LOST` | Generates discrepancy alert |
| `AVAILABLE` | Close Audit Cycle | Asset was marked MISSING | `LOST` | Generates discrepancy alert |
| `LOST` | Reconcile Discrepancy | Manager finds asset | `AVAILABLE` | Logs discrepancy resolution |
| `LOST` | Write-off Discrepancy | Manager retires asset | `DISPOSED` | Deletes future bookings |
| `AVAILABLE` | Decommission Asset | Manager retired confirm | `RETIRED` | Deletes future bookings |
| `AVAILABLE` | Decommission Asset | Manager scrap confirm | `DISPOSED` | Deletes future bookings |
| `UNDER_MAINTENANCE` | Resolve Request | Repair completed | `AVAILABLE` | Maintenance log archived |

---

## 6. Business Event Matrix

This matrix maps functional events to triggers, parameters, and notifications.

| Event Name | Triggering Action | Event Payload Parameters | Notification Recipients | Notification Channel / Content |
|---|---|---|---|---|
| `UserRegistered` | Visitor signs up | `employeeId`, `email`, `name` | Admin | Internal Dashboard: "New Employee [Name] registered." |
| `AssetRegistered`| Asset registered | `assetId`, `assetTag`, `managerId` | None | None |
| `AssetAllocated` | Asset allocation | `allocationId`, `assetId`, `employeeId` | Recipient Employee | Push/In-app: "Asset [Tag] has been allocated to you." |
| `TransferRequested` | Allocation transfer | `transferId`, `assetId`, `requestorId`, `holderId` | Current Holder, Approver | Push/In-app: "[Name] requested transfer of Asset [Tag]." |
| `TransferApproved` | Transfer approved | `transferId`, `assetId`, `newHolderId` | Old Holder, New Holder | Push/In-app: "Transfer approved. Asset [Tag] allocation active." |
| `BookingReminder`| 15m before start | `bookingId`, `assetId`, `employeeId` | Booker | Push/In-app: "Reminder: Your booking for [Asset] starts in 15 mins." |
| `MaintenanceRaised`| Request submitted | `requestId`, `assetId`, `employeeId` | Asset Managers | Push/In-app: "New maintenance request raised for Asset [Tag]." |
| `MaintenanceApproved`| Request approved | `requestId`, `assetId`, `technicianId` | Requestor, Technician | Push/In-app: "Maintenance request for [Tag] approved." |
| `AuditCycleCreated`| Audit cycle start | `auditCycleId`, `auditorIds` | Assigned Auditors | Push/In-app: "You are assigned to Audit Cycle [Scope]." |
| `AuditDiscrepancy` | Missing/Damaged item | `itemId`, `cycleId`, `assetId` | Asset Managers | Dashboard Alert: "Discrepancy flagged for Asset [Tag]." |
| `AuditCycleClosed`| Cycle finalized | `auditCycleId` | Asset Managers, Admin | Push/In-app: "Audit Cycle closed. [Count] items marked as LOST." |
| `DiscrepancyResolved`| Manager resolves | `itemId`, `resolutionAction` | None | None |
