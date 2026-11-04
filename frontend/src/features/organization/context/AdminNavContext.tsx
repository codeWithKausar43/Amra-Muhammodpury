'use client';

import React, { createContext, useContext, useState } from 'react';

export type AdminTab =
  | 'MEMBERS'
  | 'APPLICATIONS'
  | 'CONTRIBUTIONS'
  | 'FUNDS'
  | 'TRANSACTIONS'
  | 'COMMITTEES'
  | 'NOTICES'
  | 'ELECTIONS';

interface AdminNavContextType {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isAdminDrawerOpen: boolean;
  setIsAdminDrawerOpen: (open: boolean) => void;
  badgeCounts: {
    fundsCount: number;
    noticesCount: number;
  };
  setBadgeCounts: React.Dispatch<React.SetStateAction<{ fundsCount: number; noticesCount: number }>>;
}

const AdminNavContext = createContext<AdminNavContextType | undefined>(undefined);

export function AdminNavProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<AdminTab>('MEMBERS');
  const [isAdminDrawerOpen, setIsAdminDrawerOpen] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState({ fundsCount: 0, noticesCount: 0 });

  return (
    <AdminNavContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isAdminDrawerOpen,
        setIsAdminDrawerOpen,
        badgeCounts,
        setBadgeCounts,
      }}
    >
      {children}
    </AdminNavContext.Provider>
  );
}

export function useAdminNav() {
  const context = useContext(AdminNavContext);
  if (!context) {
    return {
      activeTab: 'MEMBERS' as AdminTab,
      setActiveTab: () => {},
      isAdminDrawerOpen: false,
      setIsAdminDrawerOpen: () => {},
      badgeCounts: { fundsCount: 0, noticesCount: 0 },
      setBadgeCounts: () => {},
    };
  }
  return context;
}

