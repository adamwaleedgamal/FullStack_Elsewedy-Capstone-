using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Elsewedy_Capstone_System.Models;

namespace Elsewedy_Capstone_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        private readonly SchoolDbContext _context;

        public TestController(SchoolDbContext context)
        {
            _context = context;
        }

        // GET: api/Test/Student/{id}
        [HttpGet("Student/{id}")]
        public async Task<IActionResult> TestStudent(long id)
        {
            try
            {
                // Check if student account exists
                var account = await _context.Accounts
                    .AsNoTracking()
                    .Where(a => a.Id == id)
                    .FirstOrDefaultAsync();

                if (account == null)
                    return NotFound($"Account with ID {id} not found");

                // Check if student has extension
                var studentExt = await _context.StudentExtensions
                    .AsNoTracking()
                    .Include(se => se.Class)
                    .ThenInclude(c => c.Grade)
                    .Where(se => se.AccountId == id)
                    .FirstOrDefaultAsync();

                // Check if student is in a team
                var teamMember = await _context.TeamMembers
                    .AsNoTracking()
                    .Include(tm => tm.Team)
                    .Where(tm => tm.TeamMemberAccountId == id)
                    .FirstOrDefaultAsync();

                // Check if there are any tasks for the student's grade
                var tasks = new List<object>();
                if (studentExt?.Class?.GradeId != null)
                {
                    var taskList = await _context.TblTasks
                        .AsNoTracking()
                        .Where(t => t.GradeId == studentExt.Class.GradeId)
                        .Select(t => new
                        {
                            t.Id,
                            t.TaskName,
                            t.TaskDescription,
                            t.TaskDeadline,
                            t.StatusId,
                            t.GradeId
                        })
                        .ToListAsync();
                    
                    tasks = taskList.Cast<object>().ToList();
                }

                return Ok(new
                {
                    Account = account,
                    StudentExtension = studentExt,
                    TeamMember = teamMember,
                    Tasks = tasks,
                    Message = "Database connection successful"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message, StackTrace = ex.StackTrace });
            }
        }

        // GET: api/Test/Connection
        [HttpGet("Connection")]
        public async Task<IActionResult> TestConnection()
        {
            try
            {
                // Test basic database connection
                var accountCount = await _context.Accounts.CountAsync();
                var studentCount = await _context.StudentExtensions.CountAsync();
                var teamCount = await _context.Teams.CountAsync();
                var taskCount = await _context.TblTasks.CountAsync();

                return Ok(new
                {
                    Message = "Database connection successful",
                    AccountCount = accountCount,
                    StudentCount = studentCount,
                    TeamCount = teamCount,
                    TaskCount = taskCount
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message, StackTrace = ex.StackTrace });
            }
        }
    }
} 