import { useState } from 'react';
import { Upload, FileJson } from 'lucide-react';

export default function ManifestUploader({ onLoad }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        setError(null);
        onLoad(json);
      } catch {
        setError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`w-full max-w-md border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
          dragOver ? 'border-accent bg-accent/5' : 'border-border'
        }`}
      >
        <FileJson className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
        <h3 className="text-sm font-semibold text-white mb-1">Load Generation Manifest</h3>
        <p className="text-xs text-neutral-500 mb-4">
          Drop a generation_manifest.json file here, or click to browse
        </p>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover cursor-pointer transition-colors">
          <Upload className="w-4 h-4" />
          Choose file
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />
        </label>
        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
      </div>
    </div>
  );
}
