'use client';

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

const MAX_FILES = 5;

type StatusTone = 'idle' | 'info' | 'success' | 'error';

type ConvertedFile = {
  downloadName: string;
  downloadSize: number;
  downloadUrl: string;
  sourceName: string;
  sourceSize: number;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function buildOutputName(originalName: string) {
  const baseName = originalName.replace(/\.png$/i, '') || 'converted';
  return `${baseName}.webp`;
}

export function ConverterClient() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ConvertedFile[]>([]);
  const [status, setStatus] = useState(
    `Drop in up to ${MAX_FILES} PNG files or browse from your device.`,
  );
  const [statusTone, setStatusTone] = useState<StatusTone>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    return () => {
      results.forEach((result) => {
        URL.revokeObjectURL(result.downloadUrl);
      });
    };
  }, [results]);

  const clearResults = () => {
    results.forEach((result) => {
      URL.revokeObjectURL(result.downloadUrl);
    });

    setResults([]);
  };

  const updateFiles = (nextFiles: File[]) => {
    if (nextFiles.length === 0) {
      setFiles([]);
      clearResults();
      setStatus(`Drop in up to ${MAX_FILES} PNG files or browse from your device.`);
      setStatusTone('idle');
      return;
    }

    if (nextFiles.length > MAX_FILES) {
      setFiles([]);
      clearResults();
      setStatus(`You can upload up to ${MAX_FILES} PNG files at a time.`);
      setStatusTone('error');

      if (inputRef.current) {
        inputRef.current.value = '';
      }

      return;
    }

    const invalidFile = nextFiles.find((file) => file.type !== 'image/png');

    if (invalidFile) {
      setFiles([]);
      clearResults();
      setStatus(`Only PNG images are supported. ${invalidFile.name} was rejected.`);
      setStatusTone('error');

      if (inputRef.current) {
        inputRef.current.value = '';
      }

      return;
    }

    clearResults();
    setFiles(nextFiles);
    setStatus(
      `${nextFiles.length} PNG file${nextFiles.length > 1 ? 's' : ''} ready to convert.`,
    );
    setStatusTone('info');
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateFiles(Array.from(event.target.files ?? []));
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    updateFiles(Array.from(event.dataTransfer.files ?? []));
  };

  const handleReset = () => {
    clearResults();
    setFiles([]);
    setStatus(`Drop in up to ${MAX_FILES} PNG files or browse from your device.`);
    setStatusTone('idle');

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (files.length === 0) {
      setStatus('Choose at least one PNG image before converting.');
      setStatusTone('error');
      return;
    }

    setIsSubmitting(true);
    setStatus(
      `Converting ${files.length} PNG file${files.length > 1 ? 's' : ''} to WebP...`,
    );
    setStatusTone('info');

    try {
      const convertedResults: ConvertedFile[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/convert', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorMessage = await response.text();
          throw new Error(errorMessage || `Conversion failed for ${file.name}.`);
        }

        const blob = await response.blob();

        convertedResults.push({
          downloadName: buildOutputName(file.name),
          downloadSize: blob.size,
          downloadUrl: URL.createObjectURL(blob),
          sourceName: file.name,
          sourceSize: file.size,
        });
      }

      clearResults();
      setResults(convertedResults);
      setStatus(
        `${convertedResults.length} WebP file${
          convertedResults.length > 1 ? 's are' : ' is'
        } ready. Download one by one or all as a ZIP file.`,
      );
      setStatusTone('success');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong.';
      setStatus(message);
      setStatusTone('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadFile = (result: ConvertedFile) => {
    const anchor = document.createElement('a');
    anchor.href = result.downloadUrl;
    anchor.download = result.downloadName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setStatus(`Downloading ${result.downloadName}.`);
    setStatusTone('success');
  };

  const handleDownloadAll = async () => {
    if (results.length === 0) {
      return;
    }

    setIsDownloadingAll(true);
    setStatus(`Preparing ZIP download for ${results.length} WebP files...`);
    setStatusTone('info');

    try {
      const formData = new FormData();

      for (const result of results) {
        const blob = await fetch(result.downloadUrl).then((response) => response.blob());
        formData.append('files', new File([blob], result.downloadName, { type: 'image/webp' }));
      }

      const response = await fetch('/api/zip', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || 'Failed to create ZIP file.');
      }

      const zipBlob = await response.blob();
      const zipUrl = URL.createObjectURL(zipBlob);
      const anchor = document.createElement('a');
      anchor.href = zipUrl;
      anchor.download = 'converted-webp-files.zip';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(zipUrl);

      setStatus('Downloading converted-webp-files.zip.');
      setStatusTone('success');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create ZIP file.';
      setStatus(message);
      setStatusTone('error');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  return (
    <div className="panel">
      <form className="converter" onSubmit={handleSubmit}>
        <label
          className={`dropzone ${isDragActive ? 'drag-active' : ''} ${
            files.length > 0 ? 'has-file' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png"
            multiple
            onChange={handleFileChange}
            aria-label="Upload PNG images"
          />

          <div className="dropzone-copy">
            <span className="dropzone-badge">
              {files.length > 0 ? `${files.length} PNG selected` : 'Drop PNG files here'}
            </span>
            <strong>
              {files.length > 0
                ? `${files.length} file${files.length > 1 ? 's' : ''} queued`
                : 'Choose up to 5 PNG files from your computer'}
            </strong>
            <span>
              {files.length > 0
                ? 'Convert them together, then download one by one or all at once.'
                : 'Drag and drop or click to browse'}
            </span>
          </div>
        </label>

        <div className="actions">
          <button type="submit" disabled={isSubmitting || files.length === 0}>
            {isSubmitting ? 'Converting...' : 'Convert to WebP'}
          </button>
          <button
            type="button"
            className="download-button"
            onClick={handleDownloadAll}
            disabled={isSubmitting || isDownloadingAll || results.length === 0}
          >
            {isDownloadingAll ? 'Preparing ZIP...' : 'Download All ZIP'}
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={handleReset}
            disabled={isSubmitting || isDownloadingAll || files.length === 0}
          >
            Reset
          </button>
        </div>

        <div className={`status tone-${statusTone}`} aria-live="polite">
          {status}
        </div>
      </form>

      <aside className="preview-card" aria-label="Selected image list and converted files">
        <div className="results-section">
          <div className="section-heading">
            <span className="section-label">Selected PNGs</span>
            <strong>{files.length} / {MAX_FILES}</strong>
          </div>

          <div className="file-list">
            {files.length > 0 ? (
              files.map((file) => (
                <div className="file-row" key={`${file.name}-${file.size}`}>
                  <div className="file-row-copy">
                    <strong>{file.name}</strong>
                    <span>{formatBytes(file.size)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No PNG files selected yet.</div>
            )}
          </div>
        </div>

        <div className="results-section">
          <div className="section-heading">
            <span className="section-label">Converted WebPs</span>
            <strong>{results.length}</strong>
          </div>

          <div className="file-list">
            {results.length > 0 ? (
              results.map((result) => (
                <div className="file-row" key={result.downloadName}>
                  <div className="file-row-copy">
                    <strong>{result.downloadName}</strong>
                    <span>
                      PNG {formatBytes(result.sourceSize)} {'->'} WebP{' '}
                      {formatBytes(result.downloadSize)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="mini-button"
                    onClick={() => downloadFile(result)}
                  >
                    Download
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state">Converted files will appear here.</div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
