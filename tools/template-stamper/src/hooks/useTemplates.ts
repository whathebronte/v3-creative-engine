import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Template {
  id: string;
  name: string;
  version: string;
  duration: number;
  slots: TemplateSlot[];
  status: 'active' | 'inactive';
  remotionServeUrl?: string;
  remotionCompositionId?: string;
  previewImageUrl?: string;
  createdAt: Date;
}

export interface TemplateSlot {
  slotId: string;
  label: string;
  type: 'image' | 'video' | 'text';
  description?: string;
  required: boolean;
}

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useTemplates] Starting template fetch...');
    setLoading(true);
    setError(null);

    // Set up real-time listener for active templates
    const q = query(
      collection(db, 'templates'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    console.log('[useTemplates] Setting up Firestore listener...');

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(`[useTemplates] Received ${snapshot.docs.length} templates from Firestore`);
        const templatesData = snapshot.docs.map((doc) => {
          const data = doc.data();
          console.log(`[useTemplates] Template: ${doc.id}`, data);
          return {
            id: doc.id,
            name: data.name,
            version: data.version,
            duration: data.duration,
            slots: data.slots || [],
            status: data.status,
            remotionServeUrl: data.remotionServeUrl,
            remotionCompositionId: data.remotionCompositionId,
            previewImageUrl: data.previewImageUrl,
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        });
        console.log('[useTemplates] Processed templates:', templatesData);
        setTemplates(templatesData);
        setLoading(false);
      },
      (err) => {
        console.error('[useTemplates] Error fetching templates:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      console.log('[useTemplates] Cleaning up listener');
      unsubscribe();
    };
  }, []);

  return {
    templates,
    loading,
    error,
  };
}
