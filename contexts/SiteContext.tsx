"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type SiteContextValue = {
  activeSiteId: string;
  setActiveSiteId: (id: string) => void;
};

const SiteContext = createContext<SiteContextValue>({
  activeSiteId: "",
  setActiveSiteId: () => {},
});

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [activeSiteId, setActiveSiteIdState] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("activeSiteId");
    if (stored) setActiveSiteIdState(stored);
  }, []);

  const setActiveSiteId = useCallback((id: string) => {
    setActiveSiteIdState(id);
    localStorage.setItem("activeSiteId", id);
  }, []);

  return (
    <SiteContext.Provider value={{ activeSiteId, setActiveSiteId }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  return useContext(SiteContext);
}
