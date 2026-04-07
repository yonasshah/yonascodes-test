import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import './MessageComposer.css';

function MessageComposer({ projectId, userId, onUpdatePosted }) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setError('Please select image files only');
      return;
    }

    // Upload images to storage
    const uploadedFiles = [];
    for (const file of imageFiles) {
      try {
        // Create unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('project-files')
          .getPublicUrl(fileName);

        uploadedFiles.push({
          name: file.name,
          url: publicUrl,
          type: file.type,
          size: file.size
        });
      } catch (err) {
        console.error('Error uploading file:', err);
        setError(`Failed to upload ${file.name}`);
      }
    }

    setAttachments([...attachments, ...uploadedFiles]);
    setError('');
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() && attachments.length === 0) {
      setError('Please enter a message or attach an image');
      return;
    }

    setSending(true);
    setError('');

    try {
      // Create the update message
      let messageText = message;
      
      // Add attachment URLs to message
      if (attachments.length > 0) {
        messageText += '\n\n' + attachments.map(att => `![${att.name}](${att.url})`).join('\n');
      }

      const { error: updateError } = await supabase
        .from('project_updates')
        .insert([
          {
            project_id: projectId,
            author_id: userId,
            author_type: 'client',
            message: messageText,
            is_internal: false
          }
        ]);

      if (updateError) throw updateError;

      // Also save attachments to project_files table
      if (attachments.length > 0) {
        const fileRecords = attachments.map(att => ({
          project_id: projectId,
          uploaded_by: userId,
          file_name: att.name,
          file_url: att.url,
          file_type: att.type,
          file_size: att.size,
          description: 'Attached to update'
        }));

        await supabase
          .from('project_files')
          .insert(fileRecords);
      }

      setMessage('');
      setAttachments([]);
      if (onUpdatePosted) onUpdatePosted();
    } catch (error) {
      console.error('Error posting update:', error);
      setError(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="message-composer">
      <h4 className="composer-title">Send a Message</h4>
      
      {error && <div className="composer-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <textarea
          className="composer-textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          rows="4"
          disabled={sending}
        />

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="composer-attachments">
            {attachments.map((attachment, index) => (
              <div key={index} className="attachment-preview">
                <img src={attachment.url} alt={attachment.name} />
                <button
                  type="button"
                  className="attachment-remove"
                  onClick={() => removeAttachment(index)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="composer-actions">
          <label className="composer-attach-btn">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={sending}
              style={{ display: 'none' }}
            />
            📎 Attach Images
          </label>

          <button 
            type="submit" 
            className="composer-send-btn"
            disabled={sending || (!message.trim() && attachments.length === 0)}
          >
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default MessageComposer;