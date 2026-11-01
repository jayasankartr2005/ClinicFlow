// ==============================================================================
// ClinicFlow — Structured Prescription Builder Component
// Enables doctors to compose structured, multi-drug electronic prescriptions
// ==============================================================================

import React from 'react';
import { Plus, Trash2, Pill, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';

export interface PrescriptionItem {
  id?: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PrescriptionBuilderProps {
  prescriptions: PrescriptionItem[];
  onChange: (prescriptions: PrescriptionItem[]) => void;
}

export const PrescriptionBuilder: React.FC<PrescriptionBuilderProps> = ({
  prescriptions,
  onChange,
}) => {
  const handleAddMedicine = () => {
    onChange([
      ...prescriptions,
      {
        medication_name: '',
        dosage: '',
        frequency: '1-0-1 (After food)',
        duration: '5 days',
        instructions: '',
      },
    ]);
  };

  const handleRemoveMedicine = (index: number) => {
    const updated = prescriptions.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleFieldChange = (index: number, field: keyof PrescriptionItem, value: string) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addTemplate = (template: PrescriptionItem) => {
    onChange([...prescriptions, template]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Electronic Rx Prescriptions ({prescriptions.length})
            </h4>
            <p className="text-[11px] text-slate-500">Structured medication dosage & frequency</p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddMedicine}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Medication
        </Button>
      </div>

      {/* Quick Medication Templates */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" /> Quick Add:
        </span>
        <button
          type="button"
          onClick={() =>
            addTemplate({
              medication_name: 'Paracetamol 650mg',
              dosage: '1 tablet',
              frequency: '1-0-1 (After food)',
              duration: '3 days',
              instructions: 'Take for fever or mild pain. Keep 6h gap.',
            })
          }
          className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
        >
          + Paracetamol 650
        </button>
        <button
          type="button"
          onClick={() =>
            addTemplate({
              medication_name: 'Pantoprazole 40mg',
              dosage: '1 tablet',
              frequency: '1-0-0 (Morning empty stomach)',
              duration: '5 days',
              instructions: 'Take 30 minutes before breakfast.',
            })
          }
          className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
        >
          + Pantoprazole 40
        </button>
        <button
          type="button"
          onClick={() =>
            addTemplate({
              medication_name: 'Amoxicillin + Clavulanic Acid 625mg',
              dosage: '1 tablet',
              frequency: '1-0-1 (After food)',
              duration: '5 days',
              instructions: 'Complete the entire antibiotic course.',
            })
          }
          className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
        >
          + Amox-Clav 625
        </button>
        <button
          type="button"
          onClick={() =>
            addTemplate({
              medication_name: 'Cetirizine 10mg',
              dosage: '1 tablet',
              frequency: '0-0-1 (At bedtime)',
              duration: '5 days',
              instructions: 'May cause mild drowsiness.',
            })
          }
          className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
        >
          + Cetirizine 10
        </button>
      </div>

      {/* Prescription Rows */}
      {prescriptions.length === 0 ? (
        <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50">
          <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600">No medications added yet</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Click "Add Medication" or use a quick template above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx, index) => (
            <div
              key={index}
              className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 relative group transition-all hover:bg-white hover:shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                  Medication #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveMedicine(index)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                  title="Remove medication"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Medication Name & Strength *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Atorvastatin 20mg"
                    value={rx.medication_name}
                    onChange={(e) => handleFieldChange(index, 'medication_name', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Dosage *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1 tab, 5 ml"
                    value={rx.dosage}
                    onChange={(e) => handleFieldChange(index, 'dosage', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Frequency *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1-0-1 (After food)"
                    value={rx.frequency}
                    onChange={(e) => handleFieldChange(index, 'frequency', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Duration *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5 days, 1 month"
                    value={rx.duration}
                    onChange={(e) => handleFieldChange(index, 'duration', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Special Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Take with warm water before bedtime"
                    value={rx.instructions}
                    onChange={(e) => handleFieldChange(index, 'instructions', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
