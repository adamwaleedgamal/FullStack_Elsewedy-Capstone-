import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNotification } from "../../contexts/NotificationContext";
import { format, parseISO } from "date-fns";
import { AlertTriangle, Clock, CheckCircle, Upload, X } from "lucide-react";
import { STATUS_CONSTANTS, StatusHelpers } from "../../utils/statusConstants";
import "./PhasesSection.css";

const PhasesSection = ({ setCurrentPage, setSelectedPhase, currentStudentId }) => {
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotification();

  // Function to format UTC dates to Cairo timezone
  const formatCairoDate = (dateString) => {
    if (!dateString) return "No deadline"
    
    try {
      // Parse the UTC date string
      const utcDate = parseISO(dateString)
      
      // Use browser's timezone conversion for Cairo time (same as PhasesPage)
      const cairoTime = new Date(utcDate.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
      
      // Format using date-fns with clear AM/PM display
      return format(cairoTime, "MMM dd, yyyy, hh:mm a")
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  // SECURITY: Deadline checking is now handled by the server
  // Client-side deadline checking can be manipulated by users
  // Always rely on server-side validation for security

  // Function to get time remaining until deadline
  const getTimeRemaining = (deadlineString) => {
    if (!deadlineString) return null
    
    try {
      const utcDate = parseISO(deadlineString)
      const cairoDeadline = new Date(utcDate.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
      const now = new Date()
      const diff = cairoDeadline - now
      
      if (diff <= 0) return null // Deadline has passed
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`
      if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`
      return "Less than 1 minute remaining"
    } catch (error) {
      console.error("Error calculating time remaining:", error)
      return null
    }
  }

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        console.log(`Fetching tasks for student ${currentStudentId}...`);
        
        // Fetch tasks
        const tasksResponse = await axios.get(`http://localhost:5048/api/AccountTask/StudentTasks/${currentStudentId}`);
        console.log("Tasks response:", tasksResponse.data);
        
        const tasksArray = tasksResponse.data.$values || tasksResponse.data || [];
        console.log("PhasesSection - Raw tasks array:", tasksArray);

        // Fetch task submissions to determine status
        const submissionsResponse = await axios.get('http://localhost:5048/api/TaskSubmissions');
        const submissionsArray = submissionsResponse.data.$values || submissionsResponse.data || [];
        console.log("Task submissions:", submissionsArray);

        // Get user's team
        const teamMembersResponse = await axios.get('http://localhost:5048/api/TeamMembers');
        const teamMembersArray = teamMembersResponse.data.$values || teamMembersResponse.data || [];
        const userTeamMember = teamMembersArray.find(tm => tm.teamMemberAccountId === currentStudentId);
        
        let userTeamId = null;
        if (userTeamMember) {
          userTeamId = userTeamMember.teamId;
        }

        const formatted = tasksArray.map(task => {
          // Find submission for this task by user's team
          const submission = userTeamId ? 
            submissionsArray.find(s => s.taskId === task.id && s.teamId === userTeamId) : 
            null;

          // Determine status based on submission and deadline using StatusHelpers
          let status = "Pending"; // Default status
          let statusId = STATUS_CONSTANTS.TASK_PENDING;
          let isPendingTask = false;
          
          if (submission) {
            statusId = submission.statusId;
            status = StatusHelpers.getStatusText(submission.statusId, task.taskDeadline, false, task.isLate);
          } else {
            // No submission exists - use server-provided isLate or client-side check
            isPendingTask = true;
            const clientLate = getTimeRemaining(task.taskDeadline) === null;
            const effectiveIsLate = task.isLate || clientLate;
            status = StatusHelpers.getStatusText(STATUS_CONSTANTS.TASK_PENDING, task.taskDeadline, true, effectiveIsLate);
          }

          return {
            id: task.id,
            title: task.taskName || "Untitled Task",
            description: task.taskDescription || "No description available",
            status: status,
            statusId: statusId,
            isPendingTask: isPendingTask,
            isLate: task.isLate || false, // Include isLate from server
            deadline: task.taskDeadline,
            deadlineFormatted: task.taskDeadline ? formatCairoDate(task.taskDeadline) : "No deadline",
            gradeId: task.gradeId,
            adminAccountId: task.adminAccountId,
            submission: submission // Include submission data for reference
          };
        });
        
        console.log("PhasesSection - Formatted tasks:", formatted);

        setPhases(formatted);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        showError("Failed to load tasks");
        setLoading(false);
      }
    };

    fetchTasks();
  }, [currentStudentId]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "#38a169"
      case "Completed Late":
        return "#d69e2e"
      case "Submitted":
        return "#3182ce"
      case "Submitted On Time":
        return "#3182ce"
      case "Submitted Late":
        return "#e53e3e"
      case "Rejected":
        return "#e53e3e"
      case "Pending":
        return "#d69e2e"
      case "Late":
        return "#e53e3e"
      case "Deadline Passed":
        return "#e53e3e"
      default:
        return "#718096"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <CheckCircle size={16} />
      case "Completed Late":
        return <CheckCircle size={16} />
      case "Submitted":
        return <Upload size={16} />
      case "Submitted On Time":
        return <Upload size={16} />
      case "Submitted Late":
        return <Upload size={16} />
      case "Rejected":
        return <X size={16} />
      case "Pending":
        return <Clock size={16} />
      case "Late":
        return <AlertTriangle size={16} />
      case "Deadline Passed":
        return <AlertTriangle size={16} />
      default:
        return <AlertCircle size={16} />
    }
  }

  const truncateDescription = (description, maxLength = 80) => {
    if (!description) return "";
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + "...";
  };

  const handleTaskClick = (task) => {
    console.log("Task clicked:", task);
    // Ensure we have the correct data structure
    const taskData = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      deadline: task.deadline,
      gradeId: task.gradeId,
      adminAccountId: task.adminAccountId,
      // Add any missing properties that TaskDetailsPage expects
      taskName: task.title,
      taskDescription: task.description,
      statusId: task.status === "Pending" ? STATUS_CONSTANTS.TASK_PENDING : task.status === "Submitted" ? STATUS_CONSTANTS.TASK_IN_PROGRESS : STATUS_CONSTANTS.TASK_SUBMITTED_ON_TIME, // Completed
      taskDeadline: task.deadline,
      // Include submission data with feedback
      submission: task.submission ? {
        id: task.submission.id,
        taskId: task.submission.taskId,
        teamId: task.submission.teamId,
        teamLeaderId: task.submission.teamLeaderId,
        glink: task.submission.glink,
        note: task.submission.note,
        feedback: task.submission.feedback,
        statusId: task.submission.statusId,
        submittedDate: task.submission.submittedDate,
        createdAt: task.submission.createdAt,
        updatedAt: task.submission.updatedAt
      } : null
    };
    console.log("Formatted task data:", taskData);
    setSelectedPhase(taskData);
    setCurrentPage("task-details");
  };

  if (loading) {
    return (
      <div className="phases-section">
        <div className="phases-header">
          <h2>My Tasks</h2>
        </div>
        <div className="loading">Loading tasks...</div>
      </div>
    );
  }



  return (
    <div className="phases-section">
      <div className="phases-header">
        <h2>My Tasks</h2>
      </div>
      <div className="phases-grid">
        {phases.map((phase) => {
          // Use server-provided isLate, but fallback to client-side check if server is wrong
          const timeRemaining = getTimeRemaining(phase.deadline);
          const isClientLate = timeRemaining === null; // If timeRemaining is null, deadline has passed
          const isLate = phase.isLate || isClientLate; // Use server value or client fallback
          const showRedBorder = phase.isPendingTask && isLate; // Only show red border for unsubmitted overdue tasks
          
          return (
            <div
              key={phase.id}
              className={`phase-card ${showRedBorder ? 'deadline-passed' : ''}`}
            >
              <div className="phase-header">
                <h3 className="phase-title">{phase.title}</h3>
                <span
                  className="phase-status"
                  style={{ 
                    color: getStatusColor(phase.status),
                    backgroundColor: getStatusColor(phase.status) + '20' // 20% opacity
                  }}
                >
                  {getStatusIcon(phase.status)} {phase.status}
                </span>
              </div>
              
              <p className="phase-description">{truncateDescription(phase.description, 80)}</p>
              <div className="phase-footer">
                <span className="phase-deadline">Deadline: {phase.deadlineFormatted}</span>
                <button 
                  className="phase-details-btn"
                  onClick={() => handleTaskClick(phase)}
                >
                  {phase.isPendingTask ? "Submit" : "Details"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhasesSection

// Note: This component now receives dynamic user data from the Dashboard
// No more hardcoded default values, uses currentStudentId prop instead;
