import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';

export interface UploadedFile {
  file: File;
  preview?: string;
}

export interface UploadAreaProps {
  onFilesAdded: (files: File[]) => void;
  onFileRemove?: (index: number) => void;
  uploadedFiles?: UploadedFile[];
  accept?: Record<string, string[]>;
  maxSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  className?: string;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  onFilesAdded,
  onFileRemove,
  uploadedFiles = [],
  accept = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'video/mpeg': ['.mpeg', '.mpg'],
  },
  maxSize = 100 * 1024 * 1024, // 100MB default
  maxFiles = 10,
  disabled = false,
  label,
  helperText,
  className = '',
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesAdded(acceptedFiles);
    },
    [onFilesAdded]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    disabled,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-2">
          {label}
        </label>
      )}

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8
          text-center cursor-pointer
          transition-all duration-200
          ${isDragActive
            ? 'border-accent-red bg-accent-red/5'
            : 'border-border-dashed bg-bg-secondary hover:border-border-input hover:bg-bg-tertiary'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
        {isDragActive ? (
          <p className="text-text-primary font-medium">Drop files here...</p>
        ) : (
          <>
            <p className="text-text-primary font-medium mb-1">
              Drag and drop files here, or click to select
            </p>
            <p className="text-sm text-text-tertiary">
              {helperText || `Max file size: ${formatFileSize(maxSize)}`}
            </p>
          </>
        )}
      </div>

      {fileRejections.length > 0 && (
        <div className="mt-2 text-sm text-accent-red">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name}>
              {file.name}: {errors.map((e) => e.message).join(', ')}
            </div>
          ))}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadedFiles.map((uploadedFile, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-bg-secondary border border-border-subtle rounded-md"
            >
              <File className="w-5 h-5 text-text-secondary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {uploadedFile.file.name}
                </p>
                <p className="text-xs text-text-tertiary">
                  {formatFileSize(uploadedFile.file.size)}
                </p>
              </div>
              {onFileRemove && (
                <button
                  onClick={() => onFileRemove(index)}
                  className="flex-shrink-0 p-1 hover:bg-bg-tertiary rounded transition-colors"
                >
                  <X className="w-4 h-4 text-text-secondary hover:text-accent-red" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
