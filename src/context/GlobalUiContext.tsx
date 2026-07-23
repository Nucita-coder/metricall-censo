import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GlobalUiContextProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  createTrigger: number;
  triggerCreateModal: () => void;
  soporteTrigger: number;
  triggerSoporteModal: () => void;
}

const GlobalUiContext = createContext<GlobalUiContextProps | undefined>(undefined);

export function GlobalUiProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [createTrigger, setCreateTrigger] = useState(0);
  const [soporteTrigger, setSoporteTrigger] = useState(0);

  const triggerCreateModal = () => {
    setCreateTrigger(prev => prev + 1);
  };

  const triggerSoporteModal = () => {
    setSoporteTrigger(prev => prev + 1);
  };

  return (
    <GlobalUiContext.Provider value={{ searchQuery, setSearchQuery, createTrigger, triggerCreateModal, soporteTrigger, triggerSoporteModal }}>
      {children}
    </GlobalUiContext.Provider>
  );
}

export function useGlobalUi() {
  const context = useContext(GlobalUiContext);
  if (!context) {
    throw new Error('useGlobalUi must be used within a GlobalUiProvider');
  }
  return context;
}
