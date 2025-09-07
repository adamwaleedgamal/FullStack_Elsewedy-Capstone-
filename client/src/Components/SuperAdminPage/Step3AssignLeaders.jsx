import React, { useState, useEffect } from 'react';
import { CheckCircle, ArrowLeft, ArrowRight, AlertCircle, UserCheck, Users } from 'lucide-react';
import axios from 'axios';
import './StepPages.css';

const Step3AssignLeaders = ({ onNext, onPrev, currentStep }) => {
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedLeader, setSelectedLeader] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, studentsRes] = await Promise.all([
        axios.get('/api/Teams'),
        axios.get('/api/Account/ByType/1') // Students
      ]);

      setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : []);
      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignLeader = async () => {
    if (!selectedTeam || !selectedLeader) {
      alert('Please select both team and team leader');
      return;
    }

    try {
      // This would be implemented when backend is ready
      alert('Team leader assignment functionality will be implemented with backend integration');
      setSelectedTeam('');
      setSelectedLeader('');
      fetchData();
    } catch (error) {
      console.error('Error assigning team leader:', error);
      alert('Error assigning team leader');
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.fullNameEn : 'Unknown Student';
  };

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.teamName : 'Unknown Team';
  };

  const getClassName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.className : 'Unknown Class';
  };

  const getStudentsForTeam = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return [];
    
    // Filter students by class (this would need proper implementation)
    return students.filter(student => {
      // This is a simplified filter - in reality, you'd check student's class
      return true; // For now, show all students
    });
  };

  const teamsWithoutLeaders = teams.filter(team => !team.teamLeaderName);
  const teamsWithLeaders = teams.filter(team => team.teamLeaderName);

  const isStepComplete = teamsWithLeaders.length > 0;

  return (
    <div className="step-page">
      <div className="step-header">
        <div className="step-title">
          <UserCheck className="step-title-icon" />
          <div>
            <h2>Step 3: Assign Team Leaders</h2>
            <p>Select and assign team leaders from the student accounts</p>
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
        <div className="assignment-section">
          <h3>Assign Team Leader</h3>
          <div className="assignment-form">
            <div className="form-row">
              <div className="form-group">
                <label>Select Team:</label>
                <select 
                  value={selectedTeam} 
                  onChange={(e) => setSelectedTeam(e.target.value)}
                >
                  <option value="">Choose a team...</option>
                  {teamsWithoutLeaders.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.teamName} - {team.className}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Select Team Leader:</label>
                <select 
                  value={selectedLeader} 
                  onChange={(e) => setSelectedLeader(e.target.value)}
                  disabled={!selectedTeam}
                >
                  <option value="">Choose a student...</option>
                  {selectedTeam && getStudentsForTeam(selectedTeam).map(student => (
                    <option key={student.id} value={student.id}>
                      {student.fullNameEn} - {student.email}
                    </option>
                  ))}
                </select>
              </div>
              <button 
                className="assign-button"
                onClick={handleAssignLeader}
                disabled={!selectedTeam || !selectedLeader}
              >
                <UserCheck className="button-icon" />
                Assign Leader
              </button>
            </div>
          </div>
        </div>

        <div className="teams-status">
          <div className="teams-without-leaders">
            <h3>Teams Without Leaders</h3>
            {teamsWithoutLeaders.length > 0 ? (
              <div className="teams-grid">
                {teamsWithoutLeaders.map(team => (
                  <div key={team.id} className="team-card needs-leader">
                    <div className="team-header">
                      <h4>{team.teamName}</h4>
                      <span className="status-badge warning">Needs Leader</span>
                    </div>
                    <div className="team-info">
                      <p><strong>Class:</strong> {team.className}</p>
                      <p><strong>Supervisor:</strong> {team.supervisorName || 'Not assigned'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <CheckCircle className="no-data-icon success" />
                <p>All teams have leaders assigned!</p>
              </div>
            )}
          </div>

          <div className="teams-with-leaders">
            <h3>Teams With Leaders</h3>
            {teamsWithLeaders.length > 0 ? (
              <div className="teams-grid">
                {teamsWithLeaders.map(team => (
                  <div key={team.id} className="team-card has-leader">
                    <div className="team-header">
                      <h4>{team.teamName}</h4>
                      <span className="status-badge success">Complete</span>
                    </div>
                    <div className="team-info">
                      <p><strong>Class:</strong> {team.className}</p>
                      <p><strong>Team Leader:</strong> {team.teamLeaderName}</p>
                      <p><strong>Supervisor:</strong> {team.supervisorName || 'Not assigned'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <AlertCircle className="no-data-icon" />
                <p>No teams have leaders assigned yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="step-instructions">
          <h4>Instructions:</h4>
          <ul>
            <li>Choose team leaders from student accounts (Role ID: 1)</li>
            <li>Update the Teams table with TeamLeaderAccountId</li>
            <li>Ensure team leaders are from the same class as the team</li>
            <li>Verify team leader assignments in the database</li>
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

export default Step3AssignLeaders;
