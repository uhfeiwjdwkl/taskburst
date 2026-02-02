export interface TimeSlot {
  id: string;
  label: string;
  startTime: string; // "09:00" format
  duration: number; // in minutes
}

export interface TimetableCell {
  rowIndex: number;
  colIndex: number;
  fields: string[];
  color?: string;
  rowSpan?: number;
  colSpan?: number;
  hidden?: boolean; // if part of a merged cell
  week?: 1 | 2; // for fortnightly timetables
  fieldsPerCell?: 1 | 2 | 3; // override timetable default
}

export interface Timetable {
  id: string;
  name: string;
  favorite: boolean;
  type: 'weekly' | 'fortnightly';
  mode: 'rigid' | 'flexible'; // rigid = fixed time slots, flexible = scalable events
  fortnightStartDate?: string; // ISO date for week 1 start (Monday)
  rows: TimeSlot[];
  columns: string[]; // day names (user can choose which days)
  fieldsPerCell: 1 | 2 | 3;
  cells: Record<string, TimetableCell>; // key: "row-col"
  colorKey: Record<string, string>; // color hex -> label
  customColors?: string[]; // custom hex colors saved by user
  createdAt: string;
  deletedAt?: string; // ISO string - when moved to recently deleted
  
  // Flexible mode settings
  flexStartTime?: string; // "06:00" format
  flexEndTime?: string; // "22:00" format
  flexInterval?: number; // minutes between time markings
}

// For flexible timetables
export interface FlexibleEvent {
  id: string;
  timetableId: string;
  dayIndex: number; // which column/day
  startTime: string; // "09:00" format
  endTime: string; // "10:30" format
  fields: string[];
  color?: string;
  week?: 1 | 2; // for fortnightly
}
