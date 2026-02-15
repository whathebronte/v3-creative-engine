import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { StatusIndicator } from '../ui/StatusIndicator';
import { Button } from '../ui/Button';
import { Download, Play } from 'lucide-react';
import { JobStatus } from '../../hooks/useJobStatus';

export interface GenerationProgressProps {
  jobStatus: JobStatus | null;
  onDownload?: () => void;
  onReset?: () => void;
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  jobStatus,
  onDownload,
  onReset,
}) => {
  if (!jobStatus) return null;

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      queued: 'Queued',
      preprocessing: 'Preprocessing Assets',
      rendering: 'Rendering Video',
      completed: 'Completed',
      failed: 'Failed',
    };
    return labels[status] || status;
  };

  const getProgressVariant = (): 'default' | 'success' | 'warning' | 'error' => {
    if (jobStatus.status === 'failed') return 'error';
    if (jobStatus.status === 'completed') return 'success';
    return 'default';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Video Generation</CardTitle>
          <StatusIndicator
            status={jobStatus.status}
            label={getStatusLabel(jobStatus.status)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ProgressBar
            progress={jobStatus.progress}
            variant={getProgressVariant()}
            showPercentage={true}
          />

          {jobStatus.status === 'completed' && jobStatus.outputVideoPublicUrl && (
            <div className="p-4 bg-status-online/10 border border-status-online/20 rounded-md">
              <p className="text-sm text-status-online font-medium mb-3">
                Your video is ready!
              </p>
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Video
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(jobStatus.outputVideoPublicUrl, '_blank')}
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Preview
                </Button>
              </div>
            </div>
          )}

          {jobStatus.status === 'failed' && (
            <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-md">
              <p className="text-sm text-accent-red font-medium mb-2">
                Generation Failed
              </p>
              {jobStatus.error && (
                <p className="text-xs text-text-secondary mb-3">
                  {jobStatus.error}
                </p>
              )}
              <Button variant="secondary" size="sm" onClick={onReset}>
                Try Again
              </Button>
            </div>
          )}

          {(jobStatus.status === 'queued' ||
            jobStatus.status === 'preprocessing' ||
            jobStatus.status === 'rendering') && (
            <div className="p-4 bg-bg-tertiary border border-border-subtle rounded-md">
              <p className="text-sm text-text-secondary">
                {jobStatus.status === 'queued' &&
                  'Your job is queued and will start processing soon...'}
                {jobStatus.status === 'preprocessing' &&
                  'Preparing your assets for rendering...'}
                {jobStatus.status === 'rendering' &&
                  'Rendering your video with Remotion Lambda...'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
