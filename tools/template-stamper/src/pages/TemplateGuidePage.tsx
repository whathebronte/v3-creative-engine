import React, { useState, useRef } from 'react';
import { AppLayout } from '../layouts/AppLayout';
import { Card, Badge, Button } from '../components/ui';
import {
  FileText,
  Image,
  Video,
  Type,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Figma,
  Package,
  Clock,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize
} from 'lucide-react';

type TabType = 'overview' | 'slots' | 'figma' | 'delivery' | 'reference' | 'checklist';

function TemplateGuidePage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <FileText className="w-4 h-4" /> },
    { id: 'slots', label: 'Asset Slots', icon: <Package className="w-4 h-4" /> },
    { id: 'figma', label: 'Figma Guidelines', icon: <Figma className="w-4 h-4" /> },
    { id: 'delivery', label: 'Delivery Process', icon: <Clock className="w-4 h-4" /> },
    { id: 'reference', label: 'Examples', icon: <Image className="w-4 h-4" /> },
    { id: 'checklist', label: 'Checklist', icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <AppLayout
      title="Template Creation Guide"
      subtitle="Complete guide for creative agencies to design and deliver video templates"
    >
      <div className="max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md whitespace-nowrap
                transition-all duration-200
                ${
                  activeTab === tab.id
                    ? 'bg-accent-red text-white'
                    : 'bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                }
              `}
            >
              {tab.icon}
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'slots' && <SlotsTab copyToClipboard={copyToClipboard} />}
          {activeTab === 'figma' && <FigmaTab />}
          {activeTab === 'delivery' && <DeliveryTab />}
          {activeTab === 'reference' && <ReferenceTab copyToClipboard={copyToClipboard} />}
          {activeTab === 'checklist' && <ChecklistTab />}
        </div>
      </div>
    </AppLayout>
  );
}

// Overview Tab
const OverviewTab: React.FC = () => (
  <div className="space-y-6">
    <Card>
      <h2 className="text-2xl font-bold text-text-primary mb-4">What is a Template?</h2>
      <p className="text-text-secondary mb-4">
        A template in Template Stamper is a branded video structure that combines fixed branding
        elements with variable content slots to generate professional vertical videos at scale.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 bg-bg-tertiary rounded-md">
          <div className="w-10 h-10 bg-accent-red/10 rounded-md flex items-center justify-center mb-3">
            <Image className="w-5 h-5 text-accent-red" />
          </div>
          <h3 className="font-semibold text-text-primary mb-2">Fixed Branding</h3>
          <p className="text-sm text-text-secondary">
            Logos, UI mockups, colors, typography that remain consistent
          </p>
        </div>
        <div className="p-4 bg-bg-tertiary rounded-md">
          <div className="w-10 h-10 bg-accent-red/10 rounded-md flex items-center justify-center mb-3">
            <Package className="w-5 h-5 text-accent-red" />
          </div>
          <h3 className="font-semibold text-text-primary mb-2">Variable Slots</h3>
          <p className="text-sm text-text-secondary">
            Placeholders where user images/videos are dynamically inserted
          </p>
        </div>
        <div className="p-4 bg-bg-tertiary rounded-md">
          <div className="w-10 h-10 bg-accent-red/10 rounded-md flex items-center justify-center mb-3">
            <Video className="w-5 h-5 text-accent-red" />
          </div>
          <h3 className="font-semibold text-text-primary mb-2">Animations</h3>
          <p className="text-sm text-text-secondary">
            Timing, transitions, and sequences that bring the template to life
          </p>
        </div>
      </div>
    </Card>

    <Card>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Video Output Specifications</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left py-3 px-4 text-text-primary font-semibold">Parameter</th>
              <th className="text-left py-3 px-4 text-text-primary font-semibold">Value</th>
              <th className="text-left py-3 px-4 text-text-primary font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-subtle">
              <td className="py-3 px-4 text-text-secondary">Resolution</td>
              <td className="py-3 px-4 text-text-primary font-mono">720x1280px</td>
              <td className="py-3 px-4 text-text-secondary">9:16 vertical format</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="py-3 px-4 text-text-secondary">Frame Rate</td>
              <td className="py-3 px-4 text-text-primary font-mono">24 fps</td>
              <td className="py-3 px-4 text-text-secondary">Standard for video</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="py-3 px-4 text-text-secondary">Format</td>
              <td className="py-3 px-4 text-text-primary font-mono">MP4 (H.264)</td>
              <td className="py-3 px-4 text-text-secondary">Web-optimized codec</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="py-3 px-4 text-text-secondary">Duration</td>
              <td className="py-3 px-4 text-text-primary font-mono">10-30 seconds</td>
              <td className="py-3 px-4 text-text-secondary">Flexible, typically 15-20s</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="py-3 px-4 text-text-secondary">Color Space</td>
              <td className="py-3 px-4 text-text-primary font-mono">sRGB</td>
              <td className="py-3 px-4 text-text-secondary">Web standard</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <Card>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Your Role as Creative Agency</h2>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-status-online mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-text-primary mb-1">Design in Figma</h3>
            <p className="text-sm text-text-secondary">
              Create all screens, branding elements, and mark content slots clearly
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-status-online mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-text-primary mb-1">Export Assets</h3>
            <p className="text-sm text-text-secondary">
              Provide SVG files for logos, UI elements, and custom fonts
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-status-online mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-text-primary mb-1">Document Specifications</h3>
            <p className="text-sm text-text-secondary">
              Complete asset-slots.json and timing documentation
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-status-online mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-text-primary mb-1">Create Preview</h3>
            <p className="text-sm text-text-secondary">
              Animated mockup showing the template in action
            </p>
          </div>
        </div>
      </div>
    </Card>
  </div>
);

// Slots Tab
const SlotsTab: React.FC<{ copyToClipboard: (text: string) => void }> = ({ copyToClipboard }) => (
  <div className="space-y-6">
    <Card>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Asset Slot Naming Convention</h2>
      <p className="text-text-secondary mb-4">
        Use <span className="font-mono bg-bg-tertiary px-2 py-0.5 rounded">camelCase</span> format:
        <span className="font-mono bg-bg-tertiary px-2 py-0.5 rounded ml-2">
          {'{category}{Type}{Number}'}
        </span>
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-status-online/5 border border-status-online/20 rounded-md">
          <h3 className="font-semibold text-status-online mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Good Examples
          </h3>
          <ul className="space-y-2 font-mono text-sm">
            <li className="text-text-primary">gridImage1</li>
            <li className="text-text-primary">selectedImage2</li>
            <li className="text-text-primary">generatedVideo</li>
            <li className="text-text-primary">userPrompt</li>
            <li className="text-text-primary">productTitle</li>
          </ul>
        </div>
        <div className="p-4 bg-status-error/5 border border-status-error/20 rounded-md">
          <h3 className="font-semibold text-status-error mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Bad Examples
          </h3>
          <ul className="space-y-2 font-mono text-sm line-through">
            <li className="text-text-secondary">GridImage1</li>
            <li className="text-text-secondary">selected-image-2</li>
            <li className="text-text-secondary">generated_video</li>
            <li className="text-text-secondary">user prompt</li>
            <li className="text-text-secondary">slot1</li>
          </ul>
        </div>
      </div>
    </Card>

    <Card>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Slot Types & Constraints</h2>

      {/* Image Slots */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Image className="w-5 h-5 text-accent-red" />
          <h3 className="text-lg font-semibold text-text-primary">Image Slots</h3>
        </div>
        <div className="bg-bg-tertiary rounded-md p-4 overflow-x-auto">
          <pre className="text-sm text-text-primary">
{`{
  "id": "gridImage1",
  "type": "image",
  "constraints": {
    "aspectRatio": "9:16",
    "minWidth": 720,
    "minHeight": 1280,
    "maxFileSize": 10485760,  // 10MB
    "formats": ["jpeg", "png"]
  }
}`}
          </pre>
        </div>
        <div className="mt-3 p-3 bg-accent-red/5 border border-accent-red/20 rounded-md">
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">Common aspect ratios:</strong> 9:16 (vertical),
            16:9 (landscape), 1:1 (square), 4:3 (traditional)
          </p>
        </div>
      </div>

      {/* Video Slots */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Video className="w-5 h-5 text-accent-red" />
          <h3 className="text-lg font-semibold text-text-primary">Video Slots</h3>
        </div>
        <div className="bg-bg-tertiary rounded-md p-4 overflow-x-auto">
          <pre className="text-sm text-text-primary">
{`{
  "id": "generatedVideo",
  "type": "video",
  "constraints": {
    "aspectRatio": "9:16",
    "minWidth": 720,
    "minHeight": 1280,
    "maxDuration": 15,        // seconds
    "maxFileSize": 52428800,  // 50MB
    "formats": ["mp4", "mov"],
    "codec": "h264"
  }
}`}
          </pre>
        </div>
        <div className="mt-3 p-3 bg-accent-red/5 border border-accent-red/20 rounded-md">
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">Max duration:</strong> Limit video slots to 15 seconds
            to ensure fast rendering
          </p>
        </div>
      </div>

      {/* Text Slots */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Type className="w-5 h-5 text-accent-red" />
          <h3 className="text-lg font-semibold text-text-primary">Text Slots (Optional)</h3>
        </div>
        <div className="bg-bg-tertiary rounded-md p-4 overflow-x-auto">
          <pre className="text-sm text-text-primary">
{`{
  "id": "userPrompt",
  "type": "text",
  "constraints": {
    "maxLength": 100,
    "fontFamily": "Roboto",
    "fontSize": 24,
    "textAlign": "center"
  }
}`}
          </pre>
        </div>
      </div>
    </Card>

    <Card>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Complete Slot Definition Example</h2>
      <div className="bg-bg-tertiary rounded-md p-4 overflow-x-auto">
        <pre className="text-sm text-text-primary">
{`{
  "id": "gridImage1",
  "name": "Grid Image 1",
  "type": "image",
  "required": true,
  "description": "First image in the 3x3 grid display",
  "timing": {
    "appearsAt": "0:00",
    "visibleUntil": "0:02.5",
    "durationSeconds": 2.5
  },
  "constraints": {
    "aspectRatio": "9:16",
    "minWidth": 720,
    "minHeight": 1280,
    "maxFileSize": 10485760,
    "formats": ["jpeg", "png"]
  },
  "position": {
    "screen": "Grid Screen",
    "location": "Top left corner of 3x3 grid"
  }
}`}
        </pre>
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => copyToClipboard(
            `{\n  "id": "gridImage1",\n  "name": "Grid Image 1",\n  "type": "image",\n  "required": true\n}`
          )}
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy Example
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.open('/templates/asset-slots-schema.json', '_blank')}
        >
          <Download className="w-4 h-4 mr-2" />
          Download Full Schema
        </Button>
      </div>
    </Card>
  </div>
);

// Figma Tab
const FigmaTab: React.FC = () => (
  <div className="space-y-6">
    <Card>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Figma Artboard Setup</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-bg-tertiary rounded-md">
          <h3 className="font-semibold text-text-primary mb-2">Canvas Size</h3>
          <p className="text-sm text-text-secondary mb-2">720x1280px (9:16 vertical format)</p>
          <div className="bg-bg-primary p-4 rounded border border-border-subtle">
            <div className="bg-accent-red/10 aspect-[9/16] max-w-[100px] mx-auto rounded flex items-center justify-center">
              <span className="text-xs text-text-secondary">720x1280</span>
            </div>
          </div>
        </div>
        <div className="p-4 bg-bg-tertiary rounded-md">
          <h3 className="font-semibold text-text-primary mb-2">Frame Organization</h3>
          <ul className="text-sm text-text-secondary space-y-2">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent-red rounded-full"></div>
              Create separate frames for each screen
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent-red rounded-full"></div>
              Use sequential names (01-Grid-Screen)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent-red rounded-full"></div>
              Design for 24fps playback
            </li>
          </ul>
        </div>
      </div>
    </Card>

    <Card>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Layer Organization Structure</h2>
      <div className="bg-bg-tertiary rounded-md p-4 font-mono text-sm">
        <div className="space-y-1 text-text-primary">
          <div>📄 <strong>Template Name</strong></div>
          <div className="ml-4">📁 00-Cover</div>
          <div className="ml-4">📁 01-Grid-Screen</div>
          <div className="ml-8">📁 Branding (fixed elements)</div>
          <div className="ml-12 text-text-secondary">- Logo</div>
          <div className="ml-12 text-text-secondary">- UI Frame</div>
          <div className="ml-12 text-text-secondary">- Button</div>
          <div className="ml-8">📁 Content-Slots (variable)</div>
          <div className="ml-12 text-accent-red">- [SLOT: gridImage1] 9:16 ratio</div>
          <div className="ml-12 text-accent-red">- [SLOT: gridImage2] 9:16 ratio</div>
          <div className="ml-12 text-text-secondary">...</div>
          <div className="ml-8">📁 Annotations</div>
          <div className="ml-12 text-text-secondary">- Timing notes</div>
          <div className="ml-12 text-text-secondary">- Animation notes</div>
          <div className="ml-4">📁 02-Prompt-Screen</div>
          <div className="ml-4">📁 03-Result-Screen</div>
          <div className="ml-4">📁 Assets-Export</div>
        </div>
      </div>
    </Card>

    <Card>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Marking Asset Slots in Figma</h2>
      <div className="space-y-4">
        <div className="p-4 bg-status-online/5 border border-status-online/20 rounded-md">
          <h3 className="font-semibold text-status-online mb-3">How to Mark Slots</h3>
          <ol className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-start gap-2">
              <Badge className="bg-status-online text-white flex-shrink-0">1</Badge>
              <span>Create a placeholder shape (rectangle/frame) where content will appear</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge className="bg-status-online text-white flex-shrink-0">2</Badge>
              <span>Name the layer with the slot ID in brackets</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge className="bg-status-online text-white flex-shrink-0">3</Badge>
              <span>Use bright pink/orange fill so slots are easily identifiable</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge className="bg-status-online text-white flex-shrink-0">4</Badge>
              <span>Lock branding layers to prevent accidental edits</span>
            </li>
          </ol>
        </div>

        <div className="bg-bg-tertiary rounded-md p-4">
          <h3 className="font-semibold text-text-primary mb-3">Example Layer Names</h3>
          <div className="space-y-2 font-mono text-sm">
            <div className="p-2 bg-status-online/10 rounded text-status-online">
              [SLOT: gridImage1 | image | 9:16 | required]
            </div>
            <div className="p-2 bg-status-online/10 rounded text-status-online">
              [SLOT: generatedVideo | video | 9:16 | required | 0-15s]
            </div>
            <div className="p-2 bg-status-online/10 rounded text-status-online">
              [SLOT: userPrompt | text | 100 chars | optional]
            </div>
          </div>
        </div>
      </div>
    </Card>

    <Card>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Animation Notes</h2>
      <p className="text-text-secondary mb-4">
        Use Figma comments or text annotations to specify animations:
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-bg-tertiary rounded-md">
          <h3 className="font-semibold text-text-primary mb-2">Include:</h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent-red rounded-full"></div>
              Timing (when elements appear/disappear)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent-red rounded-full"></div>
              Transitions (fade, slide, scale)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent-red rounded-full"></div>
              Duration (animation length)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent-red rounded-full"></div>
              Easing (ease-in, ease-out, spring)
            </li>
          </ul>
        </div>
        <div className="p-4 bg-bg-tertiary rounded-md">
          <h3 className="font-semibold text-text-primary mb-2">Example:</h3>
          <div className="p-3 bg-bg-primary rounded text-sm">
            <p className="text-accent-red font-semibold mb-1">Animation: Grid images fade in</p>
            <p className="text-text-secondary">Timing: 0:00 - 0:02</p>
            <p className="text-text-secondary">Stagger: Each image delays by 0.1s</p>
            <p className="text-text-secondary">Easing: Ease-out</p>
          </div>
        </div>
      </div>
    </Card>
  </div>
);

// Delivery Tab
const DeliveryTab: React.FC = () => (
  <div className="space-y-6">
    <Card>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Package Structure</h2>
      <div className="bg-bg-tertiary rounded-md p-4 font-mono text-sm">
        <div className="space-y-1 text-text-primary">
          <div>📦 <strong>template-package/</strong></div>
          <div className="ml-4">📁 01-figma-files/</div>
          <div className="ml-8 text-text-secondary">└── template-name.fig</div>
          <div className="ml-4">📁 02-assets/</div>
          <div className="ml-8 text-text-secondary">├── logo.svg</div>
          <div className="ml-8 text-text-secondary">├── ui-elements.svg</div>
          <div className="ml-8 text-text-secondary">├── icons/</div>
          <div className="ml-8 text-text-secondary">└── fonts/ (if custom)</div>
          <div className="ml-4">📁 03-specification/</div>
          <div className="ml-8 text-text-secondary">├── template-spec.md</div>
          <div className="ml-8 text-text-secondary">├── asset-slots.json</div>
          <div className="ml-8 text-text-secondary">└── timing-diagram.pdf</div>
          <div className="ml-4">📁 04-reference/</div>
          <div className="ml-8 text-text-secondary">├── preview-mockup.mp4</div>
          <div className="ml-8 text-text-secondary">├── screen-captures/</div>
          <div className="ml-8 text-text-secondary">└── example-assets/</div>
          <div className="ml-4 text-text-secondary">📄 README.md</div>
        </div>
      </div>
    </Card>

    <Card>
      <h2 className="text-2xl font-bold text-text-primary mb-4">File Format Requirements</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left py-3 px-4 text-text-primary font-semibold">Asset Type</th>
              <th className="text-left py-3 px-4 text-text-primary font-semibold">Format</th>
              <th className="text-left py-3 px-4 text-text-primary font-semibold">Requirements</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-subtle">
              <td className="py-3 px-4 text-text-secondary">Vector graphics</td>
              <td className="py-3 px-4 font-mono text-text-primary">SVG</td>
              <td className="py-3 px-4 text-text-secondary">Outlined text, no embedded images</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="py-3 px-4 text-text-secondary">Custom fonts</td>
              <td className="py-3 px-4 font-mono text-text-primary">WOFF2</td>
              <td className="py-3 px-4 text-text-secondary">Web-optimized, include license</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="py-3 px-4 text-text-secondary">Screen mockups</td>
              <td className="py-3 px-4 font-mono text-text-primary">PNG</td>
              <td className="py-3 px-4 text-text-secondary">720x1280px, 72dpi</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="py-3 px-4 text-text-secondary">Preview video</td>
              <td className="py-3 px-4 font-mono text-text-primary">MP4</td>
              <td className="py-3 px-4 text-text-secondary">H.264, max 2 minutes</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="py-3 px-4 text-text-secondary">Example assets</td>
              <td className="py-3 px-4 font-mono text-text-primary">JPEG/MP4</td>
              <td className="py-3 px-4 text-text-secondary">Match slot constraints</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="py-3 px-4 text-text-secondary">Specification</td>
              <td className="py-3 px-4 font-mono text-text-primary">Markdown</td>
              <td className="py-3 px-4 text-text-secondary">UTF-8 encoding</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <Card>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Handoff Timeline</h2>
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-status-online rounded-full flex items-center justify-center text-white text-sm font-bold">
              1
            </div>
            <div className="w-0.5 h-full bg-border-subtle"></div>
          </div>
          <div className="pb-6 flex-1">
            <h3 className="font-semibold text-text-primary mb-1">Design Completion</h3>
            <p className="text-sm text-text-secondary mb-2">3-5 days</p>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• All screens designed in Figma</li>
              <li>• Asset slots marked with [SLOT: ...] notation</li>
              <li>• Animation notes added</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-status-online rounded-full flex items-center justify-center text-white text-sm font-bold">
              2
            </div>
            <div className="w-0.5 h-full bg-border-subtle"></div>
          </div>
          <div className="pb-6 flex-1">
            <h3 className="font-semibold text-text-primary mb-1">Export & Documentation</h3>
            <p className="text-sm text-text-secondary mb-2">1 day</p>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Export all SVGs and assets</li>
              <li>• Complete asset-slots.json</li>
              <li>• Create preview mockup</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-status-warning rounded-full flex items-center justify-center text-white text-sm font-bold">
              3
            </div>
            <div className="w-0.5 h-full bg-border-subtle"></div>
          </div>
          <div className="pb-6 flex-1">
            <h3 className="font-semibold text-text-primary mb-1">Development Review</h3>
            <p className="text-sm text-text-secondary mb-2">2-3 days</p>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Technical feasibility review</li>
              <li>• Feedback and clarifications</li>
              <li>• Minor adjustments if needed</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-status-warning rounded-full flex items-center justify-center text-white text-sm font-bold">
              4
            </div>
            <div className="w-0.5 h-full bg-border-subtle"></div>
          </div>
          <div className="pb-6 flex-1">
            <h3 className="font-semibold text-text-primary mb-1">Development</h3>
            <p className="text-sm text-text-secondary mb-2">3-5 days</p>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Conversion to React/Remotion code</li>
              <li>• Animation implementation</li>
              <li>• Internal testing</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-status-offline rounded-full flex items-center justify-center text-white text-sm font-bold">
              5
            </div>
            <div className="w-0.5 h-full bg-border-subtle"></div>
          </div>
          <div className="pb-6 flex-1">
            <h3 className="font-semibold text-text-primary mb-1">Preview & Deployment</h3>
            <p className="text-sm text-text-secondary mb-2">1-2 days</p>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Agency reviews test renders</li>
              <li>• Final adjustments</li>
              <li>• Template goes live</li>
            </ul>
          </div>
        </div>

        <div className="p-4 bg-accent-red/5 border border-accent-red/20 rounded-md">
          <p className="text-text-primary font-semibold">
            Total Timeline: 1-2 weeks from handoff to deployment
          </p>
        </div>
      </div>
    </Card>
  </div>
);

// Video Player Component
const VideoPlayerComponent: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoSrc = 'https://firebasestorage.googleapis.com/v0/b/template-stamper-d7045.firebasestorage.app/o/examples%2Fveo-shorts-v1-example.mp4?alt=media';

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (hasError) {
    return (
      <div className="bg-bg-primary rounded-lg border border-border-subtle overflow-hidden">
        <div className="aspect-[9/16] bg-gradient-to-br from-bg-tertiary to-bg-secondary flex items-center justify-center relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-6">
              <Video className="w-16 h-16 text-accent-red mx-auto mb-3 opacity-50" />
              <p className="text-sm text-text-primary font-medium mb-2">
                Example Video Not Available
              </p>
              <p className="text-xs text-text-secondary mb-3">
                Place example video at:
              </p>
              <code className="text-xs bg-bg-tertiary px-2 py-1 rounded text-accent-red">
                /public/examples/veo-shorts-v1-example.mp4
              </code>
              <p className="text-xs text-text-secondary mt-3">
                720x1280px • 9:16 • 24fps • MP4
              </p>
            </div>
          </div>
        </div>
        <div className="p-3 bg-bg-secondary border-t border-border-subtle">
          <p className="text-xs text-text-secondary text-center">
            Preview: Veo Shorts Template v1.0.0
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-primary rounded-lg border border-border-subtle overflow-hidden">
      <div className="aspect-[9/16] bg-black relative group">
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={() => setHasError(true)}
          playsInline
        />

        {/* Play/Pause Overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={togglePlay}
        >
          {!isPlaying && (
            <div className="w-16 h-16 bg-accent-red/90 rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Progress Bar */}
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 mb-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${progress}%, #4b5563 ${progress}%, #4b5563 100%)`
            }}
          />

          {/* Control Buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="hover:text-accent-red transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={toggleMute}
                className="hover:text-accent-red transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <span className="text-xs font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <button
              onClick={() => videoRef.current?.requestFullscreen()}
              className="hover:text-accent-red transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-3 bg-bg-secondary border-t border-border-subtle">
        <p className="text-xs text-text-secondary text-center">
          Preview: Veo Shorts Template v1.0.0
        </p>
      </div>
    </div>
  );
};

// Reference Tab
const ReferenceTab: React.FC<{ copyToClipboard: (text: string) => void }> = () => (
  <div className="space-y-6">
    {/* Video Preview Section */}
    <Card>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Full Template Preview</h2>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-1">
          <VideoPlayerComponent />
        </div>

        {/* Template Info */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-semibold text-text-primary mb-2">Template Overview</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-bg-tertiary rounded-md">
                <p className="text-xs text-text-secondary mb-1">Name</p>
                <p className="text-sm text-text-primary font-medium">Veo on Shorts - Pet Skydiving</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-md">
                <p className="text-xs text-text-secondary mb-1">Duration</p>
                <p className="text-sm text-text-primary font-medium">17 seconds</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-md">
                <p className="text-xs text-text-secondary mb-1">Screens</p>
                <p className="text-sm text-text-primary font-medium">5 sections</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-md">
                <p className="text-xs text-text-secondary mb-1">Asset Slots</p>
                <p className="text-sm text-text-primary font-medium">13 total (9 images + 1 video + 1 text)</p>
              </div>
            </div>
          </div>

          <div className="bg-bg-tertiary rounded-md p-4">
            <h3 className="font-semibold text-text-primary mb-2">Technical Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Template ID:</span>
                <code className="text-accent-red">veo-shorts-v1</code>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Version:</span>
                <code className="text-accent-red">1.0.0</code>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Output Format:</span>
                <code className="text-accent-red">MP4 (H.264)</code>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Resolution:</span>
                <code className="text-accent-red">720x1280px</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>

    {/* Screen-by-Screen Breakdown with Visuals */}
    <Card>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Screen Breakdown with Visual Examples</h2>
      <div className="space-y-6">
        {/* Section 1: Grid Screen */}
        <div className="border border-border-subtle rounded-lg overflow-hidden">
          <div className="grid lg:grid-cols-3 gap-0">
            {/* Visual Mockup */}
            <div className="lg:col-span-1 bg-bg-primary p-6 border-r border-border-subtle">
              <div className="aspect-[9/16] bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-border-subtle overflow-hidden">
                <div className="p-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-text-secondary">Recents ▼</span>
                    <span className="text-xs text-text-secondary">✕</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="aspect-[9/16] bg-accent-red/20 rounded flex items-center justify-center">
                        <span className="text-[8px] text-accent-red font-mono">img{i + 1}</span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="bg-white/90 rounded-full py-1.5 text-center">
                      <span className="text-[8px] text-gray-800 font-medium">Done</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-text-secondary text-center mt-2">Section 1 Preview</p>
            </div>

            {/* Details */}
            <div className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-text-primary">Section 1: Grid Screen</h4>
                <Badge className="bg-accent-red text-white">0:00 - 0:02.5</Badge>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                Shows a 3x3 grid of recent images with mobile UI mockup. Users can see their recent photos
                displayed in a clean grid layout with a "Done" button at the bottom.
              </p>

              <div className="mb-4">
                <h5 className="text-sm font-semibold text-text-primary mb-2">Asset Slots (9 total):</h5>
                <div className="flex flex-wrap gap-2">
                  <Badge>gridImage1</Badge>
                  <Badge>gridImage2</Badge>
                  <Badge>gridImage3</Badge>
                  <Badge>gridImage4</Badge>
                  <Badge>gridImage5</Badge>
                  <Badge>gridImage6</Badge>
                  <Badge>gridImage7</Badge>
                  <Badge>gridImage8</Badge>
                  <Badge>gridImage9</Badge>
                </div>
              </div>

              <div className="bg-bg-tertiary rounded-md p-3">
                <h5 className="text-sm font-semibold text-text-primary mb-2">Constraints:</h5>
                <ul className="text-xs text-text-secondary space-y-1">
                  <li>• Aspect Ratio: 9:16 (vertical)</li>
                  <li>• Min Size: 720x1280px</li>
                  <li>• Max File Size: 10MB per image</li>
                  <li>• Formats: JPEG, PNG</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Prompt Screen */}
        <div className="border border-border-subtle rounded-lg overflow-hidden">
          <div className="grid lg:grid-cols-3 gap-0">
            <div className="lg:col-span-1 bg-bg-primary p-6 border-r border-border-subtle">
              <div className="aspect-[9/16] bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-lg border border-border-subtle overflow-hidden">
                <div className="p-3">
                  <div className="flex gap-2 mb-3">
                    <div className="w-12 h-12 bg-accent-red/20 rounded flex items-center justify-center">
                      <span className="text-[8px] text-accent-red">img1</span>
                    </div>
                    <div className="w-12 h-12 bg-accent-red/20 rounded flex items-center justify-center">
                      <span className="text-[8px] text-accent-red">img2</span>
                    </div>
                  </div>
                  <div className="bg-bg-tertiary rounded p-2">
                    <p className="text-[7px] text-text-secondary">
                      Show me and my cat skydiving
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-text-secondary text-center mt-2">Section 2 Preview</p>
            </div>

            <div className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-text-primary">Section 2: Prompt Screen</h4>
                <Badge className="bg-accent-red text-white">0:02.5 - 0:06.25</Badge>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                Displays 2 selected images from the grid along with a text prompt input. This screen
                shows what the user is submitting to generate their AI video.
              </p>

              <div className="mb-4">
                <h5 className="text-sm font-semibold text-text-primary mb-2">Asset Slots (3 total):</h5>
                <div className="flex flex-wrap gap-2">
                  <Badge>selectedImage1</Badge>
                  <Badge>selectedImage2</Badge>
                  <Badge>promptText</Badge>
                </div>
              </div>

              <div className="bg-bg-tertiary rounded-md p-3">
                <h5 className="text-sm font-semibold text-text-primary mb-2">Constraints:</h5>
                <ul className="text-xs text-text-secondary space-y-1">
                  <li>• Images: 1:1 aspect ratio (square)</li>
                  <li>• Text: Max 100 characters</li>
                  <li>• Font: Roboto, 20px</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Result Display */}
        <div className="border border-border-subtle rounded-lg overflow-hidden">
          <div className="grid lg:grid-cols-3 gap-0">
            <div className="lg:col-span-1 bg-bg-primary p-6 border-r border-border-subtle">
              <div className="aspect-[9/16] bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-border-subtle overflow-hidden flex items-center justify-center">
                <div className="text-center">
                  <Video className="w-8 h-8 text-accent-red mx-auto mb-2" />
                  <span className="text-[8px] text-accent-red font-mono">generatedVideo</span>
                  <p className="text-[7px] text-text-secondary mt-1">Full screen playback</p>
                </div>
              </div>
              <p className="text-xs text-text-secondary text-center mt-2">Section 3-4 Preview</p>
            </div>

            <div className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-text-primary">Section 3-4: Result Display</h4>
                <Badge className="bg-accent-red text-white">0:06.25 - 0:15</Badge>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                The AI-generated video plays full screen. First without any UI overlay (section 3),
                then with a subtle UI frame to show it's within the app context (section 4).
              </p>

              <div className="mb-4">
                <h5 className="text-sm font-semibold text-text-primary mb-2">Asset Slots (1 total):</h5>
                <div className="flex flex-wrap gap-2">
                  <Badge>generatedVideo</Badge>
                </div>
              </div>

              <div className="bg-bg-tertiary rounded-md p-3">
                <h5 className="text-sm font-semibold text-text-primary mb-2">Constraints:</h5>
                <ul className="text-xs text-text-secondary space-y-1">
                  <li>• Aspect Ratio: 9:16 (vertical)</li>
                  <li>• Min Size: 720x1280px</li>
                  <li>• Max Duration: 15 seconds</li>
                  <li>• Max File Size: 50MB</li>
                  <li>• Formats: MP4 (H.264), MOV</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Branding End Card */}
        <div className="border border-border-subtle rounded-lg overflow-hidden">
          <div className="grid lg:grid-cols-3 gap-0">
            <div className="lg:col-span-1 bg-bg-primary p-6 border-r border-border-subtle">
              <div className="aspect-[9/16] bg-gradient-to-br from-gray-500/10 to-gray-700/10 rounded-lg border border-border-subtle overflow-hidden flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-accent-red/20 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-[10px] text-accent-red font-bold">LOGO</span>
                  </div>
                  <p className="text-[8px] text-text-secondary">Create with Veo on Shorts</p>
                </div>
              </div>
              <p className="text-xs text-text-secondary text-center mt-2">Section 5 Preview</p>
            </div>

            <div className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-text-primary">Section 5: Branding End Card</h4>
                <Badge className="bg-accent-red text-white">0:15 - 0:17.5</Badge>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                Clean end card featuring the brand logo and tagline. This section contains only fixed
                branding elements with no variable content slots.
              </p>

              <div className="mb-4">
                <h5 className="text-sm font-semibold text-text-primary mb-2">Asset Slots:</h5>
                <div className="flex flex-wrap gap-2">
                  <Badge>No variable slots</Badge>
                  <Badge>Fixed branding only</Badge>
                </div>
              </div>

              <div className="bg-bg-tertiary rounded-md p-3">
                <h5 className="text-sm font-semibold text-text-primary mb-2">Elements:</h5>
                <ul className="text-xs text-text-secondary space-y-1">
                  <li>• Brand logo (SVG)</li>
                  <li>• Tagline text (outlined)</li>
                  <li>• Clean background</li>
                  <li>• Simple fade-in animation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <Card>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Complete asset-slots.json Example</h2>
      <div className="bg-bg-tertiary rounded-md p-4 overflow-x-auto max-h-96">
        <pre className="text-xs text-text-primary">
{`{
  "templateId": "veo-shorts-v1",
  "templateName": "Veo on Shorts - Pet Skydiving",
  "version": "1.0.0",
  "totalDuration": 17,
  "description": "A vertical video template showcasing Veo AI video generation",
  "slots": [
    {
      "id": "gridImage1",
      "name": "Grid Image 1",
      "type": "image",
      "required": true,
      "description": "First image in the 3x3 grid display",
      "timing": {
        "appearsAt": "0:00",
        "visibleUntil": "0:02.5",
        "durationSeconds": 2.5
      },
      "constraints": {
        "aspectRatio": "9:16",
        "minWidth": 720,
        "minHeight": 1280,
        "maxFileSize": 10485760,
        "formats": ["jpeg", "png"]
      },
      "position": {
        "screen": "Grid Screen",
        "location": "Top left corner of 3x3 grid"
      }
    },
    {
      "id": "generatedVideo",
      "name": "AI-Generated Video Result",
      "type": "video",
      "required": true,
      "description": "Main AI-generated video output",
      "timing": {
        "appearsAt": "0:06.25",
        "visibleUntil": "0:15",
        "durationSeconds": 8.75
      },
      "constraints": {
        "aspectRatio": "9:16",
        "minWidth": 720,
        "minHeight": 1280,
        "maxDuration": 15,
        "maxFileSize": 52428800,
        "formats": ["mp4", "mov"],
        "codec": "h264"
      },
      "position": {
        "screen": "Result Screen",
        "location": "Full screen display"
      }
    }
    // ... 11 more slots
  ]
}`}
        </pre>
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.open('/templates/asset-slots-example-veo-shorts.json', '_blank')}
        >
          <Download className="w-4 h-4 mr-2" />
          Download Full Example
        </Button>
      </div>
    </Card>

    <Card>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Naming Convention Examples</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold text-text-primary mb-3">File Naming (kebab-case)</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-status-online">
              <CheckCircle2 className="w-4 h-4" />
              <code>veo-shorts-template.fig</code>
            </div>
            <div className="flex items-center gap-2 text-status-online">
              <CheckCircle2 className="w-4 h-4" />
              <code>brand-logo.svg</code>
            </div>
            <div className="flex items-center gap-2 text-status-online">
              <CheckCircle2 className="w-4 h-4" />
              <code>ui-elements-screen-1.svg</code>
            </div>
            <div className="flex items-center gap-2 text-status-error">
              <AlertCircle className="w-4 h-4" />
              <code className="line-through">Brand Logo.svg</code>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-text-primary mb-3">Slot IDs (camelCase)</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-status-online">
              <CheckCircle2 className="w-4 h-4" />
              <code>gridImage1</code>
            </div>
            <div className="flex items-center gap-2 text-status-online">
              <CheckCircle2 className="w-4 h-4" />
              <code>generatedVideo</code>
            </div>
            <div className="flex items-center gap-2 text-status-online">
              <CheckCircle2 className="w-4 h-4" />
              <code>userPromptText</code>
            </div>
            <div className="flex items-center gap-2 text-status-error">
              <AlertCircle className="w-4 h-4" />
              <code className="line-through">generated_video</code>
            </div>
          </div>
        </div>
      </div>
    </Card>

    {/* How to Add Example Video */}
    <Card className="bg-accent-red/5 border-accent-red/20">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-accent-red/10 rounded-full flex items-center justify-center flex-shrink-0">
          <Video className="w-5 h-5 text-accent-red" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            How to Add Example Video Preview
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            To display an actual video in the preview player above, place your example video file in the project:
          </p>
          <div className="bg-bg-tertiary rounded-md p-4 mb-4">
            <p className="text-xs text-text-secondary mb-2">File Location:</p>
            <code className="text-sm text-accent-red">
              /public/examples/veo-shorts-v1-example.mp4
            </code>
          </div>
          <div className="space-y-2 text-sm text-text-secondary">
            <p><strong className="text-text-primary">Video Requirements:</strong></p>
            <ul className="space-y-1 ml-4">
              <li>• Resolution: 720x1280px (9:16 vertical)</li>
              <li>• Format: MP4 (H.264 codec)</li>
              <li>• Duration: ~17 seconds (matching template duration)</li>
              <li>• File size: Under 50MB recommended for web performance</li>
            </ul>
          </div>
          <div className="mt-4 p-3 bg-status-online/10 border border-status-online/20 rounded-md">
            <p className="text-xs text-status-online">
              <strong>Note:</strong> If no video is found, a helpful placeholder will be displayed with
              instructions for agencies.
            </p>
          </div>
        </div>
      </div>
    </Card>
  </div>
);

// Checklist Tab
const ChecklistTab: React.FC = () => (
  <div className="space-y-6">
    <Card>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Pre-Delivery Checklist</h2>
      <p className="text-text-secondary mb-6">
        Verify all items before delivering your template package to our development team.
      </p>

      <div className="space-y-6">
        {/* Design Quality */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <div className="w-6 h-6 bg-accent-red/10 rounded flex items-center justify-center">
              <Figma className="w-4 h-4 text-accent-red" />
            </div>
            Design Quality
          </h3>
          <div className="space-y-2 ml-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">All screens are 720x1280px</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">Asset slots clearly marked with [SLOT: ...] notation</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">Branding elements are vector-based (no rasterized logos)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">Text is outlined (converted to shapes)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">Colors match brand guidelines</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">Layout tested with various content types</span>
            </label>
          </div>
        </div>

        {/* Technical Requirements */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <div className="w-6 h-6 bg-accent-red/10 rounded flex items-center justify-center">
              <Package className="w-4 h-4 text-accent-red" />
            </div>
            Technical Requirements
          </h3>
          <div className="space-y-2 ml-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">All SVGs exported with outlined text</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">Fonts included (if custom fonts used)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">Asset slot constraints defined (aspect ratio, file size)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">Example assets match slot requirements</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">Total video duration documented</span>
            </label>
          </div>
        </div>

        {/* Documentation */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <div className="w-6 h-6 bg-accent-red/10 rounded flex items-center justify-center">
              <FileText className="w-4 h-4 text-accent-red" />
            </div>
            Documentation
          </h3>
          <div className="space-y-2 ml-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">template-spec.md completed with detailed description</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">asset-slots.json includes all slots with full constraints</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">Timing diagram shows sequence and duration</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">Animation notes are clear and specific</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">README.md provides package overview</span>
            </label>
          </div>
        </div>

        {/* Deliverables Organization */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <div className="w-6 h-6 bg-accent-red/10 rounded flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-accent-red" />
            </div>
            Deliverables Organization
          </h3>
          <div className="space-y-2 ml-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">All files named using conventions (kebab-case)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">Folder structure matches specified format</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">No missing or placeholder files</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">Package is zipped and ready to deliver</span>
            </label>
          </div>
        </div>

        {/* Preview & Testing */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <div className="w-6 h-6 bg-accent-red/10 rounded flex items-center justify-center">
              <Video className="w-4 h-4 text-accent-red" />
            </div>
            Preview & Testing
          </h3>
          <div className="space-y-2 ml-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">Animated preview video created</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">Screen capture PNGs exported for all screens</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">Example assets test the template layout</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border-input" />
              <span className="text-sm text-text-secondary">Visual consistency verified across all screens</span>
            </label>
          </div>
        </div>
      </div>
    </Card>

    <Card>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Common Mistakes to Avoid</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-status-error/5 border border-status-error/20 rounded-md">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-status-error" />
            <h3 className="font-semibold text-status-error">Don't</h3>
          </div>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>• Forget to mark slots with [SLOT: ...] notation</li>
            <li>• Use wrong aspect ratios for content</li>
            <li>• Leave text as editable (not outlined)</li>
            <li>• Miss timing/animation documentation</li>
            <li>• Include oversized asset files</li>
            <li>• Use inconsistent naming conventions</li>
            <li>• Forget to provide example assets</li>
          </ul>
        </div>
        <div className="p-4 bg-status-online/5 border border-status-online/20 rounded-md">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-status-online" />
            <h3 className="font-semibold text-status-online">Do</h3>
          </div>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>• Clearly mark all content slots</li>
            <li>• Specify constraints for each slot</li>
            <li>• Outline all text before exporting</li>
            <li>• Document every animation detail</li>
            <li>• Compress assets appropriately</li>
            <li>• Follow camelCase/kebab-case rules</li>
            <li>• Test layout with real content</li>
          </ul>
        </div>
      </div>
    </Card>

    <Card>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Performance Guidelines</h2>
      <p className="text-text-secondary mb-4">
        To ensure fast rendering (1-2 minutes per video), follow these limits:
      </p>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left py-3 px-4 text-text-primary font-semibold">Element</th>
              <th className="text-left py-3 px-4 text-text-primary font-semibold">Recommendation</th>
              <th className="text-left py-3 px-4 text-text-primary font-semibold">Max Limit</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-subtle">
              <td className="py-3 px-4 text-text-secondary">Total Asset Slots</td>
              <td className="py-3 px-4 text-text-primary">8-10 slots</td>
              <td className="py-3 px-4 text-text-primary">15 slots</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="py-3 px-4 text-text-secondary">Video Duration</td>
              <td className="py-3 px-4 text-text-primary">10-20 seconds</td>
              <td className="py-3 px-4 text-text-primary">30 seconds</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="py-3 px-4 text-text-secondary">Image Size</td>
              <td className="py-3 px-4 text-text-primary">Under 5MB each</td>
              <td className="py-3 px-4 text-text-primary">10MB</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="py-3 px-4 text-text-secondary">Video Size</td>
              <td className="py-3 px-4 text-text-primary">Under 25MB each</td>
              <td className="py-3 px-4 text-text-primary">50MB</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="py-3 px-4 text-text-secondary">Animations</td>
              <td className="py-3 px-4 text-text-primary">Simple (fade, slide, scale)</td>
              <td className="py-3 px-4 text-text-primary">No complex paths</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

export default TemplateGuidePage;
