import { useState, useEffect } from 'react';
import { AppLayout } from '../layouts/AppLayout';
import { Card, Button, Select } from '../components/ui';
import { TemplateSelector } from '../components/generate/TemplateSelector';
import { AssetSlotMapper, SlotAsset } from '../components/generate/AssetSlotMapper';
import { GenerationProgress } from '../components/generate/GenerationProgress';
import { AssetGallery } from '../components/assets/AssetGallery';
import { AssetUploadModal } from '../components/assets/AssetUploadModal';
import { useTemplates } from '../hooks/useTemplates';
import { useAssets } from '../hooks/useAssets';
import { useAssetUpload } from '../hooks/useAssetUpload';
import { useJobCreate } from '../hooks/useJobCreate';
import { useJobStatus } from '../hooks/useJobStatus';
import { Video, ArrowLeft } from 'lucide-react';

const MARKETS = [
  { value: 'japan', label: 'Japan' },
  { value: 'korea', label: 'Korea' },
  { value: 'taiwan', label: 'Taiwan' },
  { value: 'hongkong', label: 'Hong Kong' },
];

function GeneratePage() {
  const { templates, loading: templatesLoading } = useTemplates();
  const { assets, loading: assetsLoading, uploadAsset } = useAssets();
  const { uploadMultiple, uploading } = useAssetUpload();
  const { createJob, creating } = useJobCreate();
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const { jobStatus } = useJobStatus(currentJobId);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<string>('japan');
  const [slotAssets, setSlotAssets] = useState<SlotAsset[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // Initialize slot assets when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      setSlotAssets(
        selectedTemplate.slots.map((slot) => ({
          slotId: slot.slotId,
          file: null,
          textValue: null,
        }))
      );
    }
  }, [selectedTemplate]);

  const handleAssetAdded = (slotId: string, file: File) => {
    setSlotAssets((prev) =>
      prev.map((sa) => (sa.slotId === slotId ? { ...sa, file } : sa))
    );
  };

  const handleAssetRemoved = (slotId: string) => {
    setSlotAssets((prev) =>
      prev.map((sa) => (sa.slotId === slotId ? { ...sa, file: null } : sa))
    );
  };

  const handleTextChanged = (slotId: string, value: string) => {
    setSlotAssets((prev) =>
      prev.map((sa) => (sa.slotId === slotId ? { ...sa, textValue: value } : sa))
    );
  };

  const handleReset = () => {
    setSelectedTemplateId(null);
    setSlotAssets([]);
    setCurrentJobId(null);
  };

  const handleGenerateVideo = async () => {
    if (!selectedTemplate) return;

    try {
      // Generate a project ID
      const projectId = `project_${Date.now()}`;

      // Upload file assets (images/videos)
      const assetsToUpload = slotAssets
        .filter((sa) => sa.file !== null)
        .map((sa) => ({
          file: sa.file!,
          slotId: sa.slotId,
          uploaded: false,
        }));

      const uploadedAssets = await uploadMultiple(assetsToUpload, projectId);

      // Create asset mappings (combining uploaded files + text values)
      const assetMappings = slotAssets.map((slotAsset) => {
        const slot = selectedTemplate.slots.find((s) => s.slotId === slotAsset.slotId);

        if (slot?.type === 'text') {
          // For text slots, store the text value directly
          return {
            slotId: slotAsset.slotId,
            type: 'text',
            textValue: slotAsset.textValue || '',
          };
        } else {
          // For file slots, use the uploaded storage URL
          const uploadedAsset = uploadedAssets.find((ua) => ua.slotId === slotAsset.slotId);
          return {
            slotId: slotAsset.slotId,
            storageUrl: uploadedAsset?.storageUrl || '',
            type: uploadedAsset?.file.type || slot?.type || 'unknown',
          };
        }
      });

      const jobId = await createJob({
        templateId: selectedTemplate.id,
        assetMappings,
        market: selectedMarket,
      });

      setCurrentJobId(jobId);
    } catch (error) {
      console.error('Failed to generate video:', error);
    }
  };

  const allRequiredSlotsHaveAssets = (): boolean => {
    if (!selectedTemplate) return false;

    const requiredSlots = selectedTemplate.slots.filter((s) => s.required);
    return requiredSlots.every((slot) => {
      const slotAsset = slotAssets.find((sa) => sa.slotId === slot.slotId);
      if (!slotAsset) return false;

      // Check based on slot type
      if (slot.type === 'text') {
        return !!slotAsset.textValue && slotAsset.textValue.trim().length > 0;
      }
      return slotAsset.file !== null;
    });
  };

  const isGenerating =
    jobStatus?.status === 'queued' ||
    jobStatus?.status === 'preprocessing' ||
    jobStatus?.status === 'rendering';

  const isComplete = jobStatus?.status === 'completed';

  const handleUploadAssets = async (files: File[]) => {
    try {
      await Promise.all(files.map(file => uploadAsset(file, 'manual')));
      setShowUploadModal(false);
    } catch (error) {
      console.error('Failed to upload assets:', error);
    }
  };

  // Left Panel Content - Asset Gallery
  const leftPanelContent = selectedTemplate && (
    <>
      <AssetGallery
        assets={assets}
        loading={assetsLoading}
        onUploadClick={() => setShowUploadModal(true)}
      />
      <AssetUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadAssets}
      />
    </>
  );

  // Right Sidebar Content
  const rightSidebarContent = selectedTemplate && (
    <div className="space-y-4">
      {/* Template Preview */}
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Template Preview
        </h3>
        {selectedTemplate.previewImageUrl ? (
          <img
            src={selectedTemplate.previewImageUrl}
            alt={`${selectedTemplate.name} preview`}
            className="w-full rounded-md border border-border-subtle"
          />
        ) : (
          <div className="w-full aspect-[9/16] bg-bg-tertiary rounded-md border border-border-subtle flex items-center justify-center">
            <div className="text-center p-4">
              <Video className="w-12 h-12 text-text-tertiary mx-auto mb-2" />
              <p className="text-xs text-text-tertiary">
                {selectedTemplate.name}
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                {selectedTemplate.duration}s • {selectedTemplate.slots.length} slots
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Template Info
        </h3>
        <div className="space-y-2 text-xs text-text-secondary">
          <div className="flex justify-between">
            <span>Template:</span>
            <span className="text-text-primary font-medium">
              {selectedTemplate.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Version:</span>
            <span className="text-text-primary font-medium">
              v{selectedTemplate.version}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Duration:</span>
            <span className="text-text-primary font-medium">
              {selectedTemplate.duration}s
            </span>
          </div>
          <div className="flex justify-between">
            <span>Slots:</span>
            <span className="text-text-primary font-medium">
              {selectedTemplate.slots.length}
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Asset Guidelines
        </h3>
        <ul className="space-y-2 text-xs text-text-secondary">
          <li>• Images: JPEG format, max 100MB</li>
          <li>• Videos: MPEG format, max 100MB</li>
          <li>• Ensure high quality assets</li>
          <li>• Follow template slot requirements</li>
        </ul>
      </Card>
    </div>
  );

  return (
    <AppLayout
      title="Generate Video"
      subtitle="Create a new video from a template"
      leftPanel={leftPanelContent}
      leftPanelVisible={!!selectedTemplate}
      rightSidebar={rightSidebarContent}
      rightSidebarVisible={!!selectedTemplate}
      actions={
        selectedTemplate && !isGenerating && !isComplete && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Selection
          </Button>
        )
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Market Selection */}
        <Card>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-text-primary">
              Market:
            </label>
            <Select
              value={selectedMarket}
              onChange={setSelectedMarket}
              options={MARKETS}
              disabled={isGenerating || isComplete}
              className="w-48"
            />
          </div>
        </Card>

        {/* Template Selection */}
        {!selectedTemplate && (
          <TemplateSelector
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={setSelectedTemplateId}
            disabled={templatesLoading || isGenerating}
          />
        )}

        {/* Asset Upload */}
        {selectedTemplate && !currentJobId && (
          <>
            <AssetSlotMapper
              slots={selectedTemplate.slots}
              slotAssets={slotAssets}
              onAssetAdded={handleAssetAdded}
              onAssetRemoved={handleAssetRemoved}
              onTextChanged={handleTextChanged}
              disabled={uploading || creating}
            />

            {/* Generate Button */}
            <div className="flex justify-center pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleGenerateVideo}
                disabled={!allRequiredSlotsHaveAssets() || uploading || creating}
                isLoading={uploading || creating}
                className="flex items-center gap-2 min-w-[200px]"
              >
                <Video className="w-5 h-5" />
                {uploading ? 'Uploading Assets...' : creating ? 'Creating Job...' : 'Generate Video'}
              </Button>
            </div>
          </>
        )}

        {/* Generation Progress */}
        {currentJobId && (
          <GenerationProgress
            jobStatus={jobStatus}
            onDownload={() => {
              if (jobStatus?.outputVideoPublicUrl) {
                window.open(jobStatus.outputVideoPublicUrl, '_blank');
              }
            }}
            onReset={handleReset}
          />
        )}

        {/* Empty State */}
        {!selectedTemplate && templates.length === 0 && !templatesLoading && (
          <Card className="text-center py-12">
            <div className="max-w-md mx-auto">
              <Video className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No Templates Available
              </h3>
              <p className="text-sm text-text-secondary">
                There are no active templates available. Please contact an administrator to add templates.
              </p>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

export default GeneratePage;
