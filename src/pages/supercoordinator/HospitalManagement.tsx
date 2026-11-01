// ==============================================================================
// ClinicFlow — Supercoordinator: Hospital Network & Multi-Tenancy Management
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Hospital, Profile } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input, Textarea } from '@/components/common/Input';
import { useToast } from '@/contexts/ToastContext';
import { formatDate } from '@/lib/dateUtils';
import { 
  Building2, 
  Plus, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Stethoscope, 
  Users,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const HospitalManagement: React.FC = () => {
  const { success, error } = useToast();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    whatsapp_phone_number_id: '',
    whatsapp_business_account_id: '',
    whatsapp_enabled: true,
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [hList, uList] = await Promise.all([
        api.hospitals.getAll(),
        api.users.getAll(),
      ]);
      setHospitals(hList);
      setUsers(uList);
    } catch (err: any) {
      error(err.message || 'Failed to load hospital network');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingHospital(null);
    setFormData({
      name: '',
      slug: '',
      email: '',
      phone: '',
      address: '',
      whatsapp_phone_number_id: '',
      whatsapp_business_account_id: '',
      whatsapp_enabled: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (hospital: Hospital) => {
    setEditingHospital(hospital);
    setFormData({
      name: hospital.name,
      slug: hospital.slug,
      email: hospital.email || '',
      phone: hospital.phone || '',
      address: hospital.address || '',
      whatsapp_phone_number_id: hospital.whatsapp_phone_number_id || '',
      whatsapp_business_account_id: hospital.whatsapp_business_account_id || '',
      whatsapp_enabled: hospital.whatsapp_enabled,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      error('Please enter hospital name and slug identifier.');
      return;
    }

    try {
      if (editingHospital) {
        await api.hospitals.update(editingHospital.id, {
          name: formData.name,
          slug: formData.slug,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          whatsapp_phone_number_id: formData.whatsapp_phone_number_id || null,
          whatsapp_business_account_id: formData.whatsapp_business_account_id || null,
          whatsapp_enabled: formData.whatsapp_enabled,
        });
        success(`Hospital "${formData.name}" updated successfully.`);
      } else {
        await api.hospitals.create({
          name: formData.name,
          slug: formData.slug,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          whatsapp_phone_number_id: formData.whatsapp_phone_number_id || null,
          whatsapp_business_account_id: formData.whatsapp_business_account_id || null,
          whatsapp_enabled: formData.whatsapp_enabled,
        });
        success(`Hospital "${formData.name}" onboarded into network.`);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save hospital');
    }
  };

  const columns: Column<Hospital>[] = [
    {
      key: 'name',
      header: 'Hospital Name & Address',
      render: (h) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{h.name}</p>
          <p className="text-xs text-slate-500 max-w-xs truncate">{h.address || 'Address unlisted'}</p>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Info',
      render: (h) => (
        <div className="text-xs">
          <p className="text-slate-800">{h.phone || 'N/A'}</p>
          <p className="text-slate-400 text-[11px]">{h.email || 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'staff',
      header: 'Assigned Staff',
      render: (h) => {
        const docCount = users.filter(u => u.hospital_id === h.id && u.role === 'doctor').length;
        const recCount = users.filter(u => u.hospital_id === h.id && u.role === 'receptionist').length;
        return (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
              <Stethoscope className="w-3 h-3" /> {docCount} Doctors
            </span>
            <span className="flex items-center gap-1 text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-medium border border-sky-200">
              <Users className="w-3 h-3" /> {recCount} Staff
            </span>
          </div>
        );
      },
    },
    {
      key: 'whatsapp',
      header: 'WhatsApp Cloud API',
      render: (h) => (
        <div>
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              h.whatsapp_enabled
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            {h.whatsapp_enabled ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {h.whatsapp_enabled ? 'Active' : 'Disabled'}
          </span>
          {h.whatsapp_phone_number_id && (
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
              ID: {h.whatsapp_phone_number_id.slice(0, 10)}...
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (h) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => openEditModal(h)}
          className="text-xs"
        >
          <Edit3 className="w-3.5 h-3.5 mr-1" />
          Configure
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hospital Tenant Management</h1>
          <p className="text-xs text-slate-500">
            Provision hospitals, manage healthcare organizations, and configure Meta WhatsApp Cloud parameters
          </p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" />
          Onboard New Hospital
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <DataTable
          columns={columns}
          data={hospitals}
          keyExtractor={(h) => h.id}
        />
      </div>

      {/* Hospital Configuration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingHospital ? `Configure ${editingHospital.name}` : 'Onboard New Hospital Tenant'}
        subtitle="Manage hospital identity, credentials and WhatsApp Business phone settings"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Hospital Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Apollo Health Center"
              required
            />
            <Input
              label="URL Slug / Identifier"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              placeholder="e.g. apollo-health"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Contact Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 44 2829 0200"
            />
            <Input
              label="Official Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@apollohealth.demo"
            />
          </div>

          <Textarea
            label="Full Postal Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Street, City, Postal Code"
            rows={2}
          />

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Meta WhatsApp Cloud API Configuration
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="WhatsApp Phone Number ID"
                value={formData.whatsapp_phone_number_id}
                onChange={(e) => setFormData({ ...formData, whatsapp_phone_number_id: e.target.value })}
                placeholder="e.g. 109283746501928"
              />
              <Input
                label="WhatsApp Business Account ID"
                value={formData.whatsapp_business_account_id}
                onChange={(e) => setFormData({ ...formData, whatsapp_business_account_id: e.target.value })}
                placeholder="e.g. 982019284710293"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={formData.whatsapp_enabled}
                onChange={(e) => setFormData({ ...formData, whatsapp_enabled: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-slate-700">
                Enable WhatsApp Patient Interface for this Hospital
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingHospital ? 'Save Changes' : 'Create Hospital'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
