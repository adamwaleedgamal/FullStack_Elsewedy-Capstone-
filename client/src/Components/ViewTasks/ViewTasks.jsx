"use client"

/**
 * ViewTasks Component - Role-Based Access Control
 * 
 * Student: No restrictions - can see all teams
 * Engineer: Can only see teams from classes assigned to them via ReviewerSupervisorExtension
 * Super Admin: No restrictions - can see all teams
 */

import { useEffect, useState } from "react"
import { Search, CheckCircle, Eye, Send, Clock, LinkIcon, StickyNote, Upload, X, Users, Loader2, FileText, ArrowLeft, AlertTriangle } from "lucide-react"
import axios from "axios"
import { useNotification } from "../../contexts/NotificationContext"
import { format, parseISO, addHours } from "date-fns"
import { isEngineer, isReviewer } from "../../utils/roleUtils"
import { STATUS_CONSTANTS, StatusHelpers } from "../../utils/statusConstants"
import "./ViewTasks.css"

const ViewTasks = ({ teamIdFilter: initialTeamIdFilter = null, currentUserId = null, user = null }) => {
  console.log("ViewTasks component rendering with teamIdFilter:", initialTeamIdFilter)
  const [currentInitialTeamIdFilter, setCurrentInitialTeamIdFilter] = useState(initialTeamIdFilter)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTask, setSelectedTask] = useState(null)
  const [feedback, setFeedback] = useState("")
  const [submissions, setSubmissions] = useState([])
  const [tasks, setTasks] = useState([])
  const [grades, setGrades] = useState([])
  const [classes, setClasses] = useState([])
  const [teams, setTeams] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [viewMode, setViewMode] = useState("teams") // 'teams', 'tasks', 'team-info', 'student-reports'
  const [reviewingStudentId, setReviewingStudentId] = useState(null)
  const [confirmingReportId, setConfirmingReportId] = useState(null)
  // Filters
  const [statusFilter, setStatusFilter] = useState("all") // all | pending | submitted | completed
  const [gradeFilter, setGradeFilter] = useState("")
  const [classFilter, setClassFilter] = useState("")
  const [teamIdFilter, setTeamIdFilter] = useState(initialTeamIdFilter || "")
  const API_BASE_URL = "http://localhost:5048/api"
  const { showSuccess, showError, showWarning, showInfo } = useNotification()

  // Cairo timezone offset - Egypt is UTC+3 (daylight saving time)
  const CAIRO_TIMEZONE_OFFSET = 3

  // Convert UTC date to Cairo timezone and format with AM/PM
  const formatCairoDate = (dateString) => {
    if (!dateString) return "No date";
    
    try {
      // Parse the UTC date string
      const utcDate = parseISO(dateString);
      
      // Add Cairo timezone offset (UTC+3)
      const cairoTime = addHours(utcDate, CAIRO_TIMEZONE_OFFSET);
      
      // Format using date-fns with clear AM/PM display
      const formattedDate = format(cairoTime, "MMM dd, yyyy, hh:mm a");
      
      return formattedDate;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Format date only (without time) for Cairo timezone
  const formatCairoDateOnly = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const utcDate = parseISO(dateString);
      const cairoTime = addHours(utcDate, CAIRO_TIMEZONE_OFFSET);
      return format(cairoTime, "MMM dd, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Format time only for Cairo timezone
  const formatCairoTimeOnly = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const utcDate = parseISO(dateString);
      const cairoTime = addHours(utcDate, CAIRO_TIMEZONE_OFFSET);
      return format(cairoTime, "hh:mm a");
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };

  useEffect(() => {
    if (initialTeamIdFilter) {
      setTeamIdFilter(initialTeamIdFilter)
      setCurrentInitialTeamIdFilter(initialTeamIdFilter)
    }
  }, [initialTeamIdFilter])

  // Handle switching to tasks view when team data is loaded and initialTeamIdFilter is set
  useEffect(() => {
    if (initialTeamIdFilter && teams.length > 0) {
      const team = teams.find((t) => t.id === initialTeamIdFilter)
      if (team) {
        setSelectedTeam(team)
        setViewMode("tasks")
      }
    }
  }, [initialTeamIdFilter, teams])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Determine which teams endpoint to use based on user role
        let teamsEndpoint = `${API_BASE_URL}/Teams`
        if ((isEngineer(user) || isReviewer(user)) && currentUserId) {
          teamsEndpoint = `${API_BASE_URL}/Teams/ByEngineer/${currentUserId}`
          console.log(`ViewTasks - Using engineer/reviewer-specific endpoint: ${teamsEndpoint}`)
        }

        // Fetch all data in parallel
        const [submissionsRes, tasksRes, gradesRes, classesRes, teamsRes, teamMembersRes, reportsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/TaskSubmissions`),
          axios.get(`${API_BASE_URL}/AccountTask`),
          axios.get(`${API_BASE_URL}/Grades`),
          axios.get(`${API_BASE_URL}/Class`),
          axios.get(teamsEndpoint),
          axios.get(`${API_BASE_URL}/TeamMembers`),
          axios.get(`${API_BASE_URL}/Reports`),
        ])

        // Process submissions
        const submissionsRaw = submissionsRes.data
        const submissionsList = Array.isArray(submissionsRaw)
          ? submissionsRaw
          : submissionsRaw?.$values
            ? submissionsRaw.$values
            : []
        const normalizedSubmissions = submissionsList.map((s) => ({
          id: s.taskSubmissionId ?? s.TaskSubmissionId ?? s.id,
          taskId: s.taskId ?? s.TaskId ?? null,
          teamId: s.teamId ?? s.TeamId,
          teamLeaderId: s.teamLeaderId ?? s.TeamLeaderId,
          teamLeaderName: s.teamLeaderName ?? s.TeamLeaderName ?? "",
          gradeId: s.gradeId ?? s.GradeId,
          glink: s.glink ?? s.Glink ?? "",
          note: s.note ?? s.Note ?? "",
          feedback: s.feedback ?? s.Feedback ?? "",
          submittedDate: s.createdAt ?? s.CreatedAt ?? null,
          statusId: s.statusId ?? s.StatusId,
          isLate: s.isLate ?? false, // Include isLate from server
        }))

        console.log("Raw submissions data:", submissionsRaw)
        console.log("Normalized submissions:", normalizedSubmissions)

        // Debug: Log all status IDs to see what we have
        const statusCounts = normalizedSubmissions.reduce((acc, sub) => {
          acc[sub.statusId] = (acc[sub.statusId] || 0) + 1
          return acc
        }, {})
        console.log("Status ID counts:", statusCounts)
        
        // Debug: Log team ID formats in submissions
        const submissionTeamIdFormats = normalizedSubmissions.map(sub => ({
          submissionId: sub.id,
          teamId: sub.teamId,
          teamIdType: typeof sub.teamId
        }))
        console.log("Team ID formats in submissions:", submissionTeamIdFormats)

        // Process tasks
        const tasksRaw = tasksRes.data
        const tasksList = Array.isArray(tasksRaw) ? tasksRaw : tasksRaw?.$values ? tasksRaw.$values : []
        const normalizedTasks = tasksList.map((t) => ({
          id: t.id ?? t.Id,
          taskName: t.taskName ?? t.TaskName ?? `Task ${t.id ?? t.Id}`,
          taskDescription: t.taskDescription ?? t.TaskDescription ?? "",
          gradeId: t.gradeId ?? t.GradeId,
          gradeName: t.gradeName ?? t.GradeName ?? "",
          statusId: t.statusId ?? t.StatusId,
          taskDeadline: t.taskDeadline ?? t.TaskDeadline,
        }))

        // Process grades
        const gradesRaw = gradesRes.data
        const gradesList = Array.isArray(gradesRaw) ? gradesRaw : gradesRaw?.$values ? gradesRaw.$values : []
        const normalizedGrades = gradesList.map((g) => ({
          id: g.id ?? g.Id,
          gradeName: g.gradeName ?? g.GradeName,
        }))

        // Process classes
        const classesRaw = classesRes.data
        const classesList = Array.isArray(classesRaw) ? classesRaw : classesRaw?.$values ? classesRaw.$values : []
        const normalizedClasses = classesList.map((c) => ({
          id: c.id ?? c.Id,
          className: c.className ?? c.ClassName,
          gradeId: c.gradeId ?? c.GradeId,
          gradeName: c.gradeName ?? c.GradeName,
        }))

        // Process reports
        const reportsRaw = reportsRes.data
        const reportsList = Array.isArray(reportsRaw) ? reportsRaw : reportsRaw?.$values ? reportsRaw.$values : []
        const normalizedReports = reportsList.map((r) => ({
          id: r.id ?? r.Id,
          reportTitle: r.title ?? r.Title ?? `Report ${r.id ?? r.Id}`,
          reportContent: r.reportMessage ?? r.ReportMessage ?? "",
          submitterAccountId: r.submitterAccountId ?? r.SubmitterAccountId,
          authorName: r.submitterAccount?.fullNameEn ?? r.submitterAccount?.fullNameAr ?? "Unknown Author",
          submittedDate: r.submissionDate ?? r.SubmissionDate ?? r.createdAt ?? r.CreatedAt,
          statusId: r.statusId ?? r.StatusId ?? STATUS_CONSTANTS.REPORT_SUBMITTED,
          status: r.status?.name ?? r.Status?.Name ?? "Pending",
        }))

        // Process team members (using same approach as dashboard)
        const teamMembersRaw = teamMembersRes.data
        const teamMembersList = Array.isArray(teamMembersRaw) ? teamMembersRaw : teamMembersRaw?.$values ? teamMembersRaw.$values : []
        const normalizedTeamMembers = teamMembersList.map((tm) => ({
          id: tm.id ?? tm.Id,
          teamId: tm.teamId ?? tm.TeamId,
          teamMemberAccountId: tm.teamMemberAccountId ?? tm.TeamMemberAccountId,
          teamMemberDescription: tm.teamMemberDescription ?? tm.TeamMemberDescription,
          memberName: tm.memberName ?? tm.MemberName,
          memberEmail: tm.memberEmail ?? tm.MemberEmail,
          classId: tm.classId ?? tm.ClassId,
          gradeId: tm.gradeId ?? tm.GradeId,
        }))

        // Process teams
        const teamsRaw = teamsRes.data
        console.log("ViewTasks - Raw teams response:", teamsRaw)
        console.log("ViewTasks - Teams response type:", typeof teamsRaw, "Is array:", Array.isArray(teamsRaw))
        
        // Safely extract teams array with better error handling
        let teamsList = []
        try {
          if (Array.isArray(teamsRaw)) {
            teamsList = teamsRaw
          } else if (teamsRaw && typeof teamsRaw === 'object') {
            // Try different possible property names
            teamsList = teamsRaw.$values || teamsRaw.data || teamsRaw.teams || teamsRaw.results || teamsRaw.items || []
            
            // If still not an array, try to convert object to array
            if (!Array.isArray(teamsList) && teamsRaw && typeof teamsRaw === 'object') {
              // Check if it's an object with numeric keys
              const keys = Object.keys(teamsRaw)
              if (keys.length > 0 && keys.every(key => !isNaN(key))) {
                teamsList = Object.values(teamsRaw)
              }
            }
          }
        } catch (error) {
          console.error("Error extracting teams list:", error)
          teamsList = []
        }
        
        console.log("ViewTasks - Extracted teams list:", teamsList)
        console.log("ViewTasks - Teams list type:", typeof teamsList, "Is array:", Array.isArray(teamsList))
        
        // Ensure teamsList is an array before proceeding
        if (!Array.isArray(teamsList)) {
          console.error("Teams list is not an array, defaulting to empty array")
          teamsList = []
        }
        
        const normalizedTeams = teamsList.map((t) => {
          // Find the class to get grade information
          const classInfo = normalizedClasses.find((c) => c.id === (t.classId ?? t.ClassId))
          
          // Get team members for this team
          const teamMembers = normalizedTeamMembers
            .filter((tm) => tm.teamId === (t.teamId ?? t.id ?? t.Id))
            .map((tm) => {
              // Count reports for this member (excluding confirmed reports)
              const memberReports = normalizedReports.filter(r => 
                r.submitterAccountId === tm.teamMemberAccountId && r.statusId !== STATUS_CONSTANTS.REPORT_CONFIRMED
              )
              return {
                id: tm.teamMemberAccountId,
                fullName: tm.memberName || `Member ${tm.teamMemberAccountId}`,
                email: tm.memberEmail || '',
                role: tm.teamMemberDescription || 'Team Member',
                reportsCount: memberReports.length,
              }
            })

          // Use gradeId and gradeName directly from team data (from API) if available, otherwise fallback to classInfo
          const teamGradeId = t.gradeId || t.GradeId || classInfo?.gradeId || classInfo?.GradeId
          const teamGradeName = t.gradeName || t.GradeName || classInfo?.gradeName || classInfo?.GradeName

          // Debug logging for grade information
          console.log(`ViewTasks - Processing team ${t.teamName || t.TeamName}:`, {
            teamGradeId: teamGradeId,
            teamGradeName: t.gradeName || t.GradeName,
            classInfoGradeId: classInfo?.gradeId || classInfo?.GradeId,
            finalGradeId: teamGradeId,
            finalGradeName: teamGradeName
          })

          return {
            id: t.teamId ?? t.id ?? t.Id,
            teamName: t.teamName ?? t.TeamName,
            classId: t.classId ?? t.ClassId,
            className: t.className ?? t.ClassName,
            gradeId: teamGradeId,
            gradeName: teamGradeName,
            teamMembers,
            SupervisorAccountId: t.SupervisorAccountId ?? t.supervisorAccountId ?? t.supervisorAccountId ?? null,
            // We'll fetch reviewers and supervisor dynamically for each team
          }
        })

        console.log("Raw teams data:", teamsRaw)
        console.log("Raw classes data:", classesRaw)
        console.log("Raw grades data:", gradesRaw)
        console.log("Raw reports data:", reportsRaw)
        console.log("Normalized teams:", normalizedTeams)
        console.log("Normalized classes:", normalizedClasses)
        console.log("Normalized grades:", normalizedGrades)
        console.log("Normalized reports:", normalizedReports)
        
        // Debug: Log SupervisorAccountId in raw teams data
        console.log("Raw teams data type:", typeof teamsRaw, "Is array:", Array.isArray(teamsRaw))
        console.log("Raw teams data structure:", teamsRaw)
        
        // Safely handle teams data
        let teamsWithSupervisor = []
        if (Array.isArray(teamsRaw)) {
          teamsWithSupervisor = teamsRaw.filter(t => t.SupervisorAccountId || t.supervisorAccountId)
        } else if (teamsRaw && typeof teamsRaw === 'object') {
          // Handle case where data might be wrapped in an object
          const teamsArray = teamsRaw.$values || teamsRaw.data || teamsRaw.teams || []
          if (Array.isArray(teamsArray)) {
            teamsWithSupervisor = teamsArray.filter(t => t.SupervisorAccountId || t.supervisorAccountId)
          }
        }
        
        console.log("Teams with SupervisorAccountId:", teamsWithSupervisor.map(t => ({
          teamId: t.teamId || t.id || t.Id,
          teamName: t.teamName || t.TeamName,
          SupervisorAccountId: t.SupervisorAccountId || t.supervisorAccountId
        })))
        
        // Debug: Log team ID formats
        const teamsTeamIdFormats = normalizedTeams.map(team => ({
          teamName: team.teamName,
          teamId: team.id,
          teamIdType: typeof team.id,
          SupervisorAccountId: team.SupervisorAccountId
        }))
        console.log("Team ID formats in teams:", teamsTeamIdFormats)

        setSubmissions(normalizedSubmissions)
        setTasks(normalizedTasks)
        setGrades(normalizedGrades)
        setClasses(normalizedClasses)
        setTeams(normalizedTeams)
        setReports(normalizedReports)
      } catch (e) {
        console.error("Failed to load data", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // SECURITY: Deadline checking is now handled by the server
  // Client-side deadline checking can be manipulated by users
  // Always rely on server-side validation for security

  const getStatusText = (statusId, deadline = null, isPendingTask = false, isLate = false) => {
    return StatusHelpers.getStatusText(statusId, deadline, isPendingTask, isLate);
  };

  const getStatusColor = (statusId, deadline = null, isPendingTask = false, isLate = false) => {
    return StatusHelpers.getStatusColor(statusId, deadline, isPendingTask, isLate);
  };

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
  };

  const getTeamStats = (teamId) => {
    // Use the comprehensive allTasksWithStatus array instead of just submissions
    const teamTasks = allTasksWithStatus.filter((task) => task.teamId === teamId)
    
    // Debug: Log team ID matching
    console.log(`getTeamStats called for teamId: ${teamId}`)
    console.log(`allTasksWithStatus teamIds:`, allTasksWithStatus.map(t => t.teamId))
    console.log(`Filtered teamTasks for ${teamId}:`, teamTasks)
    
    // Count different statuses
    const completed = teamTasks.filter((task) => task.statusId === STATUS_CONSTANTS.TASK_COMPLETED).length
    const submitted = teamTasks.filter((task) => task.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_ON_TIME || task.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_LATE).length
    const rejected = teamTasks.filter((task) => task.statusId === STATUS_CONSTANTS.TASK_REJECTED).length
    const pending = teamTasks.filter((task) => task.statusId === STATUS_CONSTANTS.TASK_PENDING || task.isPendingTask).length
    const submittedLate = teamTasks.filter((task) => task.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_LATE).length
    const completedLate = teamTasks.filter((task) => task.statusId === STATUS_CONSTANTS.TASK_COMPLETED_LATE).length
    
    // New counter for overdue tasks (التاسكات المتأخرة) - tasks that passed deadline without submission
    const overdue = teamTasks.filter((task) => {
      // SECURITY: Use server-provided isLate instead of client-side deadline checking
      if (task.isPendingTask) {
        return task.isLate || false
      }
      // Also check submitted/completed tasks that were late
      if (task.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_ON_TIME || task.statusId === STATUS_CONSTANTS.TASK_COMPLETED) {
        return task.isLate || false
      }
      // Status 11 and 13 are already marked as late
      if (task.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_LATE || task.statusId === STATUS_CONSTANTS.TASK_COMPLETED_LATE) {
        return true
      }
      return false
    }).length

    const total = teamTasks.length

    // Debug logging
    console.log(`Team ${teamId} stats calculation:`, {
      teamTasksCount: teamTasks.length,
      completed,
      submitted,
      rejected,
      pending,
      submittedLate,
      completedLate,
      overdue,
      total
    })

    return { 
      completed, 
      submitted, 
      rejected, 
      pending, 
      submittedLate, 
      completedLate, 
      overdue,
      total 
    }
  }

  // Debug logging for role-based filtering
  console.log("ViewTasks - User role filtering:", {
    userRole: user?.role,
    currentUserId,
    totalTeams: teams.length,
    teamsWithSupervisor: teams.filter(t => t.SupervisorAccountId).map(t => ({
      teamId: t.id,
      teamName: t.teamName,
      SupervisorAccountId: t.SupervisorAccountId
    }))
  })
  
  // Filter teams based on grade, class, and search filters
  const filteredTeams = teams.filter((team) => {
    // Engineer: Teams are already filtered by the API endpoint based on assigned classes
    // Role ID = 1 (Admin): Show all teams (no restrictions)
    // Role ID = 4 (Student): Show all teams (no restrictions)
    
    const matchesGrade =
      String(gradeFilter || "").trim().length === 0 ||
      (team.gradeName || "").toLowerCase().includes(String(gradeFilter || "").toLowerCase())

    const matchesClass =
      String(classFilter || "").trim().length === 0 ||
      (team.className || "").toLowerCase().includes(String(classFilter || "").toLowerCase())

    // Debug logging for filtering
    if (gradeFilter || classFilter) {
      console.log(`Team: ${team.teamName}, Grade: "${team.gradeName}", Class: "${classFilter}"`)
      console.log(`Grade filter: "${gradeFilter}", Class filter: "${classFilter}"`)
      console.log(`Matches grade: ${matchesGrade}, Matches class: ${matchesClass}`)
    }

    return matchesGrade && matchesClass
  })

  // Combine submissions with task data to get real task names
  const submissionsWithTasks = submissions.map((submission) => {
    const task = tasks.find((t) => t.id === submission.taskId)
    const team = teams.find((t) => t.id === submission.teamId)
    const grade = grades.find((g) => g.id === submission.gradeId)
    const classInfo = classes.find((c) => c.id === submission.teamId) // Assuming teamId maps to classId for filtering

    return {
      ...submission,
      taskName: task?.taskName || `Task #${submission.taskId ?? "N/A"}`,
      taskDescription: task?.taskDescription || "",
      taskDeadline: task?.taskDeadline || null, // Add deadline for late submission logic
      gradeName: team?.gradeName || grade?.gradeName || "",
      className: team?.className || classInfo?.className || "",
      isLate: submission.isLate || false, // Include isLate from server
    }
  })

  // Create a comprehensive list that includes both submissions and tasks without submissions
  // This ensures we capture all pending tasks, not just those with submissions
  const allTasksWithStatus = []
  
  // Add all submissions
  submissionsWithTasks.forEach(submission => {
    allTasksWithStatus.push(submission)
  })
  
  // Add tasks that don't have submissions yet (these are pending)
  tasks.forEach(task => {
    const hasSubmission = submissions.some(s => s.taskId === task.id)
    if (!hasSubmission) {
      // Find teams that should have this task (based on grade)
      teams.forEach(team => {
        if (team.gradeId === task.gradeId) {
          // Check if this task is already represented by a submission
          const existingSubmission = submissions.find(s => s.taskId === task.id && s.teamId === team.id)
          if (!existingSubmission) {
            // This is a pending task for this team
            // SECURITY: Use server-provided isLate instead of client-side deadline checking
            const deadlinePassed = task.isLate || false
            const status = deadlinePassed ? 'deadline-passed' : 'pending'
            
            // Debug: Log team ID formats
            console.log(`Creating pending task for team:`, {
              teamId: team.id,
              teamIdType: typeof team.id,
              taskId: task.id,
              gradeId: task.gradeId,
              teamGradeId: team.gradeId
            })
            
            allTasksWithStatus.push({
              id: `pending-${task.id}-${team.id}`, // Unique ID for pending tasks
              taskId: task.id,
              teamId: team.id,
              taskName: task.taskName || `Task #${task.id}`,
              taskDescription: task.taskDescription || "",
              taskDeadline: task.taskDeadline,
              statusId: deadlinePassed ? STATUS_CONSTANTS.TASK_SUBMITTED_LATE : STATUS_CONSTANTS.TASK_PENDING, // Use appropriate status for deadline passed or pending
              gradeName: team.gradeName || "",
              className: team.className || "",
              teamLeaderName: "", // No team leader for pending tasks
              glink: "",
              note: "",
              feedback: "",
              submittedDate: null,
              teamLeaderId: null,
              gradeId: task.gradeId,
              isPendingTask: true, // Flag to identify pending tasks
              isLate: deadlinePassed // Include isLate for pending tasks
            })
          }
        }
      })
    }
  })

  // Debug: Log all tasks with status to see what we have
  console.log("All tasks with status:", allTasksWithStatus)
  console.log("Current status filter:", statusFilter)
  console.log(
    "Tasks with status 6 (rejected):",
    allTasksWithStatus.filter((s) => s.statusId === STATUS_CONSTANTS.TASK_REJECTED),
  )
  
  // Debug: Log team distribution in allTasksWithStatus
  const teamDistribution = allTasksWithStatus.reduce((acc, task) => {
    acc[task.teamId] = (acc[task.teamId] || 0) + 1
    return acc
  }, {})
  console.log("Team distribution in allTasksWithStatus:", teamDistribution)

  const filteredSubmissions = allTasksWithStatus.filter((submission) => {
    const matchesSearch =
      String(searchTerm || "").trim().length === 0 ||
      String(submission.taskId ?? "").includes(String(searchTerm || "")) ||
      String(submission.teamId ?? "").includes(String(searchTerm || "")) ||
      (submission.taskName || "").toLowerCase().includes(String(searchTerm || "").toLowerCase()) ||
      (submission.teamLeaderName || "").toLowerCase().includes(String(searchTerm || "").toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && (submission.statusId === STATUS_CONSTANTS.TASK_PENDING || submission.isPendingTask)) ||
      (statusFilter === "submitted" && (submission.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_ON_TIME || submission.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_LATE)) ||
      (statusFilter === "rejected" && submission.statusId === STATUS_CONSTANTS.TASK_REJECTED) ||
      (statusFilter === "completed" && (submission.statusId === STATUS_CONSTANTS.TASK_COMPLETED || submission.statusId === STATUS_CONSTANTS.TASK_COMPLETED_LATE))

    const matchesGrade =
      String(gradeFilter || "").trim().length === 0 ||
      (submission.gradeName || "").toLowerCase().includes(String(gradeFilter || "").toLowerCase())

    const matchesClass =
      String(classFilter || "").trim().length === 0 ||
      (submission.className || "").toLowerCase().includes(String(classFilter || "").toLowerCase())

    const matchesTeam =
      String(teamIdFilter || "").trim().length === 0 ||
      String(submission.teamId ?? "").includes(String(teamIdFilter || ""))

    // Debug logging for status filtering
    if (statusFilter !== "all") {
      console.log(
        `Task ${submission.id}: statusId=${submission.statusId}, isPendingTask=${submission.isPendingTask}, statusFilter=${statusFilter}, matchesStatus=${matchesStatus}`,
      )
    }

    return matchesSearch && matchesStatus && matchesGrade && matchesClass && matchesTeam
  })

  const handleMarkCompleted = async (submissionId) => {
    try {
      await axios.post(`${API_BASE_URL}/TaskSubmissions/${submissionId}/review`, {
        feedback: String(feedback || "").trim() || undefined,
      })
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId ? { ...s, statusId: STATUS_CONSTANTS.TASK_COMPLETED, feedback: String(feedback || "").trim() || s.feedback } : s,
        ),
      )
      setFeedback("")
      setSelectedTask(null)
    } catch (e) {
      console.error("Failed to mark completed", e)
    }
  }

  const handleRejectTask = async (submissionId) => {
    console.log("handleRejectTask called with submissionId:", submissionId)
    try {
      console.log("Attempting to update task submission status to rejected")

      // Verify the submission exists
      const currentSubmission = submissions.find((s) => s.id === submissionId)
      if (!currentSubmission) {
        console.error("Submission not found:", submissionId)
        showError("Submission Not Found", "Submission not found!")
        return
      }

      console.log("Rejecting submission:", currentSubmission)

      // Use the specific reject endpoint
      const response = await axios.post(`${API_BASE_URL}/TaskSubmissions/${submissionId}/reject`)
      console.log("Reject response:", response.data)

      // Update local state
      setSubmissions((prev) => {
        console.log("Previous submissions:", prev)
        const updated = prev.map((s) => (s.id === submissionId ? { ...s, statusId: STATUS_CONSTANTS.TASK_REJECTED } : s))
        console.log("Updated submissions:", updated)
        return updated
      })
      setSelectedTask(null)
      console.log(`Task ${submissionId} rejected successfully`)

      // Show success message
      showSuccess("Task Rejected", "Task rejected successfully!")
    } catch (e) {
      console.error("Failed to reject task", e)
      console.log("Error details:", e.response?.data || e.message)

      // Show error message to user
      showError("Rejection Failed", `Failed to reject task: ${e.response?.data || e.message}`)

      // Don't update UI if API call fails
      setSelectedTask(null)
    }
  }

  const handleAddFeedback = async (submissionId, feedback) => {
    console.log("handleAddFeedback called with submissionId:", submissionId, "feedback:", feedback)
    try {
      // Use the existing feedback endpoint instead of PUT
      const response = await axios.post(`${API_BASE_URL}/TaskSubmissions/${submissionId}/feedback`, {
        Feedback: feedback,
      })
      console.log("Feedback response:", response.data)

      setSubmissions((prev) => {
        const updated = prev.map((s) => (s.id === submissionId ? { ...s, feedback: feedback } : s))
        return updated
      })
      setFeedback("") // Clear the feedback input
      setSelectedTask(null)
      console.log(`Feedback added to task ${submissionId} successfully`)
      showSuccess("Feedback Added", "Feedback added successfully!")

     
      
    } catch (e) {
      console.error("Failed to add feedback", e)
      console.log("Error details:", e.response?.data || e.message)
      showError("Feedback Failed", `Failed to add feedback: ${e.response?.data || e.message}`)
      setSelectedTask(null)
    }
  }

  const handleSubmitFeedback = (submissionId) => {
    if (String(feedback || "").trim()) {
      // In a real app, this would update the database
      console.log(`Submitted feedback for ${submissionId}: ${feedback}`)
      setFeedback("")
      setSelectedTask(null)
    }
  }

  const handleTeamClick = (team) => {
    setSelectedTeam(team)
    setViewMode("tasks")
    setTeamIdFilter(team.id)
  }

  const handleTeamInfoClick = async (team) => {
    // Fetch team info first
    const teamInfo = await fetchTeamInfo(team.id)
    
    // Set selected team with all data including reviewers and supervisor
    setSelectedTeam({
      ...team,
      reviewers: teamInfo.reviewers,
      supervisor: teamInfo.supervisor
    })
    
    // Then set view mode
    setViewMode("team-info")
  }



  // Function to fetch team info (reviewers and supervisor) dynamically
  const fetchTeamInfo = async (teamId) => {
    try {
      // Get team details to find classId
      const team = teams.find(t => t.id === teamId)
      if (!team) return { reviewers: [], supervisor: null }

      const classId = team.classId
      if (!classId) return { reviewers: [], supervisor: null }

      // Fetch reviewers for this class (same as dashboard)
      const reviewersResponse = await axios.get(`${API_BASE_URL}/Account/Reviewers/ByClass/${classId}`)
      const reviewersData = reviewersResponse.data
      const reviewersList = Array.isArray(reviewersData) ? reviewersData : reviewersData?.$values || []
      
      const reviewers = reviewersList
        .filter(reviewer => [STATUS_CONSTANTS.ROLE_SUPERVISOR, STATUS_CONSTANTS.ROLE_TEACHER, STATUS_CONSTANTS.ROLE_ENGINEER].includes(reviewer.roleId))
        .map(reviewer => ({
          id: reviewer.accountId,
          fullName: reviewer.fullNameEn || "Unknown Reviewer",
          role: reviewer.roleId === STATUS_CONSTANTS.ROLE_SUPERVISOR ? "Supervisor" : 
                reviewer.roleId === STATUS_CONSTANTS.ROLE_TEACHER ? "Teacher" : 
                reviewer.roleId === STATUS_CONSTANTS.ROLE_ENGINEER ? "Engineer" : "Reviewer",
        }))

      // Fetch capstone supervisors from the dedicated table (same as dashboard)
      console.log("Fetching capstone supervisors...")
      const capstoneSupervisorsResponse = await axios.get(`${API_BASE_URL}/Account/CapstoneSupervisors`)
      console.log("Capstone supervisors response:", capstoneSupervisorsResponse.data)
      
      // Use the same data extraction logic as BottomSection
      const capstoneSupervisorsData = capstoneSupervisorsResponse.data
      const capstoneSupervisorsList = Array.isArray(capstoneSupervisorsData) ? capstoneSupervisorsData : capstoneSupervisorsData?.$values || []
      console.log("Capstone supervisors list:", capstoneSupervisorsList)
      
      // Map all capstone supervisors from the CapstoneSupervisorExtension table
      const supervisors = capstoneSupervisorsList.map((supervisor) => ({
        id: supervisor.accountId,
        fullName: supervisor.fullNameEn || supervisor.fullNameAr || "Unknown Supervisor",
        role: "Capstone Supervisor"
      }))
      console.log("All supervisors:", supervisors)

              return { reviewers, supervisor: supervisors }
    } catch (error) {
      console.error("Error fetching team info:", error)
      return { 
        reviewers: [], 
        supervisor: null 
      }
    }
  }

  // Get reports for a specific student (filter out confirmed reports)
  const getStudentReports = (studentId) => {
    return reports.filter(report => 
      report.submitterAccountId === studentId && report.statusId !== STATUS_CONSTANTS.REPORT_CONFIRMED
    )
  }

  // Handle viewing student reports
  const handleViewStudentReports = (student) => {
    setSelectedStudent(student)
    setViewMode("student-reports")
  }

  // Handle going back to team info
  const handleBackToTeamInfo = () => {
    setSelectedStudent(null)
    setViewMode("team-info")
  }

  // Handle going back to teams overview
  const handleBackToTeams = () => {
    setSelectedTeam(null)
    setSelectedStudent(null)
    setViewMode("teams")
  }

  // Handle marking all reports as reviewed for a student
  const handleMarkAsReviewed = async (student) => {
    try {
      setReviewingStudentId(student.id) // Start loading
      
      const studentReports = getStudentReports(student.id)
      if (studentReports.length === 0) {
        showWarning("No Reports", "No reports found for this student.")
        return
      }

      // Update all reports for this student to confirmed status
      const updatePromises = studentReports.map(report => 
        axios.put(`${API_BASE_URL}/Reports/${report.id}`, {
          Id: report.id,
          Title: report.reportTitle,
          ReportMessage: report.reportContent,
          SubmitterAccountId: report.submitterAccountId,
          StatusId: STATUS_CONSTANTS.REPORT_CONFIRMED
        }, {
          headers: { "Content-Type": "application/json" }
        })
      )

      await Promise.all(updatePromises)
      
      // Update local state
      setReports(prevReports => 
        prevReports.map(report => 
          report.submitterAccountId === student.id 
            ? { ...report, statusId: STATUS_CONSTANTS.REPORT_CONFIRMED, status: "Confirmed" }
            : report
        )
      )

      showSuccess("Reports Confirmed", `All reports for ${student.fullName} have been marked as confirmed!`)
    } catch (error) {
      console.error("Error marking reports as reviewed:", error)
      console.error("Error details:", error.response?.data || error.message)
      showError("Confirmation Failed", "Failed to mark reports as reviewed. Please try again.")
    } finally {
      setReviewingStudentId(null) // Stop loading
    }
  }

  // Handle confirming a single report (change status to 5)
  const handleConfirmSingleReport = async (reportId) => {
    try {
      setConfirmingReportId(reportId);
      
      // Find the report to get its current data
      const reportToUpdate = reports.find(r => r.id === reportId);
      if (!reportToUpdate) {
        showError("Report not found");
        return;
      }

      console.log("Confirming report:", reportId, "with data:", reportToUpdate);

      const updateData = {
        Id: reportId,
        Title: reportToUpdate.reportTitle,
        ReportMessage: reportToUpdate.reportContent,
        SubmitterAccountId: reportToUpdate.submitterAccountId,
        StatusId: STATUS_CONSTANTS.REPORT_CONFIRMED
      };

      console.log("Sending update data:", updateData);

      const response = await axios.put(`${API_BASE_URL}/Reports/${reportId}`, updateData, {
        headers: { "Content-Type": "application/json" }
      })
      
      console.log("Update response:", response);
      
      if (response.status === 200 || response.status === 204) {
        // Update the local reports state
        setReports(prevReports => 
          prevReports.map(report => 
            report.id === reportId 
              ? { ...report, statusId: STATUS_CONSTANTS.REPORT_CONFIRMED, status: "Confirmed" }
              : report
        )
        )
        
        // Update the teams state to reflect the new reports count
        setTeams(prevTeams => 
          prevTeams.map(team => ({
            ...team,
            teamMembers: team.teamMembers.map(member => {
              if (member.id === reportToUpdate.submitterAccountId) {
                // Recalculate reports count for this member (excluding confirmed reports)
                const updatedReports = reports.map(r => 
                  r.id === reportId 
                    ? { ...r, statusId: STATUS_CONSTANTS.REPORT_CONFIRMED, status: "Confirmed" }
                    : r
                );
                const memberReports = updatedReports.filter(r => 
                  r.submitterAccountId === member.id && r.statusId !== STATUS_CONSTANTS.REPORT_CONFIRMED
                );
                return {
                  ...member,
                  reportsCount: memberReports.length
                };
              }
              return member;
            })
          }))
        );
        
        showSuccess("Report confirmed successfully!")
      } else {
        showError("Failed to confirm report")
      }
    } catch (error) {
      console.error("Error confirming report:", error)
      console.error("Error response:", error.response?.data)
      showError("Error confirming report: " + (error.response?.data || error.message))
    } finally {
      setConfirmingReportId(null);
    }
  }

  console.log(
    "ViewTasks render - viewMode:",
    viewMode,
    "loading:",
    loading,
    "filteredTeams.length:",
    filteredTeams?.length,
    "filteredSubmissions.length:",
    filteredSubmissions?.length,
  )

  return (
    <div className="view-tasks">
      <div className="view-tasks-header">
        <h1 className="view-tasks-title">
          {viewMode === "teams"
            ? "Teams Overview"
            : viewMode === "team-info"
              ? `${selectedTeam?.teamName} - Team Info`
              : viewMode === "student-reports"
                ? `${selectedStudent?.fullName || "Student"} - Reports`
                : `${selectedTeam?.teamName} - Tasks`}
        </h1>
        {viewMode === "tasks" && (
          <button className="back-button" onClick={handleBackToTeams}>
            ← Back to Teams
          </button>
        )}
        {viewMode === "team-info" && (
          <button className="back-button" onClick={handleBackToTeams}>
            ← Back to Teams
          </button>
        )}
        {viewMode === "student-reports" && (
          <button className="back-button" onClick={handleBackToTeamInfo}>
            ← Back to Team Info
          </button>
        )}
       
        {viewMode === "teams" ? (
          <div className="filters-row">
            <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="filter-select">
              <option value="">All Grades</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.gradeName}>
                  {grade.gradeName}
                </option>
              ))}
            </select>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="filter-select">
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.className}>
                  {cls.className} ({cls.gradeName})
                </option>
              ))}
            </select>
          </div>
        ) : viewMode === "tasks" ? (
          <div className="filters-row">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
           
          </div>
        ) : null}
      </div>

      {viewMode === "teams" && (
        <div className="teams-list">
          {loading ? (
            <div className="loading-container">
              <Loader2 size={24} className="animate-spin" />
              <p>Loading teams...</p>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="no-results">
              {(isEngineer(user) || isReviewer(user)) ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '16px' }} />
                  <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>Access Restricted</h3>
                  <p style={{ color: '#6b7280', marginBottom: '12px' }}>
                    You don't have access to teams matching the selected filters.
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                    Please contact your administrator to assign you to the appropriate classes.
                  </p>
                </div>
              ) : (
                <p>No teams found matching your filters.</p>
              )}
            </div>
          ) : (
            filteredTeams.map((team) => {
              const stats = getTeamStats(team.id)
              console.log(`Team ${team.teamName} stats:`, stats)
              return (
                <div key={team.id} className="team-card" onClick={() => handleTeamClick(team)}>
                  <div className="team-info">
                    <h1 className="team-name" style={{ fontSize: "20px" }}>
                      {team.teamName}
                    </h1>

                    <div className="team-details">
                      <span className="team-class">Class: {team.className || "N/A"}</span>
                      <span className="team-grade">Grade: {team.gradeName || "N/A"}</span>
                    </div>
                    <div className="team-stats">
                      <div className="stat-item">
                        <span className="stat-label">Total Tasks:</span>
                        <span className="stat-value">{stats.total}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Completed:</span>
                        <span className="stat-value completed">{stats.completed}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Submitted:</span>
                        <span className="stat-value submitted">{stats.submitted}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Rejected:</span>
                        <span className="stat-value rejected">{stats.rejected}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Pending:</span>
                        <span className="stat-value pending">{stats.pending}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Overdue Tasks:</span>
                        <span className="stat-value overdue">{stats.overdue}</span>
                      </div>
                    </div>
                  </div>
                  <div className="team-actions">
                    <button
                      className="view-tasks-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTeamClick(team)
                      }}
                    >
                      <Eye size={16} />
                      View Tasks
                    </button>
                    <button
                      className="team-info-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTeamInfoClick(team)
                      }}
                    >
                      <Users size={16} />
                      Team Info
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {viewMode === "tasks" && (
        <div className="submissions-list">
          {loading ? (
            <div className="loading-container">
              <Loader2 size={24} className="animate-spin" />
              <p>Loading...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="no-results">
              <p>No task submissions found matching your search criteria.</p>
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <div key={submission.id} className="task-item">
                <div className="task-content">
                  <div className="task-info">
                    <div className="task-header-compact">
                      <h3 className="task-name-primary">
                        {submission.taskName || `Task #${submission.taskId ?? "N/A"}`}
                      </h3>
                      <div
                        className="task-status-compact"
                        style={{
                          color: getStatusColor(submission.statusId, submission.taskDeadline, submission.isPendingTask, submission.isLate),
                          backgroundColor: getStatusColor(submission.statusId, submission.taskDeadline, submission.isPendingTask, submission.isLate) + "20",
                          border: submission.statusId === STATUS_CONSTANTS.TASK_REJECTED ? "2px solid #e53e3e" : "none",
                          fontWeight: submission.statusId === STATUS_CONSTANTS.TASK_REJECTED ? "bold" : "normal",
                        }}
                      >
                        {getStatusIcon(getStatusText(submission.statusId, submission.taskDeadline, submission.isPendingTask, submission.isLate))}
                        {getStatusText(submission.statusId, submission.taskDeadline, submission.isPendingTask, submission.isLate)}
                        {submission.statusId === STATUS_CONSTANTS.TASK_REJECTED && " (Can Resubmit)"}
                      </div>
                    </div>

                    {submission.taskDescription && (
                      <p className="task-description-compact">{submission.taskDescription}</p>
                    )}

                    <div className="task-meta-compact">
                      <div className="meta-item-compact">
                        <span className="meta-label-compact">Team:</span>
                        <span className="meta-value-compact">#{submission.teamId}</span>
                      </div>

                      <div className="meta-item-compact">
                        <span className="meta-label-compact">Leader:</span>
                        <span className="meta-value-compact">
                          {submission.teamLeaderName || `#${submission.teamLeaderId}`}
                        </span>
                      </div>

                      {submission.gradeName && (
                        <div className="meta-item-compact">
                          <span className="meta-label-compact">Grade:</span>
                          <span className="meta-value-compact">{submission.gradeName}</span>
                        </div>
                      )}

                      {submission.className && (
                        <div className="meta-item-compact">
                          <span className="meta-label-compact">Class:</span>
                          <span className="meta-value-compact">{submission.className}</span>
                        </div>
                      )}

                      {submission.submittedDate ? (
                        <>
                          <div className="meta-item-compact">
                            <span className="meta-label-compact">Submitted:</span>
                            <span className="meta-value-compact">
                              {formatCairoDateOnly(submission.submittedDate)}
                            </span>
                          </div>

                          <div className="meta-item-compact">
                            <span className="meta-label-compact">Time:</span>
                            <span className="meta-value-compact">
                              {formatCairoTimeOnly(submission.submittedDate)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="meta-item-compact">
                          <span className="meta-label-compact">Status:</span>
                          <span className="meta-value-compact">
                            {submission.isPendingTask ? "Not Submitted" : "N/A"}
                          </span>
                        </div>
                      )}
                    </div>

                    {(submission.glink || submission.note) ? (
                      <div className="submission-attachments">
                        {submission.glink && (
                          <div className="attachment-item">
                            <LinkIcon size={16} />
                            <a href={submission.glink} target="_blank" rel="noreferrer" className="attachment-link">
                              View Submission Link
                            </a>
                          </div>
                        )}
                        {submission.note && (
                          <div className="attachment-item">
                            <StickyNote size={16} />
                            <span className="attachment-note">{submission.note}</span>
                          </div>
                        )}
                      </div>
                    ) : submission.isPendingTask ? (
                      <div className="submission-attachments">
                        <div className="attachment-item">
                          <Clock size={16} />
                          <span className="attachment-note">Task pending - no submission yet</span>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="task-actions">
                    {!submission.isPendingTask ? (
                      <>
                        <button
                          className={`task-action-btn view-btn ${selectedTask?.id === submission.id ? "active" : ""}`}
                          onClick={() => setSelectedTask(selectedTask?.id === submission.id ? null : submission)}
                        >
                          <Eye size={16} />
                          {selectedTask?.id === submission.id ? "Hide Feedback" : "View Feedback"}
                        </button>

                        {(submission.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_ON_TIME || submission.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_LATE) && (
                          <button
                            className="task-action-btn complete-btn"
                            onClick={() => handleMarkCompleted(submission.id)}
                          >
                            <CheckCircle size={16} />
                            Mark Complete
                          </button>
                        )}

                        {(submission.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_ON_TIME || submission.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_LATE) && (
                          <button
                            className="task-action-btn reject-btn"
                            onClick={() => {
                              console.log(
                                "Reject button clicked for submission:",
                                submission.id,
                                "with status:",
                                submission.statusId,
                              )
                              handleRejectTask(submission.id)
                            }}
                          >
                            <X size={16} />
                            Reject
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="task-action-info">
                        <Clock size={16} />
                        <span>Task pending - no actions available</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedTask?.id === submission.id &&
                  (submission.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_ON_TIME || submission.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_LATE || submission.statusId === STATUS_CONSTANTS.TASK_COMPLETED || submission.statusId === STATUS_CONSTANTS.TASK_REJECTED) && (
                    <div className="submission-details">
                      <div className="details-grid">
                        <div className="details-section feedback-section">
                          <h4>Previous Feedback</h4>
                          <div className="feedback-display">
                            {submission.feedback && submission.feedback.trim() && submission.feedback !== "8" ? (
                              <p className="feedback-text">{submission.feedback}</p>
                            ) : (
                              <p className="feedback-text no-feedback">No previous feedback provided</p>
                            )}
                          </div>
                        </div>

                        {(submission.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_ON_TIME || submission.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_LATE || submission.statusId === STATUS_CONSTANTS.TASK_REJECTED) && (
                          <div className="details-section new-feedback-section">
                            <h4>Add New Feedback</h4>
                            <div className="feedback-input-container">
                              <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Enter your feedback here..."
                                className="feedback-textarea"
                                rows="4"
                              />
                              <div className="feedback-actions">
                                <button
                                  className="submit-feedback-btn"
                                  onClick={() => handleAddFeedback(submission.id, feedback)}
                                  disabled={!String(feedback || "").trim()}
                                >
                                  <Send size={16} />
                                  Add Feedback Only
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            ))
          )}
        </div>
      )}

      {viewMode === "team-info" && (
        <div className="team-info-view">
          {loading ? (
            <div className="loading-container">
              <Loader2 size={24} className="animate-spin" />
              <p>Loading team information...</p>
            </div>
          ) : selectedTeam ? (
            <div className="team-info-container">
              <div className="team-info-header">
                <h2>{selectedTeam.teamName}</h2>
                <p className="project-name">Project: {selectedTeam.teamName} Capstone Project</p>
              </div>

              <div className="team-info-sections">
                <div className="team-section">
                  <h3>Team Members</h3>
                  <div className="team-members-list">
                    {selectedTeam.teamMembers?.map((member, index) => (
                      <div key={index} className="team-member-item">
                        <div className="member-avatar">{member.fullName?.charAt(0) || "M"}</div>
                        <div className="member-info">
                          <span className="member-name">{member.fullName || `Member ${index + 1}`}</span>
                          <span className="member-role">{member.role || "Team Member"}</span>
                          <span className="member-reports-count">
                            <FileText size={14} />
                            {member.reportsCount || 0} reports
                          </span>
                        </div>
                        <div className="member-actions">
                          <button 
                            className="view-reports-btn"
                            onClick={() => handleViewStudentReports(member)}
                          >
                            <Eye size={14} />
                            View Reports
                          </button>
                          {(() => {
                            const studentReports = getStudentReports(member.id);
                            const hasUnreviewedReports = studentReports.some(report => report.statusId === STATUS_CONSTANTS.REPORT_SUBMITTED);
                           
                          })()}
                        </div>
                      </div>
                    )) || <p className="no-members">No team members found</p>}
                  </div>
                </div>

                <div className="team-section">
                  <h3>Reviewers</h3>
                  <div className="reviewers-list">
                    {selectedTeam.reviewers?.map((reviewer, index) => (
                      <div key={index} className="reviewer-item">
                        <div className="reviewer-avatar">{reviewer.fullName?.charAt(0) || "R"}</div>
                        <div className="reviewer-info">
                          <span className="reviewer-name">{reviewer.fullName || `Reviewer ${index + 1}`}</span>
                          <span className="reviewer-role">{reviewer.role || "Reviewer"}</span>
                        </div>
                      </div>
                    )) || <p className="no-reviewers">No reviewers assigned</p>}
                  </div>
                </div>

                <div className="team-section">
                  <h3>Supervisors</h3>
                  <div className="supervisors-list">
                    {selectedTeam.supervisor?.length > 0 ? (
                      selectedTeam.supervisor.map((supervisor, index) => (
                        <div key={index} className="supervisor-item">
                          <div className="supervisor-avatar">
                            {supervisor?.fullName?.charAt(0) || "S"}
                          </div>
                          <div className="supervisor-details">
                            <span className="supervisor-name">
                              {supervisor?.fullName || `Supervisor ${index + 1}`}
                            </span>
                            <span className="supervisor-role">{supervisor?.role || "Capstone Supervisor"}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-supervisor">No supervisors assigned</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-results">
              <p>No team selected</p>
            </div>
          )}
        </div>
      )}

      {viewMode === "student-reports" && (
        <div className="student-reports-view">
          {loading ? (
            <div className="loading-container">
              <Loader2 size={24} className="animate-spin" />
              <p>Loading student reports...</p>
            </div>
          ) : selectedStudent ? (
            <div className="student-reports-container">
              <div className="student-reports-header">
                <h2>{selectedStudent.fullName || "Student"} Reports</h2>
              </div>

              <div className="reports-list">
                {(() => {
                  const studentReports = getStudentReports(selectedStudent.id);
                  return studentReports.length === 0 ? (
                    <div className="no-reports">
                      <p>No reports found for {selectedStudent.fullName || "this student"}.</p>
                    </div>
                  ) : (
                    studentReports.map((report) => (
                      <div key={report.id} className="report-item">
                        <div className="report-header">
                          <h4>{report.reportTitle}</h4>
                          <div className="report-status">
                            <span className="status-text">
                              {report.statusId === STATUS_CONSTANTS.REPORT_SUBMITTED ? "Submitted" : 
                               report.statusId === STATUS_CONSTANTS.REPORT_UNDER_REVIEW ? "Reviewed" : 
                               report.statusId === STATUS_CONSTANTS.REPORT_CONFIRMED ? "Mark as Reviewed" :
                               report.status}
                            </span>
                            <span className="status-icon">
                              {report.statusId === STATUS_CONSTANTS.REPORT_SUBMITTED ? <CheckCircle size={12} /> : 
                               report.statusId === STATUS_CONSTANTS.REPORT_UNDER_REVIEW ? <CheckCircle size={12} /> : 
                               report.statusId === STATUS_CONSTANTS.REPORT_CONFIRMED ? <CheckCircle size={12} /> :
                               <Clock size={12} />}
                            </span>
                          </div>
                        </div>
                        <div className="report-content">
                          <p>{report.reportContent}</p>
                          <div className="report-meta">
                            <span className="report-date">Submitted on {formatCairoDateOnly(report.submittedDate)}</span>
                            {report.statusId !== STATUS_CONSTANTS.REPORT_CONFIRMED && (
                              <button 
                                className="confirm-report-btn"
                                onClick={() => handleConfirmSingleReport(report.id)}
                                title="Mark as reviewed"
                                disabled={confirmingReportId === report.id}
                              >
                                {confirmingReportId === report.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <CheckCircle size={14} />
                                )}
                                {confirmingReportId === report.id ? "Marking as Reviewed..." : "Mark as Reviewed"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="no-results">
              <p>No student selected</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ViewTasks

// Note: This component now receives dynamic user data from the Dashboard
// No more hardcoded fallback values, uses currentUserId prop instead
