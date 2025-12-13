import { useState } from 'react';
import ParticleBackground from '@/components/ParticleBackground';
import HeroSection from '@/components/HeroSection';
import TransferFlow from '@/components/TransferFlow';

const Index = () => {
  const [showTransferFlow, setShowTransferFlow] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ParticleBackground />
      
      {showTransferFlow ? (
        <TransferFlow onBack={() => setShowTransferFlow(false)} />
      ) : (
        <HeroSection onGetStarted={() => setShowTransferFlow(true)} />
      )}
    </div>
  );
};

export default Index;
