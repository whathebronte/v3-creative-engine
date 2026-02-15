import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AssetMapping {
  slotId: string;
  storageUrl?: string;
  type: string;
  textValue?: string;
}

export interface CreateJobParams {
  templateId: string;
  assetMappings: AssetMapping[];
  market?: string;
}

export interface Job {
  id: string;
  templateId: string;
  assetMappings: AssetMapping[];
  status: 'queued' | 'preprocessing' | 'rendering' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  market?: string;
}

export function useJobCreate() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createJob = async (params: CreateJobParams): Promise<string> => {
    try {
      setCreating(true);
      setError(null);

      // Create job document in Firestore
      const jobRef = await addDoc(collection(db, 'jobs'), {
        templateId: params.templateId,
        assetMappings: params.assetMappings,
        market: params.market || 'default',
        status: 'queued',
        progress: 0,
        createdAt: serverTimestamp(),
      });

      return jobRef.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create job';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  return {
    createJob,
    creating,
    error,
  };
}
