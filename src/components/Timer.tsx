import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import ProgressRing from './ProgressRing';
import ProgressGridEditor from './ProgressGridEditor';
import { TimerPhase, Task } from '@/types/task';
import { Session } from '@/types/session';
import confetti from 'canvas-confetti';
import { playTimerEndSound } from '@/lib/sounds';

const DEFAULT_FOCUS_DURATION = 25; // minutes
const DEFAULT_BREAK_DURATION = 5; // minutes

interface TimerProps {
  onTick?: (seconds: number) => void;
  activeTaskId?: string | null;
  activeTask?: Task | null;
  onTaskComplete?: (taskId: string) => void;
  onRunningChange?: (isRunning: boolean) => void;
  onUpdateTask?: (task: Task) => void;
}

const Timer = ({ onTick, activeTaskId, activeTask, onTaskComplete, onRunningChange, onUpdateTask }: TimerProps) => {
  // Load durations from localStorage
  const [focusDuration, setFocusDuration] = useState(() => {
    const saved = localStorage.getItem('focusDuration');
    return saved ? parseInt(saved) : DEFAULT_FOCUS_DURATION;
  });
  const [breakDuration, setBreakDuration] = useState(() => {
    const saved = localStorage.getItem('breakDuration');
    return saved ? parseInt(saved) : DEFAULT_BREAK_DURATION;
  });

  const FOCUS_DURATION = focusDuration * 60; // convert to seconds
  const BREAK_DURATION = breakDuration * 60; // convert to seconds

  const [phase, setPhase] = useState<TimerPhase>('focus');
  const [seconds, setSeconds] = useState(FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [breakBonus, setBreakBonus] = useState(0);
  const [showStartEditor, setShowStartEditor] = useState(false);
  const [showEndEditor, setShowEndEditor] = useState(false);
  const [sessionStartProgress, setSessionStartProgress] = useState(0);
  const [sessionStartSpentMinutes, setSessionStartSpentMinutes] = useState(0);
  const [sessionStartPhase, setSessionStartPhase] = useState<TimerPhase>('focus');
  const [currentSessionStartTime, setCurrentSessionStartTime] = useState<Date | null>(null);
  const [currentSessionStartSeconds, setCurrentSessionStartSeconds] = useState<number>(0);
  const [showRewindOption, setShowRewindOption] = useState(false);
  const [pendingAction, setPendingAction] = useState<'skip' | 'reset' | null>(null);
  const [pendingSessionData, setPendingSessionData] = useState<{ endProgress: number; duration: number } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tempFocusDuration, setTempFocusDuration] = useState(focusDuration);
  const [tempBreakDuration, setTempBreakDuration] = useState(breakDuration);
  const intervalRef = useRef<number>();

  const totalDuration = phase === 'focus' ? FOCUS_DURATION : BREAK_DURATION + breakBonus;
  const progress = ((totalDuration - seconds) / totalDuration) * 100;

  // Calculate task progress
  const taskProgress = activeTask 
    ? Math.min((activeTask.spentMinutes / activeTask.estimatedMinutes) * 100, 100)
    : 0;

  // Load timer state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setPhase(state.phase);
        setSeconds(state.seconds);
        setBreakBonus(state.breakBonus || 0);
        if (state.currentSessionStartTime) {
          setCurrentSessionStartTime(new Date(state.currentSessionStartTime));
        }
        setCurrentSessionStartSeconds(state.currentSessionStartSeconds || 0);
        setSessionStartProgress(state.sessionStartProgress || 0);
        setSessionStartSpentMinutes(state.sessionStartSpentMinutes || 0);
        setSessionStartPhase(state.sessionStartPhase || 'focus');
      } catch (e) {
        console.error('Failed to load timer state:', e);
      }
    }
  }, []);

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    const state = {
      phase,
      seconds,
      breakBonus,
      currentSessionStartTime: currentSessionStartTime?.toISOString(),
      currentSessionStartSeconds,
      sessionStartProgress,
      sessionStartSpentMinutes,
      sessionStartPhase,
    };
    localStorage.setItem('timerState', JSON.stringify(state));
  }, [phase, seconds, breakBonus, currentSessionStartTime, currentSessionStartSeconds, sessionStartProgress, sessionStartSpentMinutes, sessionStartPhase]);

  // Auto-start timer when a new task is selected (Study button pressed)
  const prevActiveTaskIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (activeTaskId && activeTaskId !== prevActiveTaskIdRef.current && activeTask) {
      // New task selected - reset to focus phase and show start editor
      if (isRunning) {
        setIsRunning(false);
        onRunningChange?.(false);
      }
      setPhase('focus');
      setSeconds(FOCUS_DURATION);
      setBreakBonus(0);
      setShowStartEditor(true);
      prevActiveTaskIdRef.current = activeTaskId; // Update ref only when dialog opens
    }
  }, [activeTaskId, activeTask, FOCUS_DURATION, isRunning, onRunningChange]);

  const fireConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  const saveSession = (endProgress: number, duration?: number, skipRewindCheck: boolean = false): boolean => {
    if (!activeTask || !currentSessionStartTime) {
      console.warn('Cannot save session: missing activeTask or currentSessionStartTime');
      return false;
    }

    // Calculate duration based on timer seconds, not wall-clock time
    // This excludes time spent in the progress grid editor
    const calculatedDuration = duration ?? (currentSessionStartSeconds - seconds) / 60; // Convert to minutes
    console.log('Saving session with duration:', calculatedDuration, 'minutes');
    
    // If session is <2 minutes and we haven't skipped the check, show rewind option
    if (calculatedDuration < 2 && !skipRewindCheck) {
      console.log('Session too short, showing rewind option');
      setPendingSessionData({ endProgress, duration: calculatedDuration });
      setShowRewindOption(true);
      return false; // Session not saved yet, pending user decision
    }

    // Save the session
    const session: Session = {
      id: Date.now().toString(),
      taskId: activeTask.id,
      taskName: activeTask.name,
      dateEnded: new Date().toISOString(),
      duration: calculatedDuration,
      progressGridStart: sessionStartProgress,
      progressGridEnd: endProgress,
      progressGridSize: activeTask.progressGridSize,
      phase: sessionStartPhase, // Use the phase when session started, not current phase
    };

    const savedSessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    localStorage.setItem('sessions', JSON.stringify([...savedSessions, session]));
    console.log('Session saved:', session);
    setPendingSessionData(null);
    return true; // Session was saved
  };

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = window.setInterval(() => {
        setSeconds((prev) => {
          const newSeconds = prev - 1;
          if (onTick && phase === 'focus') {
            onTick(1); // Increment spent time by 1 second
          }
          
          // Check if task is completed
          if (activeTask && phase === 'focus') {
            const taskCompleted = activeTask.spentMinutes >= activeTask.estimatedMinutes;
            if (taskCompleted && onTaskComplete && newSeconds > 0) {
              // Task completed mid-session
              fireConfetti();
              onTaskComplete(activeTask.id);
              setBreakBonus(300); // Add 5 minutes (300 seconds) to break
            }
          }
          
          return newSeconds;
        });
      }, 1000);
    } else if (seconds === 0) {
      // Phase complete - play sound and show end editor
      playTimerEndSound();
      if (activeTask) {
        setShowEndEditor(true);
      }
      setIsRunning(false);
      onRunningChange?.(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, seconds, phase, onTick, activeTask, onTaskComplete, onRunningChange]);

  const handleStart = () => {
    if (!isRunning && phase === 'focus' && activeTask) {
      // Show start editor before starting focus
      setShowStartEditor(true);
    } else if (!isRunning && activeTask) {
      // Starting/resuming timer - track session start
      setCurrentSessionStartTime(new Date());
      setCurrentSessionStartSeconds(seconds);
      setSessionStartProgress(activeTask.progressGridFilled);
      setSessionStartSpentMinutes(activeTask.spentMinutes);
      setSessionStartPhase(phase); // Track which phase we're starting
      setIsRunning(true);
      onRunningChange?.(true);
    } else if (isRunning && activeTask) {
      // Pausing - show end editor to record progress
      setIsRunning(false);
      onRunningChange?.(false);
      setShowEndEditor(true);
    }
  };

  const handleStartEditorSave = (filled: number) => {
    setSessionStartProgress(filled);
    setSessionStartSpentMinutes(activeTask?.spentMinutes || 0);
    setCurrentSessionStartTime(new Date());
    setCurrentSessionStartSeconds(seconds);
    setSessionStartPhase(phase); // Track which phase we're starting
    setIsRunning(true);
    onRunningChange?.(true);
  };

  const handleEndEditorSave = (filled: number) => {
    const sessionSaved = saveSession(filled);
    
    // Only clear session start time if session was actually saved (not pending rewind decision)
    if (sessionSaved) {
      setCurrentSessionStartTime(null);
    }
    
    // Handle pending actions
    if (pendingAction === 'skip') {
      if (phase === 'focus') {
        setPhase('break');
        setSeconds(BREAK_DURATION);
        setBreakBonus(0);
      } else {
        setPhase('focus');
        setSeconds(FOCUS_DURATION);
        setBreakBonus(0);
      }
      setPendingAction(null);
    } else if (pendingAction === 'reset') {
      setSeconds(phase === 'focus' ? FOCUS_DURATION : BREAK_DURATION + breakBonus);
      setPendingAction(null);
    }
  };

  const handlePhaseComplete = (filled: number) => {
    saveSession(filled);
    const nextPhase = phase === 'focus' ? 'break' : 'focus';
    setPhase(nextPhase);
    setSeconds(nextPhase === 'focus' ? FOCUS_DURATION : BREAK_DURATION);
    setBreakBonus(0);
    setCurrentSessionStartTime(null);
  };

  const handleRewind = () => {
    // Restore timer
    setSeconds(currentSessionStartSeconds);
    
    // Restore task progress and time
    if (activeTask && onUpdateTask) {
      onUpdateTask({
        ...activeTask,
        spentMinutes: sessionStartSpentMinutes,
        progressGridFilled: sessionStartProgress
      });
    }
    
    setShowRewindOption(false);
    setPendingSessionData(null);
    setCurrentSessionStartTime(null);
  };

  const handleContinueWithoutRewind = () => {
    // Save the session even though it's <2 minutes, using the stored duration
    if (pendingSessionData && activeTask) {
      saveSession(pendingSessionData.endProgress, pendingSessionData.duration, true);
    }
    setShowRewindOption(false);
    setPendingSessionData(null);
    setCurrentSessionStartTime(null); // Now clear it after saving
  };

  const handleReset = () => {
    if (isRunning && activeTask) {
      // If running, show end editor to save session
      setIsRunning(false);
      onRunningChange?.(false);
      setPendingAction('reset');
      setShowEndEditor(true);
      return;
    }
    
    setIsRunning(false);
    onRunningChange?.(false);
    setSeconds(phase === 'focus' ? FOCUS_DURATION : BREAK_DURATION + breakBonus);
    setCurrentSessionStartTime(null);
  };

  const handleSkip = () => {
    if (isRunning && activeTask) {
      // If running, show end editor to save session first
      setIsRunning(false);
      onRunningChange?.(false);
      setPendingAction('skip');
      setShowEndEditor(true);
      return;
    }
    
    // Skip to next phase
    if (phase === 'focus') {
      setPhase('break');
      setSeconds(BREAK_DURATION);
      setBreakBonus(0);
    } else {
      setPhase('focus');
      setSeconds(FOCUS_DURATION);
      setBreakBonus(0);
    }
    setCurrentSessionStartTime(null);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleSaveSettings = () => {
    setFocusDuration(tempFocusDuration);
    setBreakDuration(tempBreakDuration);
    localStorage.setItem('focusDuration', tempFocusDuration.toString());
    localStorage.setItem('breakDuration', tempBreakDuration.toString());
    
    // Reset timer to new duration if not running
    if (!isRunning) {
      setSeconds(phase === 'focus' ? tempFocusDuration * 60 : tempBreakDuration * 60);
    }
    
    setShowSettings(false);
  };

  return (
    <>
      {activeTask && (
        <>
          <ProgressGridEditor
            task={activeTask}
            open={showStartEditor}
            onClose={() => setShowStartEditor(false)}
            onSave={handleStartEditorSave}
            title="Session Starting"
            description="Mark your current progress before starting the focus session."
          />
          <ProgressGridEditor
            task={activeTask}
            open={showEndEditor}
            onClose={() => {
              setShowEndEditor(false);
              // If timer hit 0, move to next phase
              if (seconds === 0) {
                const nextPhase = phase === 'focus' ? 'break' : 'focus';
                setPhase(nextPhase);
                setSeconds(nextPhase === 'focus' ? FOCUS_DURATION : BREAK_DURATION);
                setBreakBonus(0);
                setCurrentSessionStartTime(null);
              }
            }}
            onSave={(filled) => {
              if (seconds === 0) {
                handlePhaseComplete(filled);
              } else {
                handleEndEditorSave(filled);
              }
              setShowEndEditor(false);
            }}
            title="Session Complete"
            description="Update your progress to reflect what you achieved in this session."
          />
        </>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Timer Settings</DialogTitle>
            <DialogDescription>
              Customize your focus and break durations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="focus-duration">Focus Duration (minutes)</Label>
              <Input
                id="focus-duration"
                type="number"
                min="1"
                max="120"
                value={tempFocusDuration}
                onChange={(e) => setTempFocusDuration(parseInt(e.target.value) || DEFAULT_FOCUS_DURATION)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="break-duration">Break Duration (minutes)</Label>
              <Input
                id="break-duration"
                type="number"
                min="1"
                max="60"
                value={tempBreakDuration}
                onChange={(e) => setTempBreakDuration(parseInt(e.target.value) || DEFAULT_BREAK_DURATION)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setTempFocusDuration(focusDuration);
              setTempBreakDuration(breakDuration);
              setShowSettings(false);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} className="bg-gradient-primary">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rewind Option Dialog */}
      {showRewindOption && activeTask && (
        <Dialog open={showRewindOption} onOpenChange={setShowRewindOption}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Session Too Short</DialogTitle>
              <DialogDescription>
                This session was less than 2 minutes and won't be recorded. Would you like to rewind to the start of this session?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={handleContinueWithoutRewind}>
                Continue
              </Button>
              <Button onClick={handleRewind} className="bg-gradient-primary">
                Rewind
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          {phase === 'focus' ? '🎯 Focus Time' : '☕ Break Time'}
        </h2>
        {activeTask && phase === 'focus' && (
          <p className="text-lg font-medium mt-2">{activeTask.name}</p>
        )}
      </div>

      <div className="flex items-center gap-8">
        {/* Task Progress Ring */}
        {activeTask && phase === 'focus' && (
          <div className="relative">
            <ProgressRing progress={taskProgress} size={180} strokeWidth={10} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {Math.round(taskProgress)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Task
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Timer Ring */}
        <div className="relative">
          <ProgressRing progress={progress} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {formatTime(seconds)}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {phase === 'focus' ? 'Stay focused!' : 'Take a break!'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap justify-center relative z-50">
        <Button
          size="lg"
          onClick={handleStart}
          className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow relative z-50"
        >
          {isRunning ? (
            <>
              <Pause className="mr-2 h-5 w-5" />
              Pause
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Start
            </>
          )}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleReset}
          className="relative z-50 bg-card"
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          Reset
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleSkip}
          className="relative z-50 bg-card"
        >
          <SkipForward className="mr-2 h-5 w-5" />
          {phase === 'focus' ? 'Skip to Break' : 'Skip to Focus'}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => setShowSettings(true)}
          className="relative z-50 bg-card"
        >
          <Settings className="mr-2 h-5 w-5" />
          Settings
        </Button>
      </div>
    </div>
    </>
  );
};

export default Timer;
