import { Hand, Wifi, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroBg from '@/assets/hero-bg.jpg';

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  const features = [
    { icon: Hand, label: 'Gesture Recognition', description: 'AI-powered hand tracking' },
    { icon: Shield, label: 'Secure Transfer', description: 'One-time session keys' },
    { icon: Zap, label: 'Instant Pairing', description: 'No setup required' },
    { icon: Wifi, label: 'No Bluetooth/NFC', description: 'Pure visual connection' },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8 animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">Next-Gen Data Sharing</span>
        </div>
        
        {/* Title */}
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <span className="text-foreground">Air</span>
          <span className="text-gradient">Link</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Share data between devices using{' '}
          <span className="text-primary">hand gestures</span> in the air.
          No Bluetooth. No WiFi. No QR codes.
        </p>
        
        {/* Description */}
        <p className="text-muted-foreground max-w-xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          Draw the same gesture on two devices to create an instant secure connection 
          and transfer text, contacts, or credentials in seconds.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Button variant="hero" size="xl" onClick={onGetStarted}>
            <Hand className="w-5 h-5" />
            Start Sharing
          </Button>
          <Button variant="glass" size="xl">
            Learn How It Works
          </Button>
        </div>
        
        {/* Features grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.5s' }}>
          {features.map(({ icon: Icon, label, description }) => (
            <div 
              key={label}
              className="glass-card p-6 text-center group hover:border-primary/40 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-sm font-semibold text-foreground mb-1">{label}</h3>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
          <div className="w-1 h-2 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
