import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Calendar,
  ListChecks,
  FolderOpen,
  Award,
  Table,
  History,
  Archive,
  Trash2,
  Settings,
  Timer,
  Grid3X3,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Check,
  ArrowUp,
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

// Interactive demo components
const DemoTaskCard = () => {
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(30);

  return (
    <Card className="p-4 space-y-3 border-2 border-dashed border-primary/30">
      <div className="text-xs font-mono text-muted-foreground mb-1">↓ Interactive Demo — try it!</div>
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold flex items-center gap-2">
            Sample Task
            <Badge variant={completed ? 'secondary' : 'destructive'} className="text-xs">
              {completed ? 'Done' : 'High'}
            </Badge>
          </h4>
          <p className="text-xs text-muted-foreground mt-1">Study • 25m estimated</p>
        </div>
        <Checkbox checked={completed} onCheckedChange={(c) => setCompleted(!!c)} />
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded border cursor-pointer transition-colors ${
              i < Math.floor(progress / 16.7)
                ? 'bg-primary border-primary'
                : 'bg-muted border-border hover:border-primary/50'
            }`}
            onClick={() => setProgress(Math.min(100, (i + 1) * 16.7))}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-2">{Math.round(progress)}%</span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="default" className="text-xs h-7" disabled={completed}>
          <Play className="h-3 w-3 mr-1" /> Study
        </Button>
        <Button size="sm" variant="outline" className="text-xs h-7">Details</Button>
        <Button size="sm" variant="outline" className="text-xs h-7">Edit</Button>
        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setCompleted(!completed)}>
          {completed ? <RotateCcw className="h-3 w-3 mr-1" /> : <Check className="h-3 w-3 mr-1" />}
          {completed ? 'Undo' : 'Complete'}
        </Button>
      </div>
    </Card>
  );
};

const DemoTimer = () => {
  const [seconds, setSeconds] = useState(1500);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<'countdown' | 'stopwatch'>('countdown');

  return (
    <Card className="p-4 space-y-3 border-2 border-dashed border-primary/30">
      <div className="text-xs font-mono text-muted-foreground mb-1">↓ Interactive Demo</div>
      <div className="text-center">
        <div className="text-3xl font-bold font-mono text-primary">
          {mode === 'countdown'
            ? `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
            : `${Math.floor((1500 - seconds) / 60)}:${((1500 - seconds) % 60).toString().padStart(2, '0')}`}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {mode === 'countdown' ? 'Focus Time — Countdown' : 'Focus Time — Stopwatch'}
        </p>
      </div>
      <div className="flex justify-center gap-2">
        <Button
          size="sm"
          variant={running ? 'secondary' : 'default'}
          onClick={() => {
            if (!running && seconds > 0) {
              setRunning(true);
              // Don't actually run timer, just toggle state for demo
            }
            setRunning(!running);
          }}
        >
          {running ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
          {running ? 'Pause' : 'Start'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setSeconds(1500); setRunning(false); }}>
          <RotateCcw className="h-3 w-3 mr-1" /> Reset
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setMode(mode === 'countdown' ? 'stopwatch' : 'countdown')}
        >
          {mode === 'countdown' ? '⏱ Stopwatch' : '⏲ Countdown'}
        </Button>
      </div>
    </Card>
  );
};

const DemoProgressGrid = () => {
  const [filled, setFilled] = useState<number[]>([0, 1, 4]);

  return (
    <Card className="p-4 space-y-3 border-2 border-dashed border-primary/30">
      <div className="text-xs font-mono text-muted-foreground mb-1">↓ Interactive Demo — click boxes</div>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${
              filled.includes(i)
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-muted border-border hover:border-primary/50'
            }`}
            onClick={() =>
              setFilled((prev) =>
                prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
              )
            }
          >
            {filled.includes(i) ? '✓' : i + 1}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {filled.length}/10 completed ({Math.round((filled.length / 10) * 100)}%)
      </p>
    </Card>
  );
};

const DemoResultsRow = () => {
  const [mode, setMode] = useState<'marks' | 'average'>('marks');
  const parts = [
    { name: 'Part 1', score: 18, max: 25 },
    { name: 'Part 2', score: 22, max: 25 },
    { name: 'Part 3', score: null as number | null, max: 25 },
    { name: 'Part 4', score: 20, max: 25 },
  ];
  const scored = parts.filter((p) => p.score !== null);
  const total = scored.reduce((s, p) => s + (p.score || 0), 0);
  const maxTotal = scored.reduce((s, p) => s + p.max, 0);
  const avg =
    scored.length > 0
      ? (scored.reduce((s, p) => s + ((p.score || 0) / p.max) * 100, 0) / scored.length).toFixed(1)
      : '-';

  return (
    <Card className="p-4 space-y-3 border-2 border-dashed border-primary/30">
      <div className="text-xs font-mono text-muted-foreground mb-1">↓ Interactive Demo — click total to toggle mode</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Name</th>
              <th className="text-center p-2 cursor-pointer hover:text-primary" onClick={() => setMode(mode === 'marks' ? 'average' : 'marks')}>
                Total <Badge variant="outline" className="text-xs ml-1">{mode === 'average' ? 'Avg' : 'Sum'}</Badge>
              </th>
              {parts.map((p, i) => (
                <th key={i} className="text-center p-2">{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 font-medium">Mathematics</td>
              <td className="p-2 text-center font-bold">
                {mode === 'average' ? `${avg}%` : `${total}/${maxTotal}`}
              </td>
              {parts.map((p, i) => (
                <td key={i} className="p-2 text-center">
                  {p.score !== null ? `${p.score}/${p.max}` : '—'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const DemoSubtask = () => {
  const [items, setItems] = useState([
    { id: 1, title: 'Read Chapter 1', done: true },
    { id: 2, title: 'Complete exercises', done: false },
    { id: 3, title: 'Write summary', done: false },
  ]);

  return (
    <Card className="p-4 space-y-2 border-2 border-dashed border-primary/30">
      <div className="text-xs font-mono text-muted-foreground mb-1">↓ Interactive Demo — tick subtasks</div>
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2 p-2 rounded border">
          <Checkbox
            checked={item.done}
            onCheckedChange={(c) =>
              setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: !!c } : i)))
            }
          />
          <span className={`text-sm ${item.done ? 'line-through text-muted-foreground' : ''}`}>
            {item.title}
          </span>
        </div>
      ))}
      <Progress value={(items.filter((i) => i.done).length / items.length) * 100} className="h-2" />
    </Card>
  );
};

const Section = ({ title, icon, children, id }: { title: string; icon: React.ReactNode; children: React.ReactNode; id: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" id={id}>
          <div className="flex items-center gap-3">
            {icon}
            <h2 className="text-lg font-semibold flex-1">{title}</h2>
            {open ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
          </div>
        </Card>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-4 border-l-2 border-primary/20 pl-4 py-4 space-y-4">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default function Guide() {
  const sections = [
    { id: 'home', title: 'Home & Focus Timer', icon: <Clock className="h-5 w-5 text-primary" /> },
    { id: 'tasks', title: 'Tasks & Subtasks', icon: <ListChecks className="h-5 w-5 text-primary" /> },
    { id: 'timer', title: 'Timer Modes', icon: <Timer className="h-5 w-5 text-primary" /> },
    { id: 'progress', title: 'Progress Grid', icon: <Grid3X3 className="h-5 w-5 text-primary" /> },
    { id: 'calendar', title: 'Calendar & Events', icon: <Calendar className="h-5 w-5 text-primary" /> },
    { id: 'timetable', title: 'Timetable', icon: <Table className="h-5 w-5 text-primary" /> },
    { id: 'projects', title: 'Projects', icon: <FolderOpen className="h-5 w-5 text-primary" /> },
    { id: 'lists', title: 'Lists', icon: <ListChecks className="h-5 w-5 text-primary" /> },
    { id: 'results', title: 'Results & Assessments', icon: <Award className="h-5 w-5 text-primary" /> },
    { id: 'categories', title: 'Categories', icon: <FolderOpen className="h-5 w-5 text-primary" /> },
    { id: 'history', title: 'Session History', icon: <History className="h-5 w-5 text-primary" /> },
    { id: 'archive', title: 'Archive', icon: <Archive className="h-5 w-5 text-primary" /> },
    { id: 'deleted', title: 'Recently Deleted', icon: <Trash2 className="h-5 w-5 text-primary" /> },
    { id: 'settings', title: 'Settings', icon: <Settings className="h-5 w-5 text-primary" /> },
    { id: 'data', title: 'Import & Export', icon: <FolderOpen className="h-5 w-5 text-primary" /> },
  ];

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">TaskBurst Guide</h1>
        <p className="text-muted-foreground">
          A comprehensive guide to every feature in TaskBurst. Click each section to expand and learn more.
          Interactive demos are marked with a dashed border — try them out!
        </p>
      </div>

      {/* Table of Contents */}
      <Card className="p-4 mb-8">
        <h2 className="font-semibold mb-3">Table of Contents</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {sections.map((s) => (
            <Button
              key={s.id}
              variant="ghost"
              size="sm"
              className="justify-start text-xs h-8"
              onClick={() => scrollToSection(s.id)}
            >
              {s.icon}
              <span className="ml-2">{s.title}</span>
            </Button>
          ))}
        </div>
      </Card>

      {/* Sections */}
      <div className="space-y-3">
        <Section id="home" title="Home & Focus Timer" icon={<Clock className="h-5 w-5 text-primary" />}>
          <p className="text-sm text-muted-foreground">
            The home page is your command centre. It displays the Pomodoro-style <strong>Focus Timer</strong>, 
            your task list, and a <strong>Day Calendar</strong> showing events, tasks, and subtasks for the current day.
          </p>
          <h3 className="font-semibold text-sm mt-2">Key features:</h3>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li><strong>Focus Timer</strong> with countdown (configurable 25/5 Pomodoro) or stopwatch mode</li>
            <li><strong>Task selection</strong> — pick a task and start studying</li>
            <li><strong>Day Calendar</strong> — timeline view of all day's items, clickable to details</li>
            <li><strong>Task reordering</strong> — drag tasks to rearrange priority</li>
            <li><strong>Quick actions</strong> — Study, Details, Edit, Complete, Delete per task card</li>
          </ul>
          <DemoTaskCard />
        </Section>

        <Section id="tasks" title="Tasks & Subtasks" icon={<ListChecks className="h-5 w-5 text-primary" />}>
          <p className="text-sm text-muted-foreground">
            Tasks are the core of TaskBurst. Each task has a name, category, priority (1–5), estimated time,
            due date, description, task type, and optional progress grid.
          </p>
          <h3 className="font-semibold text-sm mt-2">Task features:</h3>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li><strong>Subtasks</strong> — break tasks into sub-items with their own details, priority, dates, and colours</li>
            <li><strong>Progress Grid</strong> — visual tracking with named/coloured boxes linked to subtasks</li>
            <li><strong>Results</strong> — optional score tracking with parts and sum/average modes</li>
            <li><strong>Linked Assessments</strong> — create assessments tied to tasks with synced results</li>
            <li><strong>Convert bullets to subtasks</strong> — write bullet points in description, convert with one click</li>
            <li><strong>Task Types</strong> — General, Study, Revision, Practice, Homework, Reading, Writing, Research</li>
          </ul>

          <h3 className="font-semibold text-sm mt-4">Subtask details:</h3>
          <p className="text-sm text-muted-foreground">
            Every subtask shows icon/letters, colour, description, date, time, duration, priority, 
            linked progress box, and time spent. You can complete, edit, or navigate to the parent task from any subtask popup.
          </p>
          <DemoSubtask />
        </Section>

        <Section id="timer" title="Timer Modes" icon={<Timer className="h-5 w-5 text-primary" />}>
          <p className="text-sm text-muted-foreground">
            TaskBurst offers two timer modes:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li><strong>Countdown</strong> — Pomodoro-style focus/break cycles. Configurable focus time (default 25 min) and break time. A progress ring shows time remaining. Sessions shorter than 10% of set time can be discarded.</li>
            <li><strong>Stopwatch</strong> — unlimited, open-ended timer with no progress ring. Perfect for free-form study. No minimum session length restriction.</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            When a session ends, you're prompted to name it before it's saved to history. Press cancel or X to discard the time instead.
          </p>
          <DemoTimer />
        </Section>

        <Section id="progress" title="Progress Grid" icon={<Grid3X3 className="h-5 w-5 text-primary" />}>
          <p className="text-sm text-muted-foreground">
            The Progress Grid provides visual progress tracking. Set a grid size when creating/editing a task, 
            and each box can be named, assigned a subtask, given an abbreviation (max 3 chars), and a custom colour.
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li>Click a box to see subtask details or complete it</li>
            <li>Naming a box auto-creates a linked subtask</li>
            <li>New subtasks auto-link to the next available box</li>
            <li>Abbreviation text appears inside the grid box</li>
            <li>Colour ring cycles through preset colours</li>
          </ul>
          <DemoProgressGrid />
        </Section>

        <Section id="calendar" title="Calendar & Events" icon={<Calendar className="h-5 w-5 text-primary" />}>
          <p className="text-sm text-muted-foreground">
            The Calendar page shows a monthly overview with highlighted dates. Click any day to open a 
            <strong> Day Calendar</strong> — a full timeline showing events, tasks, subtasks, assessments, and timetable events.
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li><strong>Events</strong> — one-time or recurring, with location, description, time, duration, colour, and category</li>
            <li><strong>Recurring events</strong> — daily, weekly, or monthly patterns</li>
            <li><strong>Multi-day events</strong> — events spanning multiple dates</li>
            <li><strong>Day Calendar</strong> — unified view with arrows to navigate days and calendar picker</li>
            <li>All items are clickable to their respective detail popups</li>
          </ul>
        </Section>

        <Section id="timetable" title="Timetable" icon={<Table className="h-5 w-5 text-primary" />}>
          <p className="text-sm text-muted-foreground">
            Create structured weekly or fortnightly timetables with customisable rows, columns, and colour-coded cells.
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li><strong>Flexible mode</strong> — drag-and-drop event blocks on a time grid</li>
            <li><strong>Grid mode</strong> — traditional table with custom rows and columns</li>
            <li><strong>Current day highlighting</strong> — the current day column is highlighted (week 1 only for fortnightly)</li>
            <li><strong>Red line indicator</strong> — shows the current time on today's column</li>
            <li><strong>Colour key</strong> — customisable legend for subject colours</li>
            <li><strong>Import/Export</strong> — JSON import/export for individual or all timetables</li>
          </ul>
        </Section>

        <Section id="projects" title="Projects" icon={<FolderOpen className="h-5 w-5 text-primary" />}>
          <p className="text-sm text-muted-foreground">
            Projects group related tasks together. Each project has a title, description, due date, 
            colour, category, and associated tasks.
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li>View all tasks belonging to a project</li>
            <li>Track total time spent and estimated time</li>
            <li>Project calendar view for scheduling</li>
            <li>Show projects in the Results page with scores</li>
            <li>Export/import individual projects</li>
          </ul>
        </Section>

        <Section id="lists" title="Lists" icon={<ListChecks className="h-5 w-5 text-primary" />}>
          <p className="text-sm text-muted-foreground">
            Simple, flexible lists with checkable items. Each list has a name, description, and items 
            that can be checked off. Lists support drag-and-drop reordering.
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li>Create multiple lists for different purposes</li>
            <li>Check/uncheck items</li>
            <li>Edit and delete list items</li>
            <li>Drag to reorder lists</li>
            <li>Export/import lists</li>
          </ul>
        </Section>

        <Section id="results" title="Results & Assessments" icon={<Award className="h-5 w-5 text-primary" />}>
          <p className="text-sm text-muted-foreground">
            The Results page displays scores for tasks, projects, and assessments in a table format 
            with automatic percentage calculations and category averages.
          </p>
          <h3 className="font-semibold text-sm mt-2">Results table:</h3>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li><strong>Parts</strong> — configurable columns (default 4), each with score/maxScore</li>
            <li><strong>Total mode</strong> — click the total cell to toggle between Sum and Average</li>
            <li><strong>Column renaming</strong> — click column headers to rename them</li>
            <li><strong>Group by</strong> — no grouping, by category, or by subcategory</li>
            <li><strong>Global summary</strong> — overall and per-category averages</li>
            <li><strong>Hide tasks</strong> — hide from table while retaining scores</li>
          </ul>
          <DemoResultsRow />

          <h3 className="font-semibold text-sm mt-4">Assessments:</h3>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li><strong>Independent assessments</strong> — standalone with their own results, editable in details dialog</li>
            <li><strong>Linked assessments</strong> — tied to a task, results sync automatically</li>
            <li><strong>Grid or List view</strong> — compact list or card grid display</li>
            <li><strong>Colour-coded due dates</strong> — red for overdue, yellow for soon, blue for upcoming</li>
            <li><strong>Category and Sum/Avg</strong> — assessments support category editing and mode toggle</li>
            <li><strong>Complete/hide</strong> — mark assessments as done or filter completed ones</li>
          </ul>
        </Section>

        <Section id="categories" title="Categories" icon={<FolderOpen className="h-5 w-5 text-primary" />}>
          <p className="text-sm text-muted-foreground">
            Categories and subcategories organise tasks. Create, rename, and delete them on the Categories page.
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li>Tasks assigned to subcategories show under parent categories with badges</li>
            <li>Categories are shared across tasks, assessments, and results grouping</li>
            <li>Manage categories directly or via the task edit dialog</li>
          </ul>
        </Section>

        <Section id="history" title="Session History" icon={<History className="h-5 w-5 text-primary" />}>
          <p className="text-sm text-muted-foreground">
            Every study/timer session is recorded with task name, duration, date, and session name.
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li>View all past sessions sorted by date</li>
            <li>Group by task name or date</li>
            <li>Session names are prompted when finishing a timer session</li>
            <li>Stopwatch sessions correctly record total elapsed time</li>
          </ul>
        </Section>

        <Section id="archive" title="Archive" icon={<Archive className="h-5 w-5 text-primary" />}>
          <p className="text-sm text-muted-foreground">
            Completed or inactive tasks and projects can be archived to keep your active view clean.
            Archived items retain all data and can be restored at any time.
          </p>
        </Section>

        <Section id="deleted" title="Recently Deleted" icon={<Trash2 className="h-5 w-5 text-primary" />}>
          <p className="text-sm text-muted-foreground">
            Deleted items (tasks, events, projects, sessions, timetables, assessments, lists, and text backups) 
            are kept for 30 days before permanent deletion. Items can be restored or permanently removed.
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li>Tab-based interface for each item type</li>
            <li>Shows days remaining before permanent deletion</li>
            <li>Restore or permanently delete individual items</li>
            <li>Text backups support search, bulk operations, and restore-to-field</li>
          </ul>
        </Section>

        <Section id="settings" title="Settings" icon={<Settings className="h-5 w-5 text-primary" />}>
          <p className="text-sm text-muted-foreground">
            Customise TaskBurst to your preferences:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li><strong>Dark mode</strong> — toggle between light and dark themes</li>
            <li><strong>Colour themes</strong> — multiple built-in themes that change the accent colour and favicon</li>
            <li><strong>Brightness</strong> — adjust overall screen brightness</li>
            <li><strong>Time format</strong> — 12-hour or 24-hour clock</li>
            <li><strong>Timer sounds</strong> — enable/disable completion sounds</li>
            <li><strong>PIN protection</strong> — lock the app with a PIN code</li>
            <li><strong>Navigation layout</strong> — choose between button row, two rows, or dropdown menu</li>
            <li><strong>Page visibility</strong> — show/hide and reorder navigation pages</li>
          </ul>
        </Section>

        <Section id="data" title="Import & Export" icon={<FolderOpen className="h-5 w-5 text-primary" />}>
          <p className="text-sm text-muted-foreground">
            All data in TaskBurst lives in your browser's local storage. Use export/import to back up or transfer data.
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li><strong>Export All</strong> — downloads a ZIP file with all data (tasks, events, projects, timetables, etc.)</li>
            <li><strong>Import All</strong> — restore from a previously exported ZIP</li>
            <li><strong>Individual export</strong> — export specific tasks, events, projects, or lists as JSON</li>
            <li><strong>Timetable import</strong> — import individual or bulk timetables from JSON</li>
            <li><strong>Task order preserved</strong> — import/export maintains custom task ordering</li>
          </ul>
        </Section>
      </div>

      {/* Scroll to top */}
      <div className="fixed bottom-6 right-6">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full shadow-lg"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}