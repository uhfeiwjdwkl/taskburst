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
}

export interface Timetable {
  id: string;
  name: string;
  favorite: boolean;
  type: 'weekly' | 'fortnightly';
  fortnightStartDate?: string; // ISO date for week 1 start (Monday)
  rows: TimeSlot[];
  columns: string[]; // day names (user can choose which days)
  fieldsPerCell: 1 | 2 | 3;
  cells: Record<string, TimetableCell>; // key: "row-col"
  colorKey: Record<string, string>; // color hex -> label
  createdAt: string;
  deletedAt?: string; // ISO string - when moved to recently deleted
}
