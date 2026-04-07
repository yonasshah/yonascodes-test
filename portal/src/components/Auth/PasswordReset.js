import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import './PasswordReset.css';

function PasswordReset() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/portal/reset-password`,
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Password reset link sent! Check your email.'
      });
      setEmail('');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to send reset email. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-reset-container">
      <div className="password-reset-box">
        <div className="reset-header">
          <a href="/portal" className="logo">
            Yonas<span className="accent">Codes</span>
          </a>
          <h1>Reset Password</h1>
          <p>Enter your email to receive a password reset link</p>
        </div>

        <form onSubmit={handleResetPassword} className="reset-form">
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="reset-footer">
          <p>
            Remember your password? <a href="/portal">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default PasswordReset;