import { useRef, useEffect, useState, useCallback } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

interface Point {
  x: number;
  y: number;
  timestamp: number;
}

interface GestureCanvasProps {
  onGestureComplete: (hash: string, points: Point[]) => void;
  isRecording: boolean;
  onRecordingChange: (recording: boolean) => void;
}

const GestureCanvas = ({ onGestureComplete, isRecording, onRecordingChange }: GestureCanvasProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [isHandDetected, setIsHandDetected] = useState(false);
  const pointsRef = useRef<Point[]>([]);
  const lastPointTime = useRef<number>(0);
  const recordingTimeout = useRef<NodeJS.Timeout | null>(null);

  const generateGestureHash = useCallback((gesturePoints: Point[]): string => {
    if (gesturePoints.length < 10) return '';
    
    // Normalize points to 0-1 range
    const minX = Math.min(...gesturePoints.map(p => p.x));
    const maxX = Math.max(...gesturePoints.map(p => p.x));
    const minY = Math.min(...gesturePoints.map(p => p.y));
    const maxY = Math.max(...gesturePoints.map(p => p.y));
    
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    
    const normalized = gesturePoints.map(p => ({
      x: (p.x - minX) / rangeX,
      y: (p.y - minY) / rangeY,
    }));
    
    // Sample points to create consistent signature
    const sampleSize = 16;
    const step = Math.floor(normalized.length / sampleSize);
    const sampled = normalized.filter((_, i) => i % step === 0).slice(0, sampleSize);
    
    // Create direction vectors
    const directions: number[] = [];
    for (let i = 1; i < sampled.length; i++) {
      const angle = Math.atan2(
        sampled[i].y - sampled[i - 1].y,
        sampled[i].x - sampled[i - 1].x
      );
      // Quantize to 8 directions
      const quantized = Math.round((angle + Math.PI) / (Math.PI / 4)) % 8;
      directions.push(quantized);
    }
    
    // Create hash from directions
    const hash = directions.join('');
    return hash;
  }, []);

  const drawTrail = useCallback((newPoints: Point[]) => {
    const canvas = trailCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with fade effect
    ctx.fillStyle = 'rgba(10, 15, 25, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (newPoints.length < 2) return;

    // Draw glowing trail
    ctx.beginPath();
    ctx.moveTo(newPoints[0].x * canvas.width, newPoints[0].y * canvas.height);
    
    for (let i = 1; i < newPoints.length; i++) {
      ctx.lineTo(newPoints[i].x * canvas.width, newPoints[i].y * canvas.height);
    }
    
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.stroke();

    // Draw glow layer
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 12;
    ctx.stroke();

    // Draw points
    newPoints.slice(-5).forEach((point, i) => {
      const alpha = 0.5 + (i / 5) * 0.5;
      ctx.beginPath();
      ctx.arc(
        point.x * canvas.width,
        point.y * canvas.height,
        6,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
      ctx.shadowBlur = 30;
      ctx.fill();
    });
  }, []);

  const onResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Mirror the video
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw hand landmarks
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setIsHandDetected(true);
      const hand = results.multiHandLandmarks[0];
      
      // Get index finger tip (landmark 8)
      const indexTip = hand[8];
      const mirroredX = 1 - indexTip.x;
      
      // Draw hand skeleton
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      
      // Draw connections
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // thumb
        [0, 5], [5, 6], [6, 7], [7, 8], // index
        [0, 9], [9, 10], [10, 11], [11, 12], // middle
        [0, 13], [13, 14], [14, 15], [15, 16], // ring
        [0, 17], [17, 18], [18, 19], [19, 20], // pinky
        [5, 9], [9, 13], [13, 17] // palm
      ];

      connections.forEach(([start, end]) => {
        ctx.beginPath();
        ctx.moveTo((1 - hand[start].x) * canvas.width, hand[start].y * canvas.height);
        ctx.lineTo((1 - hand[end].x) * canvas.width, hand[end].y * canvas.height);
        ctx.stroke();
      });

      // Draw landmark points
      hand.forEach((landmark, i) => {
        ctx.beginPath();
        ctx.arc(
          (1 - landmark.x) * canvas.width,
          landmark.y * canvas.height,
          i === 8 ? 10 : 4,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = i === 8 ? '#00ffff' : 'rgba(0, 255, 255, 0.6)';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = i === 8 ? 20 : 10;
        ctx.fill();
      });

      if (isRecording) {
        const now = Date.now();
        if (now - lastPointTime.current > 30) {
          const newPoint: Point = {
            x: mirroredX,
            y: indexTip.y,
            timestamp: now,
          };
          
          pointsRef.current = [...pointsRef.current, newPoint];
          setPoints(pointsRef.current);
          drawTrail(pointsRef.current);
          lastPointTime.current = now;

          // Reset timeout for auto-complete
          if (recordingTimeout.current) {
            clearTimeout(recordingTimeout.current);
          }
          recordingTimeout.current = setTimeout(() => {
            if (pointsRef.current.length > 10) {
              const hash = generateGestureHash(pointsRef.current);
              if (hash) {
                onGestureComplete(hash, pointsRef.current);
              }
            }
            pointsRef.current = [];
            setPoints([]);
            onRecordingChange(false);
          }, 1500);
        }
      }
    } else {
      setIsHandDetected(false);
    }
  }, [isRecording, drawTrail, generateGestureHash, onGestureComplete, onRecordingChange]);

  useEffect(() => {
    const video = videoRef.current;
    const trailCanvas = trailCanvasRef.current;
    if (!video || !trailCanvas) return;

    trailCanvas.width = 640;
    trailCanvas.height = 480;

    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults(onResults);

    const camera = new Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video });
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      camera.stop();
      hands.close();
      if (recordingTimeout.current) {
        clearTimeout(recordingTimeout.current);
      }
    };
  }, [onResults]);

  useEffect(() => {
    if (!isRecording) {
      pointsRef.current = [];
      setPoints([]);
      const canvas = trailCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
  }, [isRecording]);

  return (
    <div className="relative w-full max-w-2xl aspect-[4/3] rounded-2xl overflow-hidden glow-border">
      {/* Video feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-0"
        playsInline
      />
      
      {/* Hand tracking canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Gesture trail canvas */}
      <canvas
        ref={trailCanvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-screen"
      />
      
      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Scan lines effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent opacity-50 scan-line" />
        
        {/* Corner brackets */}
        <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-primary/60" />
        <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-primary/60" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-primary/60" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-primary/60" />
        
        {/* Status indicator */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isHandDetected ? 'bg-primary' : 'bg-muted-foreground'} ${isHandDetected && 'pulse-glow'}`} />
          <span className="text-sm font-display text-foreground/80">
            {isHandDetected ? 'HAND DETECTED' : 'SEARCHING...'}
          </span>
        </div>
        
        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-card/80 backdrop-blur-md px-4 py-2 rounded-full">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-display text-foreground">RECORDING GESTURE</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestureCanvas;
