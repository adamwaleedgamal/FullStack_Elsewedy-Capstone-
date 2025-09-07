using Elsewedy_Capstone_System.Models;
using Microsoft.EntityFrameworkCore;

namespace Elsewedy_Capstone_System.Services
{
    public class RoleService
    {
        private readonly SchoolDbContext _context;
        private readonly Dictionary<long, string> _roleCache;

        public RoleService(SchoolDbContext context)
        {
            _context = context;
            _roleCache = new Dictionary<long, string>();
        }

        /// <summary>
        /// Gets the role name for a given role ID
        /// </summary>
        /// <param name="roleId">The role ID to look up</param>
        /// <returns>The role name or "Unknown" if not found</returns>
        public async Task<string> GetRoleNameAsync(long roleId)
        {
            // Check cache first
            if (_roleCache.ContainsKey(roleId))
            {
                Console.WriteLine($"RoleService: Using cached role for ID {roleId}: {_roleCache[roleId]}");
                return _roleCache[roleId];
            }

            try
            {
                Console.WriteLine($"RoleService: Looking up role for ID {roleId} in database...");
                
                // Look up role in Role table by ID
                var roleRecord = await _context.Roles
                    .Where(r => r.Id == roleId)
                    .Select(r => new { r.Id, r.RoleName })
                    .FirstOrDefaultAsync();
                
                Console.WriteLine($"RoleService: Looking up role for ID {roleId} in Role table...");
                if (roleRecord != null)
                {
                    Console.WriteLine($"  - ID: {roleRecord.Id}, RoleName: '{roleRecord.RoleName}'");
                }
                else
                {
                    Console.WriteLine($"  - No role found for ID {roleId}");
                }
                
                var role = roleRecord?.RoleName;

                if (!string.IsNullOrEmpty(role))
                {
                    Console.WriteLine($"RoleService: Found role in database for ID {roleId}: {role}");
                    _roleCache[roleId] = role;
                    return role;
                }

                // No role found in database
                Console.WriteLine($"RoleService: No role found in database for ID {roleId}");
                _roleCache[roleId] = "Unknown";
                return "Unknown";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting role name for ID {roleId}: {ex.Message}");
                _roleCache[roleId] = "Unknown";
                return "Unknown";
            }
        }

        /// <summary>
        /// Gets the role ID for a given role name
        /// </summary>
        /// <param name="roleName">The role name to look up</param>
        /// <returns>The role ID or null if not found</returns>
        public async Task<long?> GetRoleIdAsync(string roleName)
        {
            try
            {
                var roleId = await _context.Roles
                    .Where(r => r.RoleName == roleName)
                    .Select(r => r.Id)
                    .FirstOrDefaultAsync();

                return roleId > 0 ? roleId : null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting role ID for name {roleName}: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Checks if a user has a specific role by role name
        /// </summary>
        /// <param name="userId">The user ID to check</param>
        /// <param name="roleName">The role name to check for</param>
        /// <returns>True if user has the role, false otherwise</returns>
        public async Task<bool> UserHasRoleAsync(long userId, string roleName)
        {
            try
            {
                var userRole = await _context.Accounts
                    .Where(a => a.Id == userId && a.IsActive)
                    .Select(a => a.RoleId)
                    .FirstOrDefaultAsync();

                if (userRole == 0) return false;

                var userRoleName = await GetRoleNameAsync(userRole);
                return string.Equals(userRoleName, roleName, StringComparison.OrdinalIgnoreCase);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error checking user role: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Gets all available roles
        /// </summary>
        /// <returns>List of role names</returns>
        public async Task<List<string>> GetAllRolesAsync()
        {
            try
            {
                var roles = await _context.Roles
                    .Select(r => r.RoleName)
                    .ToListAsync();

                return roles;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting all roles: {ex.Message}");
                return new List<string>();
            }
        }


        /// <summary>
        /// Clears the role cache (useful for testing or when roles are updated)
        /// </summary>
        public void ClearCache()
        {
            _roleCache.Clear();
        }
    }
}