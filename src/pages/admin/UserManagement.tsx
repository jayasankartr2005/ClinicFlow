// ==============================================================================
// ClinicFlow — Administrator: User & Role Management
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Profile, UserRole, Department, Specialization } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SearchFilterBar } from '@/components/common/SearchFilterBar';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { useToast } from '@/contexts/ToastContext';
import { formatDate } from '@/lib/dateUtils';
import { Users, UserPlus, Shield, UserCheck, Stethoscope, Power, Edit3, Clock, Calendar, Check, Save } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const UserManagement: React.FC = () => {
  const { success, error } = useToast();
  const { user: currentUser, hospital } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State for New Staff User
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'doctor' as UserRole,
    department_id: '',
    specialization_id: '',
    license_number: '',
    consultation_fee: 500,
    room_number: '',
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as string[],
    start_time: '09:00',
    end_time: '17:00',
    slot_duration_minutes: 30,
  });

  // Modal State for Doctor Schedule / Slots Management
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Profile | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as string[],
    start_time: '09:00',
    end_time: '17:00',
    slot_duration_minutes: 30,
    consultation_fee: 500,
    room_number: '',
    department_id: '',
    specialization_id: '',
  });
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const [usersData, deptsData, specsData] = await Promise.all([
        api.users.getAll(hospital?.id),
        api.departments.getAll(hospital?.id),
        api.departments.getSpecializations(),
      ]);
      setUsers(usersData);
      setDepartments(deptsData);
      setSpecializations(specsData);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [hospital?.id]);

  const handleToggleStatus = async (user: Profile) => {
    try {
      await api.users.toggleStatus(user.id, !user.is_active);
      success(`User account ${!user.is_active ? 'activated' : 'deactivated'}.`);
      loadUsers();
    } catch (err: any) {
      error(err.message || 'Failed to update user status.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.full_name || !newUserData.email || !newUserData.phone) {
      error('Please complete all required fields.');
      return;
    }

    try {
      if (newUserData.role === 'patient') {
        await api.patients.registerPatient({
          full_name: newUserData.full_name,
          email: newUserData.email,
          phone: newUserData.phone,
          date_of_birth: '1995-01-01',
          gender: 'male',
          address: 'Chennai, India',
          emergency_contact_name: 'Emergency Contact',
          emergency_contact_phone: newUserData.phone,
        }, hospital?.id);
      } else {
        await api.users.createStaff({
          full_name: newUserData.full_name,
          email: newUserData.email,
          phone: newUserData.phone,
          role: newUserData.role,
          hospital_id: hospital?.id,
          department_id: newUserData.department_id || undefined,
          specialization_id: newUserData.specialization_id || undefined,
          license_number: newUserData.license_number || undefined,
          consultation_fee: Number(newUserData.consultation_fee) || 500,
          room_number: newUserData.room_number || undefined,
          available_days: newUserData.role === 'doctor' ? newUserData.available_days : undefined,
          start_time: newUserData.role === 'doctor' ? (newUserData.start_time.includes(':') && newUserData.start_time.split(':').length === 2 ? `${newUserData.start_time}:00` : newUserData.start_time) : undefined,
          end_time: newUserData.role === 'doctor' ? (newUserData.end_time.includes(':') && newUserData.end_time.split(':').length === 2 ? `${newUserData.end_time}:00` : newUserData.end_time) : undefined,
          slot_duration_minutes: newUserData.role === 'doctor' ? Number(newUserData.slot_duration_minutes) : undefined,
        });
        success(
          `✅ ${newUserData.role.charAt(0).toUpperCase() + newUserData.role.slice(1)} created! ` +
          `Login: ${newUserData.email} | Password: ClinicFlow@2024`
        );
      }

      setIsAddModalOpen(false);
      setNewUserData({
        full_name: '',
        email: '',
        phone: '',
        role: 'doctor',
        department_id: '',
        specialization_id: '',
        license_number: '',
        consultation_fee: 500,
        room_number: '',
        available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        start_time: '09:00',
        end_time: '17:00',
        slot_duration_minutes: 30,
      });
      loadUsers();
    } catch (err: any) {
      error(err.message || 'Failed to create user account.');
    }
  };

  const handleOpenScheduleModal = async (doctorUser: Profile) => {
    setSelectedDoctor(doctorUser);
    setIsScheduleModalOpen(true);
    try {
      const docDetails = await api.doctors.getById(doctorUser.id);
      const dp = docDetails?.doctor_profile;
      if (dp) {
        setScheduleForm({
          available_days: dp.available_days && dp.available_days.length > 0 ? dp.available_days : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          start_time: dp.start_time ? dp.start_time.slice(0, 5) : '09:00',
          end_time: dp.end_time ? dp.end_time.slice(0, 5) : '17:00',
          slot_duration_minutes: dp.slot_duration_minutes || 30,
          consultation_fee: dp.consultation_fee || 500,
          room_number: dp.room_number || '',
          department_id: dp.department_id || '',
          specialization_id: dp.specialization_id || '',
        });
      } else {
        setScheduleForm({
          available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          start_time: '09:00',
          end_time: '17:00',
          slot_duration_minutes: 30,
          consultation_fee: 500,
          room_number: '',
          department_id: '',
          specialization_id: '',
        });
      }
    } catch (err) {
      console.error('Failed to load doctor profile', err);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    if (scheduleForm.available_days.length === 0) {
      error('Please select at least one available working day.');
      return;
    }

    setIsSavingSchedule(true);
    try {
      const sTime = scheduleForm.start_time.includes(':') && scheduleForm.start_time.split(':').length === 2 ? `${scheduleForm.start_time}:00` : scheduleForm.start_time;
      const eTime = scheduleForm.end_time.includes(':') && scheduleForm.end_time.split(':').length === 2 ? `${scheduleForm.end_time}:00` : scheduleForm.end_time;

      await api.doctors.updateDoctorProfile(selectedDoctor.id, {
        available_days: scheduleForm.available_days,
        start_time: sTime,
        end_time: eTime,
        slot_duration_minutes: Number(scheduleForm.slot_duration_minutes),
        consultation_fee: Number(scheduleForm.consultation_fee),
        room_number: scheduleForm.room_number,
        department_id: scheduleForm.department_id || null,
        specialization_id: scheduleForm.specialization_id || null,
      });

      success(`Schedule and consultation slots updated for ${selectedDoctor.full_name}!`);
      setIsScheduleModalOpen(false);
      loadUsers();
    } catch (err: any) {
      error(err.message || 'Failed to save doctor schedule.');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone && user.phone.includes(searchQuery));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const columns: Column<Profile>[] = [
    {
      key: 'name',
      header: 'User Identity',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-200">
            {u.full_name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{u.full_name}</p>
            <p className="text-xs text-slate-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (u) => <span className="text-xs text-slate-600 font-mono">{u.phone || '—'}</span>,
    },
    {
      key: 'role',
      header: 'System Role',
      render: (u) => <StatusBadge status={u.role} variant="role" size="sm" />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => <StatusBadge status={u.is_active ? 'active' : 'inactive'} variant="active" size="sm" />,
    },
    {
      key: 'created',
      header: 'Joined',
      render: (u) => <span className="text-xs text-slate-500">{formatDate(u.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (u) => (
        <div className="flex items-center gap-2">
          {u.role === 'doctor' && (
            <button
              onClick={() => handleOpenScheduleModal(u)}
              className="p-1.5 rounded-lg border border-sky-200 text-sky-700 bg-sky-50/70 hover:bg-sky-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Configure Working Days & Slot Durations"
            >
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Slots & Hours</span>
            </button>
          )}
          <button
            onClick={() => handleToggleStatus(u)}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
              u.is_active
                ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
            }`}
            title={u.is_active ? 'Deactivate User' : 'Activate User'}
          >
            <Power className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{u.is_active ? 'Deactivate' : 'Activate'}</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">User Directory & Roles</h1>
          <p className="text-xs text-slate-500">
            RBAC governance, personnel activation, and role assignments
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Add Personnel
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name, email, or phone..."
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={[
          { label: 'Active Personnel', value: 'active' },
          { label: 'Inactive Personnel', value: 'inactive' },
        ]}
        extraActions={
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="doctor">Doctors</option>
              <option value="receptionist">Receptionists</option>
              <option value="patient">Patients</option>
            </select>
          </div>
        }
      />

      {/* Users Data Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        keyExtractor={(u) => u.id}
        isLoading={isLoading}
        emptyTitle="No matching users found"
        emptyDescription="Try adjusting your search terms or role filters."
        pageSize={10}
      />

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Clinic Personnel / User"
        subtitle="Provision a new staff or clinical account with designated RBAC privileges"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              required
              placeholder="e.g. Dr. Rajesh Sharma"
              value={newUserData.full_name}
              onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              required
              placeholder="doctor@clinicflow.demo"
              value={newUserData.email}
              onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
            />
            <Input
              label="Phone Number"
              required
              placeholder="+91 98765 43210"
              value={newUserData.phone}
              onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
            />
            <Select
              label="System Role"
              required
              value={newUserData.role}
              onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
              options={[
                { value: 'doctor', label: 'Doctor (Medical Staff)' },
                { value: 'receptionist', label: 'Receptionist (Front Desk)' },
                { value: 'admin', label: 'Administrator (Operations)' },
                { value: 'patient', label: 'Patient (Self Care)' },
              ]}
            />
          </div>

          {newUserData.role === 'doctor' && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Physician Credentials & Consultation Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Department"
                  value={newUserData.department_id}
                  onChange={(e) => setNewUserData({ ...newUserData, department_id: e.target.value })}
                  options={departments.map(d => ({ value: d.id, label: `${d.name} (${d.code})` }))}
                  placeholder="Select Clinical Department..."
                />
                <Select
                  label="Specialization"
                  value={newUserData.specialization_id}
                  onChange={(e) => setNewUserData({ ...newUserData, specialization_id: e.target.value })}
                  options={specializations
                    .filter(s => !newUserData.department_id || s.department_id === newUserData.department_id)
                    .map(s => ({ value: s.id, label: s.name }))}
                  placeholder="Select Specialization..."
                />
                <Input
                  label="License Number"
                  placeholder="e.g. MCI-CARD-88321"
                  value={newUserData.license_number}
                  onChange={(e) => setNewUserData({ ...newUserData, license_number: e.target.value })}
                />
                <Input
                  label="Consultation Fee (₹)"
                  type="number"
                  placeholder="500"
                  value={newUserData.consultation_fee}
                  onChange={(e) => setNewUserData({ ...newUserData, consultation_fee: Number(e.target.value) })}
                />
                <Input
                  label="Consultation Room"
                  placeholder="e.g. Room 102 (1st Floor)"
                  value={newUserData.room_number}
                  onChange={(e) => setNewUserData({ ...newUserData, room_number: e.target.value })}
                />
                <Select
                  label="Slot Duration"
                  value={String(newUserData.slot_duration_minutes)}
                  onChange={(e) => setNewUserData({ ...newUserData, slot_duration_minutes: Number(e.target.value) })}
                  options={[
                    { value: '15', label: '15 Minutes' },
                    { value: '20', label: '20 Minutes' },
                    { value: '30', label: '30 Minutes (Recommended)' },
                    { value: '45', label: '45 Minutes' },
                    { value: '60', label: '60 Minutes' },
                  ]}
                />
                <Input
                  label="Shift Start Time"
                  type="time"
                  value={newUserData.start_time}
                  onChange={(e) => setNewUserData({ ...newUserData, start_time: e.target.value })}
                />
                <Input
                  label="Shift End Time"
                  type="time"
                  value={newUserData.end_time}
                  onChange={(e) => setNewUserData({ ...newUserData, end_time: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Available Working Days
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_DAYS.map((day) => {
                    const isSelected = newUserData.available_days.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const updated = isSelected
                            ? newUserData.available_days.filter(d => d !== day)
                            : [...newUserData.available_days, day];
                          setNewUserData({ ...newUserData, available_days: updated });
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                          isSelected
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Doctor Schedule & Slot Configuration Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Doctor Slots & Working Hours"
        subtitle={`Configure practice hours, slot intervals, and clinic room for ${selectedDoctor?.full_name || 'physician'}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveSchedule} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Department"
              value={scheduleForm.department_id}
              onChange={(e) => setScheduleForm({ ...scheduleForm, department_id: e.target.value })}
              options={departments.map(d => ({ value: d.id, label: `${d.name} (${d.code})` }))}
              placeholder="Select Clinical Department..."
            />
            <Select
              label="Specialization"
              value={scheduleForm.specialization_id}
              onChange={(e) => setScheduleForm({ ...scheduleForm, specialization_id: e.target.value })}
              options={specializations
                .filter(s => !scheduleForm.department_id || s.department_id === scheduleForm.department_id)
                .map(s => ({ value: s.id, label: s.name }))}
              placeholder="Select Specialization..."
            />
            <Input
              label="Shift Start Time"
              type="time"
              required
              value={scheduleForm.start_time}
              onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
            />
            <Input
              label="Shift End Time"
              type="time"
              required
              value={scheduleForm.end_time}
              onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
            />
            <Select
              label="Appointment Slot Duration"
              required
              value={String(scheduleForm.slot_duration_minutes)}
              onChange={(e) => setScheduleForm({ ...scheduleForm, slot_duration_minutes: Number(e.target.value) })}
              options={[
                { value: '15', label: '15 Minutes' },
                { value: '20', label: '20 Minutes' },
                { value: '30', label: '30 Minutes' },
                { value: '45', label: '45 Minutes' },
                { value: '60', label: '60 Minutes' },
              ]}
            />
            <Input
              label="Consultation Fee (₹)"
              type="number"
              required
              placeholder="500"
              value={scheduleForm.consultation_fee}
              onChange={(e) => setScheduleForm({ ...scheduleForm, consultation_fee: Number(e.target.value) })}
            />
            <div className="sm:col-span-2">
              <Input
                label="Consultation Room / OPD Station"
                placeholder="e.g. Room 102 (1st Floor)"
                value={scheduleForm.room_number}
                onChange={(e) => setScheduleForm({ ...scheduleForm, room_number: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Available Clinical Days
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map((day) => {
                const isSelected = scheduleForm.available_days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const updated = isSelected
                        ? scheduleForm.available_days.filter(d => d !== day)
                        : [...scheduleForm.available_days, day];
                      setScheduleForm({ ...scheduleForm, available_days: updated });
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{day}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSavingSchedule} leftIcon={<Save className="w-4 h-4" />}>
              Save Schedule & Slots
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
