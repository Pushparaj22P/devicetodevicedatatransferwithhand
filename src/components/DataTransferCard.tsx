import { useState } from 'react';
import { Send, Download, FileText, User, Key, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataTransferCardProps {
  mode: 'send' | 'receive';
  sessionHash?: string;
  onDataSubmit?: (data: TransferData) => void;
  receivedData?: TransferData | null;
}

export interface TransferData {
  type: 'text' | 'contact' | 'credentials' | 'link';
  content: string;
  title?: string;
}

const DataTransferCard = ({ mode, sessionHash, onDataSubmit, receivedData }: DataTransferCardProps) => {
  const [dataType, setDataType] = useState<TransferData['type']>('text');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  const dataTypes = [
    { type: 'text' as const, icon: FileText, label: 'Text' },
    { type: 'contact' as const, icon: User, label: 'Contact' },
    { type: 'credentials' as const, icon: Key, label: 'Credentials' },
    { type: 'link' as const, icon: Link2, label: 'Link' },
  ];

  const handleSubmit = () => {
    if (content && onDataSubmit) {
      onDataSubmit({ type: dataType, content, title });
      setContent('');
      setTitle('');
    }
  };

  if (mode === 'receive' && receivedData) {
    return (
      <div className="glass-card p-6 w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg text-foreground">Data Received</h3>
            <p className="text-sm text-muted-foreground capitalize">{receivedData.type}</p>
          </div>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4 border border-glass-border">
          {receivedData.title && (
            <p className="text-sm font-medium text-primary mb-2">{receivedData.title}</p>
          )}
          <p className="text-foreground font-mono text-sm break-all">{receivedData.content}</p>
        </div>
        
        <Button variant="glass" className="w-full mt-4" onClick={() => navigator.clipboard.writeText(receivedData.content)}>
          Copy to Clipboard
        </Button>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 w-full max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Send className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-lg text-foreground">Prepare Data</h3>
          <p className="text-sm text-muted-foreground">Select type and enter content</p>
        </div>
      </div>

      {/* Data type selector */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {dataTypes.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            onClick={() => setDataType(type)}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
              dataType === type
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-glass-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Title input */}
      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-glass-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 mb-3 font-mono text-sm"
      />

      {/* Content input */}
      <textarea
        placeholder={`Enter ${dataType}...`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-glass-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none font-mono text-sm"
      />

      {/* Session hash display */}
      {sessionHash && (
        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">Session Key</p>
          <p className="font-mono text-sm text-primary truncate">{sessionHash}</p>
        </div>
      )}

      <Button
        variant="hero"
        size="lg"
        className="w-full mt-4"
        onClick={handleSubmit}
        disabled={!content}
      >
        <Send className="w-4 h-4" />
        Ready to Send
      </Button>
    </div>
  );
};

export default DataTransferCard;
