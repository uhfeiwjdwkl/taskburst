import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Project } from '@/types/project';
import { Task } from '@/types/task';
import { CalendarEvent } from '@/types/event';
import { ExportProjectButton } from './ExportProjectButton';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, FileText, ListTodo, CalendarDays } from 'lucide-react';
import { formatDateTimeToDDMMYYYY } from '@/lib/dateFormat';
import { ProjectCalendarDialog } from './ProjectCalendarDialog';

interface ProjectDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  tasks: Task[];
  onEdit: (project: Project) => void;
}

export const ProjectDetailsDialog = ({ open, onClose, project, tasks, onEdit }: ProjectDetailsDialogProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const savedEvents = localStorage.getItem('events');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, [open]);

  if (!project) return null;

  const projectTasks = tasks.filter(t => project.taskIds.includes(t.id));
  const completedTasks = projectTasks.filter(t => t.completed).length;

  return (
    <>
    <ProjectCalendarDialog
      open={calendarOpen}
      onClose={() => setCalendarOpen(false)}
      project={project}
      tasks={tasks}
      events={events}
      onSave={() => {}}
    />
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {project.description && (
            <Card className="p-4">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium mb-1">Description</p>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </div>
              </div>
            </Card>
          )}

          {project.dueDateTime && (
            <Card className="p-4">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium mb-1">Due Date</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTimeToDDMMYYYY(project.dueDateTime)}
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-4">
            <div className="flex items-start gap-2">
              <ListTodo className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium mb-1">Tasks</p>
                <p className="text-sm text-muted-foreground">
                  {completedTasks} of {projectTasks.length} completed
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium mb-1">Time Tracking</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Estimated: {project.totalEstimatedMinutes} minutes</p>
                  <p>Spent: {project.totalSpentMinutes} minutes</p>
                  <p>Remaining: {Math.max(0, project.totalEstimatedMinutes - project.totalSpentMinutes)} minutes</p>
                </div>
              </div>
            </div>
          </Card>

          {project.notes && (
            <Card className="p-4">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.notes}</p>
                </div>
              </div>
            </Card>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <ExportProjectButton project={project} />
            <Button variant="outline" onClick={() => setCalendarOpen(true)}>
              <CalendarDays className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button onClick={() => {
              onEdit(project);
              onClose();
            }}>
              Edit Project
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};
