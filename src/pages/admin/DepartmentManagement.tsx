// ==============================================================================
// ClinicFlow — Administrator: Department Master Management
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Department } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input, Textarea } from '@/components/common/Input';
import { useToast } from '@/contexts/ToastContext';
import { formatDate } from '@/lib/dateUtils';
import { Building2, Plus, Edit2, CheckCircle2 } from 'lucide-react';

export const DepartmentManagement: React.FC = () => {
  const { success, error } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true,
  });

  const loadDepartments = async () => {
    try {
      setIsLoading(true);
      const data = await api.departments.getAll();
      setDepartments(data);
    } catch (err) {
      console.error('Failed to load departments', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleOpenAdd = () => {
    setEditingDept(null);
    setFormData({ name: '', code: '', description: '', is_active: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      is_active: dept.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      error('Department name and code are required.');
      return;
    }

    try {
      if (editingDept) {
        await api.departments.update(editingDept.id, formData);
        success('Department updated successfully!');
      } else {
        await api.departments.create({
          name: formData.name,
          code: formData.code.toUpperCase(),
          description: formData.description,
          is_active: formData.is_active,
        });
        success('New clinical department added!');
      }
      setIsModalOpen(false);
      loadDepartments();
    } catch (err: any) {
      error(err.message || 'Failed to save department.');
    }
  };

  const columns: Column<Department>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (d) => (
        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded border border-slate-200">
          {d.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Department Name',
      render: (d) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{d.name}</p>
          <p className="text-xs text-slate-500 line-clamp-1">{d.description || 'Clinical specialty department'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (d) => <StatusBadge status={d.is_active ? 'active' : 'inactive'} variant="active" size="sm" />,
    },
    {
      key: 'created',
      header: 'Created',
      render: (d) => <span className="text-xs text-slate-500">{formatDate(d.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (d) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenEdit(d)}
          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Departments</h1>
          <p className="text-xs text-slate-500">
            Configure hospital specialty wings, clinical codes, and department routing
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
          Add Department
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={departments}
        keyExtractor={(d) => d.id}
        isLoading={isLoading}
        emptyTitle="No departments found"
        emptyDescription="Add your first department to get started."
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? 'Edit Department' : 'Add New Department'}
        subtitle="Clinical master data configuration"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Department Name"
            required
            placeholder="e.g. Cardiology, Pediatrics"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Department Code (2-6 letters)"
            required
            placeholder="e.g. CARD, PEDS"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          />
          <Textarea
            label="Description"
            placeholder="Brief scope of medical care provided by this department..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="dept-active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="dept-active" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Department is active and accepting bookings
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingDept ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
