import { Button, Badge } from '../ui';
import { Asset } from '../../hooks/useAssets';
import { Image, Video, Upload } from 'lucide-react';

export interface AssetGalleryProps {
  assets: Asset[];
  loading: boolean;
  onAssetClick?: (asset: Asset) => void;
  onUploadClick: () => void;
}

export const AssetGallery: React.FC<AssetGalleryProps> = ({
  assets,
  loading,
  onAssetClick,
  onUploadClick,
}) => {
  const handleDragStart = (e: React.DragEvent, asset: Asset) => {
    e.dataTransfer.setData('application/json', JSON.stringify(asset));
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-sm text-text-secondary">Loading assets...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Assets</h3>
            <p className="text-xs text-text-tertiary mt-0.5">
              {assets.length} {assets.length === 1 ? 'asset' : 'assets'}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={onUploadClick}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* Asset Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {assets.length === 0 ? (
          <div className="text-center py-12">
            <Upload className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
            <p className="text-sm text-text-primary mb-1">No assets yet</p>
            <p className="text-xs text-text-tertiary mb-4">
              Upload images or videos to get started
            </p>
            <Button variant="secondary" size="sm" onClick={onUploadClick}>
              Upload Assets
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {assets.map((asset) => (
              <div
                key={asset.id}
                draggable
                onDragStart={(e) => handleDragStart(e, asset)}
                onClick={() => onAssetClick?.(asset)}
                className="group relative aspect-square bg-bg-tertiary rounded-md border border-border-subtle overflow-hidden cursor-grab active:cursor-grabbing hover:border-accent-red transition-colors"
              >
                {/* Thumbnail */}
                {asset.type === 'image' ? (
                  <img
                    src={asset.storageUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-bg-secondary">
                    <Video className="w-8 h-8 text-text-tertiary" />
                  </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <div className="w-full">
                    <p className="text-xs text-white font-medium truncate">
                      {asset.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge size="sm" variant="default" className="text-[10px]">
                        {asset.type}
                      </Badge>
                      <Badge size="sm" variant="default" className="text-[10px]">
                        {formatFileSize(asset.size)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Type indicator */}
                <div className="absolute top-2 right-2 bg-black/70 rounded-md p-1">
                  {asset.type === 'image' ? (
                    <Image className="w-3 h-3 text-white" />
                  ) : (
                    <Video className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
