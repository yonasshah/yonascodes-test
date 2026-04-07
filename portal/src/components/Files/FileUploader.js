import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import './FileUploader.css';

function FileUploader({ projectId, userId, onFileUploaded }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }

    setError('');
    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const cancelUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError('');
    // Reset file input
    const input = document.getElementById('file-input');
    if (input) input.value = '';
  };

  const confirmUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    try {
      // Create unique file name
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(fileName);

      // Create database record
      const { error: dbError } = await supabase
        .from('project_files')
        .insert([
          {
            project_id: projectId,
            uploaded_by: userId,
            file_name: selectedFile.name,
            file_url: publicUrl,
            file_type: selectedFile.type,
            file_size: selectedFile.size
          }
        ]);

      if (dbError) throw dbError;

      // Success - reset and notify
      setSelectedFile(null);
      setPreviewUrl(null);
      const input = document.getElementById('file-input');
      if (input) input.value = '';
      
      if (onFileUploaded) onFileUploaded();
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="file-uploader">
      <h3 className="uploader-title">Upload Files</h3>
      
      {error && <div className="uploader-error">{error}</div>}

      {!selectedFile ? (
        // Upload Zone
        <div
          className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-input"
            className="file-input"
            onChange={handleInputChange}
          />
          
          <label htmlFor="file-input" className="upload-label">
            <div className="upload-icon">📎</div>
            <p className="upload-text">
              <strong>Click to upload</strong> or drag and drop
            </p>
            <p className="upload-hint">PNG, JPG, PDF, DOC (max 10MB)</p>
          </label>
        </div>
      ) : (
        // Preview & Confirm
        <div className="upload-preview">
          {previewUrl ? (
            <div className="preview-image-container">
              <img src={previewUrl} alt="Preview" className="preview-image" />
            </div>
          ) : (
            <div className="preview-file-info">
              <div className="preview-file-icon">📄</div>
              <div className="preview-file-name">{selectedFile.name}</div>
            </div>
          )}
          
          <div className="preview-details">
            <div className="preview-filename">{selectedFile.name}</div>
            <div className="preview-filesize">{formatFileSize(selectedFile.size)}</div>
          </div>

          <div className="preview-actions">
            <button
              type="button"
              onClick={cancelUpload}
              className="preview-cancel-btn"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmUpload}
              className="preview-upload-btn"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUploader;