import React, { useState, useEffect } from 'react';
import { Pill, LogOut, Calendar, History, Menu } from 'lucide-react';
import { MedicationForm } from './components/MedicationForm';
import { MedicationList } from './components/MedicationList';
import { StaticMedicationList } from './components/StaticMedicationList';
import { MedicationHistory } from './components/MedicationHistory';
import { LoginForm } from './components/LoginForm';
import { supabase } from './lib/supabase';
import type { Medication, MedicationLog, User, StaticMedication } from './types';
import { useTranslation } from 'react-i18next';
import './i18n';

const DEFAULT_MEDICATIONS: StaticMedication[] = [
  {
    id: '1',
    name: 'Aspirin',
    dosage: '100mg',
    frequency: 2,
    timeSlots: ['09:00', '21:00'],
    isActive: true
  },
  {
    id: '2',
    name: 'Vitamin D',
    dosage: '1000 IU',
    frequency: 1,
    timeSlots: ['08:00'],
    isActive: true
  },
  {
    id: '3',
    name: 'Omega-3',
    dosage: '1000mg',
    frequency: 1,
    timeSlots: ['12:00'],
    isActive: false
  }
];

type Page = 'schedule' | 'medications' | 'history';

function App() {
  const { t, i18n } = useTranslation();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [user, setUser] = useState<User>({ 
    username: '', 
    isAuthenticated: false,
    isAdmin: false 
  });
  const [loginError, setLoginError] = useState<string>('');
  const [staticMedications, setStaticMedications] = useState<StaticMedication[]>(DEFAULT_MEDICATIONS);
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState<StaticMedication | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('schedule');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session) {
          const { data: userData, error: userError } = await supabase
            .from('user_roles')
            .select('is_admin')
            .eq('user_id', session.user.id)
            .single();

          setUser({ 
            username: session.user.email || '', 
            isAuthenticated: true,
            isAdmin: userData?.is_admin || false
          });
          loadMedications();
          loadTodayLogs();
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  }, []);

  const loadMedications = async () => {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading medications:', error);
      return;
    }

    if (data) {
      setStaticMedications(data.map(med => ({
        ...med,
        timeSlots: med.time_slots,
        isActive: med.is_active
      })));
    }
  };

  const loadTodayLogs = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.error('No authenticated user found');
      return;
    }

    // First check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('user_roles')
      .select('is_admin')
      .eq('user_id', session.user.id)
      .single();

    if (userError) {
      console.error('Error checking admin status:', userError);
      return;
    }

    const isAdmin = userData?.is_admin || false;

    let query = supabase
      .from('medication_logs')
      .select(`
        *,
        medications (
          name,
          dosage
        )
      `)
      .order('timestamp', { ascending: false });

    // If user is not admin, only show their logs
    if (!isAdmin) {
      query = query.eq('user_id', session.user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading logs:', error);
      return;
    }

    if (data) {
      setLogs(data.map(log => ({
        id: log.id,
        medicationId: log.medication_id,
        timestamp: new Date(log.timestamp).toISOString(),
        taken: log.taken,
        medicationName: log.medications?.name || 'Unknown Medication',
        medicationDosage: log.medications?.dosage || '',
        username: log.user_email || 'Unknown User'
      })));
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setLoginError(error.message);
        return;
      }

      if (data.user) {
        // New users are not admins by default
        setUser({ 
          username: data.user.email || '', 
          isAuthenticated: true,
          isAdmin: false
        });
        setLoginError('');
        loadMedications();
        loadTodayLogs();
      }
    } catch (error) {
      console.error('Error during sign up:', error);
      setLoginError('An unexpected error occurred');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoginError(error.message);
        return;
      }

      if (data.user) {
        // Check if user is admin
        const { data: userData, error: userError } = await supabase
          .from('user_roles')
          .select('is_admin')
          .eq('user_id', data.user.id)
          .single();

        setUser({ 
          username: data.user.email || '', 
          isAuthenticated: true,
          isAdmin: userData?.is_admin || false
        });
        setLoginError('');
        loadMedications();
        loadTodayLogs();
      }
    } catch (error) {
      console.error('Error during login:', error);
      setLoginError('An unexpected error occurred');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    try {
      await supabase.auth.signOut();
      setUser({ username: '', isAuthenticated: false, isAdmin: false });
      setLoginError('');
      setLogs([]);
      setStaticMedications([]);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleToggleMedication = async (id: string) => {
    const medication = staticMedications.find(med => med.id === id);
    if (!medication) return;

    const { error } = await supabase
      .from('medications')
      .update({ is_active: !medication.isActive })
      .eq('id', id);

    if (error) {
      console.error('Error updating medication:', error);
      return;
    }

    setStaticMedications(prev =>
      prev.map(med =>
        med.id === id ? { ...med, isActive: !med.isActive } : med
      )
    );
  };

  const handleEditMedication = (medication: StaticMedication) => {
    setEditingMedication(medication);
    setShowMedicationForm(true);
  };

  const handleAddMedication = async (newMedication: Omit<Medication, 'id'>) => {
    if (editingMedication) {
      const { error } = await supabase
        .from('medications')
        .update({
          name: newMedication.name,
          dosage: newMedication.dosage,
          frequency: newMedication.frequency,
          time_slots: newMedication.timeSlots,
          notes: newMedication.notes
        })
        .eq('id', editingMedication.id);

      if (error) {
        console.error('Error updating medication:', error);
        return;
      }

      setStaticMedications(prev =>
        prev.map(med =>
          med.id === editingMedication.id
            ? {
                ...med,
                ...newMedication,
                id: med.id,
                isActive: med.isActive
              }
            : med
        )
      );
      setEditingMedication(null);
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.error('No authenticated user found');
        return;
      }

      const { data, error } = await supabase
        .from('medications')
        .insert({
          user_id: session.user.id,
          name: newMedication.name,
          dosage: newMedication.dosage,
          frequency: newMedication.frequency,
          time_slots: newMedication.timeSlots,
          notes: newMedication.notes,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding medication:', error);
        return;
      }

      if (data) {
        const medication: StaticMedication = {
          ...data,
          id: data.id,
          timeSlots: data.time_slots,
          isActive: data.is_active
        };
        setStaticMedications(prev => [...prev, medication]);
      }
    }
    setShowMedicationForm(false);
  };

  const handleLogMedication = async (medicationId: string, timeSlot: string, taken: boolean) => {
    const medication = staticMedications.find((m) => m.id === medicationId);
    if (!medication || !medication.isActive) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.error('No authenticated user found');
      return;
    }

    const now = new Date();
    const [hours, minutes] = timeSlot.split(':');
    const timestamp = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      parseInt(hours),
      parseInt(minutes)
    ).toISOString();

    // Check for existing log
    const existingLog = logs.find(
      log => {
        const logDate = new Date(log.timestamp);
        const slotDate = new Date(timestamp);
        return log.medicationId === medicationId && 
               logDate.getHours() === slotDate.getHours() && 
               logDate.getMinutes() === slotDate.getMinutes() &&
               logDate.getDate() === slotDate.getDate();
      }
    );

    if (existingLog) {
      // Update existing log
      const { error } = await supabase
        .from('medication_logs')
        .update({ taken })
        .eq('id', existingLog.id);

      if (error) {
        console.error('Error updating log:', error);
        return;
      }

      setLogs(prev =>
        prev.map(log =>
          log.id === existingLog.id ? { ...log, taken } : log
        )
      );
    } else {
      // Create new log
      const { data, error } = await supabase
        .from('medication_logs')
        .insert({
          user_id: session.user.id,
          medication_id: medicationId,
          timestamp,
          taken,
          user_email: session.user.email
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating log:', error);
        return;
      }

      if (data) {
        const newLog: MedicationLog = {
          id: data.id,
          medicationId: data.medication_id,
          timestamp: new Date(data.timestamp).toISOString(),
          taken: data.taken,
          medicationName: medication.name,
          medicationDosage: medication.dosage,
          username: session.user.email || 'Unknown User'
        };
        setLogs(prev => [...prev, newLog]);
      }
    }
  };

  const handleDeleteMedication = async (id: string) => {
    const { error } = await supabase
      .from('medications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting medication:', error);
      return;
    }

    // Also delete associated logs
    const { error: logsError } = await supabase
      .from('medication_logs')
      .delete()
      .eq('medication_id', id);

    if (logsError) {
      console.error('Error deleting medication logs:', logsError);
    }

    // Update local state
    setStaticMedications(prev => prev.filter(med => med.id !== id));
    setLogs(prev => prev.filter(log => log.medicationId !== id));
  };

  const handleDeleteLog = async (logId: string) => {
    const { error } = await supabase
      .from('medication_logs')
      .delete()
      .eq('id', logId);

    if (error) {
      console.error('Error deleting log:', error);
      return;
    }

    // Update local state
    setLogs(prev => prev.filter(log => log.id !== logId));
  };

  const handleClearAllLogs = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.error('No authenticated user found');
      return;
    }

    const { error } = await supabase
      .from('medication_logs')
      .delete()
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error clearing all logs:', error);
      return;
    }

    // Clear all logs from local state
    setLogs([]);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user.isAuthenticated) {
    return <LoginForm onLogin={handleLogin} onSignUp={handleSignUp} error={loginError} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-full px-4 mx-auto sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Pills Tracker</h1>
              </div>
              {/* Mobile menu button */}
              <div className="sm:hidden">
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-gray-600"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Navigation items */}
            <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:flex sm:items-center sm:space-x-4`}>
              {user.isAuthenticated && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 mt-4 sm:mt-0">
                  <button
                    onClick={() => setCurrentPage('schedule')}
                    className={`${
                      currentPage === 'schedule'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    } flex items-center px-3 py-2 rounded-md text-sm font-medium w-full sm:w-auto justify-center`}
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    {t('schedule.title')}
                  </button>
                  {user?.isAdmin && (
                    <>
                      <button
                        onClick={() => setCurrentPage('medications')}
                        className={`${
                          currentPage === 'medications'
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-500 hover:text-gray-700'
                        } flex items-center px-3 py-2 rounded-md text-sm font-medium w-full sm:w-auto justify-center`}
                      >
                        <Pill className="w-5 h-5 mr-2" />
                        {t('medications.add')}
                      </button>
                      <button
                        onClick={() => setCurrentPage('history')}
                        className={`${
                          currentPage === 'history'
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-500 hover:text-gray-700'
                        } flex items-center px-3 py-2 rounded-md text-sm font-medium w-full sm:w-auto justify-center`}
                      >
                        <History className="w-5 h-5 mr-2" />
                        {t('history.title')}
                      </button>
                    </>
                  )}
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-0">
                {user.isAuthenticated ? (
                  <>
                    <select
                      value={i18n.language}
                      onChange={(e) => changeLanguage(e.target.value)}
                      className="block w-full sm:w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    >
                      <option value="en">English</option>
                      <option value="tr">Türkçe</option>
                    </select>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                    >
                      <LogOut className="w-5 h-5 mr-2" />
                      {t('auth.signOut')}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: {
                        redirectTo: window.location.origin
                      }
                    })}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  >
                    {t('auth.signIn')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {!user.isAdmin && currentPage !== 'schedule' ? (
          <div className="text-center py-8">
            <p className="text-gray-500">You don't have permission to view this page.</p>
          </div>
        ) : currentPage === 'medications' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Manage Medications</h2>
              {!showMedicationForm && (
                <button
                  onClick={() => {
                    setEditingMedication(null);
                    setShowMedicationForm(true);
                  }}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Pill className="w-5 h-5 mr-2" />
                  Add New Medication
                </button>
              )}
            </div>
            {showMedicationForm ? (
              <div className="mb-8">
                <MedicationForm
                  onAdd={handleAddMedication}
                  initialData={editingMedication || undefined}
                  onCancel={() => {
                    setShowMedicationForm(false);
                    setEditingMedication(null);
                  }}
                />
              </div>
            ) : (
              <StaticMedicationList
                medications={staticMedications}
                onToggleMedication={handleToggleMedication}
                onEditMedication={handleEditMedication}
                onDeleteMedication={handleDeleteMedication}
              />
            )}
          </div>
        ) : currentPage === 'schedule' ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Today's Schedule</h2>
            <MedicationList
              medications={staticMedications.filter(m => m.isActive)}
              logs={logs}
              onLogMedication={handleLogMedication}
            />
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Medication History</h2>
            <MedicationHistory
              medications={staticMedications}
              logs={logs}
              onDeleteLog={handleDeleteLog}
              onClearAllLogs={handleClearAllLogs}
              user={user}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;