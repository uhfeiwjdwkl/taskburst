import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProgressRing from './ProgressRing';
import { TimerPhase } from '@/types/task';
import confetti from 'canvas-confetti';

const FOCUS_DURATION = 25 * 60; // 25 minutes in seconds
const BREAK_DURATION = 5 * 60; // 5 minutes in seconds

interface TimerProps {
  onTick?: (seconds: number) => void;
  activeTaskId?: string | null;
}

const Timer = ({ onTick, activeTaskId }: TimerProps) => {
  const [phase, setPhase] = useState<TimerPhase>('focus');
  const [seconds, setSeconds] = useState(FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number>();

  const totalDuration = phase === 'focus' ? FOCUS_DURATION : BREAK_DURATION;
  const progress = ((totalDuration - seconds) / totalDuration) * 100;

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
          return newSeconds;
        });
      }, 1000);
    } else if (seconds === 0) {
      // Phase complete
      fireConfetti();
      const nextPhase = phase === 'focus' ? 'break' : 'focus';
      setPhase(nextPhase);
      setSeconds(nextPhase === 'focus' ? FOCUS_DURATION : BREAK_DURATION);
      setIsRunning(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, seconds, phase, onTick]);

  const handleStart = () => {
    if (!isRunning) {
      fireConfetti();
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(phase === 'focus' ? FOCUS_DURATION : BREAK_DURATION);
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
        {activeTaskId && phase === 'focus' && (
          <p className="text-sm text-muted-foreground">Working on task</p>
        )}
      </div>

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

      <div className="flex gap-4">
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
      </div>
    </div>
  );
};

export default Timer;
