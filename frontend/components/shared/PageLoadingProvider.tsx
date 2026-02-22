'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PageLoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  triggerPageRefresh: () => void;
}

const PageLoadingContext = createContext<PageLoadingContextType | undefined>(undefined);

export const usePageLoading = () => {
  const context = useContext(PageLoadingContext);
  if (!context) {
    throw new Error('usePageLoading must be used within PageLoadingProvider');
  }
  return context;
};

export const PageLoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial page load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const triggerPageRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <PageLoadingContext.Provider value={{ isLoading, setIsLoading, triggerPageRefresh }}>
      {children}
    </PageLoadingContext.Provider>
  );
};
