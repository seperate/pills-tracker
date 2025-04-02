import React, { useState, useEffect } from 'react';
import { PlusCircle, X } from 'lucide-react';
import type { Medication, StaticMedication } from '../types';

interface MedicationFormProps {
  onAdd: (medication: Omit<Medication, 'id'>) => void;
  initialData?: StaticMedication;
  onCancel?: () => void;
}

export function MedicationForm({ onAdd, initialData, onCancel }: MedicationFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [dosage, setDosage] = useState(initialData?.dosage || '');
  const [frequency, setFrequency] = useState(initialData?.frequency || 1);
  const [timeSlots, setTimeSlots] = useState(initialData?.timeSlots || ['08:00']);
  const [notes, setNotes] = useState(initialData?.notes || '');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDosage(initialData.dosage);
      setFrequency(initialData.frequency);
      setTimeSlots(initialData.timeSlots);
      setNotes(initialData.notes || '');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name,
      dosage,
      frequency,
      timeSlots,
      notes,
    });
    if (!initialData) {
      setName('');
      setDosage('');
      setFrequency(1);
      setTimeSlots(['08:00']);
      setNotes('');
    }
  };

  const handleFrequencyChange = (newFrequency: number) => {
    setFrequency(newFrequency);
    // Generate default time slots based on frequency
    const newTimeSlots = Array.from({ length: newFrequency }, (_, i) => {
      const hour = Math.floor(8 + (i * 24) / newFrequency);
      return `${String(hour).padStart(2, '0')}:00`;
    });
    setTimeSlots(newTimeSlots);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Medication Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="dosage" className="block text-sm font-medium text-gray-700">
          Dosage
        </label>
        <input
          type="text"
          id="dosage"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          required
          placeholder="e.g., 50mg"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
          Times per Day
        </label>
        <select
          id="frequency"
          value={frequency}
          onChange={(e) => handleFrequencyChange(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n} time{n > 1 ? 's' : ''} per day
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Time Slots</label>
        <div className="space-y-2">
          {timeSlots.map((time, index) => (
            <input
              key={index}
              type="time"
              value={time}
              onChange={(e) => {
                const newTimeSlots = [...timeSlots];
                newTimeSlots[index] = e.target.value;
                setTimeSlots(newTimeSlots);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div className="flex space-x-4">
        <button
          type="submit"
          className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          {initialData ? 'Update' : 'Add'} Medication
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <X className="w-5 h-5 mr-2" />
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}