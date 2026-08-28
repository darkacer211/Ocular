import React from 'react';
import { EyePrescription } from '../../types';
import { Eye, Stethoscope } from 'lucide-react';

interface PrescriptionFormProps {
  prescription: EyePrescription;
  onChange: (prescription: EyePrescription) => void;
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({ prescription, onChange }) => {
  const handleChange = (field: keyof EyePrescription, value: string) => {
    onChange({
      ...prescription,
      [field]: value,
    });
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-brand-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Optical Prescription Details (Optional)
          </h4>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">OD: Right Eye | OS: Left Eye</span>
      </div>

      {/* Prescription Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-200/60 text-slate-700 font-semibold">
              <th className="p-2 rounded-l-lg">Eye</th>
              <th className="p-2">SPH (Sphere)</th>
              <th className="p-2">CYL (Cylinder)</th>
              <th className="p-2">AXIS</th>
              <th className="p-2 rounded-r-lg">ADD (Near Add)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {/* OD / Right Eye */}
            <tr>
              <td className="p-2 font-bold text-brand-700 bg-brand-50/50">
                OD (Right)
              </td>
              <td className="p-1.5">
                <input
                  type="text"
                  placeholder="-1.75"
                  value={prescription.sphere_od || ''}
                  onChange={(e) => handleChange('sphere_od', e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-mono focus:border-brand-500 focus:outline-none"
                />
              </td>
              <td className="p-1.5">
                <input
                  type="text"
                  placeholder="-0.50"
                  value={prescription.cylinder_od || ''}
                  onChange={(e) => handleChange('cylinder_od', e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-mono focus:border-brand-500 focus:outline-none"
                />
              </td>
              <td className="p-1.5">
                <input
                  type="text"
                  placeholder="90°"
                  value={prescription.axis_od || ''}
                  onChange={(e) => handleChange('axis_od', e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-mono focus:border-brand-500 focus:outline-none"
                />
              </td>
              <td className="p-1.5">
                <input
                  type="text"
                  placeholder="+1.50"
                  value={prescription.add_od || ''}
                  onChange={(e) => handleChange('add_od', e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-mono focus:border-brand-500 focus:outline-none"
                />
              </td>
            </tr>

            {/* OS / Left Eye */}
            <tr>
              <td className="p-2 font-bold text-sky-700 bg-sky-50/50">
                OS (Left)
              </td>
              <td className="p-1.5">
                <input
                  type="text"
                  placeholder="-2.00"
                  value={prescription.sphere_os || ''}
                  onChange={(e) => handleChange('sphere_os', e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-mono focus:border-brand-500 focus:outline-none"
                />
              </td>
              <td className="p-1.5">
                <input
                  type="text"
                  placeholder="-0.75"
                  value={prescription.cylinder_os || ''}
                  onChange={(e) => handleChange('cylinder_os', e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-mono focus:border-brand-500 focus:outline-none"
                />
              </td>
              <td className="p-1.5">
                <input
                  type="text"
                  placeholder="180°"
                  value={prescription.axis_os || ''}
                  onChange={(e) => handleChange('axis_os', e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-mono focus:border-brand-500 focus:outline-none"
                />
              </td>
              <td className="p-1.5">
                <input
                  type="text"
                  placeholder="+1.50"
                  value={prescription.add_os || ''}
                  onChange={(e) => handleChange('add_os', e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-mono focus:border-brand-500 focus:outline-none"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Additional Prescription Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Pupillary Distance (PD mm)
          </label>
          <input
            type="text"
            placeholder="e.g. 64 mm"
            value={prescription.pd || ''}
            onChange={(e) => handleChange('pd', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Prescribing Doctor / Optometrist
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Dr. Joshi"
              value={prescription.doctor_name || ''}
              onChange={(e) => handleChange('doctor_name', e.target.value)}
              className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-1.5 text-xs focus:border-brand-500 focus:outline-none"
            />
            <Stethoscope className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Prescription Notes
          </label>
          <input
            type="text"
            placeholder="e.g. Blue cut filter required"
            value={prescription.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
