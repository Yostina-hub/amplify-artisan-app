import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';

interface ColorPickerInputProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
  '#6b7280', // gray
];

export function ColorPickerInput({ value, onChange, label }: ColorPickerInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <div className="flex-1 flex gap-2">
          <div
            className="w-10 h-10 rounded-md border-2 border-border cursor-pointer hover:scale-105 transition-transform"
            style={{ backgroundColor: value }}
            onClick={() => setIsOpen(true)}
          />
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className="flex-1 font-mono"
          />
        </div>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Preset Colors</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded-md border-2 border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        onChange(color);
                        setIsOpen(false);
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Custom Color</Label>
                <input
                  type="color"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full h-10 rounded-md border-2 border-border cursor-pointer"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
