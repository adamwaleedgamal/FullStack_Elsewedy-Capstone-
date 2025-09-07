import React, { useState } from 'react';
import { Users, UserPlus, Building, CheckCircle, ArrowRight, Info, AlertCircle, Clock } from 'lucide-react';
import Step1AssignAccounts from './Step1AssignAccounts';
import Step2CreateTeams from './Step2CreateTeams';
import Step3AssignLeaders from './Step3AssignLeaders';
import Step4AddMembers from './Step4AddMembers';
import Step5CreateProjects from './Step5CreateProjects';
import './SuperAdminPage.css';

const SuperAdminPage = ({ user }) => {
  const [activeTab, setActiveTab] = useState('team-creation');
  const [currentStep, setCurrentStep] = useState(1);
  const [isWorkflowComplete, setIsWorkflowComplete] = useState(false);

  const teamCreationSteps = [
    {
      id: 1,
      title: "Assign Engineers & Reviewers to Classes",
      description: "First, assign engineers and reviewers to specific classes using the ReviewerSupervisorExtension table.",
      details: [
        "Navigate to the Account Management section",
        "Select engineers (Role ID: 5) and reviewers (Role ID: 6) from the accounts table",
        "Assign them to classes from the TblClass table",
        "This creates the foundation for team supervision"
      ],
      icon: <Users className="step-icon" />,
      status: "pending"
    },
    {
      id: 2,
      title: "Create Teams",
      description: "Create teams and assign them to the classes where engineers/reviewers are assigned.",
      details: [
        "Use the Teams table to create new teams",
        "Assign each team to a specific class (ClassId)",
        "Set team names and basic information",
        "Ensure teams are linked to classes with assigned supervisors"
      ],
      icon: <UserPlus className="step-icon" />,
      status: "pending"
    },
    {
      id: 3,
      title: "Assign Team Leaders",
      description: "Select and assign team leaders from the student accounts.",
      details: [
        "Choose team leaders from student accounts (Role ID: 1)",
        "Update the Teams table with TeamLeaderAccountId",
        "Ensure team leaders are from the same class as the team",
        "Verify team leader assignments in the database"
      ],
      icon: <CheckCircle className="step-icon" />,
      status: "pending"
    },
    {
      id: 4,
      title: "Add Team Members",
      description: "Add students as team members to their respective teams.",
      details: [
        "Use the TeamMembers table to add students to teams",
        "Link students (TeamMemberAccountId) to their teams (TeamId)",
        "Add team member descriptions if needed",
        "Ensure all team members are from the same class"
      ],
      icon: <Building className="step-icon" />,
      status: "pending"
    },
    {
      id: 5,
      title: "Create Projects",
      description: "Create projects and assign them to teams with proper supervision.",
      details: [
        "Use the Projects table to create new projects",
        "Assign projects to teams (TeamId)",
        "Set project names, descriptions, and timelines",
        "Link projects to the supervising engineers/reviewers"
      ],
      icon: <Building className="step-icon" />,
      status: "pending"
    },
  ];

  const getStepStatus = (stepId) => {
    if (stepId < currentStep) return "completed";
    if (stepId === currentStep) return "current";
    return "pending";
  };

  const nextStep = () => {
    if (currentStep < teamCreationSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleWorkflowComplete = () => {
    setIsWorkflowComplete(true);
  };

  const resetWorkflow = () => {
    setCurrentStep(1);
    setIsWorkflowComplete(false);
  };

  return (
    <div className="super-admin-page">
      <div className="super-admin-header">
        <h1>Super Admin Dashboard</h1>
        <p>Step-by-step guide for team and project creation</p>
      </div>

      {activeTab === 'team-creation' && (
        <div className="steps-overview">
          <h3>Workflow Steps</h3>
          <div className="steps-mini">
            {teamCreationSteps.map((step) => (
              <button
                key={step.id}
                className={`step-mini ${getStepStatus(step.id)} ${currentStep === step.id ? 'active' : ''}`}
                onClick={() => setCurrentStep(step.id)}
              >
                <div className="step-mini-icon">
                  {step.icon}
                </div>
                <span className="step-mini-title">Step {step.id}</span>
                <span className="step-mini-name">{step.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

       <div className="super-admin-content">
         {activeTab === 'team-creation' && (
           <div className="workflow-section">
             {isWorkflowComplete ? (
               <div className="workflow-success">
                 <div className="success-header">
                   <CheckCircle className="success-icon" />
                   <h2>Team Creation Completed Successfully!</h2>
                   <p>Your team has been created and is ready for use. All steps have been completed successfully.</p>
                 </div>
                 
                 <div className="success-summary">
                   <h3>What was accomplished:</h3>
                   <ul>
                     <li>✅ Engineers and reviewers assigned to classes</li>
                     <li>✅ Teams created and linked to classes</li>
                     <li>✅ Team leaders assigned from student accounts</li>
                     <li>✅ Team members added to their respective teams</li>
                     <li>✅ Projects created and assigned to teams</li>
                   </ul>
                 </div>

                 <div className="success-actions">
                   <button className="reset-button" onClick={resetWorkflow}>
                     Create Another Team
                   </button>
                   <button className="dashboard-button" onClick={() => window.location.reload()}>
                     Go to Dashboard
                   </button>
                 </div>
               </div>
             ) : (
               <>
                 {currentStep === 1 && (
                   <Step1AssignAccounts 
                     onNext={() => setCurrentStep(2)} 
                     onPrev={() => setCurrentStep(1)} 
                     currentStep={currentStep} 
                   />
                 )}
                 {currentStep === 2 && (
                   <Step2CreateTeams 
                     onNext={() => setCurrentStep(3)} 
                     onPrev={() => setCurrentStep(1)} 
                     currentStep={currentStep} 
                   />
                 )}
                 {currentStep === 3 && (
                   <Step3AssignLeaders 
                     onNext={() => setCurrentStep(4)} 
                     onPrev={() => setCurrentStep(2)} 
                     currentStep={currentStep} 
                   />
                 )}
                 {currentStep === 4 && (
                   <Step4AddMembers 
                     onNext={() => setCurrentStep(5)} 
                     onPrev={() => setCurrentStep(3)} 
                     currentStep={currentStep} 
                   />
                 )}
                 {currentStep === 5 && (
                   <Step5CreateProjects 
                     onNext={handleWorkflowComplete} 
                     onPrev={() => setCurrentStep(4)} 
                     currentStep={currentStep} 
                   />
                 )}
               </>
             )}
           </div>
         )}

        {activeTab === 'project-creation' && (
          <div className="workflow-section">
            <div className="workflow-header">
              <h2>Project Creation Workflow</h2>
              <p>Coming Soon - Project creation steps will be available after team setup is complete</p>
            </div>
            <div className="coming-soon">
              <Building className="coming-soon-icon" />
              <h3>Project Creation Feature</h3>
              <p>This feature will be available soon. You'll be able to create projects, assign supervisors, and manage project timelines.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminPage;
