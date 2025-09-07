import React, { useState, useEffect } from "react";
import axios from "axios";
import { STATUS_CONSTANTS } from "../../utils/statusConstants";
import "./TimeManager.css";

const API_BASE_URL = "http://localhost:5048/api";

const TimeManager = ({ currentStudentId, user = null }) => {
  const [progress, setProgress] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [submittedTasks, setSubmittedTasks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState({
    completed: 0,
    submitted: 0,
    submittedLate: 0,
    completedLate: 0
  });

  useEffect(() => {
    const fetchTaskProgress = async () => {
      if (!currentStudentId) return;

              try {
          setLoading(true);
          console.log("TimeManager - Starting task progress fetch for user:", currentStudentId);
        
        // First, find the user's team
        let userTeam = null;
        
        // Try to find team by leader first
        try {
          const teamResponse = await axios.get(`${API_BASE_URL}/Teams/ByLeader/${currentStudentId}`);
          if (teamResponse.data) {
            userTeam = teamResponse.data;
            console.log("TimeManager - Found team by leader:", userTeam);
          }
        } catch (error) {
          console.log("TimeManager - User is not a team leader, checking team membership...");
        }
        
        // If not a leader, find team via team members
        if (!userTeam) {
          try {
            const teamMembersResponse = await axios.get(`${API_BASE_URL}/TeamMembers`);
            const teamMembers = teamMembersResponse.data;
            const teamMembersArray = Array.isArray(teamMembers) ? teamMembers : (teamMembers?.$values || []);
            const myMembership = teamMembersArray.find(tm => tm.teamMemberAccountId === currentStudentId);
            
            if (myMembership) {
              const teamResp = await axios.get(`${API_BASE_URL}/Teams/${myMembership.teamId}`);
              userTeam = teamResp.data;
              console.log("TimeManager - Found team by membership:", userTeam);
            }
          } catch (error) {
            console.error("TimeManager - Error finding team membership:", error);
          }
        }
        
        if (!userTeam) {
          console.log("TimeManager - No team found for user");
          setTotalTasks(0);
          setSubmittedTasks(0);
          setProgress(0);
          setLoading(false);
          return;
        }
        
        // Get tasks for the user's grade instead of all tasks
        let gradeTasks = [];
        try {
          // First try to get user's grade ID
          let userGradeId = null;
          
          // Try to get grade from user's student extension
          try {
            const studentExtResponse = await axios.get(`${API_BASE_URL}/StudentExtensions/${currentStudentId}`);
            if (studentExtResponse.data && studentExtResponse.data.classId) {
              const classResponse = await axios.get(`${API_BASE_URL}/Classes/${studentExtResponse.data.classId}`);
              if (classResponse.data && classResponse.data.gradeId) {
                userGradeId = classResponse.data.gradeId;
                console.log("TimeManager - Found user grade ID:", userGradeId);
              }
            }
          } catch (error) {
            console.log("TimeManager - Could not get user grade from student extension");
          }
          
          if (userGradeId) {
            // Use the new ByGrade endpoint
            const gradeTasksResponse = await axios.get(`${API_BASE_URL}/AccountTask/ByGrade/${userGradeId}`);
            const gradeTasksData = gradeTasksResponse.data;
            gradeTasks = Array.isArray(gradeTasksData) ? gradeTasksData : (gradeTasksData?.$values || gradeTasksData?.data || []);
            console.log("TimeManager - Grade-specific tasks from ByGrade endpoint:", gradeTasks);
          } else {
            // Fallback to StudentTasks endpoint
            const tasksResponse = await axios.get(`${API_BASE_URL}/AccountTask/StudentTasks/${currentStudentId}`);
            const tasksData = tasksResponse.data;
            gradeTasks = Array.isArray(tasksData) ? tasksData : (tasksData?.$values || tasksData?.data || []);
            console.log("TimeManager - Grade-specific tasks from StudentTasks endpoint:", gradeTasks);
          }
        } catch (error) {
          console.error("TimeManager - Error fetching grade tasks:", error);
          // Fallback: try to get all tasks and filter by grade
          try {
            const allTasksResponse = await axios.get(`${API_BASE_URL}/AccountTask`);
            const allTasksData = allTasksResponse.data;
            const allTasks = Array.isArray(allTasksData) ? allTasksData : (allTasksData?.$values || allTasksData?.data || []);
            
            // Get user's grade from team or user info
            let userGradeId = null;
            if (userTeam.classId) {
              // Try to get grade from team's class
              try {
                const classResponse = await axios.get(`${API_BASE_URL}/Classes/${userTeam.classId}`);
                if (classResponse.data && classResponse.data.gradeId) {
                  userGradeId = classResponse.data.gradeId;
                }
              } catch (_) {}
            }
            
            if (userGradeId) {
              gradeTasks = allTasks.filter(task => task.gradeId === userGradeId);
              console.log("TimeManager - Filtered tasks by grade:", gradeTasks);
            } else {
              gradeTasks = allTasks; // Fallback to all tasks if grade not found
              console.log("TimeManager - Using all tasks as fallback:", gradeTasks);
            }
          } catch (fallbackError) {
            console.error("TimeManager - Error in fallback task fetching:", fallbackError);
          }
        }
        
        if (gradeTasks && gradeTasks.length > 0) {
          // Get team submissions
          const submissionsResponse = await axios.get(`${API_BASE_URL}/TaskSubmissions`);
          const allSubmissions = submissionsResponse.data;
          const submissionsArray = Array.isArray(allSubmissions) ? allSubmissions : (allSubmissions?.$values || []);
          
          // Filter submissions for this team
          const teamSubmissions = submissionsArray.filter(sub => sub.teamId === userTeam.id);
          console.log("TimeManager - Team submissions:", teamSubmissions);
          
          const total = gradeTasks.length;
          
          // Count different statuses like ViewTasks component
          const completedOnTime = gradeTasks.filter(task => {
            const submission = teamSubmissions.find(sub => sub.taskId === task.id);
            return submission && submission.statusId === STATUS_CONSTANTS.TASK_COMPLETED;
          }).length;
          
          const submittedOnTime = gradeTasks.filter(task => {
            const submission = teamSubmissions.find(sub => sub.taskId === task.id);
            return submission && submission.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_ON_TIME;
          }).length;
          
          const submittedLate = gradeTasks.filter(task => {
            const submission = teamSubmissions.find(sub => sub.taskId === task.id);
            return submission && submission.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_LATE;
          }).length;
          
          const completedLate = gradeTasks.filter(task => {
            const submission = teamSubmissions.find(sub => sub.taskId === task.id);
            return submission && submission.statusId === STATUS_CONSTANTS.TASK_COMPLETED_LATE;
          }).length;
          
          // Total counts
          const completed = completedOnTime + completedLate;
          const submitted = submittedOnTime + submittedLate;
          const totalSubmitted = completed + submitted;
          
          console.log("TimeManager - Total grade tasks:", total);
          console.log("TimeManager - Status counts:", {
            completedOnTime,
            submittedOnTime,
            submittedLate,
            completedLate,
            completed,
            submitted,
            totalSubmitted
          });
          
          const percentage = total > 0 ? Math.round((totalSubmitted / total) * 100) : 0;
          
          console.log("TimeManager - Calculated percentage:", percentage);
          
          setTotalTasks(total);
          setSubmittedTasks(totalSubmitted);
          setProgress(percentage);
          setStatusCounts({
            completed,
            submitted,
            submittedLate,
            completedLate
          });
        } else {
          console.log("TimeManager - No grade-specific tasks found");
          setTotalTasks(0);
          setSubmittedTasks(0);
          setProgress(0);
          setStatusCounts({
            completed: 0,
            submitted: 0,
            submittedLate: 0,
            completedLate: 0
          });
        }
      } catch (error) {
        console.error("TimeManager - Error fetching task progress:", error);
        console.log("TimeManager - Error response:", error.response?.data);
        // Fallback to 0 progress if error
        setProgress(0);
        setTotalTasks(0);
        setSubmittedTasks(0);
        setStatusCounts({
          completed: 0,
          submitted: 0,
          submittedLate: 0,
          completedLate: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTaskProgress();
  }, [currentStudentId, user]);

  if (loading) {
    return (
      <div className="time-manager">
        <div className="time-manager-header">
          <h3>Time Manager</h3>
          <span className="time-manager-subtitle">Loading progress...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="time-manager">
      <div className="time-manager-header">
        <h3>Time Manager</h3>
        <span className="time-manager-subtitle">Your progress</span>
      </div>
      <div className="progress-container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="progress-text">{progress}% submitted</span>
      </div>
      <div className="task-summary">
        <p>{submittedTasks} of {totalTasks} tasks submitted</p>
      </div>
    </div>
  );
};

export default TimeManager;

// Note: This component now receives dynamic user data from the Dashboard
// No more hardcoded fallback values, uses currentStudentId prop instead
