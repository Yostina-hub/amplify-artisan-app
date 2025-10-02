import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { Service } from './types';

interface AIDrawerProps {
  open: boolean;
  onClose: () => void;
  service: Service | null;
}

const AI_PROMPTS: Record<string, { id: string; text: string }[]> = {
  composer: [
    { id: 'ideas-5', text: 'Draft 5 post ideas for this week in a friendly tone for LinkedIn and X.' },
    { id: 'repurpose', text: 'Repurpose our latest blog post into 3 social snippets.' }
  ],
  scheduler: [
    { id: 'autocal', text: 'Generate a 2-week posting calendar using best-time heuristics.' },
    { id: 'fill-gaps', text: 'Find gaps in next week\'s calendar and suggest content.' }
  ],
  inbox: [
    { id: 'summary', text: 'Summarize today\'s incoming messages and suggest replies for 3 priority threads.' }
  ],
  analytics: [
    { id: 'drop-fix', text: 'Explain last week\'s engagement drop on Instagram and propose 3 fixes.' }
  ]
};

export const AIDrawer = ({ open, onClose, service }: AIDrawerProps) => {
  if (!service) return null;

  const prompts = AI_PROMPTS[service.id] || [
    { id: 'default', text: `Help me optimize my ${service.title.toLowerCase()} strategy.` }
  ];

  const handlePromptClick = (prompt: { id: string; text: string }) => {
    console.log('AI Prompt Selected:', {
      service_id: service.id,
      prompt_id: prompt.id,
      prompt_text: prompt.text
    });
    
    // Store in localStorage for history
    const key = `ai_prompts_${service.id}`;
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    history.unshift(prompt);
    localStorage.setItem(key, JSON.stringify(history.slice(0, 3)));
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Suggestions for {service.title}
          </SheetTitle>
          <SheetDescription>
            Get started with these AI-powered prompts
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {prompts.map(prompt => (
            <Button
              key={prompt.id}
              variant="outline"
              className="w-full justify-start text-left h-auto py-4 px-4"
              onClick={() => handlePromptClick(prompt)}
            >
              <div className="flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <span className="text-sm">{prompt.text}</span>
              </div>
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
