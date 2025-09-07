import { useState, useEffect } from "react";
import axios from "axios";
import { useNotification } from "../../contexts/NotificationContext";
import { format, parseISO } from "date-fns";
import { AlertTriangle, Clock, CheckCircle, Upload, X } from "lucide-react";
import { STATUS_CONSTANTS, StatusHelpers } from "../../utils/statusConstants";
import "./PhasesPage.css";

const PhasesPage = ({ setCurrentPage, setSelectedTask, currentUserId = null, user = null }) => {
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotification();

  // Use the passed currentUserId or fall back to user.id
  const effectiveUserId = currentUserId || user?.id;
  const API_BASE_URL = "http://localhost:5048/api/AccountTask";

  // Function to format UTC dates to Cairo timezone
  const formatCairoDate = (dateString) => {
    if (!dateString) return "No deadline"
    
    try {
      // Parse the UTC date string
      const utcDate = parseISO(dateString)
      
      // Use browser's timezone conversion for Cairo time
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

  const getStatusBgColor = (status) => {
    const color = getStatusColor(status);
    return color + '20'; // Add 20% opacity
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

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Fetch tasks for the user's grade - use same endpoint as PhasesSection
      const tasksResponse = await axios.get(`http://localhost:5048/api/AccountTask/StudentTasks/${effectiveUserId}`);
      const tasksArray = tasksResponse.data.$values || tasksResponse.data || [];
      
      // Fetch submissions for the user's team - use same endpoint as PhasesSection
      const submissionsResponse = await axios.get('http://localhost:5048/api/TaskSubmissions');
      const submissionsArray = submissionsResponse.data.$values || submissionsResponse.data || [];
      
      // Get user's team information - use same endpoint as PhasesSection
      const teamMembersResponse = await axios.get('http://localhost:5048/api/TeamMembers');
      const teamMembersArray = teamMembersResponse.data.$values || teamMembersResponse.data || [];
      const userTeamMember = teamMembersArray.find(tm => tm.teamMemberAccountId === effectiveUserId);
      
      let userTeamId = null;
      if (userTeamMember && userTeamMember.teamId) {
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
        
        console.log(`Final status for task ${task.id}: ${status}`);
        
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
          submission: submission
        };
      });
      
      console.log("PhasesPage - Formatted tasks:", formatted);

      setTasks(formatted);
      setSubmissions(submissionsArray);
      setUserTeam(userTeamMember);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      showError("Failed to load tasks");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [effectiveUserId]);

  const handleDetailsClick = (task) => {
    console.log("PhasesPage - handleDetailsClick called with task:", task);
    
    // Create the task data object that TaskDetailsPage expects
    const taskData = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      deadline: task.deadline || task.taskDeadline,
      gradeId: task.gradeId,
      adminAccountId: task.adminAccountId,
      // Include the raw data for additional information
      raw: task,
      studentTaskData: task.studentTaskData,
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
    console.log("PhasesPage - Complete task data for details:", taskData);
    console.log("PhasesPage - Setting selectedTask with ID:", taskData.id, "Title:", taskData.title);
    console.log("PhasesPage - About to call setSelectedTask...");
    setSelectedTask(taskData); 
    console.log("PhasesPage - setSelectedTask called successfully");
    console.log("PhasesPage - Navigating to task-details page");
    
    // Navigate to task details page (same as PhasesSection)
    console.log("PhasesPage - Navigating to task-details page");
    setCurrentPage("task-details");
  };

  if (loading) return (
    <div className="phases-page">
      <div className="phases-page-header">
        <h1 className="phases-page-title">My Project Tasks</h1>
      </div>
      <div className="loading-container">
        <p>Loading your tasks...</p>
      </div>
    </div>
  );

  return (
    <div className="phases-page">
      <div className="phases-page-header">
        <h1 className="phases-page-title">My Project Tasks</h1>
        {userTeam && (
          <div className="team-info">
            <span className="team-name">Team: {userTeam.teamName}</span>
          </div>
        )}
      </div>

      <div className="phases-list">
        {tasks.length === 0 ? (
          <div className="no-tasks">
            <p>No tasks found for your grade.</p>
            <p>Tasks will appear here once they are assigned to your grade level.</p>
          </div>
        ) : (
          tasks.map((task) => {
            // Use server-provided isLate, but fallback to client-side check if server is wrong
            const timeRemaining = getTimeRemaining(task.deadline);
            const isClientLate = timeRemaining === null; // If timeRemaining is null, deadline has passed
            const isLate = task.isLate || isClientLate; // Use server value or client fallback
            const showRedBorder = task.isPendingTask && isLate; // Only show red border for unsubmitted overdue tasks
            
            return (
              <div key={task.id} className={`phase-item ${showRedBorder ? 'deadline-passed' : ''}`}>
                <div className="phase-content">
                  <div className="phase-info">
                    <h3 className="phase-item-title">{task.title}</h3>
                    <p className="phase-item-description">{task.description}</p>
                    
                    <div className="status-row">
                      <div
                        className="phase-item-status"
                        style={{
                          color: getStatusColor(task.status),
                          backgroundColor: getStatusBgColor(task.status),
                        }}
                      >
                        {getStatusIcon(task.status)} {task.status}
                      </div>
                    </div>
                    
                    {task.deadline && (
                      <div className="phase-item-deadline">
                        Deadline: {formatCairoDate(task.deadline)}
                      </div>
                    )}
                  </div>
                  <button
                    className="phase-details-button"
                    onClick={() => handleDetailsClick(task)}
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PhasesPage;

// Note: This component now receives dynamic user data from the Dashboard
// No more hardcoded fallback values, uses currentUserId prop instead
