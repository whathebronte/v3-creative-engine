import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

export interface AssetFile {
  file: File;
  slotId: string;
  preview?: string;
  storageUrl?: string;
  uploaded: boolean;
}

export function useAssetUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const uploadAsset = async (file: File, slotId: string, projectId: string): Promise<string> => {
    try {
      setUploading(true);
      setError(null);
      setUploadProgress((prev) => ({ ...prev, [slotId]: 0 }));

      // Create storage reference
      const fileExtension = file.name.split('.').pop();
      const storagePath = `assets/${projectId}/original/${slotId}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);

      // Upload file
      await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      setUploadProgress((prev) => ({ ...prev, [slotId]: 100 }));

      return downloadURL;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const uploadMultiple = async (
    assets: AssetFile[],
    projectId: string
  ): Promise<AssetFile[]> => {
    const uploadedAssets: AssetFile[] = [];

    for (const asset of assets) {
      try {
        const storageUrl = await uploadAsset(asset.file, asset.slotId, projectId);
        uploadedAssets.push({
          ...asset,
          storageUrl,
          uploaded: true,
        });
      } catch (err) {
        uploadedAssets.push({
          ...asset,
          uploaded: false,
        });
      }
    }

    return uploadedAssets;
  };

  return {
    uploadAsset,
    uploadMultiple,
    uploading,
    uploadProgress,
    error,
  };
}
