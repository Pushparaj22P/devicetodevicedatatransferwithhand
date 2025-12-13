import { gestureTemplates, GestureTemplate } from '@/lib/gestureTemplates';

interface GestureTemplateSelectorProps {
  selectedTemplate: GestureTemplate | null;
  onSelect: (template: GestureTemplate | null) => void;
}

const GestureTemplateSelector = ({ selectedTemplate, onSelect }: GestureTemplateSelectorProps) => {
  return (
    <div className="glass-card p-4 w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-sm font-semibold text-foreground">Gesture Guide</h3>
        {selectedTemplate && (
          <button
            onClick={() => onSelect(null)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {gestureTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(selectedTemplate?.id === template.id ? null : template)}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
              selectedTemplate?.id === template.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-glass-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
            }`}
          >
            <span className="text-2xl">{template.icon}</span>
            <span className="text-xs font-medium">{template.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              template.difficulty === 'easy' 
                ? 'bg-green-500/20 text-green-400' 
                : template.difficulty === 'medium'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {template.difficulty}
            </span>
          </button>
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground mt-3 text-center">
        Select a template for visual guidance, or draw freehand
      </p>
    </div>
  );
};

export default GestureTemplateSelector;
