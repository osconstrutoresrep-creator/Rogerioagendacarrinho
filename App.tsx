
import React, { useState, useEffect, useCallback } from 'react';
import { View, User, Schedule, Appointment, Role } from './types';
import { api } from './api';

// Components
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import UserManagement from './components/UserManagement';
import ScheduleConfig from './components/ScheduleConfig';
import BookingFlow from './components/BookingFlow';
import ProfileView from './components/ProfileView';
import AllAppointments from './components/AllAppointments';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('LOGIN');
  const [db, setDb] = useState<{ users: User[], schedules: Schedule[], appointments: Appointment[], announcements: any[] }>({ users: [], schedules: [], appointments: [], announcements: [] });
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  // Persistence effect
  const fetchData = useCallback(async () => {
    try {
      const [users, schedules, appointments, announcements] = await Promise.all([
        api.getUsers(),
        api.getSchedules(),
        api.getAppointments(),
        api.getAnnouncements()
      ]);
      setDb({ users, schedules, appointments, announcements });
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const user = await api.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setCurrentView('DASHBOARD');
      }
    };
    checkUser();
    fetchData();
  }, [fetchData]);

  // Handle Login
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('DASHBOARD');
  };

  const handleLogout = async () => {
    await api.signOut();
    setCurrentUser(null);
    setCurrentView('LOGIN');
  };

  const updateDB = useCallback((updater: (prev: any) => any) => {
    setDb(prev => {
      const next = updater(prev);
      return { ...next };
    });
  }, []);

  // We need to pass fetchData to components so they can refresh


  const navigateToBooking = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setCurrentView('BOOKING');
  };

  const renderView = () => {
    if (!currentUser && currentView !== 'LOGIN') return <Login onLogin={handleLogin} />;

    switch (currentView) {
      case 'LOGIN':
        return <Login onLogin={handleLogin} />;
      case 'DASHBOARD':
        return currentUser?.role === 'ADMIN' ? (
          <AdminDashboard
            user={currentUser}
            db={db}
            onNavigate={setCurrentView}
            onSelectSchedule={navigateToBooking}
            onLogout={handleLogout}
            updateDB={updateDB}
            refreshData={fetchData}
          />
        ) : (
          <UserDashboard
            user={currentUser!}
            db={db}
            updateDB={updateDB}
            refreshData={fetchData}
            onNavigate={setCurrentView}
            onSelectSchedule={navigateToBooking}
            onLogout={handleLogout}
          />
        );
      case 'USER_MANAGEMENT':
        return <UserManagement db={db} updateDB={updateDB} refreshData={fetchData} onBack={() => setCurrentView('DASHBOARD')} />;
      case 'SCHEDULE_CONFIG':
        return <ScheduleConfig db={db} updateDB={updateDB} refreshData={fetchData} onBack={() => setCurrentView('DASHBOARD')} />;
      case 'BOOKING':
        return <BookingFlow
          user={currentUser!}
          schedule={selectedSchedule!}
          db={db}
          updateDB={updateDB}
          refreshData={fetchData}
          onBack={() => setCurrentView('DASHBOARD')}
        />;
      case 'PROFILE':
        return <ProfileView user={currentUser!} updateDB={updateDB} onBack={() => setCurrentView('DASHBOARD')} onLogout={handleLogout} />;
      case 'ALL_APPOINTMENTS':
        return <AllAppointments db={db} updateDB={updateDB} onBack={() => setCurrentView('DASHBOARD')} />;
      default:
        return currentUser?.role === 'ADMIN' ? (
          <AdminDashboard
            user={currentUser!}
            db={db}
            updateDB={updateDB}
            refreshData={fetchData}
            onNavigate={setCurrentView}
            onSelectSchedule={navigateToBooking}
            onLogout={handleLogout}
          />
        ) : (
          <UserDashboard
            user={currentUser!}
            db={db}
            updateDB={updateDB}
            refreshData={fetchData}
            onNavigate={setCurrentView}
            onSelectSchedule={navigateToBooking}
            onLogout={handleLogout}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      {renderView()}
    </div>
  );
};

export default App;
