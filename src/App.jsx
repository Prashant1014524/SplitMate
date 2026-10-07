import React from 'react';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AddExpenseModal from './components/Modals/AddExpenseModal';
import SettleUpModal from './components/Modals/SettleUpModal';
import CreateGroupModal from './components/Modals/CreateGroupModal';
import ProfileModal from './components/Modals/ProfileModal';
import Dashboard from './pages/Dashboard';
import PersonalExpenses from './pages/PersonalExpenses';
import Groups from './pages/Groups';
import Analytics from './pages/Analytics';
import Auth from './pages/Auth';

export default function App() {
  const { currentUser, activeTab } = useApp();

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full overflow-y-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'expenses' && <PersonalExpenses />}
          {activeTab === 'groups' && <Groups />}
          {activeTab === 'analytics' && <Analytics />}
        </main>
      </div>

      {/* Global Modals */}
      <AddExpenseModal />
      <SettleUpModal />
      <CreateGroupModal />
      <ProfileModal />
    </div>
  );
}
