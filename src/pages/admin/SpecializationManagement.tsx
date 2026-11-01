// ==============================================================================
// ClinicFlow — Administrator: Specialization Master Management
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Specialization, Department } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input, Textarea } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { useToast } from '@/contexts/ToastContext';
import { Stethoscope, Plus } from 'lucide-react';

export const SpecializationManagement: React.FC = () => {
  const { success, error } = useToast();
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    department_id: '',
    name: '',
    description: '',
    is_active: true,
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [specs, depts] = await Promise.all([
        api.departments.getSpecializations(),
        api.departments.getAll(),
      ]);
      setSpecializations(specs);
      setDepartments(depts);
    } catch (err) {
      console.error('Error loading specializations', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.department_id || !formData.name) {
      error('Department and specialization name are required.');
      return;
    }

    try {
      await api.departments.createSpecialization({
        department_id: formData.department_id,
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
      });

      success('New specialization created!');
      setIsModalOpen(false);
      setFormData({ department_id: '', name: '', description: '', is_active: true });
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to create specialization.');
    }
  };

  const columns: Column<Specialization>[] = [
    {
      key: 'name',
      header: 'Specialization',
      render: (s) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{s.name}</p>
          <p className="text-xs text-slate-500 line-clamp-1">{s.description || 'Clinical sub-specialty'}</p>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Parent Department',
      render: (s) => (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          {s.department?.name || 'Department'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => <StatusBadge status={s.is_active ? 'active' : 'inactive'} variant="active" size="sm" />,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Specializations</h1>
          <p className="text-xs text-slate-500">
            Configure physician sub-specialties mapped to hospital departments
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Specialization
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={specializations}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
        emptyTitle="No specializations found"
        emptyDescription="Add specializations to categorize physician expertise."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Specialization"
        subtitle="Associate a clinical specialty with a department"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Clinical Department"
            required
            value={formData.department_id}
            onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
            options={departments.map(d => ({ value: d.id, label: `${d.name} (${d.code})` }))}
            placeholder="Select Department..."
          />
          <Input
            label="Specialization Title"
            required
            placeholder="e.g. Interventional Cardiology, Pediatric Surgery"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Textarea
            label="Description"
            placeholder="Clinical scope and procedural focus..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Specialization
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
