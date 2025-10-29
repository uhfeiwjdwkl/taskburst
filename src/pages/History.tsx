import { useState, useEffect } from 'react';
import { Session } from '@/types/session';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const History = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);

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
                            <h3 className="font-semibold text-lg mb-2">
                              {session.taskName}
                            </h3>
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
      </div>
    </div>
  );
};

export default History;
