import { useState, useEffect } from 'react';
import { Clock, Shield, AlertTriangle } from 'lucide-react';

interface SessionTimerProps {
  expiresAt: string;
  onExpired?: () => void;
}

const SessionTimer = ({ expiresAt, onExpired }: SessionTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      
      if (diff === 0 && !isExpired) {
        setIsExpired(true);
        onExpired?.();
      }
      
      return diff;
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, isExpired, onExpired]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (isExpired) return 'text-destructive';
    if (timeLeft <= 10) return 'text-red-500';
    if (timeLeft <= 30) return 'text-yellow-500';
    return 'text-primary';
  };

  const getProgressWidth = () => {
    const total = 60; // 60 second sessions
    return Math.min(100, (timeLeft / total) * 100);
  };

  if (isExpired) {
    return (
      <div className="glass-card p-4 flex items-center gap-3 border-destructive/30">
        <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-destructive">Session Expired</p>
          <p className="text-xs text-muted-foreground">Start a new transfer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-semibold text-foreground">Secure Session</p>
            <div className={`flex items-center gap-1 ${getTimerColor()}`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono text-sm font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">End-to-end encrypted transfer</p>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${
            timeLeft <= 10 ? 'bg-red-500' : timeLeft <= 30 ? 'bg-yellow-500' : 'bg-primary'
          }`}
          style={{ width: `${getProgressWidth()}%` }}
        />
      </div>
      
      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        <Shield className="w-3 h-3" />
        <span>AES-256 encrypted • Auto-expires for security</span>
      </div>
    </div>
  );
};

export default SessionTimer;
