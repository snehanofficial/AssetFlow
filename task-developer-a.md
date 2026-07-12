# AssetFlow – Developer A Task File
## Implementation Contract: Asset Directory, Allocations, Returns, Transfers & Lifecycle

This document serves as the official implementation contract for Developer A. It contains the exact specifications, business rules, API designs, files expected, and detailed checklists for all tasks owned by Developer A.

---

## 1. Requirement Traceability & Task Index

| Req ID | Screen / Feature | Current Status | Objective |
|---|---|---|---|
| **REQ-AST-01** | Asset Registration Form | 🟥 Not Implemented | Create form to register new assets, with dynamic custom fields based on category schemas and image uploads. |
| **REQ-AST-02** | Asset Directory Grid | 🟥 Not Implemented | Searchable, paginated datatable of assets with filters for status, category, location, and department. |
| **REQ-AST-03** | Asset Lifecycle States | 🟥 Not Implemented | Restrict asset updates to valid state transitions and handle status auto-updates. |
| **REQ-AST-04** | Asset History & Timeline | 🟥 Not Implemented | Display chronological audit timeline of allocations, transfers, and maintenance inside Asset Details. |
| **REQ-AST-05** | QR & Barcode Generation | 🟥 Not Implemented | Generate dynamic QR codes containing asset tags, and display them in details for scanning. |
| **REQ-ALC-01** | Asset Allocation | 🟥 Not Implemented | Allocate available assets to employees. Enforce conflict rules (block double-allocation) and auto-calculate overdue returns. |
| **REQ-ALC-02** | Asset Transfer Workflow | 🟥 Not Implemented | Request transfer of an asset to another employee. Route to Department Head / Asset Manager for approval. |
| **REQ-ALC-03** | Asset Return Workflow | 🟥 Not Implemented | Check-in returned assets. Require condition notes and update status back to Available. |
| **REQ-EMP-01** | Employee Deletion Protection | 🟨 Partially Implemented | Block deletion/deactivation of employees who currently hold active asset allocations. |

---

## 2. Requirement Details & Implementation Specs

### REQ-AST-01: Asset Registration Form
- **Requirement ID**: REQ-AST-01
- **Specification Reference**: Screen 4 (Asset Registration)
- **Current Status**: 🟥 Not Implemented
- **Objective**: Create the asset registration view, enabling Asset Managers to input core details, select categories, dynamically render custom category-specific attributes, and upload photos.
- **Actors**: `ADMIN`, `ASSET_MANAGER`
- **Dependencies**: Tab B (Asset Category Management) for dynamic fields, Storage Service for uploads.
- **Preconditions**: Category exists in the system.
- **Workflow**:
  1. Actor clicks "+ Register Asset" on directory page.
  2. Actor fills out name, serial number, location, acquisition date, acquisition cost, condition, and isBookable (Shared) checkbox.
  3. Actor selects Category; form fetches category schema and dynamically appends custom input fields (string/number/boolean).
  4. Actor uploads optional asset photo (uploaded via storage service).
  5. Form validates and submits payload to `/api/v1/assets`.
  6. Backend generates unique Asset Tag (`AF-{XXXX}`), saves asset with state `AVAILABLE`.
- **Business Rules**:
  - Asset Tag must be auto-generated sequentially or using a unique random sequence matching pattern `AF-\d{4,}`.
  - Serial Number must be globally unique.
- **Validation Rules**:
  - Name, Category, Serial Number, Condition, Location, and Acquisition Date are required.
  - Custom fields marked `required: true` in the category schema must be filled and validated according to their type.
- **Edge Cases**:
  - Duplicating a serial number returns a descriptive 400 error.
  - Uploading a file larger than 5MB or invalid format (non-image) is rejected.
- **Backend Tasks**:
  - Implement sequential tag generation helper.
  - Build validation schema matching core fields and Category schema structure.
  - Build endpoint `POST /api/v1/assets`.
- **Frontend Tasks**:
  - Build registration form using `react-hook-form` + `zod`.
  - Fetch categories and dynamically render custom inputs based on `customFieldsSchema`.
  - Wire up file input for uploading photo via Multipart Form Data.
- **Database Changes**: None (already covered by `Asset` model).
- **API Changes**:
  - `POST /api/v1/assets`
    - Request Body: `{ name, categoryId, serialNumber, location, acquisitionDate, acquisitionCost?, condition, isBookable, customFields: {}, photo? }`
    - Response: `{ success: true, data: Asset }`
- **Files Expected**:
  - `server/features/assets/asset.service.js`
  - `server/features/assets/asset.validators.js`
  - `client/src/features/assets/AssetRegisterForm.jsx`

---

### REQ-AST-02: Asset Directory Grid
- **Requirement ID**: REQ-AST-02
- **Specification Reference**: Screen 4 (Asset Directory)
- **Current Status**: 🟥 Not Implemented
- **Objective**: Display a paginated, filterable grid of all assets.
- **Actors**: `ADMIN`, `ASSET_MANAGER` (Full view/actions), `DEPT_HEAD` (Department assets), `EMPLOYEE` (View allocations).
- **Dependencies**: Category, Department models.
- **Preconditions**: Logged-in session.
- **Workflow**:
  1. User navigates to "/assets".
  2. System fetches page 1 of assets, respecting search keyword and filter criteria.
  3. User can search by Asset Tag, Serial Number, Name, Location.
  4. User can filter by Category, Status, Department.
  5. Datatable updates in real time using TanStack Query.
- **Business Rules**:
  - Employees only see assets allocated to them (handled under allocations page, but directory is restricted or filtered based on role. Employee role cannot view general asset directory; it is restricted to ADMIN, ASSET_MANAGER, and DEPT_HEAD. DEPT_HEAD can view assets allocated within their department).
- **Validation Rules**: None.
- **Edge Cases**:
  - Search query handles special characters safely.
- **Backend Tasks**:
  - Build query logic in `GET /api/v1/assets` handling pagination (`page`, `limit`), filters, and keyword search.
  - Restrict query results for DEPT_HEAD to assets currently allocated to employees of their department.
- **Frontend Tasks**:
  - Implement full assets table with custom status badges (Available = Green, Allocated = Blue, Under Maintenance = Yellow, Lost/Retired/Disposed = Gray/Red).
  - Add search bar and dropdown filter selectors.
  - Integrate paginator buttons.
- **Database Changes**: None.
- **API Changes**:
  - `GET /api/v1/assets`
    - Query Parameters: `page`, `limit`, `search`, `categoryId`, `status`, `departmentId`, `location`
    - Response: `{ success: true, data: { records: Asset[], total, page, limit } }`
- **Files Expected**:
  - `client/src/features/assets/AssetList.jsx` (Replace placeholder)

---

### REQ-AST-03: Asset Lifecycle States
- **Requirement ID**: REQ-AST-03
- **Specification Reference**: Screen 4 (Lifecycle States)
- **Current Status**: 🟥 Not Implemented
- **Objective**: Restrict state transitions for assets to enforce business lifecycle rules.
- **Actors**: System / Automatic workflows, `ASSET_MANAGER` (Manual changes)
- **Dependencies**: Database transaction handlers.
- **Preconditions**: Asset exists.
- **Workflow**:
  1. When state changes, backend intercepts and validates the transition.
  2. Allowable transitions:
     - `AVAILABLE` -> `ALLOCATED` (via Allocation)
     - `AVAILABLE` -> `RESERVED` (via Booking)
     - `AVAILABLE` -> `UNDER_MAINTENANCE` (via Maintenance)
     - `AVAILABLE` -> `LOST`, `RETIRED`, `DISPOSED`
     - `ALLOCATED` -> `AVAILABLE` (via Return)
     - `ALLOCATED` -> `LOST`
     - `UNDER_MAINTENANCE` -> `AVAILABLE` (on resolution)
     - `RESERVED` -> `AVAILABLE` (booking cancel/finish)
  3. Any invalid state changes must be blocked at DB / Service layer.
- **Business Rules**:
  - An asset cannot transition directly from `ALLOCATED` to `UNDER_MAINTENANCE` without first being returned, or from `UNDER_MAINTENANCE` directly to `ALLOCATED`.
- **Validation Rules**:
  - Validate state against `AssetStatus` enum.
- **Edge Cases**:
  - Attempting to allocate a `LOST` or `RETIRED` asset returns a 400 error.
- **Backend Tasks**:
  - Implement state transition validation utility.
  - Enforce transitions in `PUT /api/v1/assets/:id/status` and allocations/maintenance handlers.
- **Frontend Tasks**:
  - Disable inappropriate actions in UI according to current asset status.
- **Database Changes**: None.
- **API Changes**:
  - `PATCH /api/v1/assets/:id/status`
    - Request Body: `{ status }`
    - Response: `{ success: true, data: Asset }`
- **Files Expected**:
  - `server/features/assets/asset.lifecycle.js`

---

### REQ-AST-04: Asset History & Timeline
- **Requirement ID**: REQ-AST-04
- **Specification Reference**: Screen 4 (Asset Details Modal / View)
- **Current Status**: 🟥 Not Implemented
- **Objective**: Display a comprehensive audit log and historical chronological timeline of everything that happened to an asset (Allocations, Returns, Transfers, Repairs).
- **Actors**: `ADMIN`, `ASSET_MANAGER`, `DEPT_HEAD`
- **Dependencies**: `AssetAllocation`, `TransferRequest`, `MaintenanceRequest` tables.
- **Preconditions**: Asset exists.
- **Workflow**:
  1. Manager clicks on an asset's row in the directory.
  2. System opens Asset Details page/modal.
  3. Details page fetches asset attributes + historical timelines.
  4. Chronological feed of events displays (e.g. "June 5: Allocated to John Doe", "June 10: Transfer requested to Jane Smith", "June 12: Repaired by Tech Support").
- **Business Rules**: None.
- **Validation Rules**: None.
- **Edge Cases**:
  - Assets with no history display a friendly empty state: "No historical activity recorded yet."
- **Backend Tasks**:
  - Build `GET /api/v1/assets/:id` returning asset details joined with allocations (with employee name), maintenance requests, and transfer requests.
- **Frontend Tasks**:
  - Design a vertical timeline UI component with icons for each event type (User icon for allocation, Arrow for transfer, Wrench for maintenance).
- **Database Changes**: None.
- **API Changes**:
  - `GET /api/v1/assets/:id`
    - Response: `{ success: true, data: Asset & { category, allocations: [], maintenance: [], transferRequests: [] } }`
- **Files Expected**:
  - `client/src/features/assets/AssetDetails.jsx`

---

### REQ-AST-05: QR & Barcode Generation
- **Requirement ID**: REQ-AST-05
- **Specification Reference**: Screen 4 (Asset Registration & Details)
- **Current Status**: 🟥 Not Implemented
- **Objective**: Dynamically render QR codes for each asset containing its URL/tag to support scanning.
- **Actors**: `ADMIN`, `ASSET_MANAGER`
- **Dependencies**: Frontend QR code library (e.g. `qrcode.react` or simple API generator).
- **Preconditions**: Asset exists with a tag.
- **Workflow**:
  1. Open Asset Details.
  2. System renders QR Code image corresponding to the asset's URL or tag.
  3. Action to "Print Tag" download/opens the QR code print format.
- **Business Rules**: None.
- **Validation Rules**: None.
- **Edge Cases**: None.
- **Backend Tasks**: None (can be generated frontend-only).
- **Frontend Tasks**:
  - Integrate a standard lightweight React QR generator component.
  - Display the generated QR tag inside the Asset Details modal.
  - Create a "Print Label" window print layout.
- **Database Changes**: None.
- **API Changes**: None.
- **Files Expected**:
  - `client/src/features/assets/components/AssetQRTag.jsx`

---

### REQ-ALC-01: Asset Allocation
- **Requirement ID**: REQ-ALC-01
- **Specification Reference**: Screen 5 (Asset Allocation & Transfer)
- **Current Status**: 🟥 Not Implemented
- **Objective**: Allocate available assets to active employees. Auto-populate departments, handle return dates, prevent double-allocations, and flag overdue.
- **Actors**: `ADMIN`, `ASSET_MANAGER`, `DEPT_HEAD` (Only within their department)
- **Dependencies**: Asset, Employee models.
- **Preconditions**: Asset is `AVAILABLE`, Employee is `ACTIVE`.
- **Workflow**:
  1. Manager clicks "Allocate Asset".
  2. Form allows selecting an Asset and an Employee.
  3. Form auto-fills Employee's department.
  4. Manager enters optional "Expected Return Date".
  5. On submit, backend updates Asset status to `ALLOCATED` and inserts `AssetAllocation` record.
- **Business Rules**:
  - **Double Allocation Prevention**: If an asset is already allocated, block the request, returning "Asset currently held by [Employee Name]".
  - Expected Return Date must be in the future.
- **Validation Rules**:
  - Selected asset and employee must exist and be active.
- **Edge Cases**:
  - If a manager tries to allocate an asset already allocated, show a "Transfer Request" action shortcut instead of a generic error.
- **Backend Tasks**:
  - Build transaction-safe allocation handler in `POST /api/v1/allocations`.
  - Validate asset state is `AVAILABLE` before updating status.
  - Auto-flag overdue return date tasks (via cron or query calculations).
- **Frontend Tasks**:
  - Build allocation form using React Hook Form.
  - Provide auto-populated read-only fields for department.
  - Implement double allocation error handling presenting the Transfer option.
- **Database Changes**: None.
- **API Changes**:
  - `POST /api/v1/allocations`
    - Request Body: `{ assetId, employeeId, expectedReturnAt? }`
    - Response: `{ success: true, data: AssetAllocation }`
- **Files Expected**:
  - `server/features/allocation/allocation.validators.js`
  - `server/features/allocation/allocation.service.js`
  - `client/src/features/allocation/AllocationForm.jsx`

---

### REQ-ALC-02: Asset Transfer Workflow
- **Requirement ID**: REQ-ALC-02
- **Specification Reference**: Screen 5 (Asset Transfer)
- **Current Status**: 🟥 Not Implemented
- **Objective**: Initiate and route asset transfer requests from one employee to another, requiring authorization before final assignment.
- **Actors**: `EMPLOYEE` (Requesting), `DEPT_HEAD` (Approving within department), `ASSET_MANAGER` (Approving globally)
- **Dependencies**: `TransferRequest` model, Notifications system.
- **Preconditions**: Asset is currently `ALLOCATED` to another employee.
- **Workflow**:
  1. User tries to allocate/request an asset that is currently allocated to someone else.
  2. System shows "Request Transfer" action.
  3. User fills in target employee and reason for transfer.
  4. Backend creates `TransferRequest` in `PENDING` state.
  5. Notification is sent to Manager / Dept Head.
  6. Manager approves: Backend updates the current allocation to `RETURNED`, creates a new allocation for the target employee, updates asset holder, and sets request to `APPROVED`.
- **Business Rules**:
  - Transfer approval requires Asset Manager or target's Department Head clearance.
- **Validation Rules**:
  - Target employee must be active.
- **Edge Cases**:
  - Rejecting a transfer request sets status to `REJECTED` and requires optional reason. Asset remains with original holder.
- **Backend Tasks**:
  - Build `POST /api/v1/allocations/transfers` (create request).
  - Build `PATCH /api/v1/allocations/transfers/:id/approve` and `:id/reject`.
  - Wrap approval logic in database transaction (close old allocation + open new allocation + update asset).
- **Frontend Tasks**:
  - Create Transfer Request dialog.
  - Build Transfer Approvals inbox page for managers to review pending requests.
- **Database Changes**: None.
- **API Changes**:
  - `POST /api/v1/allocations/transfers`
    - Body: `{ assetId, targetEmployeeId, reason? }`
  - `PATCH /api/v1/allocations/transfers/:id/status`
    - Body: `{ status: 'APPROVED' | 'REJECTED', rejectReason? }`
- **Files Expected**:
  - `server/features/allocation/transfer.service.js`
  - `client/src/features/allocation/TransferInbox.jsx`

---

### REQ-ALC-03: Asset Return Workflow
- **Requirement ID**: REQ-ALC-03
- **Specification Reference**: Screen 5 (Asset Return)
- **Current Status**: 🟥 Not Implemented
- **Objective**: Register the return of an allocated asset, forcing condition checks and returning the asset to inventory.
- **Actors**: `ASSET_MANAGER`, `DEPT_HEAD`
- **Dependencies**: Asset, AssetAllocation models.
- **Preconditions**: Asset status is `ALLOCATED`.
- **Workflow**:
  1. Manager views active allocations.
  2. Manager clicks "Mark as Returned".
  3. Modal requests Return Condition (New/Good/Fair/Poor) and Return Notes.
  4. On submit, backend updates allocation to `RETURNED`, records returned timestamp, updates asset status to `AVAILABLE` (or `UNDER_MAINTENANCE` if condition is poor/damaged), and updates condition state.
- **Business Rules**:
  - Condition notes are mandatory for check-in.
- **Validation Rules**:
  - Return condition must be one of `AssetCondition` enum.
- **Edge Cases**:
  - N/A.
- **Backend Tasks**:
  - Build `POST /api/v1/allocations/:id/return` endpoint.
  - Enforce status changes and write return details.
- **Frontend Tasks**:
  - Build check-in modal.
  - Handle redirection and list refresh upon successful check-in.
- **Database Changes**: None.
- **API Changes**:
  - `POST /api/v1/allocations/:id/return`
    - Body: `{ returnCondition, returnNotes }`
    - Response: `{ success: true }`
- **Files Expected**:
  - `client/src/features/allocation/ReturnAssetModal.jsx`

---

### REQ-EMP-01: Employee Deletion Protection
- **Requirement ID**: REQ-EMP-01
- **Specification Reference**: Screen 3 (Employee Directory Tab)
- **Current Status**: 🟨 Partially Implemented (Missing allocation checks)
- **Objective**: Prevent administrative deactivation or soft deletion of employee records who currently have assets checked out to them.
- **Actors**: `ADMIN`
- **Dependencies**: `Employee`, `AssetAllocation` models.
- **Preconditions**: Admin attempts to deactivate/delete an employee.
- **Workflow**:
  1. Admin clicks "Deactivate" or "Delete" on an employee in System Admin settings.
  2. System checks `AssetAllocation` for records in `ACTIVE` state for this employee.
  3. If active records exist, block the operation and show warning: "Cannot deactivate/delete employee with active allocations. Reassign assets first."
  4. If none exist, proceed.
- **Business Rules**:
  - Active checkout records block deletion and deactivation.
- **Validation Rules**: None.
- **Edge Cases**:
  - Overdue allocations are considered active checkouts and must also block deletion.
- **Backend Tasks**:
  - Edit `PATCH /api/v1/admin/employees/:id/status` and `DELETE /api/v1/organization/employees/:id`.
  - Add database count check for allocations matching `{ employeeId, status: 'ACTIVE' }`.
- **Frontend Tasks**:
  - Display error notifications returned by backend when blocking.
- **Database Changes**: None.
- **API Changes**: None.
- **Files Expected**:
  - `server/features/admin/admin.routes.js` (Modify)
  - `server/features/organization/organization.routes.js` (Modify)

---

## 3. Developer A Tasks & Files Checklist

### Backend - Feature Assets & Allocations
- [ ] Create `server/features/assets/asset.service.js` containing core business methods:
  - `createAsset` (with auto-generated asset tag generation)
  - `listAssets` (paginated, filtered, search)
  - `getAssetById` (with relations and timeline history mapping)
- [ ] Create `server/features/assets/asset.validators.js` with Zod validation schemas for inputs.
- [ ] Update `server/features/assets/asset.routes.js` to implement:
  - `POST /` (Asset Manager / Admin only)
  - `GET /` (Auth session)
  - `GET /:id` (Auth session)
  - `PATCH /:id/status` (Asset Manager / Admin only)
- [ ] Create `server/features/allocation/allocation.service.js` containing:
  - `allocateAsset` (with conflict verification and transactions)
  - `returnAsset` (with condition check-ins and transactions)
- [ ] Create `server/features/allocation/transfer.service.js` containing:
  - `createTransferRequest`
  - `approveTransferRequest` (with transaction resolving allocations)
  - `rejectTransferRequest`
- [ ] Update `server/features/allocation/allocation.routes.js` to implement:
  - `GET /` (list active/historical allocations)
  - `POST /` (allocate asset)
  - `POST /:id/return` (check-in returned asset)
  - `POST /transfers` (initiate transfer request)
  - `GET /transfers` (list pending/past transfer requests)
  - `PATCH /transfers/:id/status` (approve/reject transfer request)
- [ ] Modify `server/features/admin/admin.routes.js` to add checks blocking status updates to `INACTIVE` for employees holding active allocations.
- [ ] Modify `server/features/organization/organization.routes.js` to block soft deletion for employees holding active allocations.

### Frontend - Asset Directory & Workflow Views
- [ ] Implement `client/src/features/assets/AssetList.jsx` (Datatable, search, categories/status filters, pagination).
- [ ] Implement `client/src/features/assets/AssetRegisterForm.jsx` (Dynamic attributes inputs based on category customFieldSchema).
- [ ] Implement `client/src/features/assets/AssetDetails.jsx` (Core attributes, QR code view, chronological activity timeline).
- [ ] Create `client/src/features/assets/components/AssetQRTag.jsx` (Frontend QR renderer with print CSS styles).
- [ ] Implement `client/src/features/allocation/AllocationList.jsx` (List of active checkouts, overdue return highlight alerts).
- [ ] Create `client/src/features/allocation/AllocationForm.jsx` (Allocation wizard auto-filling employee departments).
- [ ] Create `client/src/features/allocation/ReturnAssetModal.jsx` (Check-in notes and condition selector dialog).
- [ ] Create `client/src/features/allocation/TransferInbox.jsx` (Approvals list for managers/dept heads).

---

## 4. Verification & Testing

### Automated Tests Plan
- Execute post-implementation unit integration tests for:
  - Auto-generated Asset Tag format (`AF-xxxx`).
  - Allocation API returns 400 error if asset is already allocated.
  - Return API successfully changes asset back to `AVAILABLE`.
  - Transfer approval updates allocation holder and history correctly.
  - Employee status update returns 400 if they hold active allocations.

### Manual Verification
- Log in as Asset Manager and register a Laptop category asset. Ensure RAM and OS inputs render dynamically on frontend.
- Log in as Standard Employee. Verify you cannot access administrative pages or Register Asset.
- Allocate laptop to Employee. Attempt to allocate the same laptop to another employee; verify the system blocks it and offers a Transfer button.
- Initiate a Transfer request, approve it as Manager, and verify that the timeline in Asset Details displays the transfer event correctly.
- Verify barcode/QR tag generates in details and has a clean, readable print-media page format.

---

## 5. Definition of Done & Out of Scope

### Definition of Done
- All backend routes are validated using Zod and secure session/authorization roles.
- Frontend forms validate inputs before submission using React Hook Form.
- All database operations are transaction-safe where multi-table updates occur.
- Code must pass ESLint and Prettier rules without errors.
- Responsive design: Pages render cleanly on mobile layouts.

### Out of Scope
- Direct integration with physical barcode scanners (handled browser-native or manual key-in).
- Integrating external storage like AWS S3 or Cloudinary during dev phase (use local uploads folder).
