import { useState, useEffect } from 'react';
import { Session } from '@/types/session';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, Clock, Calendar as CalendarIcon, Trash2, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const History = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [newTaskName, setNewTaskName] = useState('');

  useEffect(() => {
    const savedSessions = localStorage.getItem('sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      // Sort by date, newest first
      setSessions(parsed.sort((a: Session, b: Session) => 
        new Date(b.dateEnded).getTime() - new Date(a.dateEnded).getTime()
      ));
    }
  }, []);

  const saveSessions = (updatedSessions: Session[]) => {
    localStorage.setItem('sessions', JSON.stringify(updatedSessions));
    setSessions(updatedSessions.sort((a: Session, b: Session) => 
      new Date(b.dateEnded).getTime() - new Date(a.dateEnded).getTime()
    ));
  };

  const handleDeleteClick = (session: Session) => {
    setSelectedSession(session);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedSession) {
      const updatedSessions = sessions.filter(s => s.id !== selectedSession.id);
      saveSessions(updatedSessions);
      toast.success('Session deleted');
      setDeleteDialogOpen(false);
      setSelectedSession(null);
    }
  };

  const handleRenameClick = (session: Session) => {
    setSelectedSession(session);
    setNewTaskName(session.taskName);
    setRenameDialogOpen(true);
  };

  const handleRenameSave = () => {
    if (selectedSession && newTaskName.trim()) {
      const updatedSessions = sessions.map(s => 
        s.id === selectedSession.id ? { ...s, taskName: newTaskName.trim() } : s
      );
      saveSessions(updatedSessions);
      toast.success('Session renamed');
      setRenameDialogOpen(false);
      setSelectedSession(null);
      setNewTaskName('');
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
      const date = new Date(session.dateEnded).toLocaleDateString('en-GB'); // DD/MM/YYYY
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(session);
    });
    return grouped;
  };

  const groupedSessions = groupByDate(sessions);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <header className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Session History
            </h1>
            <p className="text-muted-foreground mt-1">
              View all your past focus sessions
            </p>
          </div>
        </header>

        {sessions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No sessions recorded yet. Complete a focus session to see it here!
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
                      <Card key={session.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-semibold text-lg">
                                {session.taskName}
                              </h3>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleRenameClick(session)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteClick(session)}
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

                            {/* Progress Achievement */}
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Session?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this session? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Rename Dialog */}
        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="Enter new task name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameSave();
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRenameSave} className="bg-gradient-primary">
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default History;
