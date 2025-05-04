"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface MuteContextType {
  isMuted: boolean;
  toggleMute: () => void;
}

const MuteContext = createContext<MuteContextType | undefined>(undefined);

export const MuteProvider = ({ children }: { children: ReactNode }) => {
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  return (
    <MuteContext.Provider value={{ isMuted, toggleMute }}>
      {children}
    </MuteContext.Provider>
  );
};

export const useMuteContext = (): MuteContextType => {
  const context = useContext(MuteContext);
  if (context === undefined) {
    throw new Error('useMuteContext must be used within a MuteProvider');
  }
  return context;
}; 