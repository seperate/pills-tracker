import React from 'react';
import { Clock, Plus, Minus, Edit, Trash2 } from 'lucide-react';
import type { StaticMedication } from '../types';

interface StaticMedicationListProps {
  medications: StaticMedication[];
  onToggleMedication: (id: string) => void;
  onEditMedication: (medication: StaticMedication) => void;
  onDeleteMedication: (id: string) => void;
}

export function StaticMedicationList({ 
  medications, 
  onToggleMedication, 
  onEditMedication,
  onDeleteMedication 
}: StaticMedicationListProps) {
  return (
    <div className="space-y-4">
      {medications.map((medication) => (
        <div 
          key={medication.id} 
          className={`bg-white p-6 rounded-lg shadow-md transition-opacity ${
            medication.isActive ? 'opacity-100' : 'opacity-50'
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{medication.name}</h3>
              <p className="text-sm text-gray-600">{medication.dosage}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onEditMedication(medication)}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                title="Edit medication"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => onToggleMedication(medication.id)}
                className={`p-2 ${
                  medication.isActive 
                    ? 'text-red-600 hover:bg-red-100' 
                    : 'text-green-600 hover:bg-green-100'
                } rounded-full`}
                title={medication.isActive ? 'Deactivate medication' : 'Activate medication'}
              >
                {medication.isActive ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete ${medication.name}?`)) {
                    onDeleteMedication(medication.id);
                  }
                }}
                className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                title="Delete medication"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {medication.timeSlots.map((timeSlot, index) => (
              <div key={index} className="flex items-center p-2 bg-gray-50 rounded-md">
                <Clock className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium">{timeSlot}</span>
              </div>
            ))}
          </div>

          {medication.notes && (
            <div className="mt-4 text-sm text-gray-600">
              <p className="italic">{medication.notes}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}