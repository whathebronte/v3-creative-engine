import { X, Image, Film, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { getAssetUrl } from '../api';

// Placeholder images for mock mode (when no real GCS URI is available)
const PLACEHOLDER_IMAGES = {
  ref_aud01_cat: 'https://picsum.photos/seed/cat/512/512',
  ref_aud01_landscape: 'https://picsum.photos/seed/mountain/512/512',
  ref_aud03_pixel_character: 'https://picsum.photos/seed/pixel/512/512',
  ref_aud03_neon_car: 'https://picsum.photos/seed/neoncar/512/512',
  ref_aud04_motorcycle: 'https://picsum.photos/seed/motorcycle/512/512',
  job_001: 'https://picsum.photos/seed/catgirl/360/640',
  job_002: 'https://picsum.photos/seed/sleepycat/360/640',
  job_003: null,
  job_004: 'https://picsum.photos/seed/arcade/360/640',
  job_005: 'https://picsum.photos/seed/drift/360/640',
  job_006: null,
  job_007: 'https://picsum.photos/seed/caferacer/360/640',
  job_008: 'https://picsum.photos/seed/chrome/360/640',
  job_009: null,
  job_010: 'https://picsum.photos/seed/hiker/360/640',
};

export default function Lightbox({ item, status, allItems, allStatuses, onSelect, onClose }) {
  if (!item) return null;

  const id = item.ref_id || item.job_id;
  const isVideo = item.asset_type === 'video';
  const title = item.subject_label || item.element || id;
  const statusValue = status?.status || 'pending';
  const isComplete = statusValue === 'complete';

  // Navigation: find prev/next completed items
  const completedItems = allItems.filter((i) => {
    const iid = i.ref_id || i.job_id;
    return allStatuses[iid]?.status === 'complete';
  });
  const currentIdx = completedItems.findIndex((i) => (i.ref_id || i.job_id) === id);
  const prevItem = currentIdx > 0 ? completedItems[currentIdx - 1] : null;
  const nextItem = currentIdx < completedItems.length - 1 ? completedItems[currentIdx + 1] : null;

  // Prefer real GCS URI from status, fall back to placeholder for mock/local mode
  const gcsUri = status?.gcs_uri;
  const isRealUri = gcsUri && !gcsUri.startsWith('gs://mock/');
  const realUri = isRealUri ? getAssetUrl(gcsUri) : null;
  const imgSrc = realUri || PLACEHOLDER_IMAGES[id] || `https://picsum.photos/seed/${id}/512/512`;

  return (
    <aside className="w-[380px] bg-surface border-l border-border flex flex-col flex-shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-white truncate flex-1">{title}</h3>
        <button onClick={onClose} className="text-neutral-400 hover:text-white ml-2">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden bg-black">
        {isComplete ? (
          isVideo ? (
            realUri ? (
              <video
                src={realUri}
                controls
                autoPlay
                loop
                muted
                className="max-w-full max-h-full rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-neutral-400">
                <Film className="w-16 h-16" />
                <p className="text-xs">Video generated (mock mode)</p>
                <p className="text-[10px] text-neutral-500 font-mono">{id}.mp4</p>
              </div>
            )
          ) : (
            <img
              src={imgSrc}
              alt={title}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          )
        ) : (
          <div className="flex flex-col items-center gap-3 text-neutral-500">
            {isVideo ? (
              <Film className="w-16 h-16" />
            ) : (
              <Image className="w-16 h-16" />
            )}
            <p className="text-xs capitalize">{statusValue}</p>
          </div>
        )}

        {/* Navigation arrows */}
        {prevItem && (
          <button
            onClick={() => onSelect(prevItem)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 border border-border flex items-center justify-center text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {nextItem && (
          <button
            onClick={() => onSelect(nextItem)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 border border-border flex items-center justify-center text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Details */}
      <div className="px-4 py-3 border-t border-border space-y-3 overflow-y-auto max-h-[240px]">
        {/* Metadata */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">ID</span>
            <span className="text-neutral-300 font-mono">{id}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Type</span>
            <span className="text-neutral-300">{isVideo ? 'Video' : 'Image'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Model</span>
            <span className="text-neutral-300 font-mono text-[10px]">{item.model}</span>
          </div>
          {item.style?.aspect_ratio && (
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500">Aspect Ratio</span>
              <span className="text-neutral-300">{item.style.aspect_ratio}</span>
            </div>
          )}
          {item.style?.resolution && (
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500">Resolution</span>
              <span className="text-neutral-300">{item.style.resolution}</span>
            </div>
          )}
          {item.style?.duration_seconds && (
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500">Duration</span>
              <span className="text-neutral-300">{item.style.duration_seconds}s</span>
            </div>
          )}
          {item.audience_name && (
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500">Audience</span>
              <span className="text-neutral-300">{item.audience_name}</span>
            </div>
          )}
        </div>

        {/* Prompt preview */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Prompt</p>
          <p className="text-xs text-neutral-400 leading-relaxed line-clamp-4">{item.prompt}</p>
        </div>

        {/* Download button */}
        {isComplete && (
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-surface-raised border border-border rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-surface-hover transition-colors">
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        )}
      </div>
    </aside>
  );
}
