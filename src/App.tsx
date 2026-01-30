import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { PinProtectionDialog } from "@/components/PinProtectionDialog";
import { AppSettings, DEFAULT_SETTINGS } from "@/types/settings";
import Index from "./pages/Index";
import Archive from "./pages/Archive";
import Calendar from "./pages/Calendar";
import Categories from "./pages/Categories";
import Lists from "./pages/Lists";
import Projects from "./pages/Projects";
import Results from "./pages/Results";
import History from "./pages/History";
import RecentlyDeletedUnified from "./pages/RecentlyDeletedUnified";
import Timetable from "./pages/Timetable";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load settings and check PIN protection
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      try {
        const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        setSettings(parsed);
        
        // If PIN protection is enabled and pinHash exists, require PIN
        if (parsed.pinProtection && parsed.pinHash) {
          setIsUnlocked(false);
        } else {
          setIsUnlocked(true);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
        setSettings(DEFAULT_SETTINGS);
        setIsUnlocked(true);
      }
    } else {
      setSettings(DEFAULT_SETTINGS);
      setIsUnlocked(true);
    }
    setIsLoading(false);
  }, []);

  // Apply dark mode and brightness from settings
  useEffect(() => {
    if (settings) {
      if (settings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      document.documentElement.style.filter = `brightness(${settings.brightness / 100})`;
    }
  }, [settings]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        
        {/* PIN Protection Overlay */}
        {settings?.pinProtection && settings?.pinHash && !isUnlocked && (
          <>
            {/* Blurred background overlay - everything behind is blurred */}
            <div 
              className="fixed inset-0 z-[99] bg-background/80 backdrop-blur-md" 
              aria-hidden="true"
            />
            {/* PIN dialog container - not blurred */}
            <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto">
                <PinProtectionDialog
                  open={true}
                  onSuccess={() => setIsUnlocked(true)}
                  pinHash={settings.pinHash}
                />
              </div>
            </div>
          </>
        )}
        
        <BrowserRouter>
          <Navigation />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/lists" element={<Lists />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/results" element={<Results />} />
            <Route path="/history" element={<History />} />
            <Route path="/recently-deleted" element={<RecentlyDeletedUnified />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
