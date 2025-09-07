using Elsewedy_Capstone_System.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace Elsewedy_Capstone_System.Controllers
{
    [ApiController]
    [Route("api")]
    public class TeamController : ControllerBase
    {
        private readonly SchoolDbContext _context;

        public TeamController(SchoolDbContext context)
        {
            _context = context;
        }

        // GET: api/Teams
        [HttpGet("Teams")]
        public async Task<IActionResult> GetTeams()
        {
            var teams = await _context.Teams
                .AsNoTracking()
                .Include(t => t.SupervisorAccount)
                .Include(t => t.TeamLeaderAccount)
                .Include(t => t.Class)
                .Select(t => new
                {
                    id = t.Id,
                    teamName = t.TeamName,
                    classId = t.ClassId,
                    className = t.Class != null ? t.Class.ClassName : null,
                    supervisorAccountId = t.SupervisorAccountId,
                    supervisorName = t.SupervisorAccount != null ? t.SupervisorAccount.FullNameEn : null,
                    teamLeaderAccountId = t.TeamLeaderAccountId,
                    teamLeaderName = t.TeamLeaderAccount != null ? t.TeamLeaderAccount.FullNameEn : null
                })
                .ToListAsync();

            return Ok(teams);
        }

        // GET: api/Teams/{id}
        [HttpGet("Teams/{id}")]
        public async Task<IActionResult> GetTeam(long id)
        {
            var team = await _context.Teams
                .AsNoTracking()
                .Include(t => t.SupervisorAccount)
                .Include(t => t.TeamLeaderAccount)
                .Include(t => t.Class)
                .Where(t => t.Id == id)
                .Select(t => new
                {
                    t.Id,
                    t.TeamName,
                    t.ClassId,
                    ClassName = t.Class != null ? t.Class.ClassName : null,
                    SupervisorAccountId = t.SupervisorAccountId,
                    SupervisorName = t.SupervisorAccount != null ? t.SupervisorAccount.FullNameEn : null,
                    TeamLeaderAccountId = t.TeamLeaderAccountId,
                    TeamLeaderName = t.TeamLeaderAccount != null ? t.TeamLeaderAccount.FullNameEn : null
                })
                .FirstOrDefaultAsync();

            if (team == null)
                return NotFound("Team not found");

            return Ok(team);
        }

        // GET: api/Teams/ByLeader/{leaderAccountId}
        [HttpGet("Teams/ByLeader/{leaderAccountId}")]
        public async Task<IActionResult> GetTeamByLeader(long leaderAccountId)
        {
            var team = await _context.Teams
                .AsNoTracking()
                .Include(t => t.SupervisorAccount)
                .Include(t => t.TeamLeaderAccount)
                .Include(t => t.Class)
                .Where(t => t.TeamLeaderAccountId == leaderAccountId)
                .Select(t => new
                {
                    t.Id,
                    t.TeamName,
                    t.ClassId,
                    ClassName = t.Class != null ? t.Class.ClassName : null,
                    SupervisorAccountId = t.SupervisorAccountId,
                    SupervisorName = t.SupervisorAccount != null ? t.SupervisorAccount.FullNameEn : null,
                    TeamLeaderAccountId = t.TeamLeaderAccountId,
                    TeamLeaderName = t.TeamLeaderAccount != null ? t.TeamLeaderAccount.FullNameEn : null
                })
                .FirstOrDefaultAsync();

            if (team == null)
                return NotFound("Leader team not found");

            return Ok(team);
        }

        // GET: api/TeamMembers
        [HttpGet("TeamMembers")]
        public async Task<IActionResult> GetTeamMembers()
        {
            var teamMembers = await _context.TeamMembers
                .AsNoTracking()
                .Include(tm => tm.Team)
                .Include(tm => tm.TeamMemberAccount)
                    .ThenInclude(a => a.StudentExtension)
                        .ThenInclude(se => se.Class)
                .Select(tm => new
                {
                    tm.Id,
                    tm.TeamId,
                    tm.TeamMemberAccountId,
                    tm.TeamMemberDescription,
                    TeamName = tm.Team.TeamName,
                    MemberName = tm.TeamMemberAccount.FullNameEn,
                    MemberEmail = tm.TeamMemberAccount.Email,
                    MemberNationalId = tm.TeamMemberAccount.NationalId,
                    // Surface ClassId and GradeId to help the client fetch tasks per team
                    ClassId = tm.TeamMemberAccount.StudentExtension != null ? tm.TeamMemberAccount.StudentExtension.ClassId : (long?)null,
                    GradeId = tm.TeamMemberAccount.StudentExtension != null && tm.TeamMemberAccount.StudentExtension.Class != null
                        ? tm.TeamMemberAccount.StudentExtension.Class.GradeId
                        : (long?)null
                })
                .ToListAsync();

            return Ok(teamMembers);
        }

        // GET: api/Teams/WithDetails
        [HttpGet("Teams/WithDetails")]
        public async Task<IActionResult> GetTeamsWithDetails()
        {
            try
            {
                Console.WriteLine("GetTeamsWithDetails: Starting to fetch teams...");
                
                // Get all teams with basic info
                var teams = await _context.Teams
                    .AsNoTracking()
                    .Include(t => t.SupervisorAccount)
                    .Include(t => t.TeamLeaderAccount)
                    .Include(t => t.Class)
                    .Include(t => t.TeamMembers)
                        .ThenInclude(tm => tm.TeamMemberAccount)
                    .ToListAsync();

                Console.WriteLine($"GetTeamsWithDetails: Found {teams.Count} teams in database");

                if (teams.Count == 0)
                {
                    Console.WriteLine("GetTeamsWithDetails: No teams found in database");
                    return Ok(new List<object>());
                }

                var result = new List<object>();

                foreach (var team in teams)
                {
                    try
                    {
                        Console.WriteLine($"GetTeamsWithDetails: Processing team {team.Id} - {team.TeamName}");
                        
                        // Get team members
                        var members = new List<object>();
                        if (team.TeamMembers != null)
                        {
                            Console.WriteLine($"GetTeamsWithDetails: Team {team.Id} has {team.TeamMembers.Count} members");
                            foreach (var tm in team.TeamMembers)
                            {
                                members.Add(new
                                {
                                    id = tm.Id,
                                    teamMemberAccountId = tm.TeamMemberAccountId,
                                    teamMemberDescription = tm.TeamMemberDescription ?? "",
                                    memberName = tm.TeamMemberAccount?.FullNameEn ?? "Unknown",
                                    memberEmail = tm.TeamMemberAccount?.Email ?? "",
                                    memberNationalId = tm.TeamMemberAccount?.NationalId ?? ""
                                });
                            }
                        }
                        else
                        {
                            Console.WriteLine($"GetTeamsWithDetails: Team {team.Id} has no members");
                        }

                        // For now, just return basic team info without complex task processing
                        result.Add(new
                        {
                            Team = new
                            {
                                id = team.Id,
                                teamName = team.TeamName,
                                classId = team.ClassId,
                                className = team.Class?.ClassName ?? "No Class",
                                gradeId = team.Class?.GradeId,
                                supervisorAccountId = team.SupervisorAccountId,
                                supervisorName = team.SupervisorAccount?.FullNameEn ?? "No Supervisor",
                                teamLeaderAccountId = team.TeamLeaderAccountId,
                                teamLeaderName = team.TeamLeaderAccount?.FullNameEn ?? "No Leader"
                            },
                            Members = members,
                            Tasks = new List<object>(),
                            TotalTasks = 0,
                            CompletedTasks = 0,
                            InProgressTasks = 0,
                            PendingTasks = 0
                        });
                        
                        Console.WriteLine($"GetTeamsWithDetails: Successfully processed team {team.Id}");
                    }
                    catch (Exception teamEx)
                    {
                        Console.WriteLine($"Error processing team {team.Id}: {teamEx.Message}");
                        // Add a basic team entry even if processing fails
                        result.Add(new
                        {
                            Team = new
                            {
                                id = team.Id,
                                teamName = team.TeamName,
                                classId = team.ClassId,
                                className = team.Class?.ClassName ?? "No Class",
                                gradeId = team.Class?.GradeId,
                                supervisorAccountId = team.SupervisorAccountId,
                                supervisorName = team.SupervisorAccount?.FullNameEn ?? "No Supervisor",
                                teamLeaderAccountId = team.TeamLeaderAccountId,
                                teamLeaderName = team.TeamLeaderAccount?.FullNameEn ?? "No Leader"
                            },
                            Members = new List<object>(),
                            Tasks = new List<object>(),
                            TotalTasks = 0,
                            CompletedTasks = 0,
                            InProgressTasks = 0,
                            PendingTasks = 0
                        });
                    }
                }

                Console.WriteLine($"GetTeamsWithDetails: Returning {result.Count} teams");
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GetTeamsWithDetails error: {ex.Message}");
                Console.WriteLine($"GetTeamsWithDetails stack trace: {ex.StackTrace}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/Teams/Test
        [HttpGet("Teams/Test")]
        public async Task<IActionResult> TestTeams()
        {
            try
            {
                Console.WriteLine("TestTeams: Checking if teams exist...");
                
                // Check if any teams exist
                var teamCount = await _context.Teams.CountAsync();
                Console.WriteLine($"TestTeams: Found {teamCount} teams in database");
                
                if (teamCount == 0)
                {
                    return Ok(new { message = "No teams found in database", count = 0 });
                }
                
                // Get first few teams for testing
                var sampleTeams = await _context.Teams
                    .AsNoTracking()
                    .Take(5)
                    .Select(t => new { t.Id, t.TeamName })
                    .ToListAsync();
                
                return Ok(new { 
                    message = "Teams found", 
                    count = teamCount, 
                    sampleTeams = sampleTeams 
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"TestTeams error: {ex.Message}");
                return StatusCode(500, $"Test error: {ex.Message}");
            }
        }

        // GET: api/Teams/Check
        [HttpGet("Teams/Check")]
        public async Task<IActionResult> CheckTeams()
        {
            try
            {
                Console.WriteLine("CheckTeams: Checking database connection and teams...");
                
                // Check if database is accessible
                var teamCount = await _context.Teams.CountAsync();
                Console.WriteLine($"CheckTeams: Found {teamCount} teams in database");
                
                if (teamCount == 0)
                {
                    Console.WriteLine("CheckTeams: No teams found, creating sample data...");
                    
                    // Create a sample team if none exist
                    var sampleTeam = new Team
                    {
                        TeamName = "Sample Team 1",
                        ClassId = 1,
                        SupervisorAccountId = 1,
                        TeamLeaderAccountId = 9 // Using account ID 9 as mentioned before
                    };
                    
                    _context.Teams.Add(sampleTeam);
                    await _context.SaveChangesAsync();
                    
                    Console.WriteLine("CheckTeams: Created sample team with ID: " + sampleTeam.Id);
                    
                    return Ok(new { 
                        message = "No teams found, created sample team", 
                        createdTeamId = sampleTeam.Id,
                        teamName = sampleTeam.TeamName
                    });
                }
                
                // Get sample teams
                var sampleTeams = await _context.Teams
                    .AsNoTracking()
                    .Take(3)
                    .Select(t => new { t.Id, t.TeamName, t.TeamLeaderAccountId })
                    .ToListAsync();
                
                return Ok(new { 
                    message = "Teams found in database", 
                    count = teamCount, 
                    sampleTeams = sampleTeams 
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CheckTeams error: {ex.Message}");
                Console.WriteLine($"CheckTeams stack trace: {ex.StackTrace}");
                return StatusCode(500, $"Database error: {ex.Message}");
            }
        }

        // GET: api/Teams/Debug
        [HttpGet("Teams/Debug")]
        public async Task<IActionResult> DebugTeams()
        {
            try
            {
                Console.WriteLine("DebugTeams: Getting all teams with raw data...");
                
                var teams = await _context.Teams
                    .AsNoTracking()
                    .Include(t => t.SupervisorAccount)
                    .Include(t => t.TeamLeaderAccount)
                    .Include(t => t.Class)
                    .Include(t => t.TeamMembers)
                    .ToListAsync();

                var debugData = teams.Select(t => new
                {
                    RawId = t.Id,
                    RawTeamName = t.TeamName,
                    RawClassId = t.ClassId,
                    RawClass = t.Class,
                    RawSupervisorAccountId = t.SupervisorAccountId,
                    RawSupervisorAccount = t.SupervisorAccount,
                    RawTeamLeaderAccountId = t.TeamLeaderAccountId,
                    RawTeamLeaderAccount = t.TeamLeaderAccount,
                    RawTeamMembers = t.TeamMembers,
                    TeamMembersCount = t.TeamMembers?.Count ?? 0
                }).ToList();

                Console.WriteLine($"DebugTeams: Found {teams.Count} teams");
                foreach (var team in teams)
                {
                    Console.WriteLine($"Team {team.Id}: {team.TeamName} (Leader: {team.TeamLeaderAccountId}, Class: {team.ClassId})");
                }

                return Ok(new { 
                    message = "Debug data for teams",
                    count = teams.Count,
                    teams = debugData
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"DebugTeams error: {ex.Message}");
                return StatusCode(500, $"Debug error: {ex.Message}");
            }
        }

        // GET: api/Teams/ByEngineer/{engineerAccountId}
        [HttpGet("Teams/ByEngineer/{engineerAccountId}")]
        public async Task<IActionResult> GetTeamsByEngineer(long engineerAccountId)
        {
            try
            {
                Console.WriteLine($"GetTeamsByEngineer: Getting teams for engineer ID: {engineerAccountId}");

                // First, get the classes assigned to this engineer
                var assignedClasses = await _context.ReviewerSupervisorExtensions
                    .AsNoTracking()
                    .Where(r => r.AccountId == engineerAccountId && r.AssignedClassId.HasValue)
                    .Select(r => r.AssignedClassId.Value)
                    .ToListAsync();

                Console.WriteLine($"GetTeamsByEngineer: Found {assignedClasses.Count} assigned classes for engineer {engineerAccountId}");
                Console.WriteLine($"GetTeamsByEngineer: Assigned class IDs: [{string.Join(", ", assignedClasses)}]");

                if (!assignedClasses.Any())
                {
                    Console.WriteLine($"GetTeamsByEngineer: No classes assigned to engineer {engineerAccountId}");
                    return Ok(new List<object>());
                }

                // Get teams from the assigned classes
                var teams = await _context.Teams
                    .AsNoTracking()
                    .Include(t => t.SupervisorAccount)
                    .Include(t => t.TeamLeaderAccount)
                    .Include(t => t.Class)
                        .ThenInclude(c => c.Grade)
                    .Where(t => assignedClasses.Contains(t.ClassId))
                    .Select(t => new
                    {
                        id = t.Id,
                        teamName = t.TeamName,
                        classId = t.ClassId,
                        className = t.Class != null ? t.Class.ClassName : null,
                        gradeId = t.Class != null ? t.Class.GradeId : (long?)null,
                        gradeName = t.Class != null && t.Class.Grade != null ? t.Class.Grade.GradeName : null,
                        supervisorAccountId = t.SupervisorAccountId,
                        supervisorName = t.SupervisorAccount != null ? t.SupervisorAccount.FullNameEn : null,
                        teamLeaderAccountId = t.TeamLeaderAccountId,
                        teamLeaderName = t.TeamLeaderAccount != null ? t.TeamLeaderAccount.FullNameEn : null,
                        statusId = t.StatusId
                    })
                    .ToListAsync();

                Console.WriteLine($"GetTeamsByEngineer: Found {teams.Count} teams for engineer {engineerAccountId}");
                
                // Log team details for debugging
                foreach (var team in teams)
                {
                    Console.WriteLine($"GetTeamsByEngineer: Team {team.id} - {team.teamName} (Class: {team.classId} - {team.className})");
                }

                return Ok(teams);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GetTeamsByEngineer error: {ex.Message}");
                Console.WriteLine($"GetTeamsByEngineer stack trace: {ex.StackTrace}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/Teams/EngineerAssignments/{engineerAccountId}
        [HttpGet("Teams/EngineerAssignments/{engineerAccountId}")]
        public async Task<IActionResult> GetEngineerAssignments(long engineerAccountId)
        {
            try
            {
                Console.WriteLine($"GetEngineerAssignments: Getting assignments for engineer ID: {engineerAccountId}");

                // Get the classes assigned to this engineer with class details
                var assignments = await _context.ReviewerSupervisorExtensions
                    .AsNoTracking()
                    .Include(r => r.AssignedClass)
                    .Where(r => r.AccountId == engineerAccountId)
                    .Select(r => new
                    {
                        accountId = r.AccountId,
                        assignedClassId = r.AssignedClassId,
                        className = r.AssignedClass != null ? r.AssignedClass.ClassName : null,
                        gradeId = r.AssignedClass != null ? r.AssignedClass.GradeId : (long?)null,
                        statusId = r.StatusId
                    })
                    .ToListAsync();

                Console.WriteLine($"GetEngineerAssignments: Found {assignments.Count} assignments for engineer {engineerAccountId}");

                return Ok(assignments);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GetEngineerAssignments error: {ex.Message}");
                Console.WriteLine($"GetEngineerAssignments stack trace: {ex.StackTrace}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/Teams/Debug/ReviewerSupervisorExtensions
        [HttpGet("Teams/Debug/ReviewerSupervisorExtensions")]
        public async Task<IActionResult> DebugReviewerSupervisorExtensions()
        {
            try
            {
                Console.WriteLine("DebugReviewerSupervisorExtensions: Getting all ReviewerSupervisorExtension records...");

                var extensions = await _context.ReviewerSupervisorExtensions
                    .AsNoTracking()
                    .Include(r => r.Account)
                    .Include(r => r.AssignedClass)
                        .ThenInclude(c => c.Grade)
                    .Select(r => new
                    {
                        accountId = r.AccountId,
                        accountName = r.Account != null ? r.Account.FullNameEn : null,
                        accountRoleId = r.Account != null ? r.Account.RoleId : (long?)null,
                        assignedClassId = r.AssignedClassId,
                        className = r.AssignedClass != null ? r.AssignedClass.ClassName : null,
                        gradeId = r.AssignedClass != null ? r.AssignedClass.GradeId : (long?)null,
                        gradeName = r.AssignedClass != null && r.AssignedClass.Grade != null ? r.AssignedClass.Grade.GradeName : null,
                        statusId = r.StatusId
                    })
                    .ToListAsync();

                Console.WriteLine($"DebugReviewerSupervisorExtensions: Found {extensions.Count} total extensions");

                return Ok(new
                {
                    message = "All ReviewerSupervisorExtension records",
                    count = extensions.Count,
                    extensions = extensions
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"DebugReviewerSupervisorExtensions error: {ex.Message}");
                return StatusCode(500, $"Debug error: {ex.Message}");
            }
        }


        // GET: api/Teams/Debug/GradeInfo
        [HttpGet("Teams/Debug/GradeInfo")]
        public async Task<IActionResult> DebugGradeInfo()
        {
            try
            {
                Console.WriteLine("DebugGradeInfo: Getting grade information...");

                // Get all grades
                var grades = await _context.Grades
                    .AsNoTracking()
                    .Select(g => new
                    {
                        id = g.Id,
                        gradeName = g.GradeName
                    })
                    .ToListAsync();

                // Get all classes with their grades
                var classes = await _context.TblClasses
                    .AsNoTracking()
                    .Include(c => c.Grade)
                    .Select(c => new
                    {
                        id = c.Id,
                        className = c.ClassName,
                        gradeId = c.GradeId,
                        gradeName = c.Grade != null ? c.Grade.GradeName : null
                    })
                    .ToListAsync();

                // Get all teams with their class and grade info
                var teams = await _context.Teams
                    .AsNoTracking()
                    .Include(t => t.Class)
                        .ThenInclude(c => c.Grade)
                    .Select(t => new
                    {
                        id = t.Id,
                        teamName = t.TeamName,
                        classId = t.ClassId,
                        className = t.Class != null ? t.Class.ClassName : null,
                        gradeId = t.Class != null ? t.Class.GradeId : (long?)null,
                        gradeName = t.Class != null && t.Class.Grade != null ? t.Class.Grade.GradeName : null
                    })
                    .ToListAsync();

                return Ok(new
                {
                    message = "Grade information debug",
                    grades = grades,
                    classes = classes,
                    teams = teams
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"DebugGradeInfo error: {ex.Message}");
                return StatusCode(500, $"Debug error: {ex.Message}");
            }
        }
    }
}