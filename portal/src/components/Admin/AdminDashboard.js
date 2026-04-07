import { supabase } from '../../supabaseClient';
import '../Dashboard/Dashboard.css';

function AdminDashboard({ session }) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <a href="/" className="logo">
            Yonas<span className="accent">Codes</span>
          </a>
          <span className="nav-subtitle">Admin Panel</span>
        </div>
        <div className="nav-actions">
          <span className="user-email">{session.user.email}</span>
          <button onClick={handleSignOut} className="btn-signout">
            Sign Out
          </button>
        </div>
      </nav>

      <div className="dashboard-container">
        <main className="main-content" style={{ gridColumn: '1 / -1', maxWidth: '800px', margin: '100px auto' }}>
          <div className="welcome-screen">
            <h1>Admin Dashboard</h1>
            <p>
              Admin functionality coming soon. For now, you can manage clients and projects
              directly in the Supabase dashboard.
            </p>
            <a 
              href="https://supabase.com/dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Open Supabase Dashboard →
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;