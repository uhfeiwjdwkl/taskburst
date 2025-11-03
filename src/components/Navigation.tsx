import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Calendar, FolderOpen, History as HistoryIcon, Table, Archive, Clock, List } from "lucide-react";
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

export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const formatTime = () => {
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    const seconds = currentTime.getSeconds().toString().padStart(2, '0');
    const day = currentTime.toLocaleDateString('en-GB', { weekday: 'short' });
    const date = currentTime.getDate().toString().padStart(2, '0');
    const month = (currentTime.getMonth() + 1).toString().padStart(2, '0');
    const year = currentTime.getFullYear();
    return `${hours}:${minutes}:${seconds} ${day} ${date}/${month}/${year}`;
  };

  return (
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
          <Button
            variant={isActive('/') ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
          <Button
            variant={isActive('/categories') ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => navigate('/categories')}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Categories
          </Button>
          <Button
            variant={isActive('/lists') ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => navigate('/lists')}
          >
            <List className="h-4 w-4 mr-2" />
            Lists
          </Button>
          <Button
            variant={isActive('/calendar') ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => navigate('/calendar')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </Button>
          <Button
            variant={isActive('/timetable') ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => navigate('/timetable')}
          >
            <Table className="h-4 w-4 mr-2" />
            Timetable
          </Button>
          <Button
            variant={isActive('/history') ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => navigate('/history')}
          >
            <HistoryIcon className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button
            variant={isActive('/archive') ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => navigate('/archive')}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
          <Button
            variant={isActive('/recently-deleted') ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => navigate('/recently-deleted')}
          >
            <Clock className="h-4 w-4 mr-2" />
            Recently Deleted
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
              <DropdownMenuItem onClick={() => navigate('/')}>
                <Home className="h-4 w-4 mr-2" />
                Home
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/categories')}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Categories
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/lists')}>
                <List className="h-4 w-4 mr-2" />
                Lists
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/calendar')}>
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/timetable')}>
                <Table className="h-4 w-4 mr-2" />
                Timetable
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/history')}>
                <HistoryIcon className="h-4 w-4 mr-2" />
                History
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/archive')}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/recently-deleted')}>
                <Clock className="h-4 w-4 mr-2" />
                Recently Deleted
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
