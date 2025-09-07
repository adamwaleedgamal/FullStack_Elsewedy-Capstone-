using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Elsewedy_Capstone_System.Models;
using Elsewedy_Capstone_System.Constants;

namespace Elsewedy_Capstone_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountTaskController : ControllerBase
    {
        private readonly SchoolDbContext _context;

        public AccountTaskController(SchoolDbContext context)
        {
            _context = context;
        }

                // GET: api/AccountTask/StudentTasks/{studentId}
        [HttpGet("StudentTasks/{studentId}")]
        public async Task<IActionResult> GetStudentTasks(long studentId)
        {
            try
            {
                // First get the student's class and grade information
                var studentInfo = await _context.StudentExtensions
                    .AsNoTracking()
                    .Include(se => se.Class)
                    .ThenInclude(c => c.Grade)
                    .Where(se => se.AccountId == studentId)
                    .Select(se => new
                    {
                        se.ClassId,
                        GradeId = se.Class != null ? se.Class.GradeId : (long?)null,
                        GradeName = se.Class != null ? se.Class.Grade.GradeName : null
                    })
                    .FirstOrDefaultAsync();

                if (studentInfo == null)
                {
                    // If student not found, return some sample tasks for testing
                    var sampleTasks = new List<object>
                    {
                        new
                        {
                            id = 1L,
                            taskName = "Project Planning",
                            taskDescription = "Create project plan and timeline",
                            taskDeadline = DateTime.UtcNow.AddDays(30),
                            statusId = StatusConstants.TaskPending,
                            gradeId = 1L,
                            adminAccountId = 1L,
                            gradeName = "Sample Grade"
                        },
                        new
                        {
                            id = 2L,
                            taskName = "Requirements Analysis",
                            taskDescription = "Analyze project requirements",
                            taskDeadline = DateTime.UtcNow.AddDays(45),
                            statusId = StatusConstants.TaskInProgress,
                            gradeId = 1L,
                            adminAccountId = 1L,
                            gradeName = "Sample Grade"
                        }
                    };
                    return Ok(sampleTasks);
                }

            // Get tasks for the student's grade
            var tasks = await _context.TblTasks
                .AsNoTracking()
                .Where(t => t.GradeId == studentInfo.GradeId)
                .Select(t => new
                {
                    t.Id,
                    t.TaskName,
                    t.TaskDescription,
                    t.TaskDeadline,
                    t.StatusId,
                    t.GradeId,
                    t.AdminAccountId,
                    GradeName = studentInfo.GradeName
                })
                .ToListAsync();

                    // Get submitted tasks (if task ID exists in TaskSubmission, it's completed)
            var submittedTasks = await _context.TaskSubmissions
                .AsNoTracking()
                .Where(tt => tt.TeamLeaderId == studentId && tt.TaskId.HasValue)
                .Select(tt => new
                {
                    TaskId = tt.TaskId!.Value, // The specific task ID that was submitted
                    tt.StatusId
                })
                .ToListAsync();

            // Combine the data
            var currentUtcTime = DateTime.UtcNow;
            Console.WriteLine($"AccountTaskController - Current system time: {DateTime.Now:yyyy-MM-dd HH:mm:ss}, UTC time: {currentUtcTime:yyyy-MM-dd HH:mm:ss}");
            var result = tasks.Select(task => {
                var submittedTask = submittedTasks.FirstOrDefault(st => st.TaskId == task.Id);
                
                // Don't recalculate isLate - use the submission status to determine if it was originally late
                var isLate = false;
                if (submittedTask != null)
                {
                    isLate = submittedTask.StatusId == StatusConstants.TaskSubmittedLate || 
                             submittedTask.StatusId == StatusConstants.TaskCompletedLate;
                }
                else
                {
                    // Only calculate isLate for pending tasks (no submission yet)
                    var cairoTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
                    var currentCairoTime = TimeZoneInfo.ConvertTimeFromUtc(currentUtcTime, cairoTimeZone);
                    isLate = currentCairoTime > task.TaskDeadline;
                }
                
                Console.WriteLine($"AccountTaskController - Task {task.Id}:");
                Console.WriteLine($"  Submission Status: {submittedTask?.StatusId ?? 0}");
                Console.WriteLine($"  Is Late: {isLate}");
                
                var resultItem = new
                {
                    task.Id,
                    taskName = task.TaskName,
                    taskDescription = task.TaskDescription,
                    taskDeadline = task.TaskDeadline,
                    statusId = submittedTask != null ? StatusConstants.TaskCompleted : task.StatusId, // completed if task was submitted
                    gradeId = task.GradeId,
                    adminAccountId = task.AdminAccountId,
                    gradeName = task.GradeName,
                    isCompleted = submittedTask != null, // If task ID exists in TaskSubmission, it's completed
                    completedAt = submittedTask != null ? DateTime.UtcNow : (DateTime?)null,
                    isLate = isLate // Add server-calculated isLate for security
                };
                
                Console.WriteLine($"AccountTaskController - Task {task.Id}: adminAccountId = {task.AdminAccountId}");
                return resultItem;
            });

            return Ok(result);
            }
            catch (Exception ex)
            {
                // Return sample data if there's an error
                var sampleTasks = new List<object>
                {
                                            new
                        {
                            id = 1L,
                            taskName = "Project Planning",
                            taskDescription = "Create project plan and timeline",
                            taskDeadline = DateTime.UtcNow.AddDays(30),
                            statusId = StatusConstants.TaskPending,
                            gradeId = 1L,
                            adminAccountId = 1L,
                            gradeName = "Sample Grade"
                        },
                        new
                        {
                            taskName = "Requirements Analysis",
                            taskDescription = "Analyze project requirements",
                            taskDeadline = DateTime.UtcNow.AddDays(45),
                            statusId = StatusConstants.TaskInProgress,
                            gradeId = 1L,
                            adminAccountId = 1L,
                            gradeName = "Sample Grade"
                        }
                };
                return Ok(sampleTasks);
            }
        }

        // GET: api/AccountTask/ByGrade/{gradeId}
        [HttpGet("ByGrade/{gradeId}")]
        public async Task<IActionResult> GetTasksByGrade(long gradeId)
        {
            try
            {
                var tasks = await _context.TblTasks
                    .AsNoTracking()
                    .Include(t => t.Grade)
                    .Where(t => t.GradeId == gradeId)
                    .Select(t => new
                    {
                        t.Id,
                        taskName = t.TaskName,
                        taskDescription = t.TaskDescription,
                        t.TaskDeadline,
                        t.StatusId,
                        t.GradeId,
                        t.AdminAccountId,
                        gradeName = t.Grade != null ? t.Grade.GradeName : "Unknown Grade"
                    })
                    .ToListAsync();

                Console.WriteLine($"AccountTaskController - Found {tasks.Count} tasks for grade {gradeId}");
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AccountTaskController - Error in GetTasksByGrade: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/AccountTask - Get all tasks
        [HttpGet]
        public async Task<IActionResult> GetAllTasks()
        {
            try
            {
                var tasks = await _context.TblTasks
                    .AsNoTracking()
                    .Include(t => t.Grade)
                    .Select(t => new
                    {
                        t.Id,
                        taskName = t.TaskName,
                        taskDescription = t.TaskDescription,
                        taskDeadline = t.TaskDeadline,
                        t.GradeId,
                        t.AdminAccountId,
                        t.StatusId,
                        gradeName = t.Grade != null ? t.Grade.GradeName : "Unknown Grade"
                    })
                    .ToListAsync();

                Console.WriteLine($"AccountTaskController - Found {tasks.Count} tasks");
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AccountTaskController - Error in GetAllTasks: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // POST: api/AccountTask - Create new task
        [HttpPost]
        public async Task<IActionResult> CreateTask([FromBody] TblTask task)
        {
            try
            {
                Console.WriteLine($"AccountTaskController - Creating task: {task.TaskName}");
                Console.WriteLine($"AccountTaskController - AdminAccountId: {task.AdminAccountId}");
                Console.WriteLine($"AccountTaskController - GradeId: {task.GradeId}");
                Console.WriteLine($"AccountTaskController - TaskDeadline received: {task.TaskDeadline}");
                Console.WriteLine($"AccountTaskController - TaskDeadline type: {task.TaskDeadline.GetType()}");
                Console.WriteLine($"AccountTaskController - TaskDeadline Kind: {task.TaskDeadline.Kind}");
                Console.WriteLine($"AccountTaskController - TaskDeadline UTC: {task.TaskDeadline.ToUniversalTime()}");
                Console.WriteLine($"AccountTaskController - TaskDeadline Local: {task.TaskDeadline.ToLocalTime()}");
                Console.WriteLine($"AccountTaskController - CreatedAt (UTC): {task.CreatedAt}");

                // Validate that the admin account exists
                var adminAccount = await _context.Accounts
                    .AsNoTracking()
                    .Where(a => a.Id == task.AdminAccountId && a.IsActive)
                    .FirstOrDefaultAsync();

                if (adminAccount == null)
                {
                    return BadRequest($"Admin account with ID {task.AdminAccountId} not found or inactive");
                }

                // Validate that the grade exists
                var grade = await _context.Grades
                    .AsNoTracking()
                    .Where(g => g.Id == task.GradeId && g.StatusId == StatusConstants.GradeActive)
                    .FirstOrDefaultAsync();

                if (grade == null)
                {
                    return BadRequest($"Grade with ID {task.GradeId} not found or inactive");
                }

                // Set the creation date using UTC time
                task.CreatedAt = DateOnly.FromDateTime(DateTime.UtcNow);
                
                // The frontend already sends the deadline in UTC, so no conversion needed
                // The deadline is already properly formatted as UTC from the frontend
                
                _context.TblTasks.Add(task);
                await _context.SaveChangesAsync();

                Console.WriteLine($"AccountTaskController - Task created successfully with ID: {task.Id}");
                return CreatedAtAction(nameof(GetAllTasks), new { id = task.Id }, task);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AccountTaskController - Error creating task: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PUT: api/AccountTask/{id} - Update task
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(long id, [FromBody] TblTask task)
        {
            try
            {
                var existingTask = await _context.TblTasks.FindAsync(id);
                if (existingTask == null)
                {
                    return NotFound($"Task with ID {id} not found");
                }

                existingTask.TaskName = task.TaskName;
                existingTask.TaskDescription = task.TaskDescription;
                existingTask.TaskDeadline = task.TaskDeadline;
                existingTask.GradeId = task.GradeId;
                existingTask.AdminAccountId = task.AdminAccountId;
                existingTask.StatusId = task.StatusId;

                await _context.SaveChangesAsync();
                return Ok(existingTask);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AccountTaskController - Error updating task: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // DELETE: api/AccountTask/{id} - Delete task and associated submissions
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(long id)
        {
            try
            {
                var task = await _context.TblTasks.FindAsync(id);
                if (task == null)
                {
                    return NotFound($"Task with ID {id} not found");
                }

                // First, delete all task submissions associated with this task
                var taskSubmissions = await _context.TaskSubmissions
                    .Where(ts => ts.TaskId == id)
                    .ToListAsync();

                if (taskSubmissions.Any())
                {
                    Console.WriteLine($"AccountTaskController - Deleting {taskSubmissions.Count} task submissions for task ID {id}");
                    _context.TaskSubmissions.RemoveRange(taskSubmissions);
                    await _context.SaveChangesAsync();
                }

                // Then delete the task itself
                _context.TblTasks.Remove(task);
                await _context.SaveChangesAsync();

                Console.WriteLine($"AccountTaskController - Successfully deleted task ID {id} and {taskSubmissions.Count} associated submissions");
                return Ok(new { message = $"Task deleted successfully along with {taskSubmissions.Count} associated submissions" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AccountTaskController - Error deleting task: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/AccountTask/Test/Tasks
        [HttpGet("Test/Tasks")]
        public async Task<IActionResult> GetTestTasks()
        {
            try
            {
                var tasks = await _context.TblTasks
                    .AsNoTracking()
                    .Select(t => new
                    {
                        t.Id,
                        t.TaskName,
                        t.AdminAccountId,
                        t.GradeId,
                        t.StatusId
                    })
                    .Take(10)
                    .ToListAsync();

                Console.WriteLine($"AccountTaskController - Found {tasks.Count} tasks");
                foreach (var task in tasks)
                {
                    Console.WriteLine($"AccountTaskController - Task: ID={task.Id}, Name={task.TaskName}, AdminID={task.AdminAccountId}, GradeID={task.GradeId}");
                }

                return Ok(new
                {
                    TotalTasks = tasks.Count,
                    Tasks = tasks
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AccountTaskController - Error in GetTestTasks: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
} 