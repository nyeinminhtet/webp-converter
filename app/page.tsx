'use client';

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

type StatusTone = 'idle' | 'info' | 'success' | 'error';

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function HomePage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');
  const [status, setStatus] = useState('Drop in a PNG or browse from your device.');
  const [statusTone, setStatusTone] = useState<StatusTone>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const clearDownloadState = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }

    setDownloadUrl(null);
    setDownloadName('');
  };

  const handleValidFile = (nextFile: File) => {
    if (nextFile.type !== 'image/png') {
      setFile(null);
      setStatus('Only PNG images are supported.');
      setStatusTone('error');

      if (inputRef.current) {
        inputRef.current.value = '';
      }

      return;
    }

    setFile(nextFile);
    clearDownloadState();
    setStatus(`Ready to convert ${nextFile.name}.`);
    setStatusTone('info');
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;

    if (!nextFile) {
      setFile(null);
      setStatus('Drop in a PNG or browse from your device.');
      setStatusTone('idle');
      return;
    }

    handleValidFile(nextFile);
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

    const nextFile = event.dataTransfer.files?.[0];

    if (!nextFile) {
      return;
    }

    handleValidFile(nextFile);
  };

  const handleReset = () => {
    clearDownloadState();
    setFile(null);
    setStatus('Drop in a PNG or browse from your device.');
    setStatusTone('idle');

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      setStatus('Choose a PNG image before converting.');
      setStatusTone('error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsSubmitting(true);
    setStatus(`Converting ${file.name} to WebP...`);
    setStatusTone('info');

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || 'Conversion failed.');
      }

      const blob = await response.blob();
      const fileName = file.name.replace(/\.png$/i, '') || 'converted';
      const nextDownloadUrl = window.URL.createObjectURL(blob);

      clearDownloadState();
      setDownloadUrl(nextDownloadUrl);
      setDownloadName(`${fileName}.webp`);
      setStatus(`Conversion finished. Your WebP file is ready to download.`);
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

  const handleDownload = () => {
    if (!downloadUrl || !downloadName) {
      return;
    }

    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = downloadName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setStatus(`Downloading ${downloadName}.`);
    setStatusTone('success');
  };

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Fast image workflow</span>
          <h1>Turn heavy PNGs into portable WebP files in one step.</h1>
          <p className="lead">
            Drag in a screenshot, convert it, then download when you are ready.
            No settings maze, no extra screens.
          </p>

          <div className="feature-list" aria-label="Highlights">
            <span>Browser-based upload</span>
            <span>Preview before download</span>
            <span>PNG only, zero guesswork</span>
          </div>
        </div>

        <div className="panel">
          <form className="converter" onSubmit={handleSubmit}>
            <label
              className={`dropzone ${isDragActive ? 'drag-active' : ''} ${
                file ? 'has-file' : ''
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/png"
                onChange={handleFileChange}
                aria-label="Upload PNG image"
              />

              <div className="dropzone-copy">
                <span className="dropzone-badge">
                  {file ? 'PNG selected' : 'Drop PNG here'}
                </span>
                <strong>
                  {file ? file.name : 'Choose a PNG from your computer'}
                </strong>
                <span>
                  {file
                    ? `${formatBytes(file.size)} ready for conversion`
                    : 'Drag and drop or click to browse'}
                </span>
              </div>
            </label>

            <div className="actions">
              <button type="submit" disabled={isSubmitting || !file}>
                {isSubmitting ? 'Converting...' : 'Convert to WebP'}
              </button>
              <button
                type="button"
                className="download-button"
                onClick={handleDownload}
                disabled={isSubmitting || !downloadUrl}
              >
                Download WebP
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={handleReset}
                disabled={isSubmitting || !file}
              >
                Reset
              </button>
            </div>

            <div className={`status tone-${statusTone}`} aria-live="polite">
              {status}
            </div>
          </form>

          <aside className="preview-card" aria-label="Selected image preview">
            <div className="preview-frame">
              {previewUrl ? (
                <img src={previewUrl} alt="PNG preview" className="preview-image" />
              ) : (
                <div className="preview-placeholder">
                  <span>Preview appears here</span>
                </div>
              )}
            </div>

            <div className="file-meta">
              <div>
                <span>Format</span>
                <strong>{file ? 'PNG' : 'Waiting for upload'}</strong>
              </div>
              <div>
                <span>Size</span>
                <strong>{file ? formatBytes(file.size) : '-'}</strong>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
