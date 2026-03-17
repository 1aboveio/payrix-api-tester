'use client';

import { RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TestCaseTemplate } from '@/lib/payrix/templates';

interface TemplateSelectorProps {
  templates: TestCaseTemplate[];
  selectedId: string;
  onSelect: (template: TestCaseTemplate) => void;
  onReset: () => void;
}

export function TemplateSelector({ templates, selectedId, onSelect, onReset }: TemplateSelectorProps) {
  if (templates.length === 0) return null;

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium">Cert Test Template</label>
        <Select
          value={selectedId || undefined}
          onValueChange={(value) => {
            const tpl = templates.find((t) => t.id === value);
            if (tpl) onSelect(tpl);
          }}
        >
          <SelectTrigger data-testid="template-trigger">
            <SelectValue placeholder="Select a test case template..." />
          </SelectTrigger>
          <SelectContent>
            {templates.map((tpl) => (
              <SelectItem key={tpl.id} value={tpl.id}>
                <span>{tpl.name}</span>
                <span className="ml-2 text-muted-foreground">— {tpl.description}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="button" variant="outline" size="icon" onClick={onReset} title="Reset to defaults">
        <RotateCcw className="size-4" />
      </Button>
    </div>
  );
}
