import { useState } from 'react';
import { Button, Card } from '../ui';
import { UploadArea } from '../ui/UploadArea';
import { X } from 'lucide-react';

export interface AssetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
}

export const AssetUploadModal: React.FC<AssetUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleFilesAdded = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleFileRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    try {
      setUploading(true);
      await onUpload(files);
      setFiles([]);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">
              Upload Assets
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-bg-tertiary rounded transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Upload Area */}
          <UploadArea
            onFilesAdded={handleFilesAdded}
            onFileRemove={handleFileRemove}
            uploadedFiles={files.map((file) => ({ file }))}
            accept={{
              'image/jpeg': ['.jpg', '.jpeg'],
              'image/png': ['.png'],
              'video/mp4': ['.mp4'],
              'video/mpeg': ['.mpeg', '.mpg'],
            }}
            maxFiles={20}
            helperText="Upload images (JPEG, PNG) or videos (MP4, MPEG)"
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              isLoading={uploading}
            >
              Upload {files.length > 0 && `(${files.length})`}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};
