"use client"

import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Clock,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Github,
  X,
  Upload,
  StickyNote,
  MessageSquare,
} from "lucide-react"
import { showError, showSuccess, showWarning } from "../../utils/toast"
import { format, parseISO, addHours } from "date-fns"
import { STATUS_CONSTANTS, StatusHelpers } from "../../utils/statusConstants"
import "./TaskDetailsPage.css"

const TaskDetailsPage = ({ setCurrentPage, selectedTask, task, phase, previousPage, currentUserId, user }) => {
  // currentUserId: The ID of the currently logged-in user (passed from Dashboard)
  // user: The full user object with all user information (passed from Dashboard)
  const [remainingTime, setRemainingTime] = useState("")
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [githubLink, setGithubLink] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [userTeam, setUserTeam] = useState(null)
  const [isTeamLeader, setIsTeamLeader] = useState(false)
  const [studentGradeId, setStudentGradeId] = useState(null)

  // Use local state to track the current task data
  const [localTaskData, setLocalTaskData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Fetch task data from server to get latest isLate status
  useEffect(() => {
    const fetchTaskData = async () => {
      const newTaskData = selectedTask || task || phase;
      if (!newTaskData?.id) return;
      
      setLoading(true);
      try {
        // Fetch latest task data from server to get isLate status
        const response = await fetch(`http://localhost:5048/api/AccountTask/StudentTasks/${currentUserId}`);
        const data = await response.json();
        const tasksArray = data.$values || data || [];
        const serverTask = tasksArray.find(t => t.id === newTaskData.id);
        
        if (serverTask) {
          // Merge server data with existing data
          const mergedTaskData = {
            ...newTaskData,
            isLate: serverTask.isLate || false,
            taskDeadline: serverTask.taskDeadline || newTaskData.taskDeadline || newTaskData.deadline
          };
          console.log("TaskDetailsPage - Merged task data with server isLate:", mergedTaskData);
          setLocalTaskData(mergedTaskData);
        } else {
          setLocalTaskData(newTaskData);
        }
      } catch (error) {
        console.error("Error fetching task data:", error);
        setLocalTaskData(newTaskData);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTaskData();
  }, [selectedTask, task, phase, currentUserId]);
  
  // Use localTaskData as the main data source
  const taskData = localTaskData;
  
  // Debug logging to see which data source is being used
  useEffect(() => {
    console.log("TaskDetailsPage - Current taskData:", taskData);
    console.log("TaskDetailsPage - taskData.id:", taskData?.id);
    console.log("TaskDetailsPage - taskData.title:", taskData?.title);
    console.log("TaskDetailsPage - taskData.isLate:", taskData?.isLate);
  }, [taskData]);

  // Reset form fields when task changes
  useEffect(() => {
    if (taskData) {
      console.log("TaskDetailsPage - Task changed, resetting form fields");
      setGithubLink("")
      setNotes("")
      setRemainingTime("")
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    }
  }, [taskData]);

  // Force re-render when props change by using a key
  const taskKey = selectedTask?.id || task?.id || phase?.id || 'default';

  // Additional effect to monitor prop changes
  useEffect(() => {
    console.log("TaskDetailsPage - Props monitoring:");
    console.log("  selectedTask?.id:", selectedTask?.id);
    console.log("  task?.id:", task?.id);
    console.log("  phase?.id:", phase?.id);
    console.log("  localTaskData?.id:", localTaskData?.id);
  }, [selectedTask?.id, task?.id, phase?.id, localTaskData?.id]);



  // Function to format UTC dates to Cairo timezone
  const formatCairoDate = (dateString) => {
    if (!dateString) return "No deadline"
    
    try {
      // Parse the UTC date string
      const utcDate = parseISO(dateString)
      
      // Create a new date object and set it to Cairo timezone
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

  // Function to get current status based on server status (like PhasesSection)
  const getCurrentStatus = (taskData) => {
    if (!taskData) return "Unknown"
    
    console.log("getCurrentStatus - Input taskData:", taskData);
    console.log("getCurrentStatus - taskData.deadline:", taskData.deadline);
    console.log("taskData.taskDeadline:", taskData.taskDeadline);
    console.log("taskData.submission:", taskData.submission);
    console.log("taskData.isLate:", taskData.isLate);
    
    // If task has submission, use StatusHelpers with server-provided isLate
    if (taskData.submission) {
      console.log("getCurrentStatus - Task has submission, statusId:", taskData.submission.statusId);
      const statusText = StatusHelpers.getStatusText(
        taskData.submission.statusId, 
        taskData.deadline || taskData.taskDeadline, 
        false,
        taskData.isLate // Use server-provided isLate
      );
      console.log("getCurrentStatus - Status text from StatusHelpers:", statusText);
      return statusText;
    } else {
      // No submission exists - use StatusHelpers with isPendingTask = true
      // Use server-provided isLate or client-side fallback
      console.log("getCurrentStatus - No submission, using StatusHelpers");
      const statusText = StatusHelpers.getStatusText(
        STATUS_CONSTANTS.TASK_PENDING,
        taskData.deadline || taskData.taskDeadline, 
        true,
        taskData.isLate // Use server-provided isLate
      );
      console.log("getCurrentStatus - Status text from StatusHelpers:", statusText);
      return statusText;
    }
  }

  // Determine where to go back based on previous page
  const getBackDestination = () => {
    if (previousPage === "phases" || previousPage === "phase-details") {
      return "phases"
    } else {
      return "dashboard"
    }
  }

  const getBackButtonText = () => {
    if (previousPage === "phases" || previousPage === "phase-details") {
      return "Back to Tasks"
    } else {
      return "Back to Dashboard"
    }
  }

  const backDestination = getBackDestination()
  const backButtonText = getBackButtonText()

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

  const getStatusText = (statusId, deadline = null, isPendingTask = false, isLateFromServer = null) => {
    const statusText = StatusHelpers.getStatusText(statusId, deadline, isPendingTask, isLateFromServer);
    return `Task ${statusText}`;
  }

  const handleSubmit = async () => {
    if (!githubLink.trim()) {
      showWarning("Please enter a GitHub link")
      return
    }

    if (!isTeamLeader) {
      showError("Only team leaders can submit tasks.")
      return
    }

    if (!currentUser?.id) {
      showError("Current user not loaded. Please try again.")
      return
    }

    // Lazy-load team if missing
    let effectiveTeam = userTeam
    if (!effectiveTeam?.id) {
      try {
        const byLeaderResp = await fetch(`http://localhost:5048/api/Teams/ByLeader/${currentUser.id}`)
        if (byLeaderResp.ok) {
          effectiveTeam = await byLeaderResp.json()
          setUserTeam(effectiveTeam)
        }
      } catch (_) {}
    }

    if (!effectiveTeam?.id) {
      showError("Team information not found. Ensure you're a team leader in a team.")
      return
    }

    if (!taskData?.id) {
      showError("Task information is missing.")
      return
    }

    setIsSubmitting(true)

    try {
      // Derive grade id; lazily fetch from dashboard if still missing
      let effectiveGradeId = taskData.gradeId ?? studentGradeId
      if (!effectiveGradeId) {
        try {
          const dashResp = await fetch(`http://localhost:5048/api/Dashboard/Student/${currentUser.id}`)
          if (dashResp.ok) {
            const dash = await dashResp.json()
            effectiveGradeId = dash?.studentExtension?.gradeId ?? effectiveGradeId
            if (!studentGradeId && effectiveGradeId) setStudentGradeId(effectiveGradeId)
          }
        } catch (_) {}
      }
      if (!effectiveGradeId) {
        showError("Cannot determine grade for submission. Please contact your supervisor.")
        return
      }

      // Check if this is a resubmission (existing submission)
      const isResubmission = taskData.submission && taskData.submission.id
      console.log("Resubmission check:", { isResubmission, submissionId: taskData.submission?.id })

      // SECURITY: Status determination is now handled by the server
      // The server will calculate isLate based on current time and set appropriate status
      let statusId = STATUS_CONSTANTS.TASK_SUBMITTED_ON_TIME; // Default: Submitted
      // Note: Server will determine the correct status based on UTC time

      const payload = {
        taskSubmissionId: isResubmission ? taskData.submission.id : 0,
        teamId: effectiveTeam.id,
        teamLeaderId: currentUser.id,
        gradeId: effectiveGradeId,
        taskId: taskData.id ?? taskData.Id,
        glink: githubLink.trim(),
        note: notes.trim() || null,
        statusId: statusId, // Submitted or Submitted Late based on deadline
      }

      console.log("Making request:", {
        url: `http://localhost:5048/api/TaskSubmissions`,
        method: "POST",
        payload,
      })

      const response = await fetch(`http://localhost:5048/api/TaskSubmissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        // SECURITY: Use server-provided isLate instead of client-side deadline checking
        const responseData = await response.json();
        const isLate = responseData.isLate || false;
        const message = isResubmission 
          ? (isLate ? "Task resubmitted late!" : "Task resubmitted successfully!")
          : (isLate ? "Task submitted late!" : "Task submitted successfully!");
        
        showSuccess(message)
        setShowSubmitModal(false)
        setGithubLink("")
        setNotes("")

        // Update the local task data with new submission info
        if (taskData && isResubmission) {
          // SECURITY: Use server-provided isLate instead of client-side deadline checking
          taskData.status = isLate ? "Submitted Late" : "Submitted"
          taskData.submission = {
            ...taskData.submission,
            glink: githubLink.trim(),
            note: notes.trim() || null,
            statusId: isLate ? STATUS_CONSTANTS.TASK_SUBMITTED_LATE : STATUS_CONSTANTS.TASK_SUBMITTED_ON_TIME,
    
          }
        }

        // Refresh the page to show updated data
        window.location.reload()
      } else {
        const errText = await response.text()
        showError(`Submission failed: ${errText || response.status}`)
      }
    } catch (error) {
      showError("Error submitting. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModalClose = () => {
    setShowSubmitModal(false)
    setGithubLink("")
    setNotes("")
  }

  // Countdown timer effect
  useEffect(() => {
    if (taskData && (taskData.deadline || taskData.taskDeadline)) {
      const deadlineString = taskData.deadline || taskData.taskDeadline;
      
      try {
        // Parse the UTC date string and convert to Cairo timezone for countdown calculation
        const utcDate = parseISO(deadlineString);
        // Create a new date object and set it to Cairo timezone
        const cairoDeadline = new Date(utcDate.toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
        
        const interval = setInterval(() => {
          const now = new Date();
          const diff = cairoDeadline - now;

          if (diff <= 0) {
            setRemainingTime("Deadline Passed");
            setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            clearInterval(interval);
            return;
          }

          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          setCountdown({ days, hours, minutes, seconds });

          if (days > 0) {
            setRemainingTime(`${days} days, ${hours} hours remaining`);
          } else if (hours > 0) {
            setRemainingTime(`${hours} hours, ${minutes} minutes remaining`);
          } else if (minutes > 0) {
            setRemainingTime(`${minutes} minutes, ${seconds} seconds remaining`);
          } else {
            setRemainingTime(`${seconds} seconds remaining`);
          }
        }, 1000);

        return () => clearInterval(interval);
      } catch (error) {
        console.error("Error processing deadline for countdown:", error);
        setRemainingTime("Error calculating deadline");
      }
    }
  }, [taskData])

  // Pre-fill form with existing submission data for resubmission
  useEffect(() => {
    if (taskData?.submission && taskData.status === "Rejected") {
      setGithubLink(taskData.submission.glink || "")
      setNotes(taskData.submission.note || "")
    }
  }, [taskData])

  // Fetch current user and team information
  useEffect(() => {
    const fetchUserAndTeamInfo = async () => {
      try {
        // Use the currentUserId prop passed from parent component (no more hardcoded ID = 9)
        if (!currentUserId) {
          console.error("No currentUserId provided to TaskDetailsPage")
          return
        }

        console.log("TaskDetailsPage - Fetching user info for ID:", currentUserId)

        // Fetch current user information using the dynamic currentUserId
        const userResponse = await fetch(`http://localhost:5048/api/Account/${currentUserId}`)
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setCurrentUser(userData)
          console.log("TaskDetailsPage - User data loaded:", userData)
        } else {
          console.error("Failed to fetch user data:", userResponse.status)
        }

        // Check if user is a team leader
        const studentExtensionResponse = await fetch(`http://localhost:5048/api/StudentExtensions/${currentUserId}`)
        if (studentExtensionResponse.ok) {
          const studentExtensionData = await studentExtensionResponse.json()
          const isLeader = studentExtensionData.isLeader || false
          setIsTeamLeader(isLeader)

          // Derive student's grade from class info if available
          try {
            const derivedGradeId = studentExtensionData?.class?.gradeId ?? null
            if (derivedGradeId) setStudentGradeId(derivedGradeId)
          } catch (_) {}

          // If user is a leader, find their team
          if (isLeader) {
            try {
              const byLeaderResp = await fetch(`http://localhost:5048/api/Teams/ByLeader/${currentUserId}`)
              if (byLeaderResp.ok) {
                const team = await byLeaderResp.json()
                setUserTeam(team)
              }
            } catch (err) {
              console.error("Error while discovering user's team:", err)
            }
          }
        } else {
          setIsTeamLeader(false)
        }
      } catch (error) {
        console.error("Error fetching user and team info:", error)
        setIsTeamLeader(false)
      }
    }

    fetchUserAndTeamInfo()
  }, [currentUserId])

  if (!taskData) {
    return (
      <div className="task-details-page">
        <div className="task-details-header">
          <button className="back-button" onClick={() => setCurrentPage("dashboard")}>
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
        </div>
        <div className="task-details-content">
          <p>No task selected</p>
        </div>
      </div>
    )
  }

  // Check if currentUserId is available
  if (!currentUserId) {
    return (
      <div className="task-details-page">
        <div className="task-details-header">
          <button className="back-button" onClick={() => setCurrentPage("dashboard")}>
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
        </div>
        <div className="task-details-content">
          <p>User information not available. Please log in again.</p>
        </div>
      </div>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div className="task-details-page">
        <div className="task-details-header">
          <button className="back-button" onClick={() => setCurrentPage(backDestination)}>
            <ArrowLeft size={20} />
            {backButtonText}
          </button>
        </div>
        <div className="task-details-content">
          <div className="loading">Loading task details...</div>
        </div>
      </div>
    );
  }



  return (
    <div className="task-details-page">
      <div className="task-details-header">
        <button className="back-button" onClick={() => setCurrentPage(backDestination)}>
          <ArrowLeft size={20} />
          {backButtonText}
        </button>
      </div>

      <div className="task-details-content">
        <div className="task-details-card">
          {/* Task Title and Status */}
          <div className="task-title-section">
            <h2>{taskData.title || taskData.taskName || `Task ${taskData.id || "Unknown"}`}</h2>
            <div
              className="task-status-badge"
              style={{
                color: getStatusColor(getCurrentStatus(taskData)),
                backgroundColor: getStatusColor(getCurrentStatus(taskData)) + "20",
              }}
            >
              {getStatusIcon(getCurrentStatus(taskData))}
              {getCurrentStatus(taskData)}
            </div>
          </div>

          {/* Deadline Countdown - Most Important */}
          <div className="deadline-countdown">
            <h3>Time Remaining</h3>
            <div className="countdown-timer">
              <div className="countdown-item">
                <span className="countdown-number">{countdown.days}</span>
                <span className="countdown-label">Days</span>
              </div>
              <div className="countdown-separator">:</div>
              <div className="countdown-item">
                <span className="countdown-number">{countdown.hours.toString().padStart(2, "0")}</span>
                <span className="countdown-label">Hours</span>
              </div>
              <div className="countdown-separator">:</div>
              <div className="countdown-item">
                <span className="countdown-number">{countdown.minutes.toString().padStart(2, "0")}</span>
                <span className="countdown-label">Minutes</span>
              </div>
              <div className="countdown-separator">:</div>
              <div className="countdown-item">
                <span className="countdown-number">{countdown.seconds.toString().padStart(2, "0")}</span>
                <span className="countdown-label">Seconds</span>
              </div>
            </div>
            <p className="countdown-text">{remainingTime}</p>

          </div>

          {/* Essential Task Information */}
          <div className="task-essential-info">
            <div className="task-description-section">
              <h3>What you need to do</h3>
              <p className="task-description-text">
                {taskData.description || taskData.taskDescription || "No description available for this task."}
              </p>

              {/* Submit Button - Show for any task that can be submitted (pending, rejected, or not yet submitted) */}
              {(getCurrentStatus(taskData) === "Pending" || getCurrentStatus(taskData) === "Rejected" || 
                getCurrentStatus(taskData) === "Deadline Passed" || 
                (!taskData.submission && getCurrentStatus(taskData) !== "Submitted On Time" && getCurrentStatus(taskData) !== "Submitted Late" && 
                 getCurrentStatus(taskData) !== "Completed" && getCurrentStatus(taskData) !== "Completed Late")) && (
                <div className="submit-section">
                  <button
                    className="submit-task-btn"
                    onClick={() => setShowSubmitModal(true)}
                    disabled={!isTeamLeader}
                    title={
                      !isTeamLeader
                        ? "Only team leaders can submit tasks"
                        : getCurrentStatus(taskData) === "Rejected"
                          ? "Resubmit task"
                          : getCurrentStatus(taskData) === "Deadline Passed"
                            ? "Submit task late"
                            : "Submit task"
                    }
                  >
                    {isTeamLeader
                      ? getCurrentStatus(taskData) === "Rejected"
                        ? "Resubmit Task"
                        : getCurrentStatus(taskData) === "Deadline Passed"
                          ? "Submit Task Late"
                          : "Submit Task"
                      : "Submit Task (Leader Only)"}
                  </button>
                  {!isTeamLeader && <p className="submit-note">Only team leaders can submit tasks for their team.</p>}
                  {taskData.status === "Rejected" && (
                    <p className="resubmit-note">This task was rejected. You can resubmit with corrections.</p>
                  )}
                  {getCurrentStatus(taskData) === "Submitted Late" && (
                    <p className="late-submission-note" style={{ color: "#e53e3e", backgroundColor: "#fff5f5", padding: "8px 12px", borderRadius: "6px", border: "1px solid #fed7d7" }}>
                      ⏰ This task was submitted after the deadline. Late submissions may affect your grade.
                    </p>
                  )}
                  {getCurrentStatus(taskData) === "Completed Late" && (
                    <p className="late-completion-note" style={{ color: "#d69e2e", backgroundColor: "#fffaf0", padding: "8px 12px", borderRadius: "6px", border: "1px solid #fed7d7" }}>
                      ⏰ This task was completed after the deadline. Late completions may affect your grade.
                    </p>
                  )}
                  {getCurrentStatus(taskData) === "Deadline Passed" && (
                    <p className="late-submission-warning" style={{ color: "#e53e3e", backgroundColor: "#fff5f5", padding: "8px 12px", borderRadius: "6px", border: "1px solid #fed7d7" }}>
                      ⏰ This task is overdue. You can still submit it, but it will be marked as late and may affect your grade.
                    </p>
                  )}
                </div>
              )}

              {/* Show submission info if task is submitted, completed, or rejected (including late submissions) */}
              {(getCurrentStatus(taskData) === "Submitted On Time" || getCurrentStatus(taskData) === "Submitted Late" || getCurrentStatus(taskData) === "Completed" || getCurrentStatus(taskData) === "Completed Late" || getCurrentStatus(taskData) === "Rejected") &&
                taskData.submission && (
                  <div className="submission-info">
                    <h4>Submission Details</h4>
                    <div className="submission-details">
                      <div className="submission-detail-item">
                        <div className="detail-icon">
                          <Github size={20} />
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">Task Link:</span>
                          <a href={taskData.submission.glink} target="_blank" rel="noreferrer" className="detail-link">
                            {taskData.submission.glink}
                          </a>
                        </div>
                      </div>

                      {taskData.submission.note && (
                        <div className="submission-detail-item">
                          <div className="detail-icon">
                            <StickyNote size={20} />
                          </div>
                          <div className="detail-content">
                            <span className="detail-label">Notes:</span>
                            <span className="detail-value">{taskData.submission.note}</span>
                          </div>
                        </div>
                      )}

                      <div className="submission-detail-item">
                        <div className="detail-icon">
                          <MessageSquare size={20} />
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">Reviewer Feedback:</span>
                          <span className="detail-value">
                            {taskData.submission.feedback &&
                            taskData.submission.feedback.trim() &&
                            taskData.submission.feedback !== "8"
                              ? taskData.submission.feedback
                              : "No feedback provided yet"}
                          </span>
                        </div>
                      </div>

                      
                    </div>
                  </div>
                )}
            </div>

            {/* Key Details Only */}
            <div className="task-key-details">
              <h3>Key Details</h3>
              <div className="detail-item">
                <Calendar size={16} />
                <span className="detail-label">Deadline:</span>
                <span className="detail-value">
                  {taskData.deadline || taskData.taskDeadline
                    ? `${formatCairoDate(taskData.deadline || taskData.taskDeadline)}`
                    : "Not specified"}
                </span>
              </div>

              <div className="detail-item">
                                 {getStatusIcon(getCurrentStatus(taskData))}
                 <span className="detail-label">Status:</span>
                 <span className="detail-value" style={{ color: getStatusColor(getCurrentStatus(taskData)) }}>
                   {getCurrentStatus(taskData)}
                 </span>
              </div>

              {userTeam && (
                <div className="detail-item">
                  <User size={16} />
                  <span className="detail-label">Your Team:</span>
                  <span className="detail-value">{userTeam.teamName}</span>
                </div>
              )}

              <div className="detail-item">
                <span className="detail-label">Your Role:</span>
                <span className="detail-value" style={{ color: isTeamLeader ? "#38a169" : "#d69e2e" }}>
                  {isTeamLeader ? "Team Leader" : "Team Member"}
                </span>
              </div>

              {taskData.githubLink && (
                <div className="detail-item">
                  <Github size={16} />
                  <span className="detail-label">Repository:</span>
                  <a href={taskData.githubLink} target="_blank" rel="noopener noreferrer" className="detail-link">
                    View on GitHub
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="submit-modal-overlay" onClick={handleModalClose}>
          <div className="submit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="submit-modal-header">
              <h3>{taskData.status === "Rejected" ? "Resubmit Task" : "Submit Task"}</h3>
              <button className="close-modal-btn" onClick={handleModalClose}>
                <X size={20} />
              </button>
            </div>
            <div className="submit-modal-content">
              <div className="form-group">
                <label htmlFor="githubLink">GitHub Repository Link *</label>
                <input
                  type="url"
                  id="githubLink"
                  value={githubLink}
                  onChange={(e) => setGithubLink(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  className="github-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="notes">Additional Notes (Optional)</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about your submission..."
                  className="notes-input"
                  rows="3"
                />
              </div>
              <div className="submit-modal-actions">
                <button className="cancel-btn" onClick={handleModalClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button className="submit-btn" onClick={handleSubmit} disabled={isSubmitting || !githubLink.trim()}>
                  {isSubmitting ? "Submitting..." : taskData.status === "Rejected" ? "Resubmit" : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskDetailsPage

// Note: This component now receives dynamic user data from the Dashboard
// No more hardcoded ID = 9, uses currentUserId prop instead
