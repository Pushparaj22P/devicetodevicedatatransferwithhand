import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Send, Download, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import GestureCanvas from './GestureCanvas';
import DataTransferCard, { TransferData } from './DataTransferCard';
import GestureDisplay from './GestureDisplay';
import GestureTemplateSelector from './GestureTemplateSelector';
import SessionTimer from './SessionTimer';
import { GestureTemplate } from '@/lib/gestureTemplates';
import { 
  createGestureSession, 
  findMatchingSession, 
  completeSession,
  subscribeToSessionUpdates,
  decryptSessionData,
  GestureSession
} from '@/lib/sessionManager';

interface Point {
  x: number;
  y: number;
  timestamp: number;
}

interface TransferFlowProps {
  onBack: () => void;
}

type FlowState = 'select-mode' | 'prepare-data' | 'capture-gesture' | 'waiting' | 'success' | 'receive-gesture' | 'received' | 'expired';

const TransferFlow = ({ onBack }: TransferFlowProps) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<'send' | 'receive' | null>(null);
  const [flowState, setFlowState] = useState<FlowState>('select-mode');
  const [isRecording, setIsRecording] = useState(false);
  const [gestureHash, setGestureHash] = useState<string>('');
  const [gesturePoints, setGesturePoints] = useState<Point[]>([]);
  const [dataToSend, setDataToSend] = useState<TransferData | null>(null);
  const [receivedData, setReceivedData] = useState<TransferData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<GestureTemplate | null>(null);
  const [currentSession, setCurrentSession] = useState<GestureSession | null>(null);

  const handleModeSelect = (selectedMode: 'send' | 'receive') => {
    setMode(selectedMode);
    if (selectedMode === 'send') {
      setFlowState('prepare-data');
    } else {
      setFlowState('receive-gesture');
    }
  };

  const handleDataSubmit = (data: TransferData) => {
    setDataToSend(data);
    setFlowState('capture-gesture');
  };

  const handleGestureComplete = useCallback(async (hash: string, points: Point[]) => {
    setGestureHash(hash);
    setGesturePoints(points);
    
    if (mode === 'send' && dataToSend) {
      setFlowState('waiting');
      
      // Create session in database
      const result = await createGestureSession(points, dataToSend);
      
      if (result) {
        setCurrentSession(result.session);
        
        toast({
          title: "Session Created",
          description: "Waiting for receiver to draw the same gesture...",
        });

        // Subscribe to session updates
        const unsubscribe = subscribeToSessionUpdates(result.session.id, (updatedSession) => {
          if (updatedSession.status === 'matched' || updatedSession.status === 'completed') {
            setFlowState('success');
            toast({
              title: "Transfer Complete!",
              description: "Your data has been securely delivered.",
            });
            unsubscribe();
          }
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create session. Please try again.",
          variant: "destructive",
        });
        setFlowState('capture-gesture');
      }
    } else if (mode === 'receive') {
      setFlowState('waiting');
      
      // Try to find matching session
      const matchedSession = await findMatchingSession(points);
      
      if (matchedSession) {
        setCurrentSession(matchedSession);
        
        // Decrypt and display data
        const decryptedContent = await decryptSessionData(matchedSession);
        
        setReceivedData({
          type: matchedSession.data_type as TransferData['type'],
          title: matchedSession.data_title || undefined,
          content: decryptedContent || matchedSession.data_content,
        });
        
        // Mark session as completed
        await completeSession(matchedSession.id);
        
        setFlowState('received');
        
        toast({
          title: "Data Received!",
          description: "Gesture matched successfully.",
        });
      } else {
        toast({
          title: "No Match Found",
          description: "No active session with matching gesture. Try again.",
          variant: "destructive",
        });
        setFlowState('receive-gesture');
      }
    }
  }, [mode, dataToSend, toast]);

  const handleSessionExpired = useCallback(() => {
    setFlowState('expired');
    toast({
      title: "Session Expired",
      description: "The transfer session has timed out for security.",
      variant: "destructive",
    });
  }, [toast]);

  const resetFlow = () => {
    setMode(null);
    setFlowState('select-mode');
    setGestureHash('');
    setGesturePoints([]);
    setDataToSend(null);
    setReceivedData(null);
    setIsRecording(false);
    setSelectedTemplate(null);
    setCurrentSession(null);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-glass-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-display">Back</span>
          </button>
          <h1 className="font-display text-xl font-bold">
            <span className="text-foreground">Air</span>
            <span className="text-gradient">Link</span>
          </h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-4xl">
          
          {/* Mode Selection */}
          {flowState === 'select-mode' && (
            <div className="text-center animate-fade-in">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Choose Your Role
              </h2>
              <p className="text-muted-foreground mb-12">
                Are you sending or receiving data?
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <button
                  onClick={() => handleModeSelect('send')}
                  className="glass-card p-8 text-center group hover:border-primary/40 transition-all duration-300"
                >
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                    <Send className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-foreground mb-2">Send</h3>
                  <p className="text-muted-foreground">Share data with another device</p>
                </button>
                
                <button
                  onClick={() => handleModeSelect('receive')}
                  className="glass-card p-8 text-center group hover:border-primary/40 transition-all duration-300"
                >
                  <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/20 transition-colors">
                    <Download className="w-10 h-10 text-accent" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-foreground mb-2">Receive</h3>
                  <p className="text-muted-foreground">Accept data from another device</p>
                </button>
              </div>
            </div>
          )}

          {/* Prepare Data (Send mode) */}
          {flowState === 'prepare-data' && (
            <div className="flex flex-col items-center animate-fade-in">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2 text-foreground text-center">
                Prepare Your Data
              </h2>
              <p className="text-muted-foreground mb-8 text-center">
                Enter the content you want to share
              </p>
              <DataTransferCard mode="send" onDataSubmit={handleDataSubmit} />
            </div>
          )}

          {/* Capture Gesture */}
          {(flowState === 'capture-gesture' || flowState === 'receive-gesture') && (
            <div className="flex flex-col items-center animate-fade-in">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2 text-foreground text-center">
                Draw Your Gesture
              </h2>
              <p className="text-muted-foreground mb-6 text-center">
                {mode === 'send' 
                  ? 'Draw a unique gesture that the receiver will replicate'
                  : 'Replicate the sender\'s gesture to receive data'}
              </p>

              {/* Template Selector */}
              <div className="w-full max-w-2xl mb-6">
                <GestureTemplateSelector
                  selectedTemplate={selectedTemplate}
                  onSelect={setSelectedTemplate}
                />
              </div>
              
              <GestureCanvas
                onGestureComplete={handleGestureComplete}
                isRecording={isRecording}
                onRecordingChange={setIsRecording}
                selectedTemplate={selectedTemplate}
              />
              
              <div className="mt-8 flex gap-4">
                <Button
                  variant={isRecording ? 'outline' : 'hero'}
                  size="lg"
                  onClick={() => setIsRecording(!isRecording)}
                >
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
                <Button variant="glass" size="lg" onClick={resetFlow}>
                  Cancel
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mt-4">
                Raise your hand and draw a shape (star, circle, heart, etc.)
              </p>
            </div>
          )}

          {/* Waiting State */}
          {flowState === 'waiting' && (
            <div className="flex flex-col items-center text-center animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8 animate-glow-pulse">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
              
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-4 text-foreground">
                {mode === 'send' ? 'Waiting for Receiver...' : 'Matching Gesture...'}
              </h2>
              
              <p className="text-muted-foreground mb-8">
                {mode === 'send' 
                  ? 'Ask the receiver to draw the same gesture'
                  : 'Looking for a matching session'}
              </p>
              
              {gesturePoints.length > 0 && (
                <div className="mb-8">
                  <p className="text-sm text-muted-foreground mb-3">Your Gesture</p>
                  <GestureDisplay points={gesturePoints} size={150} />
                </div>
              )}

              {/* Session Timer */}
              {currentSession && (
                <div className="w-full max-w-sm mb-6">
                  <SessionTimer 
                    expiresAt={currentSession.expires_at}
                    onExpired={handleSessionExpired}
                  />
                </div>
              )}
              
              <div className="glass-card p-4 max-w-sm">
                <p className="text-xs text-muted-foreground mb-1">Session Key</p>
                <p className="font-mono text-primary text-sm">{gestureHash || 'Generating...'}</p>
              </div>
            </div>
          )}

          {/* Success State (Send) */}
          {flowState === 'success' && (
            <div className="flex flex-col items-center text-center animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-8">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-4 text-foreground">
                Transfer Complete!
              </h2>
              
              <p className="text-muted-foreground mb-8">
                Your data has been securely delivered
              </p>
              
              {gesturePoints.length > 0 && (
                <div className="mb-8">
                  <p className="text-sm text-muted-foreground mb-3">Gesture Used</p>
                  <GestureDisplay points={gesturePoints} size={120} animate={false} />
                </div>
              )}
              
              <Button variant="hero" size="lg" onClick={resetFlow}>
                Start New Transfer
              </Button>
            </div>
          )}

          {/* Expired State */}
          {flowState === 'expired' && (
            <div className="flex flex-col items-center text-center animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mb-8">
                <RefreshCw className="w-12 h-12 text-destructive" />
              </div>
              
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-4 text-foreground">
                Session Expired
              </h2>
              
              <p className="text-muted-foreground mb-8">
                The session timed out for security. Please start a new transfer.
              </p>
              
              <Button variant="hero" size="lg" onClick={resetFlow}>
                Start New Transfer
              </Button>
            </div>
          )}

          {/* Received State */}
          {flowState === 'received' && (
            <div className="flex flex-col items-center animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-8">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-4 text-foreground text-center">
                Data Received!
              </h2>
              
              <p className="text-muted-foreground mb-8 text-center">
                Gesture matched successfully • AES-256 encrypted
              </p>
              
              <DataTransferCard mode="receive" receivedData={receivedData} />
              
              <Button variant="hero" size="lg" className="mt-8" onClick={resetFlow}>
                Start New Transfer
              </Button>
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
};

export default TransferFlow;
