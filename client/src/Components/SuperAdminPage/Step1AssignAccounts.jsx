import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import './StepPages.css';

const Step1AssignAccounts = ({ onNext, onPrev, currentStep }) => {
  const [engineers, setEngineers] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [engineersRes, reviewersRes, classesRes, assignmentsRes] = await Promise.all([
        axios.get('/api/Account/ByType/5'), // Engineers
        axios.get('/api/Account/ByType/6'), // Reviewers
        axios.get('/api/Class'),
        axios.get('/api/Teams/Debug/ReviewerSupervisorExtensions')
      ]);

      setEngineers(Array.isArray(engineersRes.data) ? engineersRes.data : []);
      setReviewers(Array.isArray(reviewersRes.data) ? reviewersRes.data : []);
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
      setAssignments(Array.isArray(assignmentsRes.data?.extensions) ? assignmentsRes.data.extensions : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignEngineer = async () => {
    if (!selectedEngineer || !selectedClass) {
      alert('Please select both engineer and class');
      return;
    }

    try {
      // This would be implemented when backend is ready
      alert('Engineer assignment functionality will be implemented with backend integration');
      setSelectedEngineer('');
      setSelectedClass('');
      fetchData();
    } catch (error) {
      console.error('Error assigning engineer:', error);
      alert('Error assigning engineer to class');
    }
  };

  const handleAssignReviewer = async () => {
    if (!selectedReviewer || !selectedClass) {
      alert('Please select both reviewer and class');
      return;
    }

    try {
      // This would be implemented when backend is ready
      alert('Reviewer assignment functionality will be implemented with backend integration');
      setSelectedReviewer('');
      setSelectedClass('');
      fetchData();
    } catch (error) {
      console.error('Error assigning reviewer:', error);
      alert('Error assigning reviewer to class');
    }
  };

  const getClassName = (classId) => {
    const classObj = classes.find(c => c.id === classId);
    return classObj ? classObj.className : 'Unknown Class';
  };

  const getAccountName = (accountId) => {
    const assignment = assignments.find(a => a.accountId === accountId);
    return assignment ? assignment.accountName : 'Unknown Account';
  };

  const getAccountRole = (accountId) => {
    const assignment = assignments.find(a => a.accountId === accountId);
    if (assignment) {
      return assignment.accountRoleId === 5 ? 'Engineer' : 'Reviewer';
    }
    return 'Unknown';
  };

  const isStepComplete = assignments.length > 0;

  return (
    <div className="step-page">
      <div className="step-header">
        <div className="step-title">
          <Users className="step-title-icon" />
          <div>
            <h2>Step 1: Assign Engineers & Reviewers to Classes</h2>
            <p>Assign engineers and reviewers to specific classes using the ReviewerSupervisorExtension table</p>
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
        <div className="assignment-forms">
          <div className="assignment-form">
            <h3>Assign Engineer to Class</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Select Engineer:</label>
                <select 
                  value={selectedEngineer} 
                  onChange={(e) => setSelectedEngineer(e.target.value)}
                >
                  <option value="">Choose an engineer...</option>
                  {engineers.map(engineer => (
                    <option key={engineer.id} value={engineer.id}>
                      {engineer.fullNameEn} - {engineer.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Select Class:</label>
                <select 
                  value={selectedClass} 
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">Choose a class...</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.className} ({cls.gradeName})
                    </option>
                  ))}
                </select>
              </div>
              <button 
                className="assign-button"
                onClick={handleAssignEngineer}
                disabled={!selectedEngineer || !selectedClass}
              >
                <Plus className="button-icon" />
                Assign Engineer
              </button>
            </div>
          </div>

       
        </div>

        <div className="assignments-overview">
          <h3>Current Assignments</h3>
          {loading ? (
            <div className="loading">Loading assignments...</div>
          ) : assignments.length > 0 ? (
            <div className="assignments-grid">
              {assignments.map(assignment => (
                <div key={assignment.accountId} className="assignment-card">
                  <div className="assignment-info">
                    <h4>{getAccountName(assignment.accountId)}</h4>
                    <span className={`role-badge ${getAccountRole(assignment.accountId).toLowerCase()}`}>
                      {getAccountRole(assignment.accountId)}
                    </span>
                    <p>Assigned to: {getClassName(assignment.assignedClassId)}</p>
                  </div>
                  <button className="remove-button">
                    <Trash2 className="remove-icon" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-assignments">
              <AlertCircle className="no-data-icon" />
              <p>No assignments found. Please assign engineers and reviewers to classes.</p>
            </div>
          )}
        </div>
      </div>

      <div className="step-navigation">
        <button className="nav-button prev" onClick={onPrev} disabled={currentStep === 1}>
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

export default Step1AssignAccounts;
