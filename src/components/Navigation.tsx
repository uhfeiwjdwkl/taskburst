import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Calendar, FolderOpen, History as HistoryIcon, Table, Archive, Clock, List, Briefcase, Settings, Award } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";
import { SettingsDialog } from "./SettingsDialog";
import { AppSettings, DEFAULT_SETTINGS, PageConfig } from "@/types/settings";

export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, [showSettings]);

  const isActive = (path: string) => location.pathname === path;

  const visiblePages = settings.pages
    .filter(p => p.visible)
    .sort((a, b) => a.order - b.order);

  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      Home: <Home className="h-4 w-4 mr-2" />,
      FolderOpen: <FolderOpen className="h-4 w-4 mr-2" />,
      List: <List className="h-4 w-4 mr-2" />,
      Briefcase: <Briefcase className="h-4 w-4 mr-2" />,
      Calendar: <Calendar className="h-4 w-4 mr-2" />,
      Table: <Table className="h-4 w-4 mr-2" />,
      Award: <Award className="h-4 w-4 mr-2" />,
      HistoryIcon: <HistoryIcon className="h-4 w-4 mr-2" />,
      Archive: <Archive className="h-4 w-4 mr-2" />,
      Clock: <Clock className="h-4 w-4 mr-2" />,
    };
    return icons[iconName] || <Home className="h-4 w-4 mr-2" />;
  };

  return (
    <>
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-14 items-center px-4">
          <div className="mr-4 flex items-center gap-2">
            <div className="relative group">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="mr-2 font-semibold px-2"
              >
                TaskBurst
              </Button>
              <a
                href="https://kommenszlapf.website"
                className="absolute left-0 top-full mt-1 bg-popover text-sm px-3 py-1 rounded-md shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50"
              >
                Return to kommenszlapf.website
              </a>
            </div>
            <div className="px-3 py-1 rounded-md bg-muted border">
              <div className="font-mono text-xs font-bold leading-tight">
                <div>{currentTime.getHours().toString().padStart(2, '0')}:{currentTime.getMinutes().toString().padStart(2, '0')}:{currentTime.getSeconds().toString().padStart(2, '0')}</div>
                <div className="text-[10px]">
                  {currentTime.toLocaleDateString('en-GB', { weekday: 'short' })} {currentTime.getDate().toString().padStart(2, '0')}/{(currentTime.getMonth() + 1).toString().padStart(2, '0')}/{currentTime.getFullYear()}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:gap-1">
            {visiblePages.map((page) => (
              <Button
                key={page.id}
                variant={isActive(page.path) ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate(page.path)}
              >
                {getIcon(page.icon)}
                {page.name}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="ml-auto md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background">
                <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {visiblePages.map((page) => (
                  <DropdownMenuItem key={page.id} onClick={() => navigate(page.path)}>
                    {getIcon(page.icon)}
                    {page.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowSettings(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
      
      <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
