import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import './UpdateThread.css';

function UpdateThread({ update, projectId, userId, onReplyPosted }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('project_updates')
        .insert([
          {
            project_id: projectId,
            author_id: userId,
            author_type: 'client',
            message: replyText,
            parent_id: update.id,
            is_internal: false
          }
        ]);

      if (error) throw error;

      setReplyText('');
      setShowReply(false);
      if (onReplyPosted) onReplyPosted();
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setSending(false);
    }
  };

  // Parse message for markdown images and text
  const renderMessage = (message) => {
    const parts = [];
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;

    while ((match = imageRegex.exec(message)) !== null) {
      // Add text before image
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: message.substring(lastIndex, match.index)
        });
      }

      // Add image
      parts.push({
        type: 'image',
        alt: match[1],
        url: match[2]
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < message.length) {
      parts.push({
        type: 'text',
        content: message.substring(lastIndex)
      });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content: message }];
  };

  const messageParts = renderMessage(update.message);

  return (
    <>
      <div className="update-thread">
        <div className="update-main">
          <div className="update-header">
            <div className="update-author-info">
              <div className="update-avatar">
                {update.author_type === 'admin' ? '👨‍💼' : '👤'}
              </div>
              <div>
                <span className="update-author">
                  {update.author_type === 'admin' ? 'YonasCodes Team' : 'You'}
                </span>
                <span className="update-date">
                  {new Date(update.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="update-content">
            {messageParts.map((part, index) => {
              if (part.type === 'text') {
                return part.content.trim() ? (
                  <p key={index} className="update-text">{part.content}</p>
                ) : null;
              } else if (part.type === 'image') {
                return (
                  <div key={index} className="update-image-thumbnail">
                    <img 
                      src={part.url} 
                      alt={part.alt || 'Attachment'} 
                      onClick={() => setLightboxImage(part.url)}
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>

          {!showReply && (
            <button 
              className="update-reply-btn"
              onClick={() => setShowReply(true)}
            >
              💬 Reply
            </button>
          )}

          {showReply && (
            <form onSubmit={handleReply} className="update-reply-form">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                rows="3"
                disabled={sending}
                className="reply-textarea"
              />
              <div className="reply-actions">
                <button
                  type="button"
                  onClick={() => setShowReply(false)}
                  className="reply-cancel-btn"
                  disabled={sending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="reply-send-btn"
                  disabled={sending || !replyText.trim()}
                >
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Replies */}
        {update.replies && update.replies.length > 0 && (
          <div className="update-replies">
            {update.replies.map((reply) => (
              <div key={reply.id} className="update-reply">
                <div className="update-header">
                  <div className="update-author-info">
                    <div className="update-avatar small">
                      {reply.author_type === 'admin' ? '👨‍💼' : '👤'}
                    </div>
                    <div>
                      <span className="update-author">
                        {reply.author_type === 'admin' ? 'YonasCodes Team' : 'You'}
                      </span>
                      <span className="update-date">
                        {new Date(reply.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="update-content">
                  {renderMessage(reply.message).map((part, index) => {
                    if (part.type === 'text') {
                      return part.content.trim() ? (
                        <p key={index} className="update-text">{part.content}</p>
                      ) : null;
                    } else if (part.type === 'image') {
                      return (
                        <div key={index} className="update-image-thumbnail">
                          <img 
                            src={part.url} 
                            alt={part.alt || 'Attachment'}
                            onClick={() => setLightboxImage(part.url)}
                          />
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div className="update-lightbox" onClick={() => setLightboxImage(null)}>
          <div className="update-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="update-lightbox-close"
              onClick={() => setLightboxImage(null)}
            >
              ✕
            </button>
            <img src={lightboxImage} alt="Full size" />
          </div>
        </div>
      )}
    </>
  );
}

export default UpdateThread;