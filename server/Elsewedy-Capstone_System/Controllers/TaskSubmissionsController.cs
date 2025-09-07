using Elsewedy_Capstone_System.Models;
using Elsewedy_Capstone_System.Constants;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;

[Route("api/[controller]")]
[ApiController]
public class TaskSubmissionsController : ControllerBase
{
    private readonly SchoolDbContext _context;

    public TaskSubmissionsController(SchoolDbContext context)
    {
        _context = context;
    }

    // GET: api/TaskSubmissions
    [HttpGet]
    public async Task<IActionResult> GetTaskSubmissions()
    {
        try
        {
            var currentUtcTime = DateTime.UtcNow;
            var list = await _context.TaskSubmissions
                .AsNoTracking()
                .Select(s => new
                {
                    TaskSubmissionId = s.TaskSubmissionId,
                    TeamId = s.TeamId,
                    TeamLeaderId = s.TeamLeaderId,
                    TeamLeaderName = _context.Accounts
                        .AsNoTracking()
                        .Where(a => a.Id == s.TeamLeaderId)
                        .Select(a => a.FullNameEn)
                        .FirstOrDefault(),
                    GradeId = s.GradeId,
                    TaskId = s.TaskId,
                    Glink = s.Glink,
                    Note = s.Note,
                    Feedback = s.Feedback, // may be null
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt,
                    StatusId = s.StatusId,
                    // Add task deadline and isLate calculation for security
                    TaskDeadline = _context.TblTasks
                        .AsNoTracking()
                        .Where(t => t.Id == s.TaskId)
                        .Select(t => t.TaskDeadline)
                        .FirstOrDefault(),
                    isLate = false // Will be calculated after the query
                })
                .ToListAsync();

            // Don't recalculate isLate - use the status ID to determine if it was originally late
            var result = list.Select(item => new
            {
                item.TaskSubmissionId,
                item.TeamId,
                item.TeamLeaderId,
                item.TeamLeaderName,
                item.GradeId,
                item.TaskId,
                item.Glink,
                item.Note,
                item.Feedback,
                item.CreatedAt,
                item.UpdatedAt,
                item.StatusId,
                item.TaskDeadline,
                isLate = item.StatusId == StatusConstants.TaskSubmittedLate || item.StatusId == StatusConstants.TaskCompletedLate
            }).ToList();

            // lightweight diagnostics (optional): count null feedback
            var nullFeedbackCount = result.Count(x => x.Feedback == null);
            Console.WriteLine($"TaskSubmissionsController - Loaded {result.Count}, null Feedback: {nullFeedbackCount}");
            
            // Log submission details
            foreach (var item in result)
            {
                Console.WriteLine($"TaskSubmissionsController - Submission {item.TaskSubmissionId}:");
                Console.WriteLine($"  Status ID: {item.StatusId}");
                Console.WriteLine($"  Is Late: {item.isLate}");
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"TaskSubmissionsController - Error in GetTaskSubmissions: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // GET: api/TaskSubmissions/5
    [HttpGet("{id}")]
    public async Task<ActionResult<TaskSubmission>> GetTaskSubmission(int id)
    {
        var submission = await _context.TaskSubmissions.FindAsync(id);

        if (submission == null)
        {
            return NotFound();
        }

        return submission;
    }

    // POST: api/TaskSubmissions
    [HttpPost]
    public async Task<ActionResult<TaskSubmission>> PostTaskSubmission(TaskSubmission submission)
    {
        try
        {
            // Get current UTC time
            var currentUtcTime = DateTime.UtcNow;
            
            // Get task deadline for comparison
            var task = await _context.TblTasks
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == submission.TaskId);
            
            if (task == null)
            {
                return BadRequest("Task not found");
            }

            // Compare current time with deadline to determine if submission is late
            // Compare Cairo time with UTC deadline
            var cairoTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
            var currentCairoTime = TimeZoneInfo.ConvertTimeFromUtc(currentUtcTime, cairoTimeZone);
            var isLate = currentCairoTime > task.TaskDeadline;
            var submissionStatus = StatusConstants.GetTaskSubmissionStatus(isLate);
            
            // Store the submission time for future reference
            var submissionTime = currentUtcTime;
            
            Console.WriteLine($"TaskSubmissionsController - Task {task.Id}:");
            Console.WriteLine($"  Current UTC: {currentUtcTime:yyyy-MM-dd HH:mm:ss}");
            Console.WriteLine($"  Current Cairo: {currentCairoTime:yyyy-MM-dd HH:mm:ss}");
            Console.WriteLine($"  Deadline UTC: {task.TaskDeadline:yyyy-MM-dd HH:mm:ss}");
            Console.WriteLine($"  Comparison: {currentCairoTime:yyyy-MM-dd HH:mm:ss} > {task.TaskDeadline:yyyy-MM-dd HH:mm:ss} = {isLate}");
            Console.WriteLine($"  Is Late: {isLate}");
            Console.WriteLine($"  Status ID: {submissionStatus}");

            // Check if this is a resubmission (existing submission for same task and team)
            var existingSubmission = await _context.TaskSubmissions
                .FirstOrDefaultAsync(s => s.TaskId == submission.TaskId && s.TeamId == submission.TeamId);
            
            if (existingSubmission != null)
            {
                // Update existing submission (resubmission)
                existingSubmission.Glink = submission.Glink;
                existingSubmission.Note = submission.Note;
                existingSubmission.StatusId = submissionStatus; // Use late/on-time status
                existingSubmission.Feedback = null; // Clear old feedback
                existingSubmission.UpdatedAt = currentUtcTime;
                
                await _context.SaveChangesAsync();
                
                return Ok(new { 
                    message = isLate ? "Task resubmitted late" : "Task resubmitted successfully", 
                    submissionId = existingSubmission.TaskSubmissionId,
                    isLate = isLate,
                    submittedAt = currentUtcTime,
                    deadline = task.TaskDeadline,
                    timeDifference = currentUtcTime - task.TaskDeadline
                });
            }
            else
            {
                // Create new submission
                submission.CreatedAt = currentUtcTime;
                submission.UpdatedAt = currentUtcTime;
                submission.StatusId = submissionStatus; // Use late/on-time status
                _context.TaskSubmissions.Add(submission);
                await _context.SaveChangesAsync();
                
                return CreatedAtAction(nameof(GetTaskSubmission), new { id = submission.TaskSubmissionId }, new {
                    submission = submission,
                    isLate = isLate,
                    submittedAt = currentUtcTime,
                    deadline = task.TaskDeadline,
                    timeDifference = currentUtcTime - task.TaskDeadline
                });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"TaskSubmissionsController - Error in PostTaskSubmission: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // POST: api/TaskSubmissions/{id}/review
    [HttpPost("{id}/review")]
    public async Task<IActionResult> MarkReviewed(int id, [FromBody] ReviewRequest request)
    {
        try
        {
            var submission = await _context.TaskSubmissions.FirstOrDefaultAsync(s => s.TaskSubmissionId == id);
            if (submission == null)
            {
                return NotFound("Submission not found");
            }

            // Get current UTC time
            var currentUtcTime = DateTime.UtcNow;
            
            // Get task for reference
            var task = await _context.TblTasks
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == submission.TaskId);
            
            // Check if submission was originally late (don't recalculate)
            var isCompletedLate = false;
            if (submission.StatusId == StatusConstants.TaskSubmittedLate)
            {
                // If it was submitted late, mark as completed late
                isCompletedLate = true;
            }
            // If it was submitted on time, mark as completed on time
            // (don't recalculate based on current time vs deadline)

            // Update submission status - use appropriate status based on original submission timing
            var completionStatus = StatusConstants.GetTaskCompletionStatus(isCompletedLate);
            submission.StatusId = completionStatus;
            
            if (!string.IsNullOrWhiteSpace(request?.Feedback))
            {
                submission.Feedback = request.Feedback;
            }
            submission.UpdatedAt = currentUtcTime;

            Console.WriteLine($"Task review - Current UTC: {currentUtcTime:yyyy-MM-dd HH:mm:ss}, Original Status: {submission.StatusId}, Completed Late: {isCompletedLate}, New Status: {completionStatus}");

            // If it is linked to a task, update the task status too
            if (submission.TaskId.HasValue && task != null)
            {
                task.StatusId = completionStatus;
            }

            await _context.SaveChangesAsync();
            return Ok(new { 
                message = isCompletedLate ? "Marked reviewed (completed late)" : "Marked reviewed", 
                submissionId = submission.TaskSubmissionId,
                isCompletedLate = isCompletedLate,
                completedAt = currentUtcTime,
                deadline = task?.TaskDeadline,
                timeDifference = task != null ? currentUtcTime - task.TaskDeadline : TimeSpan.Zero
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"TaskSubmissionsController - Error in MarkReviewed: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    public class ReviewRequest
    {
        public string? Feedback { get; set; }
    }

    // POST: api/TaskSubmissions/{id}/reject
    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectTask(int id)
    {
        try
        {
            var submission = await _context.TaskSubmissions.FirstOrDefaultAsync(s => s.TaskSubmissionId == id);
            if (submission == null)
            {
                return NotFound("Submission not found");
            }

            // Update submission status to rejected
            submission.StatusId = StatusConstants.TaskRejected;
            submission.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Task rejected", submissionId = submission.TaskSubmissionId });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"TaskSubmissionsController - Error in RejectTask: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // POST: api/TaskSubmissions/{id}/feedback
    [HttpPost("{id}/feedback")]
    public async Task<IActionResult> AddFeedback(int id, [FromBody] FeedbackRequest request)
    {
        try
        {
            var submission = await _context.TaskSubmissions.FirstOrDefaultAsync(s => s.TaskSubmissionId == id);
            if (submission == null)
            {
                return NotFound("Submission not found");
            }

            // Add feedback without changing status
            if (!string.IsNullOrWhiteSpace(request?.Feedback))
            {
                submission.Feedback = request.Feedback;
                submission.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return Ok(new { message = "Feedback added successfully", submissionId = submission.TaskSubmissionId });
            }

            return BadRequest("Feedback cannot be empty");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"TaskSubmissionsController - Error in AddFeedback: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    public class FeedbackRequest
    {
        public string? Feedback { get; set; }
    }
    
    // PUT: api/TaskSubmissions/5
    [HttpPut("{id}")]
    public async Task<IActionResult> PutTaskSubmission(int id, TaskSubmission submission)
    {
        if (id != submission.TaskSubmissionId)
        {
            return BadRequest();
        }

        submission.UpdatedAt = DateTime.UtcNow;

        _context.Entry(submission).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!TaskSubmissionExists(id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }

    // DELETE: api/TaskSubmissions/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTaskSubmission(int id)
    {
        var submission = await _context.TaskSubmissions.FindAsync(id);
        if (submission == null)
        {
            return NotFound();
        }

        _context.TaskSubmissions.Remove(submission);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool TaskSubmissionExists(int id)
    {
        return _context.TaskSubmissions.Any(e => e.TaskSubmissionId == id);
    }
}
