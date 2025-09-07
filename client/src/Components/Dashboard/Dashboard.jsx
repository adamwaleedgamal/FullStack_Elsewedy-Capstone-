import React from "react";
import Sidebar from "../Sidebar/Sidebar";
import MainContent from "../MainContent/MainContent";
import PhasesPage from "../PhasesPage/PhasesPage";
import TaskDetailsPage from "../TaskDetailsPage/TaskDetailsPage";
import ReportsPage from "../ReportsPage/ReportsPage";
import TeamsProgress from "../TeamsProgress/TeamsProgress";
import ViewTasks from "../ViewTasks/ViewTasks";
import AdminTasksPage from "../AdminTasksPage/AdminTasksPage";
import QuizAdd from "../QuizAdd/QuizAdd";
import QuizSee from "../QuizSee/QuizSee";
import Expo from "../Expo/Expo";
import PanelReview from "../PanelReview/PanelReview";
import SuperAdminPage from "../SuperAdminPage/SuperAdminPage";
import { canAccessPage, isStudent } from "../../utils/roleUtils";
import "./Dashboard.css";

const Dashboard = ({ onLogout, user }) => {
  const [currentPage, setCurrentPage] = React.useState("dashboard");
  const [selectedPhase, setSelectedPhase] = React.useState(null);
  const [selectedTask, setSelectedTask] = React.useState(null);
  const [previousPage, setPreviousPage] = React.useState("dashboard");
  const [teamIdFilter, setTeamIdFilter] = React.useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Get the current user's ID from the user object
  const currentUserId = user?.id || null;

  const handlePageChange = (newPage, teamId = null) => {
    // Check if user can access the requested page based on their role
    if (!canAccessPage(user, newPage)) {
      console.log("Access denied to:", newPage, "for role:", user?.role || "Unknown");
      return; // Don't allow access to restricted pages
    }
    
    setPreviousPage(currentPage);
    setCurrentPage(newPage);
    setTeamIdFilter(teamId);
  };

  const handleSidebarPageChange = (newPage) => {
    // Check if user can access the requested page based on their role
    if (!canAccessPage(user, newPage)) {
      console.log("Access denied to:", newPage, "for role:", user?.role || "Unknown");
      return; // Don't allow access to restricted pages
    }
    
    setPreviousPage(currentPage);
    setCurrentPage(newPage);
    setTeamIdFilter(null); // Clear team filter when navigating from sidebar
  };

  const renderCurrentPage = () => {
    // For students, only allow access to specific pages
    if (isStudent(user)) {
      if (currentPage === "task-details" && (selectedPhase || selectedTask)) {
        return (
          <TaskDetailsPage
            task={selectedTask}
            phase={selectedPhase}
            selectedTask={selectedTask}
            setCurrentPage={handlePageChange}
            previousPage={previousPage}
            currentUserId={currentUserId}
            user={user}
          />
        );
      } else if (currentPage === "phase-details" && selectedPhase) {
        return (
          <PhasesPage
            setCurrentPage={handlePageChange}
            setSelectedPhase={setSelectedPhase}
            currentUserId={currentUserId}
            user={user}
          />
        );
      } else if (currentPage === "phases") {
        return (
          <PhasesPage
            setCurrentPage={handlePageChange}
            setSelectedPhase={setSelectedPhase}
            setSelectedTask={setSelectedTask}
            currentUserId={currentUserId}
            user={user}
            previousPage={previousPage}
          />
        );
      } else if (currentPage === "reports") {
        return <ReportsPage currentUserId={currentUserId} user={user} />;
      } else if (currentPage === "teams-progress") {
        return <TeamsProgress setCurrentPage={handlePageChange} currentUserId={currentUserId} user={user} />;
      } else {
        // Default to dashboard for students
        return <MainContent 
          currentStudentId={currentUserId} 
          setCurrentPage={handlePageChange} 
          setSelectedPhase={setSelectedPhase}
          user={user}
        />;
      }
    }

    // For other roles, allow access to all pages
    if (currentPage === "task-details" && (selectedPhase || selectedTask)) {
      return (
        <TaskDetailsPage
          task={selectedTask}
          phase={selectedPhase}
          selectedTask={selectedTask}
          setCurrentPage={handlePageChange}
          previousPage={previousPage}
          currentUserId={currentUserId}
          user={user}
        />
      );
    } else if (currentPage === "phase-details" && selectedPhase) {
      return (
        <PhasesPage
          setCurrentPage={handlePageChange}
          setSelectedPhase={setSelectedPhase}
          currentUserId={currentUserId}
          user={user}
        />
      );
    } else if (currentPage === "phases") {
      return (
        <PhasesPage
          setCurrentPage={handlePageChange}
          setSelectedPhase={setSelectedPhase}
          setSelectedTask={setSelectedTask}
          currentUserId={currentUserId}
          user={user}
          previousPage={previousPage}
        />
      );
    } else if (currentPage === "reports") {
      return <ReportsPage currentUserId={currentUserId} user={user} />;
    } else if (currentPage === "teams-progress") {
      return <TeamsProgress setCurrentPage={handlePageChange} currentUserId={currentUserId} user={user} />;
    } else if (currentPage === "view-tasks") {
      return <ViewTasks teamIdFilter={teamIdFilter} currentUserId={currentUserId} user={user} />;
    } else if (currentPage === "admin-tasks") {
      return <AdminTasksPage currentUserId={currentUserId} user={user} />;
    } else if (currentPage === "quiz_add") {
      return <QuizAdd currentUserId={currentUserId} user={user} />;
    } else if (currentPage === "quiz_see") {
      return <QuizSee currentUserId={currentUserId} user={user} />;
    } else if (currentPage === "expo") {
      return <Expo currentUserId={currentUserId} user={user} />;
    } else if (currentPage === "panel") {
      return <PanelReview currentUserId={currentUserId} user={user} />;
    } else if (currentPage === "super-admin") {
      return <SuperAdminPage user={user} />;
    } else {
      // Use the logged-in user's ID (no more hardcoded ID 9)
      return <MainContent 
        currentStudentId={currentUserId} 
        setCurrentPage={handlePageChange} 
        setSelectedPhase={setSelectedPhase}
        user={user}
      />;
    }
  };

  return (
    <div className="dashboard">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={handleSidebarPageChange} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onLogout={onLogout}
        user={user}
      />
      {renderCurrentPage()}
    </div>
  );
};

export default Dashboard;

// Note: This component now passes dynamic user data to all child components
// No more hardcoded IDs, uses user.id from login instead

