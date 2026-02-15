import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video';
  storageUrl: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  source: 'manual' | 'mcp';
  createdAt: Date;
  market?: string;
}

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useAssets] Starting assets fetch...');
    setLoading(true);
    setError(null);

    // Set up real-time listener for assets
    const q = query(
      collection(db, 'assets'),
      orderBy('createdAt', 'desc')
    );

    console.log('[useAssets] Setting up Firestore listener...');

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(`[useAssets] Received ${snapshot.docs.length} assets from Firestore`);
        const assetsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            type: data.type,
            storageUrl: data.storageUrl,
            thumbnailUrl: data.thumbnailUrl,
            mimeType: data.mimeType,
            size: data.size,
            width: data.width,
            height: data.height,
            source: data.source,
            market: data.market,
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        });
        console.log('[useAssets] Processed assets:', assetsData);
        setAssets(assetsData);
        setLoading(false);
      },
      (err) => {
        console.error('[useAssets] Error fetching assets:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      console.log('[useAssets] Cleaning up listener');
      unsubscribe();
    };
  }, []);

  const uploadAsset = async (file: File, source: 'manual' | 'mcp' = 'manual'): Promise<string> => {
    try {
      console.log('[useAssets] Uploading asset:', file.name);

      // Determine type from MIME type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        throw new Error('File must be an image or video');
      }

      const assetType: 'image' | 'video' = isImage ? 'image' : 'video';
      const timestamp = Date.now();
      const storagePath = `assets/gallery/${assetType}s/${timestamp}_${file.name}`;

      // Upload to Firebase Storage
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      console.log('[useAssets] File uploaded, creating Firestore record');

      // Create Firestore record
      const assetDoc = await addDoc(collection(db, 'assets'), {
        name: file.name,
        type: assetType,
        storageUrl: downloadURL,
        mimeType: file.type,
        size: file.size,
        source,
        createdAt: serverTimestamp(),
      });

      console.log('[useAssets] Asset created with ID:', assetDoc.id);
      return assetDoc.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      console.error('[useAssets] Upload error:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    assets,
    loading,
    error,
    uploadAsset,
  };
}
