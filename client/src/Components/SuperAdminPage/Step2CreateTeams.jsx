import React, { useState, useEffect } from 'react';
import { UserPlus, ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Plus, Trash2, Edit } from 'lucide-react';
import axios from 'axios';
import './StepPages.css';

const Step2CreateTeams = ({ onNext, onPrev, currentStep }) => {
  const [teams, setTeams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeam, setNewTeam] = useState({
    teamName: '',
    classId: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, classesRes] = await Promise.all([
        axios.get('/api/Teams'),
        axios.get('/api/Class')
      ]);

      setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : []);
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeam.teamName || !newTeam.classId) {
      alert('Please fill in team name and select a class');
      return;
    }

    try {
      // This would be implemented when backend is ready
      alert('Team creation functionality will be implemented with backend integration');
      setNewTeam({ teamName: '', classId: '', description: '' });
      setShowCreateForm(false);
      fetchData();
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Error creating team');
    }
  };

  const getClassName = (classId) => {
    const classObj = classes.find(c => c.id === classId);
    return classObj ? classObj.className : 'Unknown Class';
  };

  const getGradeName = (classId) => {
    const classObj = classes.find(c => c.id === classId);
    return classObj ? classObj.gradeName : 'Unknown Grade';
  };

  const isStepComplete = teams.length > 0;

  return (
    <div className="step-page">
      <div className="step-header">
        <div className="step-title">
          <UserPlus className="step-title-icon" />
          <div>
            <h2>Step 2: Create Teams</h2>
            <p>Create teams and assign them to classes where engineers/reviewers are assigned</p>
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
            <h3>Create New Team</h3>
            <button 
              className="toggle-form-button"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <Plus className="button-icon" />
              {showCreateForm ? 'Cancel' : 'Create Team'}
            </button>
          </div>

          {showCreateForm && (
            <div className="create-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Team Name:</label>
                  <input
                    type="text"
                    value={newTeam.teamName}
                    onChange={(e) => setNewTeam({ ...newTeam, teamName: e.target.value })}
                    placeholder="Enter team name..."
                  />
                </div>
                <div className="form-group">
                  <label>Assign to Class:</label>
                  <select
                    value={newTeam.classId}
                    onChange={(e) => setNewTeam({ ...newTeam, classId: e.target.value })}
                  >
                    <option value="">Choose a class...</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.className} ({cls.gradeName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description (Optional):</label>
                <textarea
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  placeholder="Enter team description..."
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button className="create-button" onClick={handleCreateTeam}>
                  <Plus className="button-icon" />
                  Create Team
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

        <div className="teams-overview">
          <h3>Existing Teams</h3>
          {loading ? (
            <div className="loading">Loading teams...</div>
          ) : teams.length > 0 ? (
            <div className="teams-grid">
              {teams.map(team => (
                <div key={team.id} className="team-card">
                  <div className="team-header">
                    <h4>{team.teamName}</h4>
                    <div className="team-actions">
                      <button className="edit-button">
                        <Edit className="action-icon" />
                      </button>
                      <button className="remove-button">
                        <Trash2 className="action-icon" />
                      </button>
                    </div>
                  </div>
                  <div className="team-info">
                    <p><strong>Class:</strong> {getClassName(team.classId)}</p>
                    <p><strong>Grade:</strong> {getGradeName(team.classId)}</p>
                    {team.supervisorName && (
                      <p><strong>Supervisor:</strong> {team.supervisorName}</p>
                    )}
                    {team.teamLeaderName && (
                      <p><strong>Team Leader:</strong> {team.teamLeaderName}</p>
                    )}
                  </div>
                  <div className="team-status">
                    <span className="status-badge">
                      {team.teamLeaderName ? 'Complete' : 'Needs Leader'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-teams">
              <AlertCircle className="no-data-icon" />
              <p>No teams found. Create your first team to get started.</p>
            </div>
          )}
        </div>

        <div className="step-instructions">
          <h4>Instructions:</h4>
          <ul>
            <li>Create teams and assign them to specific classes</li>
            <li>Ensure teams are linked to classes with assigned supervisors</li>
            <li>Set team names and basic information</li>
            <li>Teams will be used in the next steps for leader and member assignment</li>
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
          Next Step
          <ArrowRight className="nav-icon" />
        </button>
      </div>
    </div>
  );
};

export default Step2CreateTeams;
