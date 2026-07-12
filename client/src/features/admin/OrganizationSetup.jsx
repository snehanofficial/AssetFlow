import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '../../utils/api.js';
import { useToast } from '../../components/common/Providers.jsx';
import {
  Users,
  Network,
  FolderOpen,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserX,
  UserCheck,
} from 'lucide-react';

export const OrganizationSetup = () => {
  const [activeTab, setActiveTab] = useState(0); // 0: Employees, 1: Departments, 2: Categories
  const { showToast } = useToast();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          System Administration
        </h1>
        <p className="text-text-secondary text-xs">
          Manage corporate structure, category schemas, and employee privileges.
        </p>
      </div>

      <div className="card-elevation p-6 space-y-6">
        {/* Tab Headers */}
        <div className="border-b border-border pb-4 flex gap-6">
          {[
            { label: 'Employees Directory', icon: Users },
            { label: 'Department Hierarchies', icon: Network },
            { label: 'Custom Category Schemas', icon: FolderOpen },
          ].map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`text-sm font-semibold pb-4 -mb-4 transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div>
          {activeTab === 0 && <EmployeesTab showToast={showToast} />}
          {activeTab === 1 && <DepartmentsTab showToast={showToast} />}
          {activeTab === 2 && <CategoriesTab showToast={showToast} />}
        </div>
      </div>
    </div>
  );
};

/**
 * ============================================================================
 * EMPLOYEES TAB
 * ============================================================================
 */
const EmployeesTab = ({ showToast }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editEmployee, setEditEmployee] = useState(null);
  const [confirmRole, setConfirmRole] = useState(null); // { employee, role }

  // Fetch employees
  const { data: employeesData, isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees', page, search],
    queryFn: () => apiFetch(`/organization/employees?page=${page}&limit=10&search=${search}`),
  });

  // Fetch departments list for dropdown
  const { data: deptsData } = useQuery({
    queryKey: ['departments', 'dropdown-list'],
    queryFn: () => apiFetch('/organization/departments'),
  });

  const employees = employeesData?.data?.records || [];
  const departments = deptsData?.data?.records || [];
  const totalPages =
    Math.ceil((employeesData?.data?.total || 0) / (employeesData?.data?.limit || 10)) || 1;

  const handleUpdateRole = async (employee, role) => {
    try {
      const res = await apiFetch(`/admin/employees/${employee.id}/role`, {
        method: 'PATCH',
        body: { role },
      });
      if (res.success) {
        showToast(`Role updated to ${role} for ${employee.name}. Target logged out.`, 'success');
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      }
    } catch (err) {
      showToast(err.message || 'Role promotion failed.', 'error');
    } finally {
      setConfirmRole(null);
    }
  };

  const handleToggleStatus = async (employee) => {
    const targetStatus = employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await apiFetch(`/admin/employees/${employee.id}/status`, {
        method: 'PATCH',
        body: { status: targetStatus },
      });
      if (res.success) {
        showToast(`Employee is now ${targetStatus.toLowerCase()}.`, 'success');
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      }
    } catch (err) {
      showToast(err.message || 'Failed to toggle status.', 'error');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee? (Soft Delete)')) return;
    try {
      const res = await apiFetch(`/organization/employees/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast('Employee account soft-deleted successfully.', 'success');
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete employee.', 'error');
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      departmentId: formData.get('departmentId') || null,
    };

    try {
      const res = await apiFetch(`/organization/employees/${editEmployee.id}`, {
        method: 'PUT',
        body: payload,
      });
      if (res.success) {
        showToast('Employee details updated successfully.', 'success');
        setEditEmployee(null);
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      }
    } catch (err) {
      showToast(err.message || 'Failed to save changes.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <input
          type="text"
          placeholder="Search employees by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="bg-background border border-border rounded-md px-3 py-2 text-xs text-text-primary w-full sm:w-80 outline-none focus:border-primary"
        />
      </div>

      {loadingEmployees ? (
        <div className="flex flex-col items-center justify-center p-12 h-64 space-y-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-text-muted text-xs">Loading directory...</span>
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 h-64 text-text-muted text-xs italic">
          No employees found in organization directory.
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-background text-text-secondary border-b border-border uppercase tracking-wider font-semibold">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Department</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-surface-hover text-text-secondary">
                  <td className="p-4 font-semibold text-text-primary">{emp.name}</td>
                  <td className="p-4">{emp.email}</td>
                  <td className="p-4">
                    {emp.department?.name || <span className="text-text-muted">Unassigned</span>}
                  </td>
                  <td className="p-4">
                    <select
                      value={emp.role}
                      onChange={(e) => setConfirmRole({ employee: emp, role: e.target.value })}
                      className="bg-background border border-border rounded px-2 py-1 text-text-primary outline-none text-xxs font-semibold focus:border-primary"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="ASSET_MANAGER">Asset Manager</option>
                      <option value="DEPT_HEAD">Dept Head</option>
                      <option value="EMPLOYEE">Employee</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleStatus(emp)}
                      className={`px-2 py-0.5 rounded text-xxs font-semibold border flex items-center gap-1 cursor-pointer transition-all ${
                        emp.status === 'ACTIVE'
                          ? 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                          : 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
                      }`}
                    >
                      {emp.status === 'ACTIVE' ? (
                        <UserCheck className="w-3 h-3" />
                      ) : (
                        <UserX className="w-3 h-3" />
                      )}
                      {emp.status}
                    </button>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => setEditEmployee(emp)}
                      className="p-1.5 hover:bg-surface-hover rounded text-text-secondary hover:text-text-primary cursor-pointer transition-all"
                      title="Edit details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(emp.id)}
                      className="p-1.5 hover:bg-destructive/10 rounded text-text-muted hover:text-destructive cursor-pointer transition-all"
                      title="Soft delete account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-xxs text-text-muted">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 bg-surface border border-border rounded text-text-secondary disabled:opacity-30 disabled:pointer-events-none hover:text-text-primary cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 bg-surface border border-border rounded text-text-secondary disabled:opacity-30 disabled:pointer-events-none hover:text-text-primary cursor-pointer transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Details Modal */}
      {editEmployee && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border border-border rounded-lg p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold text-text-primary">Edit Employee Details</h3>
            <form onSubmit={handleSaveDetails} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xxs text-text-secondary font-medium">Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editEmployee.name}
                  required
                  className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xxs text-text-secondary font-medium">Email Address</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editEmployee.email}
                  required
                  className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xxs text-text-secondary font-medium">Department</label>
                <select
                  name="departmentId"
                  defaultValue={editEmployee.departmentId || ''}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-text-primary outline-none focus:border-primary"
                >
                  <option value="">Unassigned</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditEmployee(null)}
                  className="px-3 py-1.5 border border-border hover:bg-surface-hover text-text-secondary rounded text-xxs font-medium cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded text-xxs font-medium cursor-pointer transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Role Change Modal */}
      {confirmRole && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface border border-border rounded-lg p-6 space-y-4 shadow-xl border-warning/30">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-semibold">Verify Role Change</h3>
            </div>
            <p className="text-xxs text-text-secondary leading-relaxed">
              Are you sure you want to change <strong>{confirmRole.employee.name}</strong>'s system
              clearance to <strong className="text-text-primary">{confirmRole.role}</strong>? This
              action will immediately terminate the employee's active refresh tokens, forcing them
              to sign in again.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmRole(null)}
                className="px-3 py-1.5 border border-border hover:bg-surface-hover text-text-secondary rounded text-xxs font-medium cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateRole(confirmRole.employee, confirmRole.role)}
                className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded text-xxs font-medium cursor-pointer transition-all"
              >
                Yes, Change Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * ============================================================================
 * DEPARTMENTS TAB
 * ============================================================================
 */
const DepartmentsTab = ({ showToast }) => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false); // true/false
  const [editDept, setEditDept] = useState(null); // dept object

  // Fetch departments list
  const { data: deptsData, isLoading: loadingDepts } = useQuery({
    queryKey: ['departments', 'admin-list'],
    queryFn: () => apiFetch('/organization/departments'),
  });

  // Fetch employees list for dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'dropdown-list'],
    queryFn: () => apiFetch('/organization/employees?limit=100'),
  });

  const departments = deptsData?.data?.records || [];
  const employees = employeesData?.data?.records || [];

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      name: formData.get('name'),
      parentId: formData.get('parentId') || null,
      headId: formData.get('headId') || null,
    };

    try {
      if (editDept) {
        const res = await apiFetch(`/admin/departments/${editDept.id}`, {
          method: 'PUT',
          body: payload,
        });
        if (res.success) {
          showToast('Department updated successfully.', 'success');
          setEditDept(null);
        }
      } else {
        const res = await apiFetch('/admin/departments', {
          method: 'POST',
          body: payload,
        });
        if (res.success) {
          showToast('Department created successfully.', 'success');
          setShowModal(false);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    } catch (err) {
      showToast(err.message || 'Failed to save department.', 'error');
    }
  };

  const handleToggleStatus = async (dept) => {
    const targetStatus = dept.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await apiFetch(`/admin/departments/${dept.id}/status`, {
        method: 'PATCH',
        body: { status: targetStatus },
      });
      if (res.success) {
        showToast(`Department status updated to ${targetStatus.toLowerCase()}.`, 'success');
        queryClient.invalidateQueries({ queryKey: ['departments'] });
      }
    } catch (err) {
      showToast(err.message || 'Failed to update department status.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      const res = await apiFetch(`/admin/departments/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast('Department deleted successfully.', 'success');
        queryClient.invalidateQueries({ queryKey: ['departments'] });
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete department.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditDept(null);
            setShowModal(true);
          }}
          className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-xs px-3 py-2 rounded-md flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Department
        </button>
      </div>

      {loadingDepts ? (
        <div className="flex flex-col items-center justify-center p-12 h-64 space-y-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-text-muted text-xs">Loading hierarchy structure...</span>
        </div>
      ) : departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 h-64 text-text-muted text-xs italic">
          No departments configured. Click "Add Department" to start.
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-background text-text-secondary border-b border-border uppercase tracking-wider font-semibold">
                <th className="p-4">Department Name</th>
                <th className="p-4">Parent Department</th>
                <th className="p-4">Department Head</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-surface-hover text-text-secondary">
                  <td className="p-4 font-semibold text-text-primary">{dept.name}</td>
                  <td className="p-4">
                    {dept.parent?.name || <span className="text-text-muted">None (Root)</span>}
                  </td>
                  <td className="p-4">
                    {dept.head?.name || <span className="text-text-muted">Unassigned</span>}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleStatus(dept)}
                      className={`px-2 py-0.5 rounded text-xxs font-semibold border flex items-center gap-1 cursor-pointer transition-all ${
                        dept.status === 'ACTIVE'
                          ? 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                          : 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
                      }`}
                    >
                      {dept.status}
                    </button>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => setEditDept(dept)}
                      className="p-1.5 hover:bg-surface-hover rounded text-text-secondary hover:text-text-primary cursor-pointer transition-all"
                      title="Edit department"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id)}
                      className="p-1.5 hover:bg-destructive/10 rounded text-text-muted hover:text-destructive cursor-pointer transition-all"
                      title="Delete department"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Department Modal */}
      {(showModal || editDept) && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border border-border rounded-lg p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold text-text-primary">
              {editDept ? 'Edit Department details' : 'Create New Department'}
            </h3>
            <form onSubmit={handleSaveDepartment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xxs text-text-secondary font-medium">Department Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editDept ? editDept.name : ''}
                  required
                  className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-text-primary outline-none focus:border-primary"
                  placeholder="e.g. Engineering"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xxs text-text-secondary font-medium">
                  Parent Department
                </label>
                <select
                  name="parentId"
                  defaultValue={editDept ? editDept.parentId || '' : ''}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-text-primary outline-none focus:border-primary"
                >
                  <option value="">None (Top Level Root)</option>
                  {departments
                    // Don't list ourselves as possible parent
                    .filter((d) => !editDept || d.id !== editDept.id)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xxs text-text-secondary font-medium">
                  Department Head / Manager
                </label>
                <select
                  name="headId"
                  defaultValue={editDept ? editDept.headId || '' : ''}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-text-primary outline-none focus:border-primary"
                >
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditDept(null);
                  }}
                  className="px-3 py-1.5 border border-border hover:bg-surface-hover text-text-secondary rounded text-xxs font-medium cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded text-xxs font-medium cursor-pointer transition-all"
                >
                  {editDept ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * ============================================================================
 * ASSET CATEGORIES TAB
 * ============================================================================
 */
const CategoriesTab = ({ showToast }) => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState(null);

  // Field attributes builder state
  const [attributes, setAttributes] = useState([]);

  // Fetch asset categories
  const { data: catsData, isLoading: loadingCats } = useQuery({
    queryKey: ['categories', 'admin-list'],
    queryFn: () => apiFetch('/organization/categories'),
  });

  const categories = catsData?.data?.records || [];

  const handleOpenAdd = () => {
    setEditCat(null);
    setAttributes([]);
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditCat(cat);
    setAttributes(cat.customFieldsSchema || []);
    setShowModal(true);
  };

  const handleAddAttribute = () => {
    setAttributes([...attributes, { name: '', type: 'string', required: false }]);
  };

  const handleRemoveAttribute = (idx) => {
    setAttributes(attributes.filter((_, i) => i !== idx));
  };

  const handleAttributeChange = (idx, field, value) => {
    const updated = [...attributes];
    updated[idx][field] = value;
    setAttributes(updated);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    // Clean up empty attribute definitions
    const cleanedSchema = attributes.filter((attr) => attr.name.trim() !== '');

    const payload = {
      name: formData.get('name'),
      customFieldsSchema: cleanedSchema,
    };

    try {
      if (editCat) {
        const res = await apiFetch(`/organization/categories/${editCat.id}`, {
          method: 'PUT',
          body: payload,
        });
        if (res.success) {
          showToast('Category schema updated successfully.', 'success');
          setShowModal(false);
        }
      } else {
        const res = await apiFetch('/organization/categories', {
          method: 'POST',
          body: payload,
        });
        if (res.success) {
          showToast('Category schema registered successfully.', 'success');
          setShowModal(false);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (err) {
      showToast(err.message || 'Failed to save category schema.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category schema?')) return;
    try {
      const res = await apiFetch(`/organization/categories/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast('Category schema deleted successfully.', 'success');
        queryClient.invalidateQueries({ queryKey: ['categories'] });
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete category.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Button */}
      <div className="flex justify-end">
        <button
          onClick={handleOpenAdd}
          className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-xs px-3 py-2 rounded-md flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Category
        </button>
      </div>

      {loadingCats ? (
        <div className="flex flex-col items-center justify-center p-12 h-64 space-y-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-text-muted text-xs">Loading categories...</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 h-64 text-text-muted text-xs italic">
          No asset categories found. Click "Add Category" to initialize.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-5 bg-surface border border-border rounded-lg flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    {cat.name}
                  </h3>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1 hover:bg-surface-hover rounded text-text-secondary hover:text-text-primary cursor-pointer transition-all"
                      title="Edit Category Schema"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1 hover:bg-destructive/10 rounded text-text-muted hover:text-destructive cursor-pointer transition-all"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xxs font-semibold text-text-muted uppercase tracking-wide">
                    Custom Metadata Schema
                  </span>
                  {cat.customFieldsSchema && cat.customFieldsSchema.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cat.customFieldsSchema.map((field, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-background text-text-secondary border border-border rounded text-xxs font-medium"
                        >
                          {field.name} ({field.type})
                          {field.required && <span className="text-destructive ml-0.5">*</span>}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xxs text-text-muted italic">
                      No custom schema fields configured.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface border border-border rounded-lg p-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-sm font-semibold text-text-primary">
              {editCat ? `Modify Category Schema: ${editCat.name}` : 'Register New Asset Category'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xxs text-text-secondary font-medium">Category Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editCat ? editCat.name : ''}
                  required
                  className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-text-primary outline-none focus:border-primary"
                  placeholder="e.g. Electronics, Vehicles"
                />
              </div>

              {/* Dynamic JSON Schema attributes builder */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-xxs font-bold text-primary uppercase tracking-wide">
                    Schema attributes builder
                  </span>
                  <button
                    type="button"
                    onClick={handleAddAttribute}
                    className="flex items-center gap-1 text-xxs font-semibold text-primary hover:text-primary-hover cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Attribute
                  </button>
                </div>

                {attributes.length === 0 ? (
                  <p className="text-xxs text-text-muted italic py-2 text-center">
                    No custom schema fields added yet. Laptops, hardware, and equipment categories
                    benefit from custom fields definition.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {attributes.map((attr, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={attr.name}
                          onChange={(e) => handleAttributeChange(idx, 'name', e.target.value)}
                          placeholder="Field name (e.g. RAM)"
                          required
                          className="flex-1 bg-background border border-border rounded px-2 py-1.5 text-xs text-text-primary outline-none focus:border-primary"
                        />
                        <select
                          value={attr.type}
                          onChange={(e) => handleAttributeChange(idx, 'type', e.target.value)}
                          className="bg-background border border-border rounded px-2 py-1.5 text-xs text-text-primary outline-none focus:border-primary"
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                        </select>
                        <label className="flex items-center gap-1 text-xxs text-text-secondary cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={attr.required}
                            onChange={(e) =>
                              handleAttributeChange(idx, 'required', e.target.checked)
                            }
                            className="rounded border-border text-primary outline-none focus:ring-0 focus:ring-offset-0"
                          />
                          Req.
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttribute(idx)}
                          className="p-1.5 text-text-muted hover:text-destructive cursor-pointer transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-border hover:bg-surface-hover text-text-secondary rounded text-xxs font-medium cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded text-xxs font-medium cursor-pointer transition-all"
                >
                  {editCat ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationSetup;
