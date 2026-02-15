import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface JobStatus {
  id: string;
  status: 'queued' | 'preprocessing' | 'rendering' | 'completed' | 'failed';
  progress: number;
  outputVideoUrl?: string;
  outputVideoPublicUrl?: string;
  error?: string;
  updatedAt?: Date;
}

export function useJobStatus(jobId: string | null) {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      doc(db, 'jobs', jobId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setJobStatus({
            id: snapshot.id,
            status: data.status,
            progress: data.progress || 0,
            outputVideoUrl: data.outputVideoUrl,
            outputVideoPublicUrl: data.outputVideoPublicUrl,
            error: data.error,
            updatedAt: data.updatedAt?.toDate(),
          });
        } else {
          setError('Job not found');
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [jobId]);

  return {
    jobStatus,
    loading,
    error,
  };
}
