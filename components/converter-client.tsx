"use client";

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

const MAX_FILES = 5;

type StatusTone = "idle" | "info" | "success" | "error";
type FileStatus = "queued" | "uploading" | "converting" | "complete" | "error";

type FileItem = {
  downloadBlob?: Blob;
  downloadName?: string;
  downloadSize?: number;
  downloadUrl?: string;
  file: File;
  id: string;
  status: FileStatus;
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
  const baseName = originalName.replace(/\.png$/i, "") || "converted";
  return `${baseName}.webp`;
}

function getStatusLabel(status: FileStatus) {
  switch (status) {
    case "queued":
      return "Queued";
    case "uploading":
      return "Uploading";
    case "converting":
      return "Converting";
    case "complete":
      return "Done";
    case "error":
      return "Error";
    default:
      return status;
  }
}

function convertFile(file: File, onStatusChange: (status: FileStatus) => void) {
  return new Promise<Blob>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/convert");
    request.responseType = "blob";

    request.upload.onloadstart = () => {
      onStatusChange("uploading");
    };

    request.upload.onprogress = () => {
      onStatusChange("uploading");
    };

    request.upload.onload = () => {
      onStatusChange("converting");
    };

    request.onerror = () => {
      reject(new Error(`Conversion failed for ${file.name}.`));
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(request.response);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        reject(
          new Error(
            typeof reader.result === "string"
              ? reader.result
              : `Conversion failed for ${file.name}.`,
          ),
        );
      };
      reader.onerror = () => {
        reject(new Error(`Conversion failed for ${file.name}.`));
      };
      reader.readAsText(request.response);
    };

    request.send(formData);
  });
}

export function ConverterClient() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<FileItem[]>([]);
  const [status, setStatus] = useState(
    `Drop in up to ${MAX_FILES} PNG files or browse from your device.`,
  );
  const [statusTone, setStatusTone] = useState<StatusTone>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.downloadUrl) {
          URL.revokeObjectURL(item.downloadUrl);
        }
      });
    };
  }, [items]);

  const updateItem = (id: string, updates: Partial<FileItem>) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      ),
    );
  };

  const revokeDownloadUrls = (currentItems: FileItem[]) => {
    currentItems.forEach((item) => {
      if (item.downloadUrl) {
        URL.revokeObjectURL(item.downloadUrl);
      }
    });
  };

  const clearItems = () => {
    setItems((currentItems) => {
      revokeDownloadUrls(currentItems);
      return [];
    });
  };

  const updateFiles = (nextFiles: File[]) => {
    if (nextFiles.length === 0) {
      clearItems();
      setStatus(
        `Drop in up to ${MAX_FILES} PNG files or browse from your device.`,
      );
      setStatusTone("idle");
      return;
    }

    if (nextFiles.length > MAX_FILES) {
      clearItems();
      setStatus(`You can upload up to ${MAX_FILES} PNG files at a time.`);
      setStatusTone("error");

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      return;
    }

    const invalidFile = nextFiles.find((file) => file.type !== "image/png");

    if (invalidFile) {
      clearItems();
      setStatus(
        `Only PNG images are supported. ${invalidFile.name} was rejected.`,
      );
      setStatusTone("error");

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      return;
    }

    clearItems();
    setItems(
      nextFiles.map((file, index) => ({
        file,
        id: `${file.name}-${file.size}-${index}`,
        status: "queued",
      })),
    );
    setStatus(
      `${nextFiles.length} PNG file${nextFiles.length > 1 ? "s" : ""} ready to convert.`,
    );
    setStatusTone("info");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateFiles(Array.from(event.target.files ?? []));
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    if (isSubmitting) {
      return;
    }

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

    if (isSubmitting) {
      return;
    }

    updateFiles(Array.from(event.dataTransfer.files ?? []));
  };

  const handleReset = () => {
    clearItems();
    setStatus(
      `Drop in up to ${MAX_FILES} PNG files or browse from your device.`,
    );
    setStatusTone("idle");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (items.length === 0) {
      setStatus("Choose at least one PNG image before converting.");
      setStatusTone("error");
      return;
    }

    setIsSubmitting(true);
    setStatus(
      `Converting ${items.length} PNG file${items.length > 1 ? "s" : ""} to WebP...`,
    );
    setStatusTone("info");

    try {
      let successCount = 0;

      for (const item of items) {
        try {
          const blob = await convertFile(item.file, (nextStatus) => {
            updateItem(item.id, { status: nextStatus });
          });

          updateItem(item.id, {
            downloadBlob: blob,
            downloadName: buildOutputName(item.file.name),
            downloadSize: blob.size,
            downloadUrl: URL.createObjectURL(blob),
            status: "complete",
          });
          successCount += 1;
        } catch {
          updateItem(item.id, { status: "error" });
        }
      }

      if (successCount === items.length) {
        setStatus(
          `${items.length} WebP file${items.length > 1 ? "s are" : " is"} ready. Download one by one or all as a ZIP file.`,
        );
        setStatusTone("success");
      } else if (successCount > 0) {
        setStatus(
          `${successCount} file${successCount > 1 ? "s" : ""} completed. Some files failed.`,
        );
        setStatusTone("error");
      } else {
        setStatus("All conversions failed.");
        setStatusTone("error");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setStatus(message);
      setStatusTone("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (item: FileItem) => {
    if (!item.downloadUrl || !item.downloadName) {
      return;
    }

    setDownloadingIds((currentIds) => [...currentIds, item.id]);

    try {
      const anchor = document.createElement("a");
      anchor.href = item.downloadUrl;
      anchor.download = item.downloadName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setStatus(`Downloaded ${item.downloadName}.`);
      setStatusTone("success");
    } finally {
      window.setTimeout(() => {
        setDownloadingIds((currentIds) =>
          currentIds.filter((currentId) => currentId !== item.id),
        );
      }, 500);
    }
  };

  const handleDownloadAll = async () => {
    const completedItems = items.filter(
      (item) => item.downloadBlob && item.downloadName,
    );

    if (completedItems.length === 0) {
      return;
    }

    setIsDownloadingAll(true);
    setStatus(
      `Preparing ZIP download for ${completedItems.length} WebP files...`,
    );
    setStatusTone("info");

    try {
      const formData = new FormData();

      for (const item of completedItems) {
        formData.append(
          "files",
          new File([item.downloadBlob as Blob], item.downloadName as string, {
            type: "image/webp",
          }),
        );
      }

      const response = await fetch("/api/zip", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || "Failed to create ZIP file.");
      }

      const zipBlob = await response.blob();
      const zipUrl = URL.createObjectURL(zipBlob);
      const anchor = document.createElement("a");
      anchor.href = zipUrl;
      anchor.download = "converted-webp-files.zip";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(zipUrl);

      setStatus("Downloaded converted-webp-files.zip.");
      setStatusTone("success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create ZIP file.";
      setStatus(message);
      setStatusTone("error");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const completedItems = items.filter((item) => item.status === "complete");
  const inputLocked = isSubmitting;

  return (
    <div className="panel">
      <form className="converter" onSubmit={handleSubmit}>
        <label
          className={`dropzone ${isDragActive ? "drag-active" : ""} ${
            items.length > 0 ? "has-file" : ""
          } ${inputLocked ? "is-disabled" : ""}`}
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
            disabled={inputLocked}
          />

          <div className="dropzone-copy">
            <span className="dropzone-badge">
              {items.length > 0
                ? `${items.length} PNG selected`
                : "Drop PNG files here"}
            </span>
            <strong>
              {items.length > 0
                ? `${items.length} file${items.length > 1 ? "s" : ""} queued`
                : "Choose up to 5 PNG files from your computer"}
            </strong>
            <span>
              {inputLocked
                ? "Uploads are locked while conversion is running."
                : items.length > 0
                  ? "Convert them together, then download one by one or all at once."
                  : "Drag and drop or click to browse"}
            </span>
          </div>
        </label>

        {items.length > 0 ? (
          <div className="actions">
            <button type="submit" disabled={isSubmitting || items.length === 0}>
              {isSubmitting ? "Converting..." : "Convert to WebP"}
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={handleReset}
              disabled={isSubmitting || isDownloadingAll || items.length === 0}
            >
              Reset
            </button>
          </div>
        ) : null}

        <div className={`status tone-${statusTone}`} aria-live="polite">
          {status}
        </div>
      </form>

      <aside
        className="preview-card"
        aria-label="Selected image list and converted files"
      >
        <div className="results-section">
          <div className="section-heading">
            <span className="section-label">File Status</span>
            <div className="section-heading-actions">
              <strong>
                {items.length} / {MAX_FILES}
              </strong>
              {completedItems.length > 1 ? (
                <button
                  type="button"
                  className="download-button section-download-all"
                  onClick={handleDownloadAll}
                  disabled={isSubmitting || isDownloadingAll}
                >
                  {isDownloadingAll ? "Preparing ZIP..." : "Download All ZIP"}
                </button>
              ) : null}
            </div>
          </div>

          <div className="file-list">
            {items.length > 0 ? (
              items.map((item) => (
                <div className="file-row" key={item.id}>
                  <div className="file-row-copy">
                    <strong>{item.file.name}</strong>
                    <span>
                      PNG {formatBytes(item.file.size)}
                      {item.downloadSize
                        ? ` -> WebP ${formatBytes(item.downloadSize)}`
                        : ""}
                    </span>
                  </div>
                  <div className="file-row-actions">
                    <span className={`status-chip status-chip-${item.status}`}>
                      {getStatusLabel(item.status)}
                    </span>
                    {item.downloadUrl && item.downloadName ? (
                      <button
                        type="button"
                        className="mini-button"
                        onClick={() => handleDownload(item)}
                        disabled={
                          downloadingIds.includes(item.id) || isDownloadingAll
                        }
                      >
                        {downloadingIds.includes(item.id) ? (
                          <>
                            <svg
                              className="button-spinner"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <circle
                                className="button-spinner-track"
                                cx="12"
                                cy="12"
                                r="9"
                              />
                              <path
                                className="button-spinner-head"
                                d="M12 3a9 9 0 0 1 9 9"
                              />
                            </svg>
                            Loading...
                          </>
                        ) : (
                          "Download"
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No PNG files selected yet.</div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
