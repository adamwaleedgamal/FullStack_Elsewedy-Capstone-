import { useState, useEffect } from "react";
import { BarChart3, User, FileText, LogOut, Settings, Users, TrendingUp, ScrollText, PlusCircle, ArrowRight, ArrowDown, Eye, CalendarCheck, PartyPopper, Shield, Menu, X } from "lucide-react";
import { isStudent, isEngineer, isReviewer, isSuperAdmin } from "../../utils/roleUtils";
import "./Sidebar.css";

const Sidebar = ({ currentPage, setCurrentPage, isOpen, setIsOpen, user, onLogout }) => {
   const [open, setOpen] = useState(false);
   const [on, setOn] = useState(false);

   console.log("Sidebar - User object:", user);
   console.log("Sidebar - User role:", user?.role);

   // Close sidebar when clicking on a nav item on mobile
   const handleNavClick = (page) => {
     setCurrentPage(page);
     if (window.innerWidth <= 768) {
       setIsOpen(false);
     }
   };

   // Handle click outside to close sidebar
   useEffect(() => {
     const handleClickOutside = (event) => {
       if (window.innerWidth <= 768 && isOpen) {
         const sidebar = document.querySelector('.sidebar');
         const hamburger = document.querySelector('.hamburger-menu');
         if (sidebar && !sidebar.contains(event.target) && !hamburger?.contains(event.target)) {
           setIsOpen(false);
         }
       }
     };

     document.addEventListener('mousedown', handleClickOutside);
     return () => document.removeEventListener('mousedown', handleClickOutside);
   }, [isOpen, setIsOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}
      
      {/* Hamburger Menu Button */}
      <button 
        className="hamburger-menu"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <img src="../../../public/1732864917491 (1).png" className="logo-img" alt="" />
            <div className="logo-text">
              <p>Elsewedy</p>
              <p>Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* Dashboard - Always visible */}
          <div
            className={`nav-item ${currentPage === "dashboard" ? "active" : ""}`}
            onClick={() => handleNavClick("dashboard")}
          >
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </div>



          {/* Student - Show only Tasks and Reports */}
          {isStudent(user) && (
            <>
              <div
                className={`nav-item ${currentPage === "phases" ? "active" : ""}`}
                onClick={() => handleNavClick("phases")}
              >
                <User size={20} />
                <span>Tasks</span>
              </div>
              <div
                className={`nav-item ${currentPage === "reports" ? "active" : ""}`}
                onClick={() => handleNavClick("reports")}
              >
                <FileText size={20} />
                <span>Reports</span>
              </div>
              <div
                className={`nav-item ${currentPage === "teams-progress" ? "active" : ""}`}
                onClick={() => handleNavClick("teams-progress")}
              >
                <BarChart3 size={20} />
                <span>My Team Progress</span>
              </div>
            </>
          )}

          {/* Engineer and Reviewer - Show Teams Overview and Task Management */}
          {(isEngineer(user) || isReviewer(user)) && (
            <>
              <div
                className={`nav-item ${currentPage === "view-tasks" ? "active" : ""}`}
                onClick={() => handleNavClick("view-tasks")}
              >
                <Users size={20} />
                <span>Teams Overview</span>
              </div>
              <div
                className={`nav-item ${currentPage === "teams-progress" ? "active" : ""}`}
                onClick={() => handleNavClick("teams-progress")}
              >
                <BarChart3 size={20} />
                <span>Teams Progress</span>
              </div>
              <div
                className={`nav-item ${currentPage === "admin-tasks" ? "active" : ""}`}
                onClick={() => handleNavClick("admin-tasks")}
              >
                <Shield size={20} />
                <span>Task Management</span>
              </div>
            </>
          )}

          {/* Super Admin - Show Teams Overview and Admin Dashboard */}
          {isSuperAdmin(user) && (
            <>
              <div
                className={`nav-item ${currentPage === "view-tasks" ? "active" : ""}`}
                onClick={() => handleNavClick("view-tasks")}
              >
                <Users size={20} />
                <span>Teams Overview</span>
              </div>
              <div
                className={`nav-item ${currentPage === "teams-progress" ? "active" : ""}`}
                onClick={() => handleNavClick("teams-progress")}
              >
                <BarChart3 size={20} />
                <span>Teams Progress</span>
              </div>
              <div
                className={`nav-item ${currentPage === "admin-tasks" ? "active" : ""}`}
                onClick={() => handleNavClick("admin-tasks")}
              >
                <Shield size={20} />
                <span>Tasks Management</span>
              </div>
                {/* Super Admin Section - Only show for Super Admin role */}
            <div
              className={`nav-item ${currentPage === "super-admin" ? "active" : ""}`}
              onClick={() => handleNavClick("super-admin")}
            >
              <Shield size={20} />
              <span>Super Admin</span>
            </div>      
            </>
          )}

          {/* Journals Section - Only show for non-student roles */}
          {!isStudent(user) && (
            <>
              <div
                className={`nav-item ${currentPage === "quiz" ? "active" : ""}`}
                onClick={() => setOpen(!open)} 
              >
                <ScrollText size={20} />
                <span>Journals</span>
                <span className="arrow">{open ? <ArrowDown size = {13}/>: <ArrowRight size={13}/> }</span>
              </div>
              {open && (
                <div className="dropdown-menu">
                  <div className={`nav-item ${currentPage === "quiz_add" ? "active" : ""}`} onClick={() => handleNavClick("quiz_add")}><PlusCircle size={15}/> Add Journal</div>
                  <div className={`nav-item ${currentPage === "quiz_see" ? "active" : ""}`} onClick={() => handleNavClick("quiz_see")}><Eye size={15}/> See Journals</div>
                </div>
              )}
            </>
          )}

          {/* Events Section - Only show for non-student roles */}
          {!isStudent(user) && (
            <>
              <div
                className={`nav-item ${currentPage === "events" ? "active" : ""}`}
                onClick={() => setOn(!on)} 
              >
                <CalendarCheck size={20} />
                <span>Events</span>
                <span className="arrow">{on ? <ArrowDown size = {13}/>: <ArrowRight size={13}/> }</span>
              </div>
              {on && (
                <div className="dropdown-menu">
                  <div className={`nav-item ${currentPage === "expo" ? "active" : ""}`} onClick={() => handleNavClick("expo")}><PartyPopper size={15}/> Expo</div>
                  <div className={`nav-item ${currentPage === "panel" ? "active" : ""}`} onClick={() => handleNavClick("panel")}><Eye size={15}/> Panel review</div>
                </div>
              )}
            </>
          )}

        
        </nav>

        <div className="sidebar-footer">
          <div className="nav-item logout" onClick={onLogout}>
            <LogOut size={20} />
            <span>Log Out</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

// Note: This component now receives dynamic user data from the Dashboard
// No more hardcoded fallback values, uses user prop instead
