import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './FileList.css';

function FileList({ files }) {
  const [lightboxImage, setLightboxImage] = useState(null);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightboxImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [lightboxImage]);

  if (!files || files.length === 0) {
    return (
      <div className="file-list-empty">
        <p>No files uploaded yet</p>
      </div>
    );
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return '📄';
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('zip') || fileType.includes('compressed')) return '📦';
    return '📄';
  };

  const isImage = (fileType) => {
    return fileType && fileType.startsWith('image/');
  };

  const handleDownload = async (file) => {
    try {
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(file.file_url, '_blank');
    }
  };

  const Lightbox = ({ imageUrl, fileName, onClose, onDownload }) => {
    return createPortal(
      <div className="file-lightbox" onClick={onClose}>
        <div className="file-lightbox-content" onClick={(e) => e.stopPropagation()}>
          <button className="file-lightbox-close" onClick={onClose}>
            ✕
          </button>
          <img src={imageUrl} alt={fileName} />
          <div className="file-lightbox-footer">
            <div className="file-lightbox-name">{fileName}</div>
            <button className="file-lightbox-download" onClick={onDownload}>
              ⬇️ Download
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <div className="file-list">
        {files.map((file) => (
          <div key={file.id} className="file-item">
            {/* Thumbnail or Icon */}
            {isImage(file.file_type) ? (
              <div 
                className="file-thumbnail"
                onClick={() => setLightboxImage(file)}
              >
                <img 
                  src={file.file_url} 
                  alt={file.file_name}
                  loading="lazy"
                />
                <div className="file-thumbnail-overlay">
                  <span>👁️ View</span>
                </div>
              </div>
            ) : (
              <div className="file-icon">{getFileIcon(file.file_type)}</div>
            )}

            {/* File Info */}
            <div className="file-info">
              <div className="file-name">
                {file.file_name}
              </div>
              <div className="file-meta">
                {file.file_size && <span>{formatFileSize(file.file_size)}</span>}
                {file.created_at && (
                  <span>
                    • {new Date(file.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              {file.description && (
                <p className="file-description">{file.description}</p>
              )}
            </div>

            {/* Actions */}
            <div className="file-actions">
              {isImage(file.file_type) ? (
                <button
                  className="file-action-btn view-btn"
                  onClick={() => setLightboxImage(file)}
                  title="View image"
                >
                  👁️ View
                </button>
              ) : (
                <button
                  className="file-action-btn view-btn"
                  onClick={() => window.open(file.file_url, '_blank')}
                  title="Open file"
                >
                  👁️ Open
                </button>
              )}
              <button
                className="file-action-btn download-btn"
                onClick={() => handleDownload(file)}
                title="Download file"
              >
                ⬇️ Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox using Portal - renders at document.body level */}
      {lightboxImage && (
        <Lightbox
          imageUrl={lightboxImage.file_url}
          fileName={lightboxImage.file_name}
          onClose={() => setLightboxImage(null)}
          onDownload={() => {
            handleDownload(lightboxImage);
            setLightboxImage(null);
          }}
        />
      )}
    </>
  );
}

export default FileList;