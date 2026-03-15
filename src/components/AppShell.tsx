"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";

const SplashScreen = dynamic(() => import("./SplashScreen"), { ssr: false });

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("d3stats-splash-seen");
    if (!seen) setShowSplash(true);
    setReady(true);
  }, []);

  const handleFinish = useCallback(() => {
    setShowSplash(false);
    sessionStorage.setItem("d3stats-splash-seen", "1");
  }, []);

  if (!ready) return <div className="min-h-screen bg-bg-primary" />;

  return (
    <>
      {showSplash && <SplashScreen onFinish={handleFinish} />}
      <div style={{ opacity: showSplash ? 0 : 1, transition: "opacity 0.5s ease-in" }}>
        {children}
      </div>
    </>
  );
}
