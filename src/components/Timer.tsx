import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProgressRing from './ProgressRing';
import { TimerPhase, Task } from '@/types/task';
import confetti from 'canvas-confetti';
import { playTimerEndSound } from '@/lib/sounds';

const FOCUS_DURATION = 25 * 60; // 25 minutes in seconds
const BREAK_DURATION = 5 * 60; // 5 minutes in seconds

interface TimerProps {
  onTick?: (seconds: number) => void;
  activeTaskId?: string | null;
  activeTask?: Task | null;
  onTaskComplete?: (taskId: string) => void;
  onRunningChange?: (isRunning: boolean) => void;
}

const Timer = ({ onTick, activeTaskId, activeTask, onTaskComplete, onRunningChange }: TimerProps) => {
  const [phase, setPhase] = useState<TimerPhase>('focus');
  const [seconds, setSeconds] = useState(FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [breakBonus, setBreakBonus] = useState(0);
  const intervalRef = useRef<number>();

  const totalDuration = phase === 'focus' ? FOCUS_DURATION : BREAK_DURATION + breakBonus;
  const progress = ((totalDuration - seconds) / totalDuration) * 100;

  // Calculate task progress
  const taskProgress = activeTask 
    ? Math.min((activeTask.spentMinutes / activeTask.estimatedMinutes) * 100, 100)
    : 0;

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
              setPhase('break');
              setSeconds(BREAK_DURATION + 300);
              setIsRunning(false);
              onRunningChange?.(false);
            }
          }
          
          return newSeconds;
        });
      }, 1000);
    } else if (seconds === 0) {
      // Phase complete - play sound
      playTimerEndSound();
      const nextPhase = phase === 'focus' ? 'break' : 'focus';
      setPhase(nextPhase);
      setSeconds(nextPhase === 'focus' ? FOCUS_DURATION : BREAK_DURATION);
      setBreakBonus(0);
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
    const newRunningState = !isRunning;
    setIsRunning(newRunningState);
    onRunningChange?.(newRunningState);
  };

  const handleReset = () => {
    setIsRunning(false);
    onRunningChange?.(false);
    setSeconds(phase === 'focus' ? FOCUS_DURATION : BREAK_DURATION + breakBonus);
  };

  const handleSkipToBreak = () => {
    setPhase('break');
    setSeconds(BREAK_DURATION);
    setBreakBonus(0);
    setIsRunning(false);
    onRunningChange?.(false);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
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

      <div className="flex gap-4 flex-wrap justify-center">
        <Button
          size="lg"
          onClick={handleStart}
          className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
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
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          Reset
        </Button>
        {phase === 'focus' && (
          <Button
            size="lg"
            variant="outline"
            onClick={handleSkipToBreak}
          >
            <SkipForward className="mr-2 h-5 w-5" />
            Skip to Break
          </Button>
        )}
      </div>
    </div>
  );
};

export default Timer;
