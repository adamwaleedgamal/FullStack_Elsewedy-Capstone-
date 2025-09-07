import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, ArrowRight, CheckCircle, AlertCircle, UserPlus, Trash2 } from 'lucide-react';
import axios from 'axios';
import './StepPages.css';

const Step4AddMembers = ({ onNext, onPrev, currentStep }) => {
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [memberDescription, setMemberDescription] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, studentsRes, membersRes] = await Promise.all([
        axios.get('/api/Teams'),
        axios.get('/api/Account/ByType/1'), // Students
        axios.get('/api/TeamMembers')
      ]);

      setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : []);
      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
      setTeamMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedStudent) {
      alert('Please select both team and student');
      return;
    }

    try {
      // This would be implemented when backend is ready
      alert('Team member addition functionality will be implemented with backend integration');
      setSelectedTeam('');
      setSelectedStudent('');
      setMemberDescription('');
      fetchData();
    } catch (error) {
      console.error('Error adding team member:', error);
      alert('Error adding team member');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      // This would be implemented when backend is ready
      alert('Team member removal functionality will be implemented with backend integration');
      fetchData();
    } catch (error) {
      console.error('Error removing team member:', error);
      alert('Error removing team member');
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

  const getMembersForTeam = (teamId) => {
    return teamMembers.filter(member => member.teamId === teamId);
  };

  const getAvailableStudents = () => {
    // Get students who are not already team members
    const assignedStudentIds = teamMembers.map(member => member.teamMemberAccountId);
    return students.filter(student => !assignedStudentIds.includes(student.id));
  };

  const teamsWithMembers = teams.filter(team => getMembersForTeam(team.id).length > 0);
  const teamsWithoutMembers = teams.filter(team => getMembersForTeam(team.id).length === 0);

  const isStepComplete = teamsWithMembers.length > 0;

  return (
    <div className="step-page">
      <div className="step-header">
        <div className="step-title">
          <Users className="step-title-icon" />
          <div>
            <h2>Step 4: Add Team Members</h2>
            <p>Add students as team members to their respective teams</p>
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
        <div className="add-member-section">
          <h3>Add Team Member</h3>
          <div className="add-member-form">
            <div className="form-row">
              <div className="form-group">
                <label>Select Team:</label>
                <select 
                  value={selectedTeam} 
                  onChange={(e) => setSelectedTeam(e.target.value)}
                >
                  <option value="">Choose a team...</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.teamName} - {team.className}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Select Student:</label>
                <select 
                  value={selectedStudent} 
                  onChange={(e) => setSelectedStudent(e.target.value)}
                >
                  <option value="">Choose a student...</option>
                  {getAvailableStudents().map(student => (
                    <option key={student.id} value={student.id}>
                      {student.fullNameEn} - {student.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Member Description (Optional):</label>
              <textarea
                value={memberDescription}
                onChange={(e) => setMemberDescription(e.target.value)}
                placeholder="Enter member role or description..."
                rows={2}
              />
            </div>
            <button 
              className="add-button"
              onClick={handleAddMember}
              disabled={!selectedTeam || !selectedStudent}
            >
              <UserPlus className="button-icon" />
              Add Member
            </button>
          </div>
        </div>

        <div className="teams-members-overview">
          <div className="teams-with-members">
            <h3>Teams with Members</h3>
            {teamsWithMembers.length > 0 ? (
              <div className="teams-members-grid">
                {teamsWithMembers.map(team => (
                  <div key={team.id} className="team-members-card">
                    <div className="team-header">
                      <h4>{team.teamName}</h4>
                      <span className="member-count">
                        {getMembersForTeam(team.id).length} member(s)
                      </span>
                    </div>
                    <div className="members-list">
                      {getMembersForTeam(team.id).map(member => (
                        <div key={member.id} className="member-item">
                          <div className="member-info">
                            <span className="member-name">{getStudentName(member.teamMemberAccountId)}</span>
                            {member.teamMemberDescription && (
                              <span className="member-description">{member.teamMemberDescription}</span>
                            )}
                          </div>
                          <button 
                            className="remove-member-button"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="remove-icon" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <AlertCircle className="no-data-icon" />
                <p>No teams have members assigned yet.</p>
              </div>
            )}
          </div>

          <div className="teams-without-members">
            <h3>Teams without Members</h3>
            {teamsWithoutMembers.length > 0 ? (
              <div className="teams-grid">
                {teamsWithoutMembers.map(team => (
                  <div key={team.id} className="team-card needs-members">
                    <div className="team-header">
                      <h4>{team.teamName}</h4>
                      <span className="status-badge warning">Needs Members</span>
                    </div>
                    <div className="team-info">
                      <p><strong>Class:</strong> {team.className}</p>
                      <p><strong>Team Leader:</strong> {team.teamLeaderName || 'Not assigned'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <CheckCircle className="no-data-icon success" />
                <p>All teams have members assigned!</p>
              </div>
            )}
          </div>
        </div>

        <div className="step-instructions">
          <h4>Instructions:</h4>
          <ul>
            <li>Use the TeamMembers table to add students to teams</li>
            <li>Link students (TeamMemberAccountId) to their teams (TeamId)</li>
            <li>Add team member descriptions if needed</li>
            <li>Ensure all team members are from the same class</li>
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

export default Step4AddMembers;
