import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('split_theme') || 'light';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const cached = localStorage.getItem('split_user');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('split_token'));
  const [loading, setLoading] = useState(() => {
    const hasToken = localStorage.getItem('split_token');
    const hasUser = localStorage.getItem('split_user');
    return Boolean(hasToken && !hasUser);
  });

  // Database-backed State
  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);

  // UI Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [settleUpPreset, setSettleUpPreset] = useState(null);

  const openSettleUpWithData = (preset) => {
    setSettleUpPreset(preset);
    setIsSettleUpOpen(true);
  };

  // Sync theme
  useEffect(() => {
    localStorage.setItem('split_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Synchronize browser history for seamless mobile back-button navigation
  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
        if (e.state.groupId) {
          setSelectedGroupId(e.state.groupId);
        }
      } else {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      window.history.replaceState({ tab: 'dashboard' }, '');
    } else {
      window.history.pushState({ tab: activeTab, groupId: selectedGroupId }, '');
    }
  }, [activeTab, selectedGroupId]);

  // Fetch all user data from backend
  const refreshData = useCallback(async () => {
    if (!token) return;
    try {
      const [groupsData, expensesData, settlementsData] = await Promise.all([
        api.getGroups(),
        api.getExpenses(),
        api.getSettlements()
      ]);

      setGroups(groupsData.groups || []);
      setExpenses(expensesData.expenses || []);
      setSettlements(settlementsData.settlements || []);

      if (groupsData.groups && groupsData.groups.length > 0) {
        setSelectedGroupId(prev => prev || groupsData.groups[0].id);
      }
    } catch (err) {
      console.error('Failed to refresh data from server:', err);
    }
  }, [token]);

  // Initial authentication check on load
  useEffect(() => {
    async function initAuth() {
      const savedToken = localStorage.getItem('split_token');
      if (savedToken) {
        try {
          const res = await api.getMe();
          setCurrentUser(res.user);
          localStorage.setItem('split_user', JSON.stringify(res.user));
          setToken(savedToken);
        } catch (err) {
          console.warn('Session expired or invalid token:', err.message);
          localStorage.removeItem('split_token');
          localStorage.removeItem('split_user');
          setCurrentUser(null);
          setToken(null);
        }
      } else {
        localStorage.removeItem('split_user');
        setCurrentUser(null);
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  // Fetch groups, expenses, and settlements when authenticated
  useEffect(() => {
    if (currentUser && token) {
      refreshData();
    }
  }, [currentUser, token, refreshData]);

  // Real-Time Background Synchronization (Periodic 4s polling + immediate refresh on tab focus)
  useEffect(() => {
    if (!currentUser || !token) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    }, 4000);

    const handleSync = () => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    };

    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
    };
  }, [currentUser, token, refreshData]);

  // Handle URL Invite Link (?join=<groupId>)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinId = params.get('join');

    if (joinId) {
      if (currentUser && token) {
        // Automatically join the group
        api.joinGroup(joinId)
          .then(() => refreshData())
          .then(() => {
            setSelectedGroupId(joinId);
            setActiveTab('groups');
            const url = new URL(window.location);
            url.searchParams.delete('join');
            window.history.replaceState({}, document.title, url.pathname);
          })
          .catch(err => console.error('Failed to join group from URL:', err));
      } else {
        localStorage.setItem('pending_join_group', joinId);
      }
    }
  }, [currentUser, token, refreshData]);

  // Auth Actions
  const loginUser = async (email, password) => {
    try {
      const data = await api.login(email, password);
      localStorage.setItem('split_token', data.token);
      localStorage.setItem('split_user', JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);

      // Handle pending join if any
      const pendingJoin = localStorage.getItem('pending_join_group');
      if (pendingJoin) {
        localStorage.removeItem('pending_join_group');
        await api.joinGroup(pendingJoin).catch(console.error);
        await refreshData();
        setSelectedGroupId(pendingJoin);
        setActiveTab('groups');
      }

      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const googleLoginUser = async (credential) => {
    try {
      const data = await api.googleLogin(credential);
      localStorage.setItem('split_token', data.token);
      localStorage.setItem('split_user', JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);

      // Handle pending join if any
      const pendingJoin = localStorage.getItem('pending_join_group');
      if (pendingJoin) {
        localStorage.removeItem('pending_join_group');
        await api.joinGroup(pendingJoin).catch(console.error);
        await refreshData();
        setSelectedGroupId(pendingJoin);
        setActiveTab('groups');
      }

      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const registerUser = async (name, email, password, upiId, phone) => {
    try {
      const data = await api.register(name, email, password, upiId, phone);
      localStorage.setItem('split_token', data.token);
      localStorage.setItem('split_user', JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);

      // Handle pending join if any
      const pendingJoin = localStorage.getItem('pending_join_group');
      if (pendingJoin) {
        localStorage.removeItem('pending_join_group');
        await api.joinGroup(pendingJoin).catch(console.error);
        await refreshData();
        setSelectedGroupId(pendingJoin);
        setActiveTab('groups');
      }

      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      const data = await api.updateProfile(profileData);
      localStorage.setItem('split_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      await refreshData();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('split_token');
    localStorage.removeItem('split_user');
    setToken(null);
    setCurrentUser(null);
    setGroups([]);
    setExpenses([]);
    setSettlements([]);
  };

  // Expense Actions
  const addExpense = async (newExpense) => {
    try {
      await api.createExpense(newExpense);
      await refreshData();
    } catch (err) {
      console.error('Failed to create expense:', err);
      alert(err.message || 'Failed to save expense');
    }
  };

  const deleteExpense = async (id) => {
    try {
      await api.deleteExpense(id);
      await refreshData();
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  // Group Actions
  const createGroup = async (name, category, memberEmails) => {
    try {
      const data = await api.createGroup(name, category, memberEmails);
      await refreshData();
      if (data.group) {
        setSelectedGroupId(data.group.id);
      }
    } catch (err) {
      console.error('Failed to create group:', err);
      alert(err.message || 'Failed to create group');
    }
  };

  const joinGroup = async (groupId) => {
    try {
      await api.joinGroup(groupId);
      await refreshData();
      setSelectedGroupId(groupId);
      setActiveTab('groups');
      return { success: true };
    } catch (err) {
      console.error('Failed to join group:', err);
      return { success: false, message: err.message || 'Failed to join group' };
    }
  };

  const deleteGroup = async (groupId) => {
    try {
      await api.deleteGroup(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setExpenses(prev => prev.filter(e => e.groupId !== groupId));
      setSettlements(prev => prev.filter(s => s.groupId !== groupId));
      setSelectedGroupId(null);
      setActiveTab('dashboard');
      await refreshData();
      return { success: true };
    } catch (err) {
      console.error('Failed to delete group:', err);
      return { success: false, message: err.message || 'Failed to delete group' };
    }
  };

  const leaveGroup = async (groupId) => {
    try {
      const res = await api.leaveGroup(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setSelectedGroupId(null);
      setActiveTab('dashboard');
      await refreshData();
      return { success: true, groupDeleted: res?.groupDeleted };
    } catch (err) {
      console.error('Failed to leave group:', err);
      return { success: false, message: err.message || 'Failed to leave group' };
    }
  };

  // Settlement Actions
  const addSettlement = async (groupId, payerId, payeeId, amount) => {
    try {
      await api.createSettlement({ groupId, payerId, payeeId, amount });
      await refreshData();
    } catch (err) {
      console.error('Failed to create settlement:', err);
      alert(err.message || 'Failed to record settlement');
    }
  };

  const deleteSettlement = async (id) => {
    try {
      await api.deleteSettlement(id);
      await refreshData();
    } catch (err) {
      console.error('Failed to delete settlement:', err);
      alert(err.message || 'Failed to delete settlement');
    }
  };

  return (
    <AppContext.Provider value={{
      theme,
      setTheme,
      toggleTheme,
      currentUser,
      token,
      loading,
      groups,
      expenses,
      settlements,
      activeTab,
      setActiveTab,
      selectedGroupId,
      setSelectedGroupId,
      isAddExpenseOpen,
      setIsAddExpenseOpen,
      isCreateGroupOpen,
      setIsCreateGroupOpen,
      isSettleUpOpen,
      setIsSettleUpOpen,
      isProfileOpen,
      setIsProfileOpen,
      settleUpPreset,
      setSettleUpPreset,
      openSettleUpWithData,
      loginUser,
      googleLoginUser,
      registerUser,
      updateUserProfile,
      logoutUser,
      addExpense,
      deleteExpense,
      createGroup,
      joinGroup,
      deleteGroup,
      leaveGroup,
      addSettlement,
      deleteSettlement,
      refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
