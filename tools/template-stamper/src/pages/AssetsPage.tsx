import { useState } from 'react';
import { AppLayout } from '../layouts/AppLayout';
import { Card, Button } from '../components/ui';
import { AssetGallery } from '../components/assets/AssetGallery';
import { AssetUploadModal } from '../components/assets/AssetUploadModal';
import { useAssets, Asset } from '../hooks/useAssets';
import { Upload } from 'lucide-react';

function AssetsPage() {
  const { assets, loading, uploadAsset } = useAssets();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const handleUploadAssets = async (files: File[]) => {
    try {
      await Promise.all(files.map(file => uploadAsset(file, 'manual')));
      setShowUploadModal(false);
    } catch (error) {
      console.error('Failed to upload assets:', error);
    }
  };

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  // Right Sidebar - Asset Details
  const rightSidebarContent = selectedAsset && (
    <div className="space-y-4">
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Asset Preview
        </h3>
        {selectedAsset.type === 'image' ? (
          <img
            src={selectedAsset.storageUrl}
            alt={selectedAsset.name}
            className="w-full rounded-md border border-border-subtle"
          />
        ) : (
          <video
            src={selectedAsset.storageUrl}
            controls
            className="w-full rounded-md border border-border-subtle"
          />
        )}
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Asset Details
        </h3>
        <div className="space-y-2 text-xs text-text-secondary">
          <div className="flex justify-between">
            <span>Name:</span>
            <span className="text-text-primary font-medium truncate ml-2">
              {selectedAsset.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="text-text-primary font-medium uppercase">
              {selectedAsset.type}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Size:</span>
            <span className="text-text-primary font-medium">
              {formatFileSize(selectedAsset.size)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Format:</span>
            <span className="text-text-primary font-medium">
              {selectedAsset.mimeType}
            </span>
          </div>
          {selectedAsset.width && selectedAsset.height && (
            <div className="flex justify-between">
              <span>Dimensions:</span>
              <span className="text-text-primary font-medium">
                {selectedAsset.width} × {selectedAsset.height}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Source:</span>
            <span className="text-text-primary font-medium capitalize">
              {selectedAsset.source}
            </span>
          </div>
          {selectedAsset.market && (
            <div className="flex justify-between">
              <span>Market:</span>
              <span className="text-text-primary font-medium capitalize">
                {selectedAsset.market}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Uploaded:</span>
            <span className="text-text-primary font-medium">
              {new Date(selectedAsset.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <AppLayout
      title="Asset Library"
      subtitle="Manage your images and videos"
      rightSidebar={rightSidebarContent}
      rightSidebarVisible={!!selectedAsset}
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Assets
        </Button>
      }
    >
      <div className="max-w-6xl mx-auto">
        <Card>
          <AssetGallery
            assets={assets}
            loading={loading}
            onAssetClick={handleAssetClick}
            onUploadClick={() => setShowUploadModal(true)}
          />
        </Card>
      </div>

      <AssetUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadAssets}
      />
    </AppLayout>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default AssetsPage;
