import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, ChevronDown } from 'lucide-react';

interface OptionItem {
  id: string;
  label: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}

interface ResponsiveOptionBarProps {
  options: OptionItem[];
  className?: string;
  breakpoint?: number; // Width in px below which to collapse to dropdown
}

export const ResponsiveOptionBar = ({ 
  options, 
  className = '',
  breakpoint = 640 
}: ResponsiveOptionBarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkWidth = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.parentElement?.clientWidth || window.innerWidth;
        setIsCollapsed(parentWidth < breakpoint);
      } else {
        setIsCollapsed(window.innerWidth < breakpoint);
      }
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, [breakpoint]);

  if (isCollapsed) {
    return (
      <div ref={containerRef} className={className}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Menu className="h-4 w-4" />
              Options
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-background">
            {options.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onClick={option.onClick}
                disabled={option.disabled}
                className={option.active ? 'bg-secondary' : ''}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => (
        <Button
          key={option.id}
          variant={option.active ? 'secondary' : 'outline'}
          size="sm"
          onClick={option.onClick}
          disabled={option.disabled}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
};
