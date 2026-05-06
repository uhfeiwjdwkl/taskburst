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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
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
  const [activeTaskName, setActiveTaskName] = useState<string | null>(null);
  const [todayItems, setTodayItems] = useState<{ id: string; name: string; kind: 'task' | 'event' }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Read active task & today items from localStorage
  useEffect(() => {
    const refresh = () => {
      try {
        const id = localStorage.getItem('activeTaskId');
        const tasksRaw = localStorage.getItem('tasks');
        const tasks = tasksRaw ? JSON.parse(tasksRaw) : [];
        const safeTasks = Array.isArray(tasks) ? tasks : [];
        const active = id ? safeTasks.find((t: any) => t.id === id) : null;
        setActiveTaskName(active ? active.name : null);

        const todayStr = new Date().toISOString().split('T')[0];
        const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
        const remainingTasks = safeTasks
          .filter((t: any) => !t.completed && t.dueDate && t.dueDate.split('T')[0] === todayStr)
          .map((t: any) => ({ id: `t-${t.id}`, name: t.name, kind: 'task' as const }));

        const eventsRaw = localStorage.getItem('calendarEvents');
        const events = eventsRaw ? JSON.parse(eventsRaw) : [];
        const safeEvents = Array.isArray(events) ? events : [];
        const remainingEvents = safeEvents
          .filter((e: any) => !e.deletedAt && e.date === todayStr && (() => {
            if (!e.time) return true;
            const [h, m] = e.time.split(':').map(Number);
            const end = h * 60 + m + (e.duration || 60);
            return end > nowMin;
          })())
          .map((e: any) => ({ id: `e-${e.id}`, name: e.title, kind: 'event' as const }));

        setTodayItems([...remainingTasks, ...remainingEvents]);
      } catch (e) {
        // silent
      }
    };
    refresh();
    const id = setInterval(refresh, 30000);
    window.addEventListener('storage', refresh);
    window.addEventListener('activeTaskIdChange', refresh);
    window.addEventListener('appSettingsUpdated', refresh);
    return () => {
      clearInterval(id);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('activeTaskIdChange', refresh);
      window.removeEventListener('appSettingsUpdated', refresh);
    };
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

  // Analogue clock (compact)
  const showAnalogue = Boolean((settings as any).showAnalogueClock);
  const hourAngle = ((currentTime.getHours() % 12) + currentTime.getMinutes() / 60) * 30;
  const minAngle = (currentTime.getMinutes() + currentTime.getSeconds() / 60) * 6;
  const secAngle = currentTime.getSeconds() * 6;

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
                <div className="absolute left-0 top-full mt-1 bg-popover rounded-md shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[200px]">
                  <a
                    href="https://kommenszlapf.website"
                    className="block px-3 py-2 text-sm hover:bg-muted rounded-t-md transition-colors"
                  >
                    Return to kommenszlapf.website
                  </a>
                  <button
                    onClick={() => navigate('/guide')}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-b-md transition-colors"
                  >
                    📖 TaskBurst Guide
                  </button>
                </div>
              </div>
              <div className="px-3 py-1 rounded-md bg-muted border">
                <div className="font-mono text-xs font-bold leading-tight text-center">
                  <div>{settings.timeFormat === '12h' ? (() => {
                    const h = currentTime.getHours();
                    const period = h >= 12 ? 'PM' : 'AM';
                    const displayH = h % 12 || 12;
                    return `${displayH}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')} ${period}`;
                  })() : `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`}</div>
                  <div className="text-[10px] whitespace-nowrap">
                    {currentTime.toLocaleDateString('en-GB', { weekday: 'short' })} {currentTime.getDate().toString().padStart(2, '0')}/{(currentTime.getMonth() + 1).toString().padStart(2, '0')}/{currentTime.getFullYear()}
                  </div>
                </div>
              </div>
              {showAnalogue && (
                <svg width="32" height="32" viewBox="-16 -16 32 32" className="flex-shrink-0">
                  <circle r="15" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
                  <line x1="0" y1="0" x2="0" y2="-8" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round" transform={`rotate(${hourAngle})`} />
                  <line x1="0" y1="0" x2="0" y2="-11" stroke="hsl(var(--foreground))" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${minAngle})`} />
                  <line x1="0" y1="0" x2="0" y2="-12" stroke="hsl(var(--destructive))" strokeWidth="1" strokeLinecap="round" transform={`rotate(${secAngle})`} />
                  <circle r="1.2" fill="hsl(var(--foreground))" />
                </svg>
              )}
              {activeTaskName && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Badge variant="secondary" className="cursor-pointer max-w-[140px] truncate">▶ {activeTaskName}</Badge>
                  </PopoverTrigger>
                  <PopoverContent className="w-60">
                    <div className="text-xs font-semibold mb-1">Active session</div>
                    <div className="text-sm">{activeTaskName}</div>
                  </PopoverContent>
                </Popover>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Badge variant="outline" className="cursor-pointer">{todayItems.length} today</Badge>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="text-xs font-semibold mb-2">Remaining today</div>
                  {todayItems.length === 0 ? (
                    <div className="text-xs text-muted-foreground">All caught up.</div>
                  ) : (
                    <ul className="space-y-1 max-h-64 overflow-y-auto">
                      {todayItems.map(it => (
                        <li key={it.id} className="text-sm truncate">
                          <span className="text-xs text-muted-foreground mr-1">{it.kind === 'task' ? '📋' : '📅'}</span>
                          {it.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Single row navigation - only show when navRows is 1 (fits) */}
            {navRows === 1 && (
              <div ref={navRef} className="hidden md:flex md:gap-1 flex-wrap">
                {renderNavButtons(visiblePages)}
              </div>
            )}

            {/* Dropdown navigation - only show when explicitly dropdown mode */}
            {navRows === 'dropdown' && (
              <div className="hidden md:flex ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Menu className="h-4 w-4" />
                      Navigation
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Pages</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {visiblePages.map((page) => (
                      <DropdownMenuItem 
                        key={page.id} 
                        onClick={() => navigate(page.path)}
                        className={isActive(page.path) ? 'bg-muted' : ''}
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

          {/* Two row navigation - second row (when items don't fit in one row) */}
          {navRows === 2 && (
            <div className="hidden md:flex gap-1 pb-2 flex-wrap justify-start">
              {renderNavButtons(visiblePages)}
            </div>
          )}
        </div>
      </nav>
      
      <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}