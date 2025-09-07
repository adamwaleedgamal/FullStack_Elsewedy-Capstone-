"use client"

/**
 * TeamsProgress Component - Role-Based Access Control
 *
 * Student: No restrictions - can see all teams
 * Engineer: Can only see teams from classes assigned to them via ReviewerSupervisorExtension
 * Super Admin: No restrictions - can see all teams
 */

import { useState, useEffect } from "react"
import { Search, Users, Building, Grid, ChevronLeft, AlertTriangle } from "lucide-react"
import axios from "axios"
import { useNotification } from "../../contexts/NotificationContext"
import { parseISO, format } from "date-fns"
import { isStudent, isEngineer, isReviewer } from "../../utils/roleUtils"
import { STATUS_CONSTANTS } from "../../utils/statusConstants"
import "./TeamsProgress.css"

const TeamsProgress = ({ setCurrentPage, currentUserId = null, user = null }) => {
  const [teams, setTeams] = useState([])
  const [tasks, setTasks] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [grades, setGrades] = useState([])
  const [classes, setClasses] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [viewMode, setViewMode] = useState("teams") // 'teams' or 'grid'
  const [searchTerm, setSearchTerm] = useState("")
  const [filterGrade, setFilterGrade] = useState("")
  const [studentTeam, setStudentTeam] = useState(null)
  const { showError, showSuccess } = useNotification()

  const API_BASE_URL = "http://localhost:5048/api"

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Determine which teams endpoint to use based on user role
      let teamsEndpoint = `${API_BASE_URL}/Teams`
      if ((isEngineer(user) || isReviewer(user)) && currentUserId) {
        teamsEndpoint = `${API_BASE_URL}/Teams/ByEngineer/${currentUserId}`
        console.log(`TeamsProgress - Using engineer/reviewer-specific endpoint: ${teamsEndpoint}`)
      }

      // Fetch all data in parallel
      const [teamsRes, tasksRes, submissionsRes, gradesRes, classesRes, teamMembersRes] = await Promise.all([
        axios.get(teamsEndpoint),
        axios.get(`${API_BASE_URL}/AccountTask`),
        axios.get(`${API_BASE_URL}/TaskSubmissions`),
        axios.get(`${API_BASE_URL}/Grades`),
        axios.get(`${API_BASE_URL}/Class`),
        axios.get(`${API_BASE_URL}/TeamMembers`),
      ])

      // Helper function to extract array from response with better error handling
      const extractArray = (data) => {
        try {
          if (Array.isArray(data)) {
            return data
          } else if (data && typeof data === "object") {
            // Try different possible property names
            const extracted = data.$values || data.data || data.teams || data.results || data.items || []

            // If still not an array, try to convert object to array
            if (!Array.isArray(extracted) && data && typeof data === "object") {
              // Check if it's an object with numeric keys
              const keys = Object.keys(data)
              if (keys.length > 0 && keys.every((key) => !isNaN(key))) {
                return Object.values(data)
              }
            }

            return extracted
          }
          return []
        } catch (error) {
          console.error("Error extracting array:", error)
          return []
        }
      }

      // Process data
      console.log("TeamsProgress - Raw teams response:", teamsRes.data)
      console.log(
        "TeamsProgress - Teams response type:",
        typeof teamsRes.data,
        "Is array:",
        Array.isArray(teamsRes.data),
      )

      const teamsData = extractArray(teamsRes.data)
      console.log("TeamsProgress - Extracted teams data:", teamsData)
      console.log("TeamsProgress - Teams data type:", typeof teamsData, "Is array:", Array.isArray(teamsData))

      const tasksData = extractArray(tasksRes.data)
      const submissionsData = extractArray(submissionsRes.data)
      const gradesData = extractArray(gradesRes.data)
      const classesData = extractArray(classesRes.data)
      const teamMembersData = extractArray(teamMembersRes.data)

      // Process teams with class and grade info
      const processedTeams = teamsData.map((team) => {
        const classInfo = classesData.find((c) => c.id === team.classId || c.Id === team.ClassId)
        
        // Use gradeId directly from team data (from API) if available, otherwise fallback to classInfo
        const teamGradeId = team.gradeId || team.GradeId || classInfo?.gradeId || classInfo?.GradeId
        const gradeInfo = gradesData.find((g) => g.id === teamGradeId || g.Id === teamGradeId)

        // Debug logging for grade information
        console.log(`TeamsProgress - Processing team ${team.teamName || team.TeamName}:`, {
          teamGradeId: teamGradeId,
          teamGradeName: team.gradeName || team.GradeName,
          classInfoGradeId: classInfo?.gradeId || classInfo?.GradeId,
          gradeInfoName: gradeInfo?.gradeName || gradeInfo?.GradeName,
          finalGradeId: teamGradeId,
          finalGradeName: team.gradeName || team.GradeName || gradeInfo?.gradeName || gradeInfo?.GradeName || "Unknown"
        })

        return {
          id: team.teamId || team.id || team.Id,
          name: team.teamName || team.TeamName,
          classId: team.classId || team.ClassId,
          className: team.className || team.ClassName || classInfo?.className || classInfo?.ClassName || "Unknown",
          gradeId: teamGradeId,
          gradeName: team.gradeName || team.GradeName || gradeInfo?.gradeName || gradeInfo?.GradeName || "Unknown",
          SupervisorAccountId: team.SupervisorAccountId || team.supervisorAccountId || team.supervisorAccountId || null,
        }
      })

      // Process tasks
      const processedTasks = tasksData.map((task) => ({
        id: task.id || task.Id,
        name: task.taskName || task.TaskName,
        description: task.taskDescription || task.TaskDescription,
        deadline: task.taskDeadline || task.TaskDeadline,
        gradeId: task.gradeId || task.GradeId,
      }))

      // Process submissions
      const processedSubmissions = submissionsData.map((submission) => ({
        id: submission.taskSubmissionId || submission.TaskSubmissionId || submission.id,
        taskId: submission.taskId || submission.TaskId,
        teamId: submission.teamId || submission.TeamId,
        statusId: submission.statusId || submission.StatusId,
        submittedDate:
          submission.createdAt || submission.CreatedAt || submission.submittedDate || submission.SubmittedDate,
      }))

      // Process team members
      const processedTeamMembers = teamMembersData.map((member) => ({
        id: member.teamMemberAccountId || member.TeamMemberAccountId,
        teamId: member.teamId || member.TeamId,
        name: member.memberName || member.MemberName || `Member ${member.teamMemberAccountId}`,
        role: member.teamMemberDescription || member.TeamMemberDescription || "Team Member",
      }))

      setTeams(processedTeams)
      setTasks(processedTasks)
      setSubmissions(processedSubmissions)
      setGrades(gradesData)
      setClasses(classesData)
      setTeamMembers(processedTeamMembers)

      // If user is a student, find their team and set it automatically
      if (isStudent(user) && currentUserId) {
        const userTeamMember = processedTeamMembers.find(tm => tm.id === currentUserId)
        if (userTeamMember) {
          const userTeam = processedTeams.find(team => team.id === userTeamMember.teamId)
          if (userTeam) {
            setStudentTeam(userTeam)
            setSelectedTeam(userTeam)
            setViewMode("grid")
          }
        }
      }

      // Debug: Log SupervisorAccountId in raw teams data
      console.log("TeamsProgress - Raw teams data type:", typeof teamsData, "Is array:", Array.isArray(teamsData))
      console.log("TeamsProgress - Raw teams data structure:", teamsData)

      // Safely handle teams data
      let teamsWithSupervisor = []
      if (Array.isArray(teamsData)) {
        teamsWithSupervisor = teamsData.filter((t) => t.SupervisorAccountId || t.supervisorAccountId)
      } else if (teamsData && typeof teamsData === "object") {
        // Handle case where data might be wrapped in an object
        const teamsArray = teamsData.$values || teamsData.data || teamsData.teams || []
        if (Array.isArray(teamsArray)) {
          teamsWithSupervisor = teamsArray.filter((t) => t.SupervisorAccountId || t.supervisorAccountId)
        }
      }

      console.log(
        "TeamsProgress - Teams with SupervisorAccountId:",
        teamsWithSupervisor.map((t) => ({
          teamId: t.teamId || t.id || t.Id,
          teamName: t.teamName || t.TeamName,
          SupervisorAccountId: t.SupervisorAccountId || t.supervisorAccountId,
        })),
      )

      console.log("Data loaded:", {
        teams: processedTeams,
        tasks: processedTasks,
        submissions: processedSubmissions,
        teamMembers: processedTeamMembers,
      })
    } catch (error) {
      console.error("Error fetching data:", error)
      showError("Failed to load data. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const selectTeam = (team) => {
    setSelectedTeam(team)
    setViewMode("grid")
  }

  // SECURITY: Deadline checking is now handled by the server
  // Client-side deadline checking can be manipulated by users
  // Always rely on server-side validation for security

  const getTaskStatus = (taskId, teamId) => {
    const submission = submissions.find((s) => s.taskId === taskId && s.teamId === teamId)
    const task = tasks.find((t) => t.id === taskId)

    // Default status is "Pending" (like PhasesPage)
    let status = "not-completed-yet"

    if (submission) {
      // SECURITY: Use server-provided isLate instead of client-side deadline checking
      switch (submission.statusId) {
        case STATUS_CONSTANTS.TASK_SUBMITTED_ON_TIME: // 10
          status = task?.isLate ? "submitted-late" : "submitted"
          break
        case STATUS_CONSTANTS.TASK_COMPLETED: // 12
          status = task?.isLate ? "completed-late" : "completed-on-time"
          break
        case STATUS_CONSTANTS.TASK_REJECTED: // 6
          status = "rejected"
          break
        case STATUS_CONSTANTS.TASK_PENDING: // 1
          status = "not-completed-yet"
          break
        case STATUS_CONSTANTS.TASK_SUBMITTED_LATE: // 11
          status = "submitted-late"
          break
        case STATUS_CONSTANTS.TASK_COMPLETED_LATE: // 13
          status = "completed-late"
          break
        default:
          status = "not-completed-yet"
          break
      }
    } else {
      // No submission exists - this is a pending task
      // SECURITY: Use server-provided isLate instead of client-side deadline checking
      if (task?.isLate) {
        status = "deadline-passed" // Red for deadline passed without submission
      } else {
        status = "pending" // Gray for pending tasks (deadline not passed)
      }
    }

    console.log(
      `Task ${taskId} for team ${teamId}: submission=${submission?.statusId}, deadline=${task?.deadline}, isLate=${task?.isLate}, finalStatus=${status}`,
    )

    return status
  }

  const getStatusBox = (status) => {
    switch (status) {
      case "completed-on-time":
        return <div className="status-box completed-on-time" title="Completed on time"></div>
      case "completed-late":
        return <div className="status-box completed-late" title="Completed late"></div>
      case "submitted":
        return <div className="status-box submitted" title="Submitted"></div>
      case "submitted-late":
        return <div className="status-box submitted-late" title="Submitted late"></div>
      case "rejected":
        return <div className="status-box rejected" title="Rejected"></div>
      case "deadline-passed":
        return <div className="status-box deadline-passed" title="Deadline passed"></div>
      case "pending":
        return <div className="status-box pending" title="Pending"></div>
      case "not-completed-yet":
        return <div className="status-box not-completed-yet" title="Not completed yet"></div>
      default:
        return <div className="status-box not-completed-yet" title="Unknown status"></div>
    }
  }

  // Debug logging for role-based filtering
  console.log("TeamsProgress - User role filtering:", {
    userRole: user?.role,
    currentUserId,
    totalTeams: teams.length,
    teamsWithSupervisor: teams
      .filter((t) => t.SupervisorAccountId)
      .map((t) => ({
        teamId: t.id,
        teamName: t.name,
        SupervisorAccountId: t.SupervisorAccountId,
      })),
  })

  const filteredTeams = teams.filter((team) => {
    // Engineer: Teams are already filtered by the API endpoint based on assigned classes
    // Role ID = 1 (Admin): Show all teams (no restrictions)
    // Role ID = 4 (Student): Show all teams (no restrictions)

    const matchesSearch =
      team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.className?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGrade = !filterGrade || team.gradeId === Number.parseInt(filterGrade)
    return matchesSearch && matchesGrade
  })

  const renderTeamsView = () => {
    // If user is a student and has a team, show a message that they'll be redirected to their team
    if (isStudent(user) && studentTeam) {
      return (
        <div className="teams-view">
          <div className="head">
            <h1>Teams Progress</h1>
          </div>
          <div className="student-redirect-message">
            <Users size={48} />
            <h3>Redirecting to your team...</h3>
            <p>You will be automatically shown your team's progress grid.</p>
          </div>
        </div>
      )
    }

    return (
      <div className="teams-view">
        <div className="head">
          <h1>Teams Progress</h1>
        </div>

        <div className="filters">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="grade-filter">
            <option value="">All Grades</option>
            {grades.map((grade) => (
              <option key={grade.id || grade.Id} value={grade.id || grade.Id}>
                {grade.gradeName || grade.GradeName}
              </option>
            ))}
          </select>
        </div>

        <div className="teams-grid">
          {filteredTeams.map((team) => (
            <div key={team.id} className="team-card" onClick={() => selectTeam(team)}>
              <div className="team-header">
                <Building size={24} />
                <h3>{team.name}</h3>
              </div>
              <div className="team-info">
                <p>
                  <strong>Class:</strong> {team.className}
                </p>
                <p>
                  <strong>Grade:</strong> {team.gradeName}
                </p>
              </div>
              <div className="team-actions">
                <button className="view-grid-btn">
                  <Grid size={16} />
                  View Task Grid
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <div className="no-teams">
            {(isEngineer(user) || isReviewer(user)) ? (
              <>
                <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '16px' }} />
                <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>Access Restricted</h3>
                <p style={{ color: '#6b7280', marginBottom: '12px' }}>
                  You don't have access to any teams.
                </p>
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                  Please contact your administrator to assign you to the appropriate classes.
                </p>
              </>
            ) : (
              <>
                <Users size={48} />
                <h3>No teams found</h3>
                <p>Try adjusting your search or filters</p>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderTaskGrid = () => {
    if (!selectedTeam) return null

    // Get tasks for this team's grade
    const teamTasks = tasks.filter((task) => task.gradeId === selectedTeam.gradeId)
    // Get team members for this team
    const currentTeamMembers = teamMembers.filter((member) => member.teamId === selectedTeam.id)

    // Get all submissions for this team to see which tasks they have
    const teamSubmissions = submissions.filter((sub) => sub.teamId === selectedTeam.id)
    const teamTaskIds = [...new Set(teamSubmissions.map((sub) => sub.taskId))]

    console.log("Selected Team:", selectedTeam)
    console.log("All Tasks:", tasks)
    console.log("Team Tasks (filtered by grade):", teamTasks)
    console.log("Team Members:", currentTeamMembers)
    console.log("Team Submissions:", teamSubmissions)
    console.log("Team Task IDs:", teamTaskIds)

    return (
      <div className="task-grid-view">
        <div className="grid-header">
          {/* Only show back button for non-student users */}
          {!isStudent(user) && (
            <button className="back-btn" onClick={() => setViewMode("teams")}>
              <ChevronLeft size={20} />
              Back to Teams
            </button>
          )}
          <h2>Task Status Grid - {selectedTeam.name}</h2>
          <div className="legend">
            <div className="legend-item">
              <div className="status-box completed-on-time"></div>
              <span>Completed (On Time)</span>
            </div>
            <div className="legend-item">
              <div className="status-box completed-late"></div>
              <span>Completed Late</span>
            </div>
            <div className="legend-item">
              <div className="status-box submitted"></div>
              <span>Submitted</span>
            </div>
            <div className="legend-item">
              <div className="status-box submitted-late"></div>
              <span>Submitted Late</span>
            </div>
            <div className="legend-item">
              <div className="status-box deadline-passed"></div>
              <span>Deadline Passed</span>
            </div>
            <div className="legend-item">
              <div className="status-box not-completed-yet"></div>
              <span>Pending</span>
            </div>
            <div className="legend-item">
              <div className="status-box rejected"></div>
              <span>Rejected</span>
            </div>
          </div>
        </div>

        <div className="task-grid">
          {/* Header row */}
          <div className="grid-row header-row">
            {teamTasks.map((task) => (
              <div key={task.id} className="grid-cell header-cell task-header">
                <div className="task-name">{task.name}</div>
                <div className="task-deadline">
                  {task.deadline ? format(parseISO(task.deadline), "MMM dd, yyyy") : "No deadline"}
                </div>
              </div>
            ))}
          </div>

          {/* Single data row for team */}
          <div className="grid-row data-row">
            {teamTasks.map((task) => {
              const status = getTaskStatus(task.id, selectedTeam.id)
              console.log(`Task ${task.id} status: ${status}`)
              return (
                <div key={task.id} className="grid-cell status-cell">
                  {getStatusBox(status)}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="teams-progress-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">
            <div className="loading-title">Loading Teams Data</div>
            <div className="loading-subtitle">Please wait while we fetch teams information...</div>
          </div>
        </div>
      </div>
    )
  }

  return <div className="teams-progress-container">{viewMode === "teams" ? renderTeamsView() : renderTaskGrid()}</div>
}

export default TeamsProgress
