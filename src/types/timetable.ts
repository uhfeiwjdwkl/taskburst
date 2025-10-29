export interface TimeSlot {
  id: string;
  label: string;
  startTime: string; // "09:00" format
  endTime: string;
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
  columns: string[]; // day names
  fieldsPerCell: 1 | 2 | 3;
  cells: Record<string, TimetableCell>; // key: "row-col"
  colorKey: Record<string, string>; // color hex -> label
  createdAt: string;
}
