using Elsewedy_Capstone_System.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;

namespace Elsewedy_Capstone_System.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StudentExtensionsController : ControllerBase
    {
        private readonly SchoolDbContext _context;

        public StudentExtensionsController(SchoolDbContext context)
        {
            _context = context;
        }

        // GET: api/StudentExtensions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<StudentExtension>>> GetStudentExtensions()
        {
            return await _context.StudentExtensions
                                 .Include(s => s.Account)
                                 .Include(s => s.Class)
                                 .Include(s => s.Status)
                                 .ToListAsync();
        }

        // GET: api/StudentExtensions/5
        [HttpGet("{id}")]
        public async Task<ActionResult<StudentExtension>> GetStudentExtension(long id)
        {
            var studentExtension = await _context.StudentExtensions
                                                 .Include(s => s.Account)
                                                 .Include(s => s.Class)
                                                 .Include(s => s.Status)
                                                 .FirstOrDefaultAsync(s => s.AccountId == id);

            if (studentExtension == null)
            {
                return NotFound();
            }

            return studentExtension;
        }

        // POST: api/StudentExtensions
        [HttpPost]
        public async Task<ActionResult<StudentExtension>> PostStudentExtension(StudentExtension studentExtension)
        {
            _context.StudentExtensions.Add(studentExtension);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetStudentExtension), new { id = studentExtension.AccountId }, studentExtension);
        }

        // PUT: api/StudentExtensions/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutStudentExtension(long id, StudentExtension studentExtension)
        {
            if (id != studentExtension.AccountId)
            {
                return BadRequest();
            }

            _context.Entry(studentExtension).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!StudentExtensionExists(id))
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

        // DELETE: api/StudentExtensions/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStudentExtension(long id)
        {
            var studentExtension = await _context.StudentExtensions.FindAsync(id);
            if (studentExtension == null)
            {
                return NotFound();
            }

            _context.StudentExtensions.Remove(studentExtension);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool StudentExtensionExists(long id)
        {
            return _context.StudentExtensions.Any(e => e.AccountId == id);
        }
    }
}
