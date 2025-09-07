import React, { useState, useEffect } from 'react';
import { Building, ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Plus, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import './StepPages.css';

const Step5CreateProjects = ({ onNext, onPrev, currentStep }) => {
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({
    projectName: '',
    teamId: '',
    description: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes] = await Promise.all([
        axios.get('/api/Teams')
      ]);

      setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : []);
      // Projects would be fetched from a Projects endpoint when available
      setProjects([]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.projectName || !newProject.teamId) {
      alert('Please fill in project name and select a team');
      return;
    }

    try {
      // This would be implemented when backend is ready
      alert('Project creation functionality will be implemented with backend integration');
      setNewProject({
        projectName: '',
        teamId: '',
        description: '',
        startDate: '',
        endDate: ''
      });
      setShowCreateForm(false);
      fetchData();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project');
    }
  };

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.teamName : 'Unknown Team';
  };

  const getClassName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.className : 'Unknown Class';
  };

  const getSupervisorName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.supervisorName : 'Not assigned';
  };

  const teamsWithProjects = teams.filter(team => 
    projects.some(project => project.teamId === team.id)
  );
  const teamsWithoutProjects = teams.filter(team => 
    !projects.some(project => project.teamId === team.id)
  );

  const isStepComplete = projects.length > 0;

  return (
    <div className="step-page">
      <div className="step-header">
        <div className="step-title">
          <Building className="step-title-icon" />
          <div>
            <h2>Step 5: Create Projects</h2>
            <p>Create projects and assign them to teams with proper supervision</p>
          </div>
        </div>
        <div className="step-status">
          {isStepComplete ? (
            <CheckCircle className="status-icon completed" />
          ) : (
            <AlertCircle className="status-icon pending" />
          )}
        </div>
      </div>

      <div className="step-content">
        <div className="create-section">
          <div className="section-header">
            <h3>Create New Project</h3>
            <button 
              className="toggle-form-button"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <Plus className="button-icon" />
              {showCreateForm ? 'Cancel' : 'Create Project'}
            </button>
          </div>

          {showCreateForm && (
            <div className="create-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Project Name:</label>
                  <input
                    type="text"
                    value={newProject.projectName}
                    onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
                    placeholder="Enter project name..."
                  />
                </div>
                <div className="form-group">
                  <label>Assign to Team:</label>
                  <select
                    value={newProject.teamId}
                    onChange={(e) => setNewProject({ ...newProject, teamId: e.target.value })}
                  >
                    <option value="">Choose a team...</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.teamName} - {team.className}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Project Description:</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Enter project description..."
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date:</label>
                  <input
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>End Date:</label>
                  <input
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button className="create-button" onClick={handleCreateProject}>
                  <Plus className="button-icon" />
                  Create Project
                </button>
                <button 
                  className="cancel-button" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="projects-overview">
          <h3>Existing Projects</h3>
          {loading ? (
            <div className="loading">Loading projects...</div>
          ) : projects.length > 0 ? (
            <div className="projects-grid">
              {projects.map(project => (
                <div key={project.id} className="project-card">
                  <div className="project-header">
                    <h4>{project.projectName}</h4>
                    <div className="project-actions">
                      <button className="edit-button">
                        <Edit className="action-icon" />
                      </button>
                      <button className="remove-button">
                        <Trash2 className="action-icon" />
                      </button>
                    </div>
                  </div>
                  <div className="project-info">
                    <p><strong>Team:</strong> {getTeamName(project.teamId)}</p>
                    <p><strong>Class:</strong> {getClassName(project.teamId)}</p>
                    <p><strong>Supervisor:</strong> {getSupervisorName(project.teamId)}</p>
                    {project.description && (
                      <p><strong>Description:</strong> {project.description}</p>
                    )}
                    {project.startDate && (
                      <p><strong>Start Date:</strong> {new Date(project.startDate).toLocaleDateString()}</p>
                    )}
                    {project.endDate && (
                      <p><strong>End Date:</strong> {new Date(project.endDate).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="project-status">
                    <span className="status-badge success">Active</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-projects">
              <AlertCircle className="no-data-icon" />
              <p>No projects found. Create your first project to get started.</p>
            </div>
          )}
        </div>

        <div className="teams-status">
          <div className="teams-without-projects">
            <h3>Teams Without Projects</h3>
            {teamsWithoutProjects.length > 0 ? (
              <div className="teams-grid">
                {teamsWithoutProjects.map(team => (
                  <div key={team.id} className="team-card needs-project">
                    <div className="team-header">
                      <h4>{team.teamName}</h4>
                      <span className="status-badge warning">Needs Project</span>
                    </div>
                    <div className="team-info">
                      <p><strong>Class:</strong> {team.className}</p>
                      <p><strong>Team Leader:</strong> {team.teamLeaderName || 'Not assigned'}</p>
                      <p><strong>Supervisor:</strong> {team.supervisorName || 'Not assigned'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <CheckCircle className="no-data-icon success" />
                <p>All teams have projects assigned!</p>
              </div>
            )}
          </div>
        </div>

        <div className="step-instructions">
          <h4>Instructions:</h4>
          <ul>
            <li>Use the Projects table to create new projects</li>
            <li>Assign projects to teams (TeamId)</li>
            <li>Set project names, descriptions, and timelines</li>
            <li>Link projects to the supervising engineers/reviewers</li>
          </ul>
        </div>
      </div>

      <div className="step-navigation">
        <button className="nav-button prev" onClick={onPrev}>
          <ArrowLeft className="nav-icon" />
          Previous Step
        </button>
        
        <div className="step-progress">
          <span>Step {currentStep} of 5</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(currentStep / 5) * 100}%` }}></div>
          </div>
        </div>
        
        <button 
          className="nav-button next" 
          onClick={onNext}
          disabled={!isStepComplete}
        >
          {isStepComplete ? 'Team Created Successfully!' : 'Complete Setup'}
          <CheckCircle className="nav-icon" />
        </button>
      </div>
    </div>
  );
};

export default Step5CreateProjects;
