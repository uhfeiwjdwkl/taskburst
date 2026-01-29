import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Home, Calendar, FolderOpen, History as HistoryIcon, Table, Archive, Clock, List, Briefcase, Settings, Award, Menu, ChevronDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SettingsDialog } from "./SettingsDialog";
import { AppSettings, DEFAULT_SETTINGS, PageConfig } from "@/types/settings";

export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [navRows, setNavRows] = useState<1 | 2 | 'dropdown'>(1);
  const navRef = useRef<HTMLDivElement>(null);

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

  // Calculate nav layout based on available space
  useEffect(() => {
    const calculateLayout = () => {
      if (settings.useDropdownNav) {
        setNavRows('dropdown');
        return;
      }

      const width = window.innerWidth;
      const visiblePagesCount = settings.pages.filter(p => p.visible).length + 1; // +1 for settings
      const buttonWidth = 100; // approximate button width
      const availableWidth = width - 300; // subtract logo/clock area
      
      if (availableWidth >= visiblePagesCount * buttonWidth) {
        setNavRows(1);
      } else if (availableWidth >= (visiblePagesCount * buttonWidth) / 2) {
        setNavRows(2);
      } else {
        setNavRows('dropdown');
      }
    };

    calculateLayout();
    window.addEventListener('resize', calculateLayout);
    return () => window.removeEventListener('resize', calculateLayout);
  }, [settings.pages, settings.useDropdownNav]);

  const isActive = (path: string) => location.pathname === path;

  const visiblePages = settings.pages
    .filter(p => p.visible)
    .sort((a, b) => a.order - b.order);

  const getIcon = (iconName: string, className = "h-4 w-4 mr-2") => {
    const icons: Record<string, React.ReactNode> = {
      Home: <Home className={className} />,
      FolderOpen: <FolderOpen className={className} />,
      List: <List className={className} />,
      Briefcase: <Briefcase className={className} />,
      Calendar: <Calendar className={className} />,
      Table: <Table className={className} />,
      Award: <Award className={className} />,
      HistoryIcon: <HistoryIcon className={className} />,
      Archive: <Archive className={className} />,
      Clock: <Clock className={className} />,
    };
    return icons[iconName] || <Home className={className} />;
  };

  const renderNavButtons = (pages: PageConfig[]) => (
    <>
      {pages.map((page) => (
        <Button
          key={page.id}
          variant={isActive(page.path) ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => navigate(page.path)}
          className="whitespace-nowrap"
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
    </>
  );

  return (
    <>
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex flex-col px-4">
          <div className="flex h-14 items-center">
            <div className="mr-4 flex items-center gap-2 flex-shrink-0">
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
                <div className="font-mono text-xs font-bold leading-tight text-center">
                  <div>{currentTime.getHours().toString().padStart(2, '0')}:{currentTime.getMinutes().toString().padStart(2, '0')}:{currentTime.getSeconds().toString().padStart(2, '0')}</div>
                  <div className="text-[10px] whitespace-nowrap">
                    {currentTime.toLocaleDateString('en-GB', { weekday: 'short' })} {currentTime.getDate().toString().padStart(2, '0')}/{(currentTime.getMonth() + 1).toString().padStart(2, '0')}/{currentTime.getFullYear()}
                  </div>
                </div>
              </div>
            </div>

            {/* Single row navigation */}
            {navRows === 1 && (
              <div ref={navRef} className="hidden md:flex md:gap-1 flex-wrap">
                {renderNavButtons(visiblePages)}
              </div>
            )}

            {/* Dropdown navigation */}
            {(navRows === 'dropdown' || navRows === 2) && (
              <div className="hidden md:flex ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Menu className="h-4 w-4" />
                      Navigation
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-background">
                    <DropdownMenuLabel>Pages</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {visiblePages.map((page) => (
                      <DropdownMenuItem 
                        key={page.id} 
                        onClick={() => navigate(page.path)}
                        className={isActive(page.path) ? 'bg-secondary' : ''}
                      >
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
            )}

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

          {/* Two row navigation - second row */}
          {navRows === 2 && (
            <div className="hidden md:flex gap-1 pb-2 flex-wrap justify-center">
              {renderNavButtons(visiblePages)}
            </div>
          )}
        </div>
      </nav>
      
      <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}