import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GripVertical, Edit, Trash2, Zap, Mail, Webhook, Database, MessageSquare } from 'lucide-react';

interface WorkflowNodeProps {
  node: any;
  onEdit: () => void;
  onDelete: () => void;
}

const TRIGGER_ICONS: Record<string, any> = {
  schedule: Zap,
  webhook: Webhook,
  database: Database,
  email: Mail,
  message: MessageSquare,
};

export function WorkflowNode({ node, onEdit, onDelete }: WorkflowNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = TRIGGER_ICONS[node.trigger_type] || Zap;
  const bgColor = node.metadata?.color || 'hsl(var(--primary))';

  return (
    <Card
      ref={setNodeRef}
      style={{ ...style, borderLeftColor: bgColor, borderLeftWidth: '4px' }}
      className="overflow-hidden hover:shadow-md transition-all"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button
            className="cursor-grab active:cursor-grabbing mt-1"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>

          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${bgColor}15` }}
          >
            <Icon className="h-5 w-5" style={{ color: bgColor }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-semibold truncate">{node.name}</h4>
              <Badge
                variant={node.is_active ? 'default' : 'secondary'}
                className="shrink-0"
              >
                {node.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            {node.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {node.description}
              </p>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {node.trigger_type}
              </Badge>
              {node.actions?.length > 0 && (
                <span>{node.actions.length} action{node.actions.length !== 1 ? 's' : ''}</span>
              )}
              {node.execution_count > 0 && (
                <span>• {node.execution_count} runs</span>
              )}
            </div>
          </div>

          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
