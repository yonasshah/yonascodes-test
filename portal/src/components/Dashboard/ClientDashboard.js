import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import MessageComposer from '../Messages/MessageComposer';
import UpdateThread from '../Updates/UpdateThread';
import FileUploader from '../Files/FileUploader';
import FileList from '../Files/FileList';
import './Dashboard.css';

const ClientDashboard = ({ user, session, onSignOut }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [milestones, setMilestones] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [files, setFiles] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Handle both 'user' and 'session' props (session.user)
  const currentUser = user || session?.user;
  const userId = currentUser?.id;
  const userEmail = currentUser?.email || currentUser?.user_metadata?.email || '';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    if (onSignOut) onSignOut();
  };

  const fetchProjects = React.useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProjects(data || []);
      if (data && data.length > 0) {
        setSelectedProject(data[0]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchProjects();
    }
  }, [userId, fetchProjects]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectData(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchProjectData = async (projectId) => {
    try {
      // Fetch milestones
      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });
      setMilestones(milestonesData || []);

      // Fetch updates
      const { data: updatesData } = await supabase
        .from('project_updates')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      setUpdates(updatesData || []);

      // Fetch files
      const { data: filesData } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      setFiles(filesData || []);

      // Fetch invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      setInvoices(invoicesData || []);
    } catch (error) {
      console.error('Error fetching project data:', error);
    }
  };

  const organizeUpdates = () => {
    const threads = [];
    const updateMap = new Map();

    updates.forEach(update => {
      if (!update.parent_id) {
        const thread = {
          ...update,
          replies: []
        };
        threads.push(thread);
        updateMap.set(update.id, thread);
      }
    });

    updates.forEach(update => {
      if (update.parent_id) {
        const parentThread = updateMap.get(update.parent_id);
        if (parentThread) {
          parentThread.replies.push(update);
        }
      }
    });

    return threads;
  };

  const handleUpdatePosted = () => {
    if (selectedProject) {
      fetchProjectData(selectedProject.id);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      in_progress: '#3b82f6',
      review: '#8b5cf6',
      completed: '#10b981',
      on_hold: '#6b7280',
      draft: '#6b7280',
      sent: '#3b82f6',
      paid: '#10b981',
      overdue: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Strip markdown images from text for clean display
  const stripImages = (text) => {
    if (!text) return '';
    // Remove markdown images: ![alt](url)
    const cleaned = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '');
    // Clean up extra whitespace and newlines
    return cleaned.replace(/\n\n+/g, ' ').trim();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <a href="/" className="logo">
            Yonas<span className="accent">Codes</span>
          </a>
          <span className="nav-subtitle">Client Portal</span>
        </div>
        <div className="nav-actions">
          <span className="user-email">{userEmail}</span>
          <button onClick={handleSignOut} className="btn-signout">
            Sign Out
          </button>
        </div>
      </nav>

      <div className="dashboard-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Your Projects</h3>
            <div className="project-list">
              {projects.length === 0 ? (
                <p className="empty-text">No projects yet</p>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className={`project-item ${
                      selectedProject?.id === project.id ? 'active' : ''
                    }`}
                  >
                    <div className="project-item-header">
                      <h4>{project.title}</h4>
                      <span
                        className="status-badge"
                        style={{ 
                          backgroundColor: getStatusColor(project.status),
                          color: 'white'
                        }}
                      >
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                    {project.description && (
                      <p className="project-item-desc">{project.description}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {!selectedProject ? (
            <div className="welcome-screen">
              <h1>Welcome to Your Portal</h1>
              <p>Select a project from the sidebar to get started.</p>
            </div>
          ) : (
            <>
              {/* Project Header */}
              <div className="project-header">
                <div className="project-header-main">
                  <div className="project-header-content">
                    <div className="project-status-row">
                      <span
                        className="status-badge large"
                        style={{
                          backgroundColor: getStatusColor(selectedProject.status),
                          color: 'white'
                        }}
                      >
                        {selectedProject.status.replace('_', ' ')}
                      </span>
                      <span className="project-package">{selectedProject.package_type}</span>
                    </div>
                    <h1>{selectedProject.title}</h1>
                    {selectedProject.description && (
                      <p className="project-desc">{selectedProject.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="project-stats-grid">
                  <div className="project-stat-card">
                    <div className="stat-card-label">Project Value</div>
                    <div className="stat-card-value">
                      {selectedProject.budget
                        ? formatCurrency(selectedProject.budget)
                        : 'Not specified'}
                    </div>
                  </div>
                  <div className="project-stat-card">
                    <div className="stat-card-label">Started</div>
                    <div className="stat-card-value">
                      {formatDate(selectedProject.start_date)}
                    </div>
                  </div>
                  <div className="project-stat-card">
                    <div className="stat-card-label">Target Completion</div>
                    <div className="stat-card-value">
                      {formatDate(selectedProject.target_completion_date)}
                    </div>
                  </div>
                  <div className="project-stat-card">
                    <div className="stat-card-label">Progress</div>
                    <div className="stat-card-value progress-percentage">
                      {milestones.length > 0 
                        ? Math.round((milestones.filter(m => m.status === 'completed').length / milestones.length) * 100)
                        : 0}%
                    </div>
                    <div className="mini-progress-bar">
                      <div 
                        className="mini-progress-fill"
                        style={{
                          width: `${milestones.length > 0 
                            ? (milestones.filter(m => m.status === 'completed').length / milestones.length * 100) 
                            : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <span className="tab-icon">📊</span>
                  Overview
                </button>
                <button
                  className={`tab ${activeTab === 'milestones' ? 'active' : ''}`}
                  onClick={() => setActiveTab('milestones')}
                >
                  <span className="tab-icon">🎯</span>
                  Milestones
                </button>
                <button
                  className={`tab ${activeTab === 'updates' ? 'active' : ''}`}
                  onClick={() => setActiveTab('updates')}
                >
                  <span className="tab-icon">💬</span>
                  Updates
                </button>
                <button
                  className={`tab ${activeTab === 'files' ? 'active' : ''}`}
                  onClick={() => setActiveTab('files')}
                >
                  <span className="tab-icon">📁</span>
                  Files
                </button>
                <button
                  className={`tab ${activeTab === 'invoices' ? 'active' : ''}`}
                  onClick={() => setActiveTab('invoices')}
                >
                  <span className="tab-icon">💳</span>
                  Invoices
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="content-grid">
                    {/* Timeline */}
                    <div className="card">
                      <h3 className="card-title">Timeline</h3>
                      <div className="timeline">
                        <div className="timeline-item">
                          <span className="timeline-label">Start Date</span>
                          <span className="timeline-value">
                            {formatDate(selectedProject.start_date)}
                          </span>
                        </div>
                        <div className="timeline-item">
                          <span className="timeline-label">Target Completion</span>
                          <span className="timeline-value">
                            {formatDate(selectedProject.target_completion_date)}
                          </span>
                        </div>
                        {selectedProject.actual_completion_date && (
                          <div className="timeline-item">
                            <span className="timeline-label">Completed</span>
                            <span className="timeline-value">
                              {formatDate(selectedProject.actual_completion_date)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Next Steps / Current Milestones */}
                    <div className="card">
                      <h3 className="card-title">Current Milestones</h3>
                      {milestones.length === 0 ? (
                        <p className="empty-text">No milestones yet</p>
                      ) : (
                        <div className="current-milestones-list">
                          {milestones
                            .filter(m => m.status !== 'completed')
                            .slice(0, 3)
                            .map((milestone) => (
                              <div key={milestone.id} className="current-milestone-item">
                                <div className="current-milestone-icon">
                                  {milestone.status === 'in_progress' ? '⟳' : '○'}
                                </div>
                                <div className="current-milestone-content">
                                  <h4>{milestone.title}</h4>
                                  {milestone.due_date && (
                                    <span className="current-milestone-date">
                                      Due: {formatDate(milestone.due_date)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          {milestones.filter(m => m.status !== 'completed').length === 0 && (
                            <div className="completion-message">
                              <div className="completion-icon">✓</div>
                              <div>
                                <h4>All milestones completed!</h4>
                                <p>Great work on this project.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Recent Activity */}
                    <div className="card full-width">
                      <h3 className="card-title">Recent Activity</h3>
                      {updates.length === 0 ? (
                        <p className="empty-text">No updates yet</p>
                      ) : (
                        <div className="activity-list">
                          {updates.slice(0, 5).map((update) => (
                            <div key={update.id} className="activity-item">
                              <div className="activity-icon">
                                {update.author_type === 'admin' ? '👨‍💼' : '👤'}
                              </div>
                              <div className="activity-content">
                                <div className="activity-header">
                                  <span className="activity-author">
                                    {update.author_type === 'admin' ? 'YonasCodes Team' : 'You'}
                                  </span>
                                  <span className="activity-date">
                                    {formatDate(update.created_at)}
                                  </span>
                                </div>
                                <p className="activity-message">{stripImages(update.message)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Milestones Tab */}
                {activeTab === 'milestones' && (
                  <div className="single-column">
                    <div className="card">
                      <h3 className="card-title">Project Milestones</h3>
                      {milestones.length === 0 ? (
                        <p className="empty-state">No milestones yet</p>
                      ) : (
                        <div className="milestone-list">
                          {milestones.map((milestone) => (
                            <div key={milestone.id} className="milestone-item">
                              <div className="milestone-status">
                                {milestone.status === 'completed' ? (
                                  <div className="check-icon">✓</div>
                                ) : milestone.status === 'in_progress' ? (
                                  <div className="progress-icon">⟳</div>
                                ) : (
                                  <div className="pending-icon">○</div>
                                )}
                              </div>
                              <div className="milestone-content">
                                <h4>{milestone.title}</h4>
                                {milestone.description && <p>{milestone.description}</p>}
                                {milestone.due_date && (
                                  <span className="milestone-date">
                                    Due: {formatDate(milestone.due_date)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Updates Tab */}
                {activeTab === 'updates' && (
                  <div className="single-column">
                    <div className="card">
                      <h3 className="card-title">Project Updates</h3>
                      <MessageComposer
                        projectId={selectedProject.id}
                        userId={userId}
                        onUpdatePosted={handleUpdatePosted}
                      />
                      <div className="updates-list">
                        {organizeUpdates().length === 0 ? (
                          <p className="empty-state">No updates yet. Start the conversation!</p>
                        ) : (
                          organizeUpdates().map((thread) => (
                            <UpdateThread
                              key={thread.id}
                              update={thread}
                              projectId={selectedProject.id}
                              userId={userId}
                              onReplyPosted={handleUpdatePosted}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Files Tab */}
                {activeTab === 'files' && (
                  <div className="single-column">
                    <div className="card">
                      <h3 className="card-title">Project Files</h3>
                      <FileUploader
                        projectId={selectedProject.id}
                        userId={userId}
                        onFileUploaded={handleUpdatePosted}
                      />
                      <FileList files={files} />
                    </div>
                  </div>
                )}

                {/* Invoices Tab */}
                {activeTab === 'invoices' && (
                  <div className="single-column">
                    <div className="card">
                      <h3 className="card-title">Invoices</h3>
                      {invoices.length === 0 ? (
                        <p className="empty-state">No invoices yet</p>
                      ) : (
                        <div className="invoice-list">
                          {invoices.map((invoice) => (
                            <div key={invoice.id} className="invoice-item">
                              <div className="invoice-header">
                                <span className="invoice-number">{invoice.invoice_number}</span>
                                <span
                                  className="status-badge"
                                  style={{
                                    backgroundColor: getStatusColor(invoice.status),
                                    color: 'white'
                                  }}
                                >
                                  {invoice.status}
                                </span>
                              </div>
                              <div className="invoice-details">
                                <span>Amount: {formatCurrency(invoice.amount)}</span>
                                <span>Issued: {formatDate(invoice.issue_date)}</span>
                                <span>Due: {formatDate(invoice.due_date)}</span>
                              </div>
                              {invoice.notes && (
                                <p className="invoice-notes">{invoice.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ClientDashboard;