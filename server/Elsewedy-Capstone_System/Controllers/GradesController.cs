using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Elsewedy_Capstone_System.Models;

namespace Elsewedy_Capstone_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GradesController : ControllerBase
    {
        private readonly SchoolDbContext _context;

        public GradesController(SchoolDbContext context)
        {
            _context = context;
        }

        // GET: api/Grades
        [HttpGet]
        public async Task<IActionResult> GetGrades()
        {
            try
            {
                var grades = await _context.Grades
                    .AsNoTracking()
                    .OrderBy(g => g.GradeName)
                    .Select(g => new
                    {
                        g.Id,
                        g.GradeName,
                        g.StatusId
                    })
                    .ToListAsync();

                return Ok(grades);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}


