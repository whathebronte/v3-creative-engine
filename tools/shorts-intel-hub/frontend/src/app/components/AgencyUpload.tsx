import { useState, useRef } from 'react';
import { Upload, FileText, Download, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadCsvFile, type CsvUploadResponse } from '@/services/api';

interface UploadLog {
  id: string;
  fileName: string;
  uploadedAt: Date;
  status: 'success' | 'processing' | 'error';
  format?: string;
  stats?: CsvUploadResponse['stats'];
  errorMessage?: string;
  source: string;
}

const templateMarkdown = `# Shorts Intel Hub - Data Upload Template

Two CSV formats are supported. The server auto-detects format from the headers.

---

## 1. Vayner (trend-level, curated)

One row per trend. Required headers:

\`\`\`
Date Identified, GenAI/non-GenAI, Topic Name, Trend Velocity, Description,
Creation Complexity (Ease of Participation), Trend Scale (Creation-led/Viewer-led),
Trend Bucket, AI Tool, Brand Safe, Content Quality, Initial Trigger,
Reference Links, Publication Date, Length of Video (sec), Creator Subscriber Count,
Views, Likes, Comments, Reposts (IG or X), Shares (TT-only, Saves (TT-only),
Engagement Rate, Hashtags (comma-separated), Audio Track, Audio Track URL,
Creation Volume, Platform Origin, Platforms Trending, Primary Markets,
Secondary Markets, Target Demo, User Sentiment, Score Ranking, Normalized
\`\`\`

### Quality gate values
- **Brand Safe**: \`Yes\` | \`No\`
- **Content Quality**: \`Not AI Slop\` | \`Potential AI Slop\` | \`AI Slop\` | (blank)
- **User Sentiment**: \`Positive\` | \`Mix-Sentiment\` | \`Negative\`
- **Trend Velocity**: \`Trending\` | \`Emerging\` | \`Niche\`
- **Creation Complexity**: \`Easy\` | \`Medium\` | \`Hard\`
- **Trend Scale**: \`Creation-Led\` | \`Viewer-led\`

Trends with \`Brand Safe=No\`, \`Content Quality=AI Slop\`, or \`User Sentiment=Negative\`
are scored as 0 and hidden by default. \`Potential AI Slop\` trends appear with a
"For quality review" pill.

---

## 2. Nyan Cat (video-level, raw)

One row per YouTube Short. The server groups by \`audio_id\` and aggregates
views, watchtime, and quality signals into trend-level rows.

Required headers:

\`\`\`
external_video_id, Shorts_link, audio_id, Song_link, Song_title,
shorts_video_published_date, title, description, Hashtags, Is_CPM_Creator,
Is_influencer, shorts_video_upload_country, yearr, length_sec,
has_video_shorts_creation, first_level_vertical_name, second_level_vertical_name,
third_level_vertical_name, lego_level_1_name, lego_level_2_name, lego_level_3_name,
creator_age_bucket, creator_gender, elmo_bucket, subs_bucket,
downstream_uploads_1d_by_shorts_video_published_date,
downstream_uploads_2d_by_shorts_video_published_date,
downstream_uploads_3d_by_shorts_video_published_date,
Views_1D, watch_time_hour_1D, potential_watch_time_hour_1D, engagement_1D,
Views_2D, watch_time_hour_2D, potential_watch_time_hour_2D, engagement_2D,
Views_3D, watch_time_hour_3D, potential_watch_time_hour_3D, engagement_3D,
Total_followers_at_video_published_date, Net_Likes_at_video_published_date,
visual_quality_score, audio_quality_score,
Net_Likes_last_30d_from_video_published_date, monetization_enabled_avod,
linear_reg_7d_pred
\`\`\`

### Inferred quality signals
- \`elmo_bucket\` not in \`TRUSTED\`/\`LOW_RISK\` anywhere in the group → Brand Safe = No
- Average \`visual_quality_score\` < 0.30 → AI Slop (hidden)
- Average \`visual_quality_score\` < 0.45 → Potential AI Slop (flagged for review)

---

## Tips

1. Export directly from your pipeline — the server handles quoted/multi-line
   fields per RFC 4180.
2. CSV only. JSON support is deprecated for batch uploads.
3. Upload multiple files in a single session — each is processed independently.
4. After upload, review the format detected + counts in the log below.
`;

export function AgencyUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadLogs, setUploadLogs] = useState<UploadLog[]>([]);
  const [showTemplate, setShowTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(Array.from(e.target.files));
  };

  const handleFiles = (files: File[]) => {
    files.forEach((file) => {
      const logId = `${Date.now()}-${Math.random()}`;
      const pending: UploadLog = {
        id: logId,
        fileName: file.name,
        uploadedAt: new Date(),
        status: 'processing',
        source: 'Manual Upload',
      };
      setUploadLogs((prev) => [pending, ...prev]);

      uploadCsvFile(file)
        .then((res) => {
          setUploadLogs((prev) =>
            prev.map((log) =>
              log.id === logId
                ? {
                    ...log,
                    status: 'success',
                    format: res.format,
                    stats: res.stats,
                    source: res.format === 'vayner' ? 'Vayner (trend-level)'
                      : res.format === 'nyancat' ? 'Nyan Cat (video-level, aggregated)'
                      : 'Unknown',
                  }
                : log
            )
          );
        })
        .catch((err) => {
          setUploadLogs((prev) =>
            prev.map((log) =>
              log.id === logId
                ? { ...log, status: 'error', errorMessage: err.message ?? 'Upload failed' }
                : log
            )
          );
        });
    });
  };

  const downloadTemplate = () => {
    const blob = new Blob([templateMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'intel-hub-upload-template.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-6 py-6">
      <div className="max-w-5xl mx-auto">
        {/* Info Banner */}
        <div className="mb-6 p-4 bg-card border border-border rounded-lg">
          <h3 className="text-foreground mb-2">Agency Upload Portal</h3>
          <p className="text-muted-foreground">
            Upload Vayner trend reports or Nyan Cat video exports. The server
            auto-detects format, aggregates video rows by audio, applies the
            ERS ranking, and flags trends for brand safety or AI slop review.
          </p>
        </div>

        {/* Template Section */}
        <div className="mb-6 bg-card border border-border rounded-lg p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-foreground mb-2">Upload Template & Guidelines</h3>
              <p className="text-muted-foreground">
                Supports both Vayner and Nyan Cat CSV exports.
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Download className="size-4" />
              Download Template
            </button>
          </div>

          <button
            onClick={() => setShowTemplate(!showTemplate)}
            className="text-primary hover:underline"
          >
            {showTemplate ? 'Hide' : 'Show'} Template Preview
          </button>

          {showTemplate && (
            <div className="mt-4 p-4 bg-muted rounded-lg overflow-auto max-h-96">
              <pre className="text-sm text-foreground whitespace-pre-wrap">{templateMarkdown}</pre>
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div
          className={`mb-6 border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
          }`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="size-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-foreground mb-2">Drag & Drop CSV Files Here</h3>
          <p className="text-muted-foreground mb-4">
            Vayner or Nyan Cat format — auto-detected
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Browse Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".csv,text/csv"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* Upload History */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground">Upload History (This Session)</h3>
          </div>

          {uploadLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No uploads yet — drop a Vayner or Nyan Cat CSV above to begin.
            </div>
          ) : (
            <div className="space-y-3">
              {uploadLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className="flex-shrink-0">
                    {log.status === 'success' && <CheckCircle2 className="size-6 text-green-600" />}
                    {log.status === 'processing' && <Clock className="size-6 text-blue-600 animate-pulse" />}
                    {log.status === 'error' && <AlertCircle className="size-6 text-red-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="size-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{log.fileName}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span>{log.source}</span>
                      {log.stats && (
                        <>
                          <span>• {log.stats.total} trends</span>
                          <span>• {log.stats.visible} visible</span>
                          {log.stats.hidden > 0 && (
                            <span>• {log.stats.hidden} hidden</span>
                          )}
                          {log.stats.forQualityReview > 0 && (
                            <span className="text-orange-500">
                              • {log.stats.forQualityReview} for review
                            </span>
                          )}
                        </>
                      )}
                      {log.errorMessage && (
                        <span className="text-red-500">• {log.errorMessage}</span>
                      )}
                      <span>
                        • {log.uploadedAt.toLocaleDateString()} at {log.uploadedAt.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {log.status === 'success' && (
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                        Success
                      </span>
                    )}
                    {log.status === 'processing' && (
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                        Processing...
                      </span>
                    )}
                    {log.status === 'error' && (
                      <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm">
                        Error
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="text-foreground mb-2">Need Help?</h4>
          <p className="text-muted-foreground text-sm">
            For questions about data format, submission guidelines, or technical issues,
            contact the APAC Shorts Intel Hub team at{' '}
            <span className="text-primary">shorts-intel@example.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
