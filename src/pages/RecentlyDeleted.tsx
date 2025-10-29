import { useState, useEffect } from 'react';
import { Session } from '@/types/session';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Clock, Calendar as CalendarIcon, Trash2, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const RecentlyDeleted = () => {
  const navigate = useNavigate();
  const [deletedSessions, setDeletedSessions] = useState<Session[]>([]);
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    const savedDeletedSessions = localStorage.getItem('deletedSessions');
    if (savedDeletedSessions) {
      const parsed = JSON.parse(savedDeletedSessions);
      setDeletedSessions(parsed.sort((a: Session, b: Session) => 
        new Date(b.dateEnded).getTime() - new Date(a.dateEnded).getTime()
      ));
    }
  }, []);

  const saveDeletedSessions = (updatedSessions: Session[]) => {
    localStorage.setItem('deletedSessions', JSON.stringify(updatedSessions));
    setDeletedSessions(updatedSessions.sort((a: Session, b: Session) => 
      new Date(b.dateEnded).getTime() - new Date(a.dateEnded).getTime()
    ));
  };

  const handleRestore = (session: Session) => {
    // Restore session to active sessions
    const activeSessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    localStorage.setItem('sessions', JSON.stringify([...activeSessions, session]));
    
    // Restore time to task
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]') as Task[];
    const updatedTasks = tasks.map(task => {
      if (task.id === session.taskId) {
        return {
          ...task,
          spentMinutes: task.spentMinutes + session.duration
        };
      }
      return task;
    });
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    
    // Remove from deleted sessions
    const updatedDeleted = deletedSessions.filter(s => s.id !== session.id);
    saveDeletedSessions(updatedDeleted);
    
    toast.success('Session restored');
  };

  const handlePermanentDeleteClick = (session: Session) => {
    setSelectedSession(session);
    setPermanentDeleteDialogOpen(true);
  };

  const handlePermanentDeleteConfirm = () => {
    if (selectedSession) {
      const updatedSessions = deletedSessions.filter(s => s.id !== selectedSession.id);
      saveDeletedSessions(updatedSessions);
      toast.success('Session permanently deleted');
      setPermanentDeleteDialogOpen(false);
      setSelectedSession(null);
    }
  };

  const formatDuration = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins}m ${secs}s`;
  };

  const groupByDate = (sessions: Session[]) => {
    const grouped: { [key: string]: Session[] } = {};
    sessions.forEach(session => {
      const date = new Date(session.dateEnded).toLocaleDateString('en-GB');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(session);
    });
    return grouped;
  };

  const groupedSessions = groupByDate(deletedSessions);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <header className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/history')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Recently Deleted
            </h1>
            <p className="text-muted-foreground mt-1">
              Restore or permanently delete sessions
            </p>
          </div>
        </header>

        {deletedSessions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No deleted sessions
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSessions).map(([date, dateSessions]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">{date}</h2>
                  <span className="text-sm text-muted-foreground">
                    ({dateSessions.length} session{dateSessions.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <div className="space-y-3">
                  {dateSessions.map(session => {
                    const progressChange = session.progressGridEnd - session.progressGridStart;
                    const progressPercentage = session.progressGridSize > 0
                      ? Math.round((progressChange / session.progressGridSize) * 100)
                      : 0;

                    return (
                      <Card key={session.id} className="p-4 opacity-70">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {session.description || 'Untitled Session'}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Task: {session.taskName}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleRestore(session)}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handlePermanentDeleteClick(session)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {new Date(session.dateEnded).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                              <div>
                                Duration: {formatDuration(session.duration)}
                              </div>
                              <div>
                                Phase: {session.phase === 'focus' ? '🎯 Focus' : '☕ Break'}
                              </div>
                            </div>

                            <div>
                              <div className="text-sm font-medium mb-2">
                                Progress Made: {progressChange > 0 ? '+' : ''}{progressChange} squares 
                                {progressPercentage > 0 && ` (+${progressPercentage}%)`}
                              </div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-muted-foreground">Start:</span>
                                <div className="flex gap-1">
                                  {Array.from({ length: Math.min(session.progressGridSize, 20) }).map((_, index) => (
                                    <div
                                      key={index}
                                      className={cn(
                                        "w-3 h-3 border border-border rounded-sm",
                                        index < session.progressGridStart
                                          ? "bg-gradient-primary"
                                          : "bg-secondary"
                                      )}
                                    />
                                  ))}
                                  {session.progressGridSize > 20 && (
                                    <span className="text-xs text-muted-foreground ml-1">
                                      +{session.progressGridSize - 20} more
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">End:</span>
                                <div className="flex gap-1">
                                  {Array.from({ length: Math.min(session.progressGridSize, 20) }).map((_, index) => (
                                    <div
                                      key={index}
                                      className={cn(
                                        "w-3 h-3 border border-border rounded-sm",
                                        index < session.progressGridEnd
                                          ? "bg-gradient-primary"
                                          : "bg-secondary"
                                      )}
                                    />
                                  ))}
                                  {session.progressGridSize > 20 && (
                                    <span className="text-xs text-muted-foreground ml-1">
                                      +{session.progressGridSize - 20} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <AlertDialog open={permanentDeleteDialogOpen} onOpenChange={setPermanentDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Permanently Delete Session?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This session will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePermanentDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Permanently Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default RecentlyDeleted;
