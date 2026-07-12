# AssetFlow — API Specification

This document defines the RESTful Web API for the **AssetFlow** platform. Every endpoint is mapped to its required RBAC permissions, request validators, response structures, and referenced business rules.

---

## 1. API Standards & System Context

To ensure consistency, predictability, and ease of frontend-backend integration:

*   **REST Conventions**: All API resources use standard plural nouns (e.g. `/api/assets`, `/api/allocations`). Actions that mutate resource state use HTTP `POST`, `PATCH`, or `DELETE`.
*   **API Versioning**: Enforced globally via URL prefixing: `/api/v1/...`
*   **Payload Format**: All request and response bodies must use JSON (`application/json`).
*   **Stateful Timezones**: All timestamps passed in requests or returned in responses are formatted in ISO 8601 UTC format (`YYYY-MM-DDTHH:mm:ss.sssZ`).

---

### 1.1 Response Envelope

All API responses are wrapped in a standard JSON envelope:

#### Success Envelope (HTTP 200/201)
```json
{
  "success": true,
  "data": {
    "records": [],
    "total": 0
  },
  "message": "Optional user-friendly message."
}
```

#### Error Envelope (HTTP 4xx/5xx)
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Developer-friendly explanation.",
    "details": [
      {
        "field": "fieldName",
        "message": "Specific validation failure message."
      }
    ]
  }
}
```

---

### 1.2 Query Parameters for List Endpoints

List endpoints (`GET`) support standardized parameters for sorting, filtering, and pagination to optimize performance:

*   **Pagination**:
    *   `page`: Integer, defaults to `1`.
    *   `limit`: Integer, defaults to `20`, maximum allowed is `100`.
*   **Sorting**:
    *   `sortBy`: Column name (e.g. `createdAt`, `name`), default is `createdAt`.
    *   `sortOrder`: `'asc' | 'desc'`, default is `'desc'`.
*   **Filtering**: Passed as specific query keys (e.g., `status=AVAILABLE&categoryId=uuid`).
*   **Search**: Passed via `search` parameter, triggers text searches against whitelisted columns (e.g. asset tags, names, emails).

---

## 2. Authentication & Authorization Middlewares

Security is enforced at the route handler level using two Express middleware blocks:

1.  **`authenticateSession`**:
    *   Verifies the presence of a valid JWT Access Token in the `Authorization: Bearer <token>` header.
    *   If expired or missing, rejects the request with HTTP `401 Unauthorized` and the error code `EXPIRED_SESSION` or `INVALID_SESSION`.
2.  **`authorizeRoles(...allowedRoles)`**:
    *   Checks the role payload extracted from the validated JWT access token against the whitelisted roles.
    *   If unauthorized, rejects with HTTP `403 Forbidden` and the error code `FORBIDDEN_ACTION`.

---

## 3. Endpoint Catalogue

### 3.1 Authentication Module (`features/auth`)

#### 3.1.1 Signup
*   **HTTP Method / Route**: `POST /api/v1/auth/signup`
*   **Required Role(s)**: Guest (Public access)
*   **Purpose**: Allows visitors to register as employees.
*   **Validation (Zod)**:
    *   `email`: Required, valid email format.
    *   `password`: Required, string, min 8 characters, min 1 digit, min 1 special char.
    *   `name`: Required, string, min 2 chars, max 100 chars.
*   **Request Body**:
    ```json
    {
      "email": "user@company.com",
      "password": "Password123!",
      "name": "John Doe"
    }
    ```
*   **Response (HTTP 201)**:
    ```json
    {
      "success": true,
      "data": {
        "employee": {
          "id": "ee765507-6cb5-45d6-a249-14a0fa842261",
          "email": "user@company.com",
          "name": "John Doe",
          "role": "EMPLOYEE",
          "status": "ACTIVE"
        },
        "accessToken": "eyJhbGciOi..."
      }
    }
    ```
*   **Error Responses**:
    *   `EMAIL_ALREADY_EXISTS` (HTTP 400): "An account with this email address already exists."
    *   `INVALID_INPUT` (HTTP 400): Request data fails Zod schema validations.
*   **Business Rules Reference**: BR-AUTH-01 (Forces signup role to `'EMPLOYEE'`).
*   **Database Entity**: `Employee`.
*   **Notification Trigger**: `UserRegistered`.

#### 3.1.2 Login
*   **HTTP Method / Route**: `POST /api/v1/auth/login`
*   **Required Role(s)**: Guest
*   **Request Body**:
    ```json
    {
      "email": "user@company.com",
      "password": "Password123!"
    }
    ```
*   **Response (HTTP 200)**: Sets refresh token in HTTP-only Cookie (`refreshToken`) and returns access token.
    ```json
    {
      "success": true,
      "data": {
        "accessToken": "eyJhbGciOi..."
      }
    }
    ```
*   **Error Responses**:
    *   `INVALID_CREDENTIALS` (HTTP 401): "Invalid email or password."
    *   `ACCOUNT_DEACTIVATED` (HTTP 403): "Your account has been deactivated."

#### 3.1.3 Token Refresh
*   **HTTP Method / Route**: `POST /api/v1/auth/refresh`
*   **Required Role(s)**: Guest (Reads token from cookies)
*   **Response (HTTP 200)**: Returns a new access token.

#### 3.1.4 Logout
*   **HTTP Method / Route**: `POST /api/v1/auth/logout`
*   **Required Role(s)**: Guest (Clears cookies and invalidates session token record)

#### 3.1.5 Get Current User Profile
*   **HTTP Method / Route**: `GET /api/v1/auth/me`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`, `DEPT_HEAD`, `EMPLOYEE`
*   **Response (HTTP 200)**:
    ```json
    {
      "success": true,
      "data": {
        "user": {
          "id": "ee765507-6cb5-45d6-a249-14a0fa842261",
          "email": "user@company.com",
          "name": "John Doe",
          "role": "EMPLOYEE",
          "departmentId": "48ca7c10-e4b9-43c2-bf72-3580436a0fb4"
        }
      }
    }
    ```

---

### 3.2 Organization & Administration Module (`features/admin`)

#### 3.2.1 Update Employee Role
*   **HTTP Method / Route**: `PATCH /api/v1/admin/employees/:id/role`
*   **Required Role(s)**: `ADMIN`
*   **Validation (Zod)**: `role` must be one of: `ADMIN`, `ASSET_MANAGER`, `DEPT_HEAD`, `EMPLOYEE`.
*   **Request Body**:
    ```json
    {
      "role": "ASSET_MANAGER"
    }
    ```
*   **Response (HTTP 200)**:
    ```json
    {
      "success": true,
      "message": "Employee role updated successfully."
    }
    ```
*   **Business Rules Reference**: BR-AUTH-02, BR-AUTH-03.
*   **Database Entity**: `Employee`, `RefreshToken` (purges old refresh tokens).
*   **Notification Trigger**: `EmployeeRoleUpdated`.

#### 3.2.2 Update Employee Status
*   **HTTP Method / Route**: `PATCH /api/v1/admin/employees/:id/status`
*   **Required Role(s)**: `ADMIN`
*   **Request Body**:
    ```json
    {
      "status": "INACTIVE"
    }
    ```
*   **Business Rules Reference**: BR-ORG-03 (Blocks deactivation if employee holds active allocations; deactivation cancels future bookings).
*   **Database Entity**: `Employee`, `Allocation`, `Booking`.

#### 3.2.3 Update Department
*   **HTTP Method / Route**: `PUT /api/v1/admin/departments/:id`
*   **Required Role(s)**: `ADMIN`
*   **Request Body**:
    ```json
    {
      "name": "Finance Department",
      "parentId": "d50a20cb-c309-4171-871d-f8ec00366ebc",
      "headId": "ee765507-6cb5-45d6-a249-14a0fa842261"
    }
    ```
*   **Business Rules Reference**: BR-ORG-01 (Validates department name uniqueness and checks parent graphs to prevent cyclical structures).
*   **Database Entity**: `Department`.

#### 3.2.4 Update Department Status
*   **HTTP Method / Route**: `PATCH /api/v1/admin/departments/:id/status`
*   **Required Role(s)**: `ADMIN`
*   **Request Body**:
    ```json
    {
      "status": "INACTIVE"
    }
    ```
*   **Business Rules Reference**: BR-ORG-02 (Blocks deactivation if department holds active allocations or active members).
*   **Database Entity**: `Department`, `Employee`, `Allocation`.

---

### 3.3 Asset Lifecycle Module (`features/assets`)

#### 3.3.1 Get Asset List
*   **HTTP Method / Route**: `GET /api/v1/assets`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`, `DEPT_HEAD`, `EMPLOYEE`
*   **Query Parameters**: `page`, `limit`, `search`, `status`, `categoryId`, `isBookable`
*   **Response (HTTP 200)**: Returns paginated assets matching parameters.

#### 3.3.2 Register Asset
*   **HTTP Method / Route**: `POST /api/v1/assets`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`
*   **Validation (Zod)**:
    *   `name`: Required, string, min 2 chars.
    *   `categoryId`: Required, UUID, must exist.
    *   `isBookable`: Boolean.
    *   `metadata`: Object (validated against the category custom fields schema).
*   **Request Body**:
    ```json
    {
      "name": "MacBook Pro M3",
      "categoryId": "c4794e77-94d7-4638-a28a-7848c90fe7a9",
      "isBookable": false,
      "metadata": {
        "RAM": "32GB",
        "OS": "macOS Sonoma"
      }
    }
    ```
*   **Response (HTTP 201)**:
    ```json
    {
      "success": true,
      "data": {
        "asset": {
          "id": "e98e29a8-e16e-4ad3-a9d0-60bde5432a68",
          "assetTag": "AF-0014",
          "name": "MacBook Pro M3",
          "status": "AVAILABLE",
          "condition": "EXCELLENT",
          "isBookable": false,
          "metadata": {
            "RAM": "32GB",
            "OS": "macOS Sonoma"
          }
        }
      }
    }
    ```
*   **Business Rules Reference**: BR-ASSET-01 (Sequential tag generator `AF-XXXX`), BR-ASSET-04 (Custom schema verification).
*   **Database Entity**: `Asset`, `AssetCategory`.
*   **Notification Trigger**: `AssetRegistered`.

#### 3.3.3 Edit Asset Details
*   **HTTP Method / Route**: `PUT /api/v1/assets/:id`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`
*   **Request Body**: Accepts the same core editable fields as asset registration, with optional multipart photo replacement.
*   **Business Rules Reference**: BR-AUDIT-05 (Blocks asset edits while the asset is under an active audit cycle), BR-ASSET-04 (Revalidates category-specific custom fields), BR-ASSET-01 (Preserves serial uniqueness).
*   **Database Entity**: `Asset`, `AssetCategory`, `AuditCycle`.

#### 3.3.4 Delete Asset
*   **HTTP Method / Route**: `DELETE /api/v1/assets/:id`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`
*   **Behavior**: Performs a guarded soft delete by setting `deletedAt`.
*   **Business Rules Reference**: BR-AUDIT-05 (Blocks asset deletion during active audits). Deletion is also blocked while the asset still has active allocations, upcoming or ongoing bookings, active maintenance, or pending transfer requests.
*   **Database Entity**: `Asset`, `Allocation`, `Booking`, `MaintenanceRequest`, `TransferRequest`.

#### 3.3.5 Decommission Asset
*   **HTTP Method / Route**: `POST /api/v1/assets/:id/decommission`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`
*   **Request Body**:
    ```json
    {
      "type": "RETIRED",
      "reason": "Out of warranty and damaged beyond repair."
    }
    ```
*   **Business Rules Reference**: BR-ASSET-03 (Decommissioning is permitted only if current asset status is `'AVAILABLE'`).
*   **Database Entity**: `Asset`, `Booking` (Automatically cancels upcoming bookings).
*   **Notification Trigger**: `AssetDecommissioned`.

---

### 3.4 Allocation & Transfers Module (`features/allocation`)

#### 3.4.1 Allocate Asset
*   **HTTP Method / Route**: `POST /api/v1/allocations`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`
*   **Validation (Zod)**:
    *   `assetId`: Required, UUID.
    *   `employeeId`: UUID (either employee or department must be set).
    *   `departmentId`: UUID.
    *   `expectedReturnDate`: Required, ISO Date, in the future.
*   **Request Body**:
    ```json
    {
      "assetId": "e98e29a8-e16e-4ad3-a9d0-60bde5432a68",
      "employeeId": "ee765507-6cb5-45d6-a249-14a0fa842261",
      "expectedReturnDate": "2026-08-12T17:00:00.000Z"
    }
    ```
*   **Business Rules Reference**: BR-ALLOC-01 (Guarantees double-allocation prevention via database index checks).
*   **Database Entity**: `Allocation`, `Asset`.
*   **Notification Trigger**: `AssetAllocated`.

#### 3.4.2 Request Transfer
*   **HTTP Method / Route**: `POST /api/v1/allocations/transfer`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`, `DEPT_HEAD`, `EMPLOYEE`
*   **Request Body**:
    ```json
    {
      "assetId": "e98e29a8-e16e-4ad3-a9d0-60bde5432a68",
      "reason": "Needed for temporary remote development work."
    }
    ```
*   **Business Rules Reference**: BR-ALLOC-02 (Permits requesting transfers on allocated assets, inserting a Pending Transfer Request record).
*   **Database Entity**: `TransferRequest`, `Allocation`.
*   **Notification Trigger**: `TransferRequested`.

#### 3.4.3 Approve Transfer
*   **HTTP Method / Route**: `POST /api/v1/allocations/transfers/:id/approve`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`, `DEPT_HEAD`
*   **Response (HTTP 200)**:
    ```json
    {
      "success": true,
      "message": "Transfer approved. Allocation custody updated."
    }
    ```
*   **Business Rules Reference**: BR-ALLOC-03 (Approver must be Asset Manager or Department Head of holding department. Closes old allocation, creates new allocation inside a single transaction).
*   **Database Entity**: `TransferRequest`, `Allocation`, `Asset`.
*   **Notification Trigger**: `TransferApproved`.

#### 3.4.4 Return Asset
*   **HTTP Method / Route**: `POST /api/v1/allocations/:id/return`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`
*   **Request Body**:
    ```json
    {
      "condition": "GOOD",
      "notes": "Returned clean, power adapter included."
    }
    ```
*   **Business Rules Reference**: BR-ALLOC-04 (Mandatory return details; sets asset state back to `'AVAILABLE'` and updates physical condition).
*   **Database Entity**: `Allocation`, `Asset`.

---

### 3.5 Resource Booking Module (`features/booking`)

#### 3.5.1 List Bookings
*   **HTTP Method / Route**: `GET /api/v1/bookings`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`, `DEPT_HEAD`, `EMPLOYEE`
*   **Query Parameters**: `assetId`, `startTime`, `endTime`, `status`

#### 3.5.2 Create Booking
*   **HTTP Method / Route**: `POST /api/v1/bookings`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`, `DEPT_HEAD`, `EMPLOYEE`
*   **Validation (Zod)**:
    *   `assetId`: Required, UUID.
    *   `startTime`: Required, ISO Date, in the future.
    *   `endTime`: Required, ISO Date, `endTime > startTime`.
    *   `departmentId`: UUID (optional, for department bookings).
*   **Request Body**:
    ```json
    {
      "assetId": "34efca01-8b09-43c2-bd72-3580436a0fb4",
      "startTime": "2026-07-20T09:00:00.000Z",
      "endTime": "2026-07-20T10:30:00.000Z"
    }
    ```
*   **Response (HTTP 201)**: Returns the created booking record.
*   **Business Rules Reference**: BR-ASSET-05 (Enforces `isBookable = true` restriction), BR-BOOK-01 (Enforces strict non-overlapping bookings via transaction locks), BR-BOOK-03 (Restricts department booking ownership validation).
*   **Database Entity**: `Booking`, `Asset`.
*   **Notification Trigger**: `BookingCreated`.

#### 3.5.3 Cancel Booking
*   **HTTP Method / Route**: `DELETE /api/v1/bookings/:id`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`, `DEPT_HEAD`, `EMPLOYEE`
*   **Business Rules Reference**: BR-BOOK-02 (Cancellations/modifications are permitted only if booking status is `'UPCOMING'` and start time is in the future. Validates booker ownership or manager roles).
*   **Database Entity**: `Booking`.

---

### 3.6 Maintenance Module (`features/maintenance`)

#### 3.6.1 Raise Maintenance Request
*   **HTTP Method / Route**: `POST /api/v1/maintenance`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`, `DEPT_HEAD`, `EMPLOYEE`
*   **Request Body**:
    ```json
    {
      "assetId": "e98e29a8-e16e-4ad3-a9d0-60bde5432a68",
      "description": "Battery drains within 30 minutes.",
      "priority": "MEDIUM"
    }
    ```
*   **Business Rules Reference**: BR-MAINT-01 (Submits maintenance request with a `'PENDING'` status).
*   **Database Entity**: `MaintenanceRequest`.
*   **Notification Trigger**: `MaintenanceRaised`.

#### 3.6.2 Update Maintenance Status
*   **HTTP Method / Route**: `PATCH /api/v1/maintenance/:id/status`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`
*   **Request Body**:
    ```json
    {
      "status": "APPROVED"
    }
    ```
*   **Business Rules Reference**: BR-MAINT-01, BR-MAINT-02 (Approving a request automatically transitions the asset's status to `'UNDER_MAINTENANCE'`).
*   **Database Entity**: `MaintenanceRequest`, `Asset`.
*   **Notification Trigger**: `MaintenanceApproved`.

#### 3.6.3 Resolve Maintenance Request
*   **HTTP Method / Route**: `POST /api/v1/maintenance/:id/resolve`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`
*   **Request Body**:
    ```json
    {
      "resolutionNotes": "Battery replaced with official OEM pack.",
      "condition": "EXCELLENT"
    }
    ```
*   **Business Rules Reference**: BR-MAINT-02 (Resolving repair transitions the asset status back to `'AVAILABLE'` and updates physical condition rating).
*   **Database Entity**: `MaintenanceRequest`, `Asset`.
*   **Notification Trigger**: `MaintenanceResolved`.

---

### 3.7 Compliance Audit Module (`features/audit`)

#### 3.7.1 Initiate Audit Cycle
*   **HTTP Method / Route**: `POST /api/v1/audits`
*   **Required Role(s)**: `ADMIN`
*   **Request Body**:
    ```json
    {
      "name": "Q3 IT Assets Audit",
      "scopeDepartmentId": "48ca7c10-e4b9-43c2-bf72-3580436a0fb4",
      "scopeCategoryId": "c4794e77-94d7-4638-a28a-7848c90fe7a9",
      "auditorIds": ["ee765507-6cb5-45d6-a249-14a0fa842261"]
    }
    ```
*   **Response (HTTP 201)**: Returns created cycle and list of scoped assets populated into audit items.
*   **Business Rules Reference**: BR-AUDIT-01 (Registers cycle scope and auditor assignments).
*   **Database Entity**: `AuditCycle`, `AuditAuditor`, `AuditItem`, `Asset`.
*   **Notification Trigger**: `AuditCycleInitiated`.

#### 3.7.2 Submit Checklist Item Audit
*   **HTTP Method / Route**: `POST /api/v1/audits/:id/items`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`, `DEPT_HEAD`, `EMPLOYEE`
*   **Request Body**:
    ```json
    {
      "assetId": "e98e29a8-e16e-4ad3-a9d0-60bde5432a68",
      "verificationStatus": "MISSING",
      "notes": "Desk clean, laptop is nowhere to be found."
    }
    ```
*   **Business Rules Reference**: BR-AUDIT-02 (Verifies that user is assigned as auditor. Flagging items `'MISSING'` or `'DAMAGED'` triggers discrepancy tracking).
*   **Database Entity**: `AuditCycle`, `AuditItem`.
*   **Notification Trigger**: `AuditItemFlagged` (discrepancy alert).

#### 3.7.3 Close Audit Cycle
*   **HTTP Method / Route**: `POST /api/v1/audits/:id/close`
*   **Required Role(s)**: `ADMIN`
*   **Response (HTTP 200)**:
    ```json
    {
      "success": true,
      "message": "Audit Cycle closed. Missing assets marked as LOST."
    }
    ```
*   **Business Rules Reference**: BR-AUDIT-03 (Locks cycle from edits. In a single transaction, marks all items flagged as `'MISSING'` to asset status `'LOST'`).
*   **Database Entity**: `AuditCycle`, `AuditItem`, `Asset`.
*   **Notification Trigger**: `AuditCycleClosed`.

#### 3.7.4 Resolve Audit Discrepancy
*   **HTTP Method / Route**: `POST /api/v1/audits/discrepancies/:itemId/resolve`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`
*   **Request Body**:
    ```json
    {
      "action": "CREATE_MAINTENANCE",
      "notes": "Flagged as damaged; raising repair request to fix laptop screen."
    }
    ```
*   **Business Rules Reference**: BR-AUDIT-04 (Asset Manager action transitions asset status based on selected resolution format).
*   **Database Entity**: `AuditItem`, `Asset`, `MaintenanceRequest` (conditional).
*   **Notification Trigger**: `DiscrepancyResolved`.

---

### 3.8 Notifications Module (`features/notifications`)

#### 3.8.1 Fetch User Notifications
*   **HTTP Method / Route**: `GET /api/v1/notifications`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`, `DEPT_HEAD`, `EMPLOYEE`
*   **Response (HTTP 200)**: Returns user's unread and read notification records.

#### 3.8.2 Mark Notification as Read
*   **HTTP Method / Route**: `PATCH /api/v1/notifications/:id/read`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`, `DEPT_HEAD`, `EMPLOYEE`
*   **Response (HTTP 200)**: Updates `isRead = true` for the notification.

---

### 3.9 Reports & Dashboard Module (`features/reports`)

#### 3.9.1 Get Dashboard KPIs
*   **HTTP Method / Route**: `GET /api/v1/dashboard/kpis`
*   **Required Role(s)**: `ADMIN`, `ASSET_MANAGER`, `DEPT_HEAD`, `EMPLOYEE`
*   **Response (HTTP 200)**: Returns role-scoped metrics, including total assets, bookable count, active allocations, pending maintenance count, active audit cycles, and overdue return counts.
*   **Business Rules Reference**: BR-ALLOC-05.
*   **Database Entity**: Aggregates data from `Asset`, `Allocation`, `MaintenanceRequest`, `AuditCycle`.

