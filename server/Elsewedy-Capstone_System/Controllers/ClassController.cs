using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Elsewedy_Capstone_System.Models;

namespace Elsewedy_Capstone_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClassController : ControllerBase
    {
        private readonly SchoolDbContext _context;

        public ClassController(SchoolDbContext context)
        {
            _context = context;
        }

        // GET: api/Class
        [HttpGet]
        public async Task<IActionResult> GetClasses()
        {
            try
            {
                var classes = await _context.TblClasses
                    .AsNoTracking()
                    .Include(c => c.Grade)
                    .OrderBy(c => c.Grade.GradeName)
                    .ThenBy(c => c.ClassName)
                    .Select(c => new
                    {
                        c.Id,
                        c.ClassName,
                        c.GradeId,
                        GradeName = c.Grade != null ? c.Grade.GradeName : "Unknown Grade",
                        c.StatusId
                    })
                    .ToListAsync();

                return Ok(classes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/Class/ByGrade/{gradeId}
        [HttpGet("ByGrade/{gradeId}")]
        public async Task<IActionResult> GetClassesByGrade(long gradeId)
        {
            try
            {
                var classes = await _context.TblClasses
                    .AsNoTracking()
                    .Include(c => c.Grade)
                    .Where(c => c.GradeId == gradeId)
                    .OrderBy(c => c.ClassName)
                    .Select(c => new
                    {
                        c.Id,
                        c.ClassName,
                        c.GradeId,
                        GradeName = c.Grade != null ? c.Grade.GradeName : "Unknown Grade",
                        c.StatusId
                    })
                    .ToListAsync();

                return Ok(classes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
