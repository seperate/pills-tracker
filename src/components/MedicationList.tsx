import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Check, X, Sun, Sunset, Moon } from 'lucide-react';
import type { StaticMedication, MedicationLog } from '../types';

interface MedicationListProps {
  medications: StaticMedication[];
  logs: MedicationLog[];
  onLogMedication: (medicationId: string, timeSlot: string, taken: boolean) => void;
}

type TimeCategory = 'morning' | 'afternoon' | 'evening' | 'all';

export function MedicationList({ medications, logs, onLogMedication }: MedicationListProps) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<TimeCategory>('all');
  const today = new Date();

  const categorizeTimeSlot = (timeSlot: string): TimeCategory => {
    const hour = parseInt(timeSlot.split(':')[0]);
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    return 'evening';
  };

  const categorizedMedications = useMemo(() => {
    const medicationsWithCategories = medications.flatMap(medication =>
      medication.timeSlots.map(timeSlot => ({
        ...medication,
        timeSlot,
        category: categorizeTimeSlot(timeSlot)
      }))
    );

    return {
      morning: medicationsWithCategories.filter(med => med.category === 'morning'),
      afternoon: medicationsWithCategories.filter(med => med.category === 'afternoon'),
      evening: medicationsWithCategories.filter(med => med.category === 'evening')
    };
  }, [medications]);
  
  const getMedicationStatus = (medication: StaticMedication, timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':');
    const targetTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      parseInt(hours),
      parseInt(minutes)
    );

    const log = logs.find(
      (log) => {
        const logDate = new Date(log.timestamp);
        return log.medicationId === medication.id && 
               logDate.getHours() === targetTime.getHours() && 
               logDate.getMinutes() === targetTime.getMinutes() &&
               logDate.getDate() === targetTime.getDate();
      }
    );
    return log?.taken;
  };

  const renderMedicationCard = (medication: StaticMedication & { timeSlot: string }) => {
    const status = getMedicationStatus(medication, medication.timeSlot);
    
    return (
      <div key={`${medication.id}-${medication.timeSlot}`} className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{medication.name}</h3>
            <p className="text-sm text-gray-600">{medication.dosage}</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-gray-500 mr-2" />
            <span className="text-sm font-medium">{medication.timeSlot}</span>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onLogMedication(medication.id, medication.timeSlot, true)}
              className={`p-2 rounded-full transition-colors ${
                status === true
                  ? 'bg-green-100 text-green-600'
                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
              }`}
              title={t('schedule.markAsTaken')}
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={() => onLogMedication(medication.id, medication.timeSlot, false)}
              className={`p-2 rounded-full transition-colors ${
                status === false
                  ? 'bg-red-100 text-red-600'
                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
              }`}
              title={t('schedule.markAsNotTaken')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {medication.notes && (
          <div className="mt-4 text-sm text-gray-600">
            <p className="italic">{medication.notes}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex space-x-2 min-w-max sm:min-w-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="w-5 h-5 mr-2" />
            {t('medications.categories.all')}
          </button>
          <button
            onClick={() => setSelectedCategory('morning')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
              selectedCategory === 'morning'
                ? 'bg-yellow-100 text-yellow-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sun className="w-5 h-5 mr-2" />
            {t('time.morning')}
          </button>
          <button
            onClick={() => setSelectedCategory('afternoon')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
              selectedCategory === 'afternoon'
                ? 'bg-orange-100 text-orange-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sunset className="w-5 h-5 mr-2" />
            {t('time.afternoon')}
          </button>
          <button
            onClick={() => setSelectedCategory('evening')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
              selectedCategory === 'evening'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Moon className="w-5 h-5 mr-2" />
            {t('time.evening')}
          </button>
        </div>
      </div>

      {medications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('medications.noMedications')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(categorizedMedications).map(([category, meds]) => {
            if (selectedCategory !== 'all' && category !== selectedCategory) return null;
            if (meds.length === 0) return null;

            return (
              <div key={category} className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 px-1">
                  {t(`time.${category}`)}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {meds.map((medication) => (
                    <div
                      key={`${medication.id}-${medication.timeSlot}`}
                      className="bg-white rounded-lg shadow-md overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 break-words">
                              {medication.name}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1 break-words">
                              {medication.dosage}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center min-w-0">
                            <Clock className="w-5 h-5 text-gray-500 flex-shrink-0 mr-2" />
                            <span className="text-sm font-medium truncate">
                              {medication.timeSlot}
                            </span>
                          </div>
                          
                          <div className="flex space-x-2 ml-2">
                            <button
                              onClick={() => onLogMedication(medication.id, medication.timeSlot, true)}
                              className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                                getMedicationStatus(medication, medication.timeSlot) === true
                                  ? 'bg-green-100 text-green-600'
                                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title={t('schedule.markAsTaken')}
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => onLogMedication(medication.id, medication.timeSlot, false)}
                              className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                                getMedicationStatus(medication, medication.timeSlot) === false
                                  ? 'bg-red-100 text-red-600'
                                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title={t('schedule.markAsNotTaken')}
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {medication.notes && (
                          <div className="mt-4 text-sm text-gray-600">
                            <p className="italic break-words">{medication.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}