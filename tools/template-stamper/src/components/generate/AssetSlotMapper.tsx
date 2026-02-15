import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { UploadArea } from '../ui/UploadArea';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { TemplateSlot } from '../../hooks/useTemplates';
import { Asset } from '../../hooks/useAssets';
import { CheckCircle2, Circle } from 'lucide-react';

export interface SlotAsset {
  slotId: string;
  file: File | null;
  textValue: string | null;
}

export interface AssetSlotMapperProps {
  slots: TemplateSlot[];
  slotAssets: SlotAsset[];
  onAssetAdded: (slotId: string, file: File) => void;
  onAssetRemoved: (slotId: string) => void;
  onTextChanged: (slotId: string, value: string) => void;
  disabled?: boolean;
}

export const AssetSlotMapper: React.FC<AssetSlotMapperProps> = ({
  slots,
  slotAssets,
  onAssetAdded,
  onAssetRemoved,
  onTextChanged,
  disabled = false,
}) => {
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);

  const getSlotAsset = (slotId: string): SlotAsset | undefined => {
    return slotAssets.find((sa) => sa.slotId === slotId);
  };

  const getAcceptedTypes = (type: 'image' | 'video'): Record<string, string[]> => {
    if (type === 'image') {
      return { 'image/jpeg': ['.jpg', '.jpeg'] };
    }
    return { 'video/mpeg': ['.mpeg', '.mpg'] };
  };

  const isSlotComplete = (slot: TemplateSlot, slotAsset?: SlotAsset): boolean => {
    if (!slotAsset) return false;
    if (slot.type === 'text') {
      return !!slotAsset.textValue && slotAsset.textValue.trim().length > 0;
    }
    return !!slotAsset.file;
  };

  const completedCount = slots.filter((slot) =>
    isSlotComplete(slot, getSlotAsset(slot.slotId))
  ).length;

  // Handle drop from asset gallery
  const handleDrop = async (e: React.DragEvent, slotId: string, slotType: 'image' | 'video') => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlotId(null);

    try {
      // Try to get asset data from gallery
      const assetData = e.dataTransfer.getData('application/json');
      if (assetData) {
        const asset: Asset = JSON.parse(assetData);

        // Check if asset type matches slot type
        if (asset.type !== slotType) {
          console.warn(`Asset type ${asset.type} doesn't match slot type ${slotType}`);
          return;
        }

        // Fetch the asset from storage URL and convert to File
        const response = await fetch(asset.storageUrl);
        const blob = await response.blob();
        const file = new File([blob], asset.name, { type: asset.mimeType });

        onAssetAdded(slotId, file);
      }
    } catch (error) {
      console.error('Failed to handle dropped asset:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlotId(slotId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlotId(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Upload Assets & Content</CardTitle>
          <Badge variant="info">
            {completedCount} / {slots.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {slots.map((slot) => {
            const slotAsset = getSlotAsset(slot.slotId);
            const isComplete = isSlotComplete(slot, slotAsset);

            return (
              <div key={slot.slotId} className="p-4 bg-bg-tertiary border border-border-subtle rounded-md">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isComplete ? (
                        <CheckCircle2 className="w-4 h-4 text-status-online" />
                      ) : (
                        <Circle className="w-4 h-4 text-status-offline" />
                      )}
                      <h4 className="text-sm font-semibold text-text-primary">
                        {slot.label}
                      </h4>
                      {slot.required && (
                        <Badge size="sm" variant="error">
                          Required
                        </Badge>
                      )}
                    </div>
                    {slot.description && (
                      <p className="text-xs text-text-tertiary ml-6">
                        {slot.description}
                      </p>
                    )}
                  </div>
                  <Badge size="sm" variant="default">
                    {slot.type}
                  </Badge>
                </div>

                {/* Text Input for text slots */}
                {slot.type === 'text' && (
                  <Input
                    type="text"
                    placeholder={`Enter ${slot.label.toLowerCase()}`}
                    value={slotAsset?.textValue || ''}
                    onChange={(e) => onTextChanged(slot.slotId, e.target.value)}
                    disabled={disabled}
                  />
                )}

                {/* File Upload for image/video slots */}
                {(slot.type === 'image' || slot.type === 'video') && (
                  <div
                    onDrop={(e) => handleDrop(e, slot.slotId, slot.type as 'image' | 'video')}
                    onDragOver={(e) => handleDragOver(e, slot.slotId)}
                    onDragLeave={handleDragLeave}
                    className={`
                      transition-all duration-200 rounded-lg
                      ${dragOverSlotId === slot.slotId ? 'ring-2 ring-accent-red ring-offset-2' : ''}
                    `}
                  >
                    <UploadArea
                      onFilesAdded={(files) => files[0] && onAssetAdded(slot.slotId, files[0])}
                      onFileRemove={() => onAssetRemoved(slot.slotId)}
                      uploadedFiles={slotAsset?.file ? [{ file: slotAsset.file }] : []}
                      accept={getAcceptedTypes(slot.type)}
                      maxFiles={1}
                      disabled={disabled}
                      helperText={`Upload ${slot.type} or drag from gallery (max 100MB)`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
