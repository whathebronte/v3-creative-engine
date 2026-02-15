import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Select, SelectOption } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Template } from '../../hooks/useTemplates';
import { Clock, Layers } from 'lucide-react';

export interface TemplateSelectorProps {
  templates: Template[];
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string) => void;
  disabled?: boolean;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  disabled = false,
}) => {
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const templateOptions: SelectOption[] = templates.map((template) => ({
    value: template.id,
    label: `${template.name} (v${template.version})`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Template</CardTitle>
      </CardHeader>
      <CardContent>
        <Select
          value={selectedTemplateId || ''}
          onChange={onSelectTemplate}
          options={templateOptions}
          placeholder="Choose a template"
          disabled={disabled}
          className="mb-4"
        />

        {selectedTemplate && (
          <div className="mt-4 p-4 bg-bg-tertiary border border-border-subtle rounded-md space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-text-primary">
                {selectedTemplate.name}
              </h4>
              <Badge variant="success">v{selectedTemplate.version}</Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-text-secondary">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{selectedTemplate.duration}s</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>{selectedTemplate.slots.length} slots</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border-subtle">
              <p className="text-xs font-medium text-text-tertiary mb-2">Required Assets:</p>
              <div className="space-y-1">
                {selectedTemplate.slots.map((slot) => (
                  <div key={slot.slotId} className="flex items-center gap-2 text-xs">
                    <Badge size="sm" variant="default">
                      {slot.type}
                    </Badge>
                    <span className="text-text-secondary">{slot.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
