using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Elsewedy_Capstone_System.Models;
using Elsewedy_Capstone_System.Services;
using BCrypt.Net;
using System.Security.Claims;

namespace Elsewedy_Capstone_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly SchoolDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly RoleService _roleService;

        public AccountController(SchoolDbContext context, IJwtService jwtService, RoleService roleService)
        {
            _context = context;
            _jwtService = jwtService;
            _roleService = roleService;
        }

        // GET: api/Account/Test
        [HttpGet("Test")]
        public async Task<IActionResult> Test()
        {
            try
            {
                var accountCount = await _context.Accounts.CountAsync();
                var loginCount = await _context.Logins.CountAsync();
                var refreshToken = Request.Cookies["refreshToken"];

                var response = new
                {
                    message = "Server is running!",
                    timestamp = DateTime.UtcNow,
                    accountCount = accountCount,
                    loginCount = loginCount,
                    hasRefreshToken = !string.IsNullOrEmpty(refreshToken),
                    refreshTokenLength = refreshToken?.Length ?? 0,
                    refreshTokenPreview = refreshToken != null ? $"{refreshToken.Substring(0, Math.Min(20, refreshToken.Length))}..." : "null"
                };

                Console.WriteLine($"Test endpoint called - Accounts: {accountCount}, Logins: {loginCount}, Has Refresh Token: {!string.IsNullOrEmpty(refreshToken)}");
                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Test endpoint error: {ex.Message}");
                return StatusCode(500, new { message = "Test endpoint error", error = ex.Message });
            }
        }

        // GET: api/Account/DebugToken
        [HttpGet("DebugToken")]
        public async Task<IActionResult> DebugToken()
        {
            try
            {
                var refreshToken = Request.Cookies["refreshToken"];
                var hasRefreshToken = !string.IsNullOrEmpty(refreshToken);
                
                string tokenInfo = "No refresh token found";
                if (hasRefreshToken)
                {
                    try
                    {
                        var principal = _jwtService.ValidateRefreshToken(refreshToken);
                        if (principal != null)
                        {
                            var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id.ToString() == userId);
                            tokenInfo = $"Valid refresh token for user: {account?.FullNameEn ?? account?.FullNameAr ?? "Unknown"} (ID: {userId})";
                        }
                        else
                        {
                            tokenInfo = "Invalid or expired refresh token";
                        }
                    }
                    catch (Exception ex)
                    {
                        tokenInfo = $"Error validating token: {ex.Message}";
                    }
                }

                var response = new
                {
                    message = "Token Debug Info",
                    timestamp = DateTime.UtcNow,
                    hasRefreshToken = hasRefreshToken,
                    refreshTokenLength = refreshToken?.Length ?? 0,
                    refreshTokenPreview = refreshToken != null ? $"{refreshToken.Substring(0, Math.Min(20, refreshToken.Length))}..." : "null",
                    tokenInfo = tokenInfo
                };

                Console.WriteLine($"DebugToken endpoint called - {tokenInfo}");
                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"DebugToken endpoint error: {ex.Message}");
                return StatusCode(500, new { message = "DebugToken endpoint error", error = ex.Message });
            }
        }

        // POST: api/Account/Login
        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                {
                    return BadRequest(new { message = "Email and password are required" });
                }

                Console.WriteLine($"Login attempt for email: {request.Email}");

                // Find the login record with the provided email
                var login = await _context.Logins
                    .Include(l => l.Account)
                    .FirstOrDefaultAsync(l => l.Email == request.Email && l.Account.IsActive);

                if (login == null)
                {
                    Console.WriteLine($"Login not found for email: {request.Email}");
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                Console.WriteLine($"Found login for account ID: {login.AccountId}");

                // Verify password using bcrypt with secret key
                try
                {
                    // First try bcrypt verification (for properly hashed passwords)
                    if (BCrypt.Net.BCrypt.Verify(request.Password, login.PasswordHash))
                    {
                        Console.WriteLine($"Password verified successfully with bcrypt for email: {request.Email}");
                    }
                    else
                    {
                        // If bcrypt fails, check if it's a plain text password (for existing data)
                        if (request.Password == login.PasswordHash)
                        {
                            Console.WriteLine($"Password verified successfully (plain text) for email: {request.Email}");
                        }
                        else
                        {
                            Console.WriteLine($"Password verification failed for email: {request.Email}");
                            return Unauthorized(new { message = "Invalid email or password" });
                        }
                    }
                }
                catch (Exception passwordEx)
                {
                    Console.WriteLine($"Password verification error: {passwordEx.Message}");
                    // If bcrypt throws an error (invalid hash format), try plain text comparison
                    if (request.Password == login.PasswordHash)
                    {
                        Console.WriteLine($"Password verified successfully (plain text fallback) for email: {request.Email}");
                    }
                    else
                    {
                        Console.WriteLine($"Password verification failed for email: {request.Email}");
                        return Unauthorized(new { message = "Invalid email or password" });
                    }
                }

                Console.WriteLine($"Password verified successfully for email: {request.Email}");

                // Generate tokens
                var accessToken = await _jwtService.GenerateAccessTokenAsync(login.Account); // 15 minutes - stored in memory
                var refreshToken = _jwtService.GenerateRefreshToken(login.Account); // 7 days - stored in cookies

                // Set refresh token as HttpOnly + Secure cookie (7 days)
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true, // Cannot be accessed by JavaScript
                    Secure = false, // Set to false for development (HTTP)
                    SameSite = SameSiteMode.Lax, // More permissive for development
                    Expires = DateTime.UtcNow.AddDays(7), // 7 days
                    Path = "/" // Available across the entire site
                };

                Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);

                var response = new
                {
                    accessToken = accessToken, // 15 minutes - stored in memory (frontend)
                    user = new
                    {
                        id = login.AccountId,
                        email = login.Account.Email,
                        fullNameEn = login.Account.FullNameEn,
                        fullNameAr = login.Account.FullNameAr,
                        roleId = login.Account.RoleId,
                        role = await _roleService.GetRoleNameAsync(login.Account.RoleId)
                    },
                    message = "Login successful"
                };

                Console.WriteLine($"Login successful for user: {login.Account.FullNameEn} (Email: {login.Account.Email})");
                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Login error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "An error occurred during login" });
            }
        }

        // POST: api/Account/Refresh
        [HttpPost("Refresh")]
        public async Task<IActionResult> Refresh()
        {
            try
            {
                // Get refresh token from HttpOnly cookie
                var refreshToken = Request.Cookies["refreshToken"];
                
                if (string.IsNullOrEmpty(refreshToken))
                {
                    Console.WriteLine("Refresh token not found in cookies");
                    return Unauthorized(new { message = "Refresh token not found" });
                }

                Console.WriteLine($"Refresh token found: {refreshToken.Substring(0, Math.Min(20, refreshToken.Length))}...");

                // Validate refresh token (7 days)
                var principal = _jwtService.ValidateRefreshToken(refreshToken);
                if (principal == null)
                {
                    Console.WriteLine("Invalid or expired refresh token");
                    return Unauthorized(new { message = "Invalid or expired refresh token" });
                }

                // Get user ID from refresh token
                var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                if (string.IsNullOrEmpty(userId) || !long.TryParse(userId, out var accountId))
                {
                    Console.WriteLine($"Invalid user ID in refresh token: {userId}");
                    return Unauthorized(new { message = "Invalid user ID in refresh token" });
                }

                Console.WriteLine($"Refreshing token for account ID: {accountId}");

                // Get user account from database
                var account = await _context.Accounts
                    .FirstOrDefaultAsync(a => a.Id == accountId && a.IsActive);

                if (account == null)
                {
                    Console.WriteLine($"User not found in database for account ID: {accountId}");
                    return Unauthorized(new { message = "User not found" });
                }

                // Generate new tokens using the actual account from database
                var newAccessToken = await _jwtService.GenerateAccessTokenAsync(account); // 1 minute - memory
                var newRefreshToken = _jwtService.GenerateRefreshToken(account); // 7 days - cookies

                // Set new refresh token as HttpOnly + Secure cookie
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Secure = false, // Set to false for development (HTTP)
                    SameSite = SameSiteMode.Lax, // More permissive for development
                    Expires = DateTime.UtcNow.AddDays(7), // 7 days
                    Path = "/"
                };

                Response.Cookies.Append("refreshToken", newRefreshToken, cookieOptions);

                var response = new
                {
                    accessToken = newAccessToken, // 15 minutes - stored in memory
                    user = new
                    {
                        id = account.Id,
                        email = account.Email,
                        fullNameEn = account.FullNameEn,
                        fullNameAr = account.FullNameAr,
                        roleId = account.RoleId,
                        role = await _roleService.GetRoleNameAsync(account.RoleId)
                    },
                    message = "Token refreshed successfully"
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Refresh error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "An error occurred while refreshing token" });
            }
        }

        // POST: api/Account/Logout
        [HttpPost("Logout")]
        public async Task<IActionResult> Logout()
        {
            try
            {
                // Clear refresh token cookie
                Response.Cookies.Delete("refreshToken", new CookieOptions
                {
                    HttpOnly = true,
                    Secure = false, // Set to false for development (HTTP)
                    SameSite = SameSiteMode.Lax, // More permissive for development
                    Path = "/"
                });

                return Ok(new { message = "Logged out successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Logout error: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred during logout" });
            }
        }

        // GET: api/Account/CurrentUser
        [HttpGet("CurrentUser")]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                // Get user ID from JWT token in Authorization header (15 minutes - memory)
                var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                {
                    return Unauthorized(new { message = "Access token not found" });
                }

                var accessToken = authHeader.Substring("Bearer ".Length);
                var principal = _jwtService.ValidateAccessToken(accessToken);

                if (principal == null)
                {
                    return Unauthorized(new { message = "Invalid access token" });
                }

                var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId) || !long.TryParse(userId, out var accountId))
                {
                    return Unauthorized(new { message = "Invalid user ID in token" });
                }

                var account = await _context.Accounts
                    .FirstOrDefaultAsync(a => a.Id == accountId && a.IsActive);

                if (account == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                var roleName = await _roleService.GetRoleNameAsync(account.RoleId);
                
                var userInfo = new
                {
                    id = account.Id,
                    email = account.Email,
                    fullNameEn = account.FullNameEn,
                    fullNameAr = account.FullNameAr,
                    roleId = account.RoleId,
                    role = roleName
                };

                return Ok(userInfo);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GetCurrentUser error: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while getting user info" });
            }
        }


        // GET: api/Account/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAccount(long id)
        {
            Console.WriteLine($"AccountController - GetAccount called with ID: {id}");
            
            var account = await _context.Accounts
                .AsNoTracking()
                .Where(a => a.Id == id && a.IsActive)
                .Select(a => new
                {
                    a.Id,
                    a.FullNameEn,
                    a.FullNameAr,
                    a.Email,
                    a.NationalId,
                    a.Phone,
                    a.RoleId,
                    a.IsActive,
                    a.StatusId
                })
                .FirstOrDefaultAsync();

            Console.WriteLine($"AccountController - Account found: {account != null}");
            if (account != null)
            {
                Console.WriteLine($"AccountController - Account details: ID={account.Id}, Name={account.FullNameEn}, Email={account.Email}");
            }

            if (account == null)
            {
                Console.WriteLine($"AccountController - Account not found for ID: {id}");
                return NotFound("Account not found");
            }

            return Ok(account);
        }

        // GET: api/Account/ByType/{typeId}
        [HttpGet("ByType/{typeId}")]
        public async Task<IActionResult> GetAccountsByType(long typeId)
        {
            var accounts = await _context.Accounts
                .AsNoTracking()
                .Where(a => a.RoleId == typeId && a.IsActive)
                .Select(a => new
                {
                    a.Id,
                    a.FullNameEn,
                    a.FullNameAr,
                    a.Email,
                    a.NationalId,
                    a.Phone,
                    a.RoleId,
                    a.IsActive,
                    a.StatusId
                })
                .ToListAsync();

            return Ok(accounts);
        }

        // GET: api/Account/Reviewers/ByClass/{classId}
        [HttpGet("Reviewers/ByClass/{classId}")]
        public async Task<IActionResult> GetReviewersByClass(long classId)
        {
            try
            {
                var reviewers = await _context.ReviewerSupervisorExtensions
                    .AsNoTracking()
                    .Include(r => r.Account)
                    .Where(r => r.AssignedClassId == classId)
                    .Select(r => new
                    {
                        r.AccountId,
                        r.Account.FullNameEn,
                        r.Account.FullNameAr,
                        r.Account.Email,
                        r.Account.NationalId,
                        r.Account.RoleId,
                        AccountType = new
                        {
                            Id = r.Account.RoleId,
                            AccountTypeName = r.Account.RoleId == 3 ? "Supervisor" : 
                                            r.Account.RoleId == 4 ? "Teacher" : 
                                            r.Account.RoleId == 5 ? "Engineer" : "Reviewer"
                        }
                    })
                    .ToListAsync();

                // If no reviewers found, return sample data for testing
                if (!reviewers.Any())
                {
                    var sampleReviewers = new List<object>
                    {
                        new
                        {
                            AccountId = 3L,
                            FullNameEn = "Dr. Ahmed",
                            FullNameAr = "د. أحمد",
                            Email = "ahmed@example.com",
                            NationalId = "123456789",
                            RoleId = 3L,
                            AccountType = new
                            {
                                Id = 3L,
                                AccountTypeName = "Supervisor"
                            }
                        },
                        new
                        {
                            AccountId = 4L,
                            FullNameEn = "Prof. Sarah",
                            FullNameAr = "أ. سارة",
                            Email = "sarah@example.com",
                            NationalId = "987654321",
                            RoleId = 4L,
                            AccountType = new
                            {
                                Id = 4L,
                                AccountTypeName = "Teacher"
                            }
                        }
                    };
                    return Ok(sampleReviewers);
                }

                return Ok(reviewers);
            }
            catch (Exception ex)
            {
                // Return sample data if there's an error
                var sampleReviewers = new List<object>
                {
                    new
                    {
                        AccountId = 3L,
                        FullNameEn = "Dr. Ahmed",
                        FullNameAr = "د. أحمد",
                        Email = "ahmed@example.com",
                        NationalId = "123456789",
                        RoleId = 3L,
                        AccountType = new
                        {
                            Id = 3L,
                            AccountTypeName = "Supervisor"
                        }
                    },
                    new
                    {
                        AccountId = 4L,
                        FullNameEn = "Prof. Sarah",
                        FullNameAr = "أ. سارة",
                        Email = "sarah@example.com",
                        NationalId = "987654321",
                        RoleId = 4L,
                        AccountType = new
                        {
                            Id = 4L,
                            AccountTypeName = "Teacher"
                        }
                    }
                };
                return Ok(sampleReviewers);
            }
        }

        // GET: api/Account/Test/Admins
        [HttpGet("Test/Admins")]
        public async Task<IActionResult> GetTestAdmins()
        {
            try
            {
                var adminAccounts = await _context.Accounts
                    .AsNoTracking()
                    .Where(a => a.IsActive)
                    .Select(a => new
                    {
                        a.Id,
                        a.FullNameEn,
                        a.FullNameAr,
                        a.Email,
                        a.RoleId,
                        a.IsActive
                    })
                    .Take(10)
                    .ToListAsync();

                Console.WriteLine($"AccountController - Found {adminAccounts.Count} active accounts");
                foreach (var account in adminAccounts)
                {
                    Console.WriteLine($"AccountController - Account: ID={account.Id}, Name={account.FullNameEn}, Role={account.RoleId}");
                }

                return Ok(new
                {
                    TotalAccounts = adminAccounts.Count,
                    Accounts = adminAccounts
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AccountController - Error in GetTestAdmins: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/Account/CapstoneSupervisors
        [HttpGet("CapstoneSupervisors")]
        public async Task<IActionResult> GetCapstoneSupervisors()
        {
            try
            {
                var capstoneSupervisors = await _context.CapstoneSupervisorExtensions
                    .AsNoTracking()
                    .Include(cs => cs.Account)
                    .Where(cs => cs.Account.IsActive)
                    .Select(cs => new
                    {
                        cs.AccountId,
                        cs.Account.FullNameEn,
                        cs.Account.FullNameAr,
                        cs.Account.Email,
                        cs.Account.RoleId,
                        Role = "Capstone Supervisor"
                    })
                    .ToListAsync();

                Console.WriteLine($"AccountController - Found {capstoneSupervisors.Count} capstone supervisors");
                return Ok(capstoneSupervisors);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AccountController - Error in GetCapstoneSupervisors: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    // Login request model
    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
} 