/**
 * Role utility functions for checking user roles by name instead of ID
 * This solves the issue where role IDs might change but role names remain consistent
 */

/**
 * Checks if a user has a specific role by role name
 * @param {Object} user - The user object containing role information
 * @param {string} roleName - The role name to check for (case-insensitive)
 * @returns {boolean} - True if user has the role, false otherwise
 */
export const hasRole = (user, roleName) => {
  if (!user || !roleName) return false;
  
  // Check role name from user object (from backend API)
  const userRole = user.role || user.roleName;
  if (userRole) {
    return userRole.toLowerCase() === roleName.toLowerCase();
  }
  
  // No fallback - roles should come from the backend
  
  return false;
};

/**
 * Checks if a user is a student
 * @param {Object} user - The user object
 * @returns {boolean} - True if user is a student
 */
export const isStudent = (user) => {
  return hasRole(user, "student");
};

/**
 * Checks if a user is an engineer
 * @param {Object} user - The user object
 * @returns {boolean} - True if user is an engineer
 */
export const isEngineer = (user) => {
  return hasRole(user, "engineer");
};

/**
 * Checks if a user is a reviewer
 * @param {Object} user - The user object
 * @returns {boolean} - True if user is a reviewer
 */
export const isReviewer = (user) => {
  return hasRole(user, "reviewer");
};

/**
 * Checks if a user is a super admin
 * @param {Object} user - The user object
 * @returns {boolean} - True if user is a super admin
 */
export const isSuperAdmin = (user) => {
  return hasRole(user, "superadmin");
};

/**
 * Gets the user's role name
 * @param {Object} user - The user object
 * @returns {string} - The role name or "Unknown"
 */
export const getUserRole = (user) => {
  if (!user) return "Unknown";
  
  // Return role name from user object if available
  if (user.role || user.roleName) {
    return user.role || user.roleName;
  }
  
  // No fallback - role should come from the backend
  
  return "Unknown";
};

/**
 * Checks if a user can access a specific page based on their role
 * @param {Object} user - The user object
 * @param {string} pageName - The page name to check access for
 * @returns {boolean} - True if user can access the page
 */
export const canAccessPage = (user, pageName) => {
  if (!user || !pageName) return false;
  
  // Define page access rules by role
  const accessRules = {
    "student": [
      "dashboard", 
      "phases", 
      "reports", 
      "task-details", 
      "phase-details", 
      "teams-progress"
    ],
    "engineer": [
      "dashboard", 
      "phases", 
      "reports", 
      "task-details", 
      "phase-details", 
      "teams-progress",
      "view-tasks",
      "admin-tasks"
    ],
    "reviewer": [
      "dashboard", 
      "phases", 
      "reports", 
      "task-details", 
      "phase-details", 
      "teams-progress",
      "view-tasks",
      "admin-tasks"
    ],
    "superadmin": [
      "dashboard", 
      "phases", 
      "reports", 
      "task-details", 
      "phase-details", 
      "teams-progress",
      "view-tasks",
      "admin-tasks",
      "quiz_add",
      "quiz_see",
      "expo",
      "panel",
      "super-admin"
    ]
  };
  
  const userRole = getUserRole(user).toLowerCase();
  const allowedPages = accessRules[userRole] || [];
  
  return allowedPages.includes(pageName.toLowerCase());
};