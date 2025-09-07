using System;
using System.Linq;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Elsewedy_Capstone_System.Models;
using System;
using System.Linq;
using System.Collections.Generic;

namespace Elsewedy_Capstone_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly SchoolDbContext _context;

        public DashboardController(SchoolDbContext context)
        {
            _context = context;
        }

        // GET: api/Dashboard/Student/{studentId}
        [HttpGet("Student/{studentId}")]
        public async Task<IActionResult> GetStudentDashboard(long studentId)
        {
            // Basic student info
            var student = await _context.Accounts
                .AsNoTracking()
                .Where(a => a.Id == studentId && a.IsActive)
                .Select(a => new
                {
                    a.Id,
                    a.FullNameEn,
                    a.Email,
                })
                .FirstOrDefaultAsync();

            if (student == null) return NotFound("Student not found");

            // Student extension (leader, class, grade)
            var studentExt = await _context.StudentExtensions
                .AsNoTracking()
                .Include(se => se.Class)
                .ThenInclude(c => c.Grade)
                .Where(se => se.AccountId == studentId)
                .Select(se => new
                {
                    se.IsLeader,
                    ClassId = se.ClassId,
                    ClassName = se.Class != null ? se.Class.ClassName : null,
                    GradeId = se.Class != null ? se.Class.GradeId : (long?)null,
                    GradeName = se.Class != null ? se.Class.Grade.GradeName : null
                })
                .FirstOrDefaultAsync();

            // Team and teammates
            var teamInfo = await _context.TeamMembers
                .AsNoTracking()
                .Include(tm => tm.Team)
                .ThenInclude(t => t.TeamMembers)
                .ThenInclude(m => m.TeamMemberAccount)
                .Where(tm => tm.TeamMemberAccountId == studentId)
                .Select(tm => new
                {
                    TeamId = tm.TeamId,
                    TeamName = tm.Team.TeamName,
                    Members = tm.Team.TeamMembers
                        .Select(m => new { m.TeamMemberAccountId, Name = m.TeamMemberAccount.FullNameEn })
                        .ToList()
                })
                .FirstOrDefaultAsync();

            // Reviewers (assigned to class) and Capstone Supervisor for the team's class
            long? classId = studentExt?.ClassId;
            var reviewers = new List<object>();
            if (classId != null)
            {
                reviewers = await _context.ReviewerSupervisorExtensions
                    .AsNoTracking()
                    .Include(r => r.Account)
                    .Where(r => r.AssignedClassId == classId)
                    .Select(r => (object)new { r.AccountId, Name = r.Account.FullNameEn })
                    .ToListAsync();
            }

            var capstoneSupervisors = new List<object>();
            if (classId != null)
            {
                capstoneSupervisors = await _context.Teams
                    .AsNoTracking()
                    .Include(t => t.SupervisorAccount)
                    .Where(t => t.ClassId == classId && t.SupervisorAccountId != null)
                    .Select(t => (object)new { t.SupervisorAccountId, Name = t.SupervisorAccount.FullNameEn })
                    .Distinct()
                    .ToListAsync();
            }

            // Admins and Super Admins (names only)
            var admins = await _context.SuperAdminExtensions
                .AsNoTracking()
                .Include(sa => sa.Account)
                .Select(sa => new { sa.AccountId, Name = sa.Account.FullNameEn })
                .ToListAsync();

            // Tasks for student's grade
            long? gradeId = studentExt?.GradeId;
            var tasks = new List<object>();
            if (gradeId != null)
            {
                tasks = await _context.TblTasks
                    .AsNoTracking()
                    .Where(t => t.GradeId == gradeId)
                    .Select(t => (object)new
                    {
                        t.Id,
                        t.TaskName,
                        t.TaskDescription,
                        t.TaskDeadline,
                        t.StatusId
                    })
                    .ToListAsync();
            }

            return Ok(new
            {
                Student = student,
                StudentExtension = studentExt,
                Team = teamInfo,
                Reviewers = reviewers,
                CapstoneSupervisors = capstoneSupervisors,
                Admins = admins,
                Tasks = tasks
            });
        }



        // NOTE: Solution upload endpoint removed for now because TblTask has no GithubLink column.
    }
}


