import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface DraggableFieldProps {
  field: any;
  onEdit: () => void;
  onDelete: () => void;
}

export function DraggableField({ field, onEdit, onDelete }: DraggableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-4 bg-card hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <button
          className="cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{field.display_name}</span>
            <Badge variant="outline" className="text-xs">
              {field.field_type}
            </Badge>
            {field.is_required && (
              <Badge variant="destructive" className="text-xs">Required</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{field.field_name}</p>
          {field.help_text && (
            <p className="text-xs text-muted-foreground mt-1">{field.help_text}</p>
          )}
        </div>

        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
