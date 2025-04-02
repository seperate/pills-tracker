import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, ChevronLeft, ChevronRight, Trash2, Users } from 'lucide-react';
import type { MedicationLog, StaticMedication } from '../types';

interface MedicationHistoryProps {
  medications: StaticMedication[];
  logs: MedicationLog[];
  onDeleteLog: (logId: string) => void;
  onClearAllLogs: () => void;
  user: any;
}

export function MedicationHistory({ medications, logs, onDeleteLog, onClearAllLogs, user }: MedicationHistoryProps) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [selectedUser, setSelectedUser] = useState<string>('all');

  // Get unique users from logs
  const uniqueUsers = useMemo(() => {
    const users = new Set(logs.map(log => log.username));
    return Array.from(users).sort();
  }, [logs]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const getLogsForDate = (date: Date) => {
    return logs.filter(log => {
      const logDate = new Date(log.timestamp);
      const matchesDate = logDate.getDate() === date.getDate() &&
             logDate.getMonth() === date.getMonth() &&
             logDate.getFullYear() === date.getFullYear();
      
      // Apply user filter if selected
      if (selectedUser !== 'all') {
        return matchesDate && log.username === selectedUser;
      }
      return matchesDate;
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedLogs = getLogsForDate(selectedDate);
  const sortedLogs = selectedLogs.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousDay}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {formatDate(selectedDate)}
            {isToday(selectedDate) && ` (${t('schedule.today')})`}
          </h2>
          <button
            onClick={goToNextDay}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            disabled={isToday(selectedDate)}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center space-x-4">
          {user.isAdmin && (
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-500" />
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="all">{t('history.filter.allUsers')}</option>
                {uniqueUsers.map(email => (
                  <option key={email} value={email}>
                    {email}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => {
              if (window.confirm(t('history.clearAllConfirm'))) {
                onClearAllLogs();
              }
            }}
            className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
            title={t('history.clearAll')}
          >
            <Trash2 className="w-5 h-5 mr-2" />
            {t('history.clearAll')}
          </button>
        </div>
      </div>

      {sortedLogs.length > 0 ? (
        <div className="space-y-4">
          {sortedLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white p-4 rounded-lg shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {log.medicationName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {log.medicationDosage}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatTime(log.timestamp)}
                  </p>
                  {user.isAdmin && (
                    <p className="text-xs text-gray-400 mt-1">
                      {t('history.filter.byUser', { email: log.username })}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-full ${
                    log.taken
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {log.taken ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <X className="w-5 h-5" />
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm(t('history.deleteLogConfirm'))) {
                        onDeleteLog(log.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title={t('history.deleteLog')}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">{t('history.noLogs')}</p>
        </div>
      )}
    </div>
  );
} 