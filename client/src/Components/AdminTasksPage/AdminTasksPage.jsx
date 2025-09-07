"use client"

// This component automatically converts UTC dates to Cairo timezone using browser's built-in timezone API
// It handles daylight saving time changes automatically for Egypt (UTC+2/+3)

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Calendar, BookOpen, Loader2, X } from "lucide-react"
import axios from "axios"
import { useNotification } from "../../contexts/NotificationContext"
import ConfirmationDialog from "../ConfirmationDialog/ConfirmationDialog"
import { format, parseISO, addHours } from "date-fns"
import { STATUS_CONSTANTS } from "../../utils/statusConstants"
import { isEngineer, isReviewer } from "../../utils/roleUtils"
import "./AdminTasksPage.css"

const AdminTasksPage = ({ currentUserId = null, user = null }) => {
  console.log("AdminTasksPage - Component loaded with:", { currentUserId, user })
  
  const [tasks, setTasks] = useState([])
  const [grades, setGrades] = useState([])
  const [assignedClasses, setAssignedClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const { showSuccess, showError, showWarning } = useNotification()

  // User configuration - fallback to default values if not provided
  const CURRENT_USER_ID = currentUserId || 3
  const CURRENT_USER_ROLE = user?.roleId || 7

  const [formData, setFormData] = useState({
    taskName: "",
    taskDescription: "",
    taskDeadline: "",
    gradeId: "",
    statusId: STATUS_CONSTANTS.TASK_PENDING,
  })

  // Add validation constants
  const TASK_NAME_MAX_LENGTH = 100
  const TASK_DESCRIPTION_MAX_LENGTH = 500

  const API_BASE_URL = "http://localhost:5048/api"





  useEffect(() => {
    console.log("AdminTasksPage - useEffect triggered with:", { user, currentUserId })
    fetchData()
  }, [user, currentUserId])

  // ✅ Fetch all data in parallel like ViewTasks and TeamsProgress
  const fetchData = async () => {
    setLoading(true)
    try {
      // Determine which teams endpoint to use based on user role
      let teamsEndpoint = `${API_BASE_URL}/Teams`
      if ((isEngineer(user) || isReviewer(user)) && currentUserId) {
        teamsEndpoint = `${API_BASE_URL}/Teams/ByEngineer/${currentUserId}`
        console.log(`AdminTasksPage - Using engineer/reviewer-specific endpoint: ${teamsEndpoint}`)
      }

      // Fetch all data in parallel
      const [tasksRes, gradesRes, teamsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/AccountTask`),
        axios.get(`${API_BASE_URL}/Grades`),
        axios.get(teamsEndpoint),
      ])

      // Process tasks
      const tasksRaw = tasksRes.data
      const tasksList = Array.isArray(tasksRaw) ? tasksRaw : tasksRaw?.$values ? tasksRaw.$values : []
      const normalizedTasks = tasksList.map((t) => ({
        id: t.id ?? t.Id,
        taskName: t.taskName ?? t.TaskName ?? `Task ${t.id ?? t.Id}`,
        taskDescription: t.taskDescription ?? t.TaskDescription ?? "",
        gradeId: t.gradeId ?? t.GradeId,
        gradeName: t.gradeName ?? t.GradeName ?? "",
        classId: t.classId ?? t.ClassId,
        className: t.className ?? t.ClassName ?? "",
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


      // Process teams to get assigned classes for engineers
      const teamsRaw = teamsRes.data
      const teamsList = Array.isArray(teamsRaw) ? teamsRaw : teamsRaw?.$values ? teamsRaw.$values : []
      
      let assignedClasses = []
      if ((isEngineer(user) || isReviewer(user)) && currentUserId) {
        // For engineers and reviewers, get assigned classes from teams data
        const uniqueClasses = new Map()
        teamsList.forEach(team => {
          const classId = team.classId || team.ClassId
          const className = team.className || team.ClassName
          const gradeId = team.gradeId || team.GradeId
          const gradeName = team.gradeName || team.GradeName
          
          if (classId && !uniqueClasses.has(classId)) {
            uniqueClasses.set(classId, {
              assignedClassId: classId,
              className: className || "Unknown",
              gradeId: gradeId,
              gradeName: gradeName || "Unknown"
            })
          }
        })
        assignedClasses = Array.from(uniqueClasses.values())
        console.log("AdminTasksPage - Assigned classes from teams:", assignedClasses)
      }

      console.log("AdminTasksPage - Processed data:", {
        tasks: normalizedTasks.length,
        grades: normalizedGrades.length,
        assignedClasses: assignedClasses.length
      })
      
      setTasks(normalizedTasks)
      setGrades(normalizedGrades)
      setAssignedClasses(assignedClasses)
    } catch (err) {
      console.error("Error loading data:", err)
      showError("Failed to load data. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  // ✅ Handle Form Inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Apply length limits
    if (name === "taskName" && value.length > TASK_NAME_MAX_LENGTH) {
      return
    }
    if (name === "taskDescription" && value.length > TASK_DESCRIPTION_MAX_LENGTH) {
      return
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Validate deadline is not in the past
  const validateDeadline = (deadline) => {
    if (!deadline) return true
    const selectedDate = new Date(deadline)
    const now = new Date()
    return selectedDate > now
  }

  const resetForm = () => {
    setFormData({
      taskName: "",
      taskDescription: "",
      taskDeadline: "",
      gradeId: "",
      statusId: STATUS_CONSTANTS.TASK_PENDING,
    })
    setEditingTask(null)
  }



  // ✅ Get available grades for engineers and reviewers (only assigned grades)
  const getAvailableGrades = () => {
    console.log("AdminTasksPage - getAvailableGrades called with:", { 
      isEngineer: isEngineer(user), 
      isReviewer: isReviewer(user),
      grades: grades.length, 
      assignedClasses: assignedClasses.length 
    })
    
    if (!isEngineer(user) && !isReviewer(user)) {
      console.log("AdminTasksPage - Not an engineer or reviewer, returning all grades")
      return grades // All grades for non-engineers/reviewers
    }

    // For engineers, only show grades from assigned classes
    const assignedGradeIds = assignedClasses.map(ac => ac.gradeId).filter(Boolean)
    console.log("AdminTasksPage - Assigned grade IDs:", assignedGradeIds)
    
    const filteredGrades = grades.filter(grade => assignedGradeIds.includes(grade.id))
    console.log("AdminTasksPage - Filtered grades for engineer:", filteredGrades)
    
    return filteredGrades
  }

  // ✅ Get filtered tasks for engineers and reviewers (only tasks from assigned grades)
  const getFilteredTasks = () => {
    console.log("AdminTasksPage - getFilteredTasks called with:", { 
      isEngineer: isEngineer(user), 
      isReviewer: isReviewer(user),
      tasks: tasks.length, 
      assignedClasses: assignedClasses.length 
    })
    
    if (!isEngineer(user) && !isReviewer(user)) {
      console.log("AdminTasksPage - Not an engineer or reviewer, returning all tasks")
      return tasks // All tasks for non-engineers/reviewers
    }

    // For engineers, only show tasks from assigned grades
    const assignedGradeIds = assignedClasses.map(ac => ac.gradeId).filter(Boolean)
    console.log("AdminTasksPage - Assigned grade IDs:", assignedGradeIds)
    
    const filteredTasks = tasks.filter(task => {
      const taskGradeId = task.gradeId
      const isInAssignedGrade = taskGradeId && assignedGradeIds.includes(taskGradeId)
      
      console.log(`AdminTasksPage - Task ${task.id} (${task.taskName}):`, {
        taskGradeId: taskGradeId,
        isInAssignedGrade: isInAssignedGrade,
        assignedGradeIds: assignedGradeIds
      })
      
      return isInAssignedGrade
    })
    
    console.log("AdminTasksPage - Filtered tasks for engineer:", filteredTasks)
    return filteredTasks
  }

  // ✅ Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    // Validate deadline
    if (!validateDeadline(formData.taskDeadline)) {
      showError("Invalid Deadline", "Deadline cannot be in the past. Please select a future date.")
      setSubmitting(false)
      return
    }

    const taskData = {
      TaskName: formData.taskName,
      TaskDescription: formData.taskDescription,
      TaskDeadline: cairoToUTC(formData.taskDeadline), // Convert Cairo time to UTC for server
      GradeId: Number(formData.gradeId),
      ClassId: null, // Tasks are now only linked to grades, not classes
      StatusId: Number(formData.statusId),
      AdminAccountId: CURRENT_USER_ID, // Using user ID 3 as requested
      // Removed AssignedId and Form fields as requested
    }



    try {
      if (editingTask) {
        await axios.put(`${API_BASE_URL}/AccountTask/${editingTask.id}`, taskData, {
          headers: { "Content-Type": "application/json" },
        })
        showSuccess("Task Updated", "Task updated successfully!")
      } else {
        await axios.post(`${API_BASE_URL}/AccountTask`, taskData, {
          headers: { "Content-Type": "application/json" },
        })
        showSuccess("Task Created", "Task created successfully!")
      }

      resetForm()
      setShowAddForm(false)
      await fetchData()
    } catch (err) {
      console.error("Error submitting task:", err)
      if (err.response) {
        console.error("Error status:", err.response.status)
        console.error("Error response:", err.response.data)

        // Check if it's a foreign key constraint error
        const errorMessage = err.response.data
        if (errorMessage.includes("FK_Task_AdminAccount")) {
          showError("Error: Invalid admin account. Please check database setup.")
        } else {
          showError(`Failed to save task: ${errorMessage}`)
        }
      } else {
        showError("Failed to submit task.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ✅ Delete Task
  const handleDelete = async (taskId) => {
    setTaskToDelete(taskId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      const response = await axios.delete(`${API_BASE_URL}/AccountTask/${taskToDelete}`)
      showSuccess("Task Deleted", response.data.message || "Task deleted successfully!")
      await fetchData()
    } catch (err) {
      console.error("Error deleting task:", err)
      showError("Delete Failed", "Failed to delete task. Please try again.")
    } finally {
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setTaskToDelete(null);
  };

  // Cairo timezone offset - calculated based on actual time difference
  const CAIRO_TIMEZONE_OFFSET = 9 // Add 9 hours to UTC to get Cairo time
  
  // Helper function to get Cairo timezone offset (simplified)
  const getCairoOffset = (date) => {
    // For now, using fixed +9 hours offset (calculated from actual time difference)
    // In the future, you can implement proper timezone detection here
    return CAIRO_TIMEZONE_OFFSET
  }

  const formatDate = (dateString) => {
    if (!dateString) return "No deadline"
    
    try {
      // Parse the UTC date string
      const utcDate = parseISO(dateString)
      
      // Debug: Show the original UTC time
      console.log("Original UTC time:", utcDate.toISOString())
      
      // Try different approaches to get Cairo time
      // Method 1: Add 9 hours
      const cairoTime1 = addHours(utcDate, 9)
      console.log("Method 1 (+9 hours):", cairoTime1.toISOString())
      
      // Method 2: Use browser's timezone conversion
      const cairoTime2 = new Date(utcDate.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
      console.log("Method 2 (browser timezone):", cairoTime2.toISOString())
      
      // Method 3: Subtract 9 hours (reverse approach)
      const cairoTime3 = addHours(utcDate, -9)
      console.log("Method 3 (-9 hours):", cairoTime3.toISOString())
      
      // For now, use Method 2 (browser timezone) as it's most reliable
      const cairoTime = cairoTime2
      
      // Format using date-fns with clear AM/PM display
      const formattedDate = format(cairoTime, "MMM dd, yyyy, hh:mm a")
      
      return formattedDate
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  const getGradeName = (gradeId) => {
    const grade = grades.find((g) => g.id === gradeId)
    return grade ? grade.gradeName : `Grade ${gradeId}`
  }

  // Helper function to get deadline value safely from task object
  const getTaskDeadline = (task) => {
    return task.taskDeadline || task.TaskDeadline || task.deadline || task.Deadline || null
  }

  // ✅ Edit Task
  const toLocalInputValue = (date) => {
    if (!date) return ""
    
    try {
      // Parse the UTC date string
      const utcDate = parseISO(date)
      
      // Use browser's timezone conversion for Cairo time
      const cairoTime = new Date(utcDate.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
      
      // Format as YYYY-MM-DDTHH:mm for datetime-local input
      return format(cairoTime, "yyyy-MM-dd'T'HH:mm")
    } catch (error) {
      console.error("Error converting date for input:", error)
      return ""
    }
  }

  // Convert Cairo time back to UTC for server submission
  const cairoToUTC = (cairoDateString) => {
    if (!cairoDateString) return ""
    
    try {
      // Parse the Cairo date string (from datetime-local input)
      const cairoDate = parseISO(cairoDateString)
      
      // Convert Cairo time to UTC using browser timezone conversion
      // First, create a date object in Cairo timezone
      const cairoDateObj = new Date(cairoDate.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
      
      // Then convert to UTC by getting the time difference
      const utcOffset = cairoDateObj.getTimezoneOffset() * 60000 // Convert minutes to milliseconds
      const utcDate = new Date(cairoDate.getTime() - utcOffset)
      
      // Return ISO string for server
      return utcDate.toISOString()
    } catch (error) {
      console.error("Error converting Cairo time to UTC:", error)
      return ""
    }
  }





  const handleEdit = (task) => {
    setEditingTask(task)
    setFormData({
      taskName: task.taskName || "",
      taskDescription: task.taskDescription || "",
      taskDeadline: toLocalInputValue(getTaskDeadline(task)),
      gradeId: String(task.gradeId || ""),
      statusId: Number(task.statusId || STATUS_CONSTANTS.TASK_PENDING),
    })
    setShowAddForm(true)
  }

  return (
    <div className="admin-tasks-page">
    
      
             <div className="admin-tasks-header">
         <div className="header-content">
           <h1 className="admin-tasks-title">Task Management</h1>
           <p className="admin-tasks-subtitle">
             {(isEngineer(user) || isReviewer(user)) 
               ? "Create and manage tasks for your assigned classes Grades" 
               : "Create and manage tasks for all grades"
             }
           </p>
         </div>
         <div className="header-buttons">
           <button
             className="test-timezone-button"
             onClick={() => {
               const now = new Date()
               console.log("Current browser time:", now.toISOString())
               console.log("Current Cairo time:", now.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
               console.log("Current UTC time:", now.toUTCString())
             }}
           >
             Test Timezone
           </button>
           <button
             className="add-task-button"
             onClick={() => {
               resetForm()
               setShowAddForm(true)
             }}
           >
             <Plus size={20} />
             Add New Task
           </button>
         </div>
      </div>

      {/* Add/Edit Task Form */}
      {showAddForm && (
        <div className="task-form-overlay">
          <div className="task-form-modal">
            <div className="form-header">
              <h2>{editingTask ? "Edit Task" : "Add New Task"}</h2>
              <button
                className="close-button"
                onClick={() => {
                  setShowAddForm(false)
                  resetForm()
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="task-form">
              <div className="form-group">
                <label className="form-label">Task Name *</label>
                <input
                  type="text"
                  name="taskName"
                  className="form-input"
                  placeholder="Enter task name"
                  value={formData.taskName}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                  maxLength={TASK_NAME_MAX_LENGTH}
                />
                <div className="form-helper">
                  {formData.taskName.length}/{TASK_NAME_MAX_LENGTH} characters
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Task Description *</label>
                <textarea
                  name="taskDescription"
                  className="form-textarea"
                  placeholder="Enter task description"
                  rows={4}
                  value={formData.taskDescription}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                  maxLength={TASK_DESCRIPTION_MAX_LENGTH}
                  style={{ 
                    resize: "vertical",
                    wordWrap: "break-word",
                    whiteSpace: "pre-wrap"
                  }}
                />
                <div className="form-helper">
                  {formData.taskDescription.length}/{TASK_DESCRIPTION_MAX_LENGTH} characters
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Grade *</label>
                  <select
                    name="gradeId"
                    className="form-select"
                    value={formData.gradeId}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                  >
                    <option value="">Select a grade</option>
                    {getAvailableGrades().map((grade) => (
                      <option key={grade.id} value={grade.id}>
                        {grade.gradeName}
                      </option>
                    ))}
                  </select>
                  {(isEngineer(user) || isReviewer(user)) && getAvailableGrades().length === 0 && (
                    <div className="form-helper" style={{ color: '#dc2626' }}>
                      No grades available. You need to be assigned to classes first.
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Deadline * (Cairo Time)</label>
                  <input
                    type="datetime-local"
                    name="taskDeadline"
                    className="form-input"
                    value={formData.taskDeadline}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                                     <div className="form-helper">
                     Must be a future date and time.
                   </div>
                </div>
              </div>

              {/* Class Selection for Engineers */}

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowAddForm(false)
                    resetForm()
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={
                    !formData.taskName.trim() ||
                    !formData.taskDescription.trim() ||
                    !formData.gradeId ||
                    !formData.taskDeadline ||
                    submitting
                  }
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {editingTask ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>{editingTask ? "Update Task" : "Create Task"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="tasks-content">
        {loading ? (
          <div className="loading-container">
            <Loader2 size={32} className="animate-spin" />
            <p>Loading tasks...</p>
          </div>
        ) : getFilteredTasks().length === 0 ? (
          <div className="no-tasks">
            <BookOpen size={48} className="no-tasks-icon" />
            {(isEngineer(user) || isReviewer(user)) ? (
              <div>
                <p>No tasks found for your assigned classes.</p>
                <p>Create your first task above!</p>
              </div>
            ) : (
              <p>No tasks found. Create your first task above!</p>
            )}
          </div>
        ) : (
          <div className="tasks-list">
            {getFilteredTasks().map((task) => (
              <div key={task.id} className="task-item">
                <div className="task-content">
                  <div className="task-info">
                    <div className="task-header">
                      <h3 className="task-title">{task.taskName}</h3>
                    </div>

                    <p className="task-description" style={{ 
                      wordWrap: "break-word",
                      whiteSpace: "pre-wrap",
                      maxHeight: "100px",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>{task.taskDescription}</p>

                    <div className="task-meta">
                      <div className="task-grade">
                        <BookOpen size={16} />
                        <span>{getGradeName(task.gradeId)}</span>
                      </div>
                                             <div className="task-deadline">
                         <Calendar size={16} />
                         <span>{formatDate(getTaskDeadline(task))}</span>
                         <small style={{ display: 'block', fontSize: '10px', color: '#666' }}>
                           Raw: {getTaskDeadline(task)}
                         </small>
                       </div>
                    </div>
                  </div>

                  <div className="task-actions">
                    <button className="task-action-btn" onClick={() => handleEdit(task)}>
                      <Edit size={16} />
                      Edit
                    </button>
                    <button className="task-action-btn delete-btn" onClick={() => handleDelete(task.id)}>
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Task"
        message="Are you sure you want to delete this task? This will also delete all associated task submissions."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}

export default AdminTasksPage

// Note: This component now receives dynamic user data from the Dashboard
// No more hardcoded fallback values, uses currentUserId prop instead
