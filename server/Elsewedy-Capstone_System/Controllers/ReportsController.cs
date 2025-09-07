using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Elsewedy_Capstone_System.Models;
using Elsewedy_Capstone_System.Constants;

namespace Elsewedy_Capstone_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly SchoolDbContext _context;

        public ReportsController(SchoolDbContext context)
        {
            _context = context;
        }

        // GET: api/Reports
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Report>>> GetReports()
        {
            return await _context.Reports
                .AsNoTracking()
                .Include(r => r.Status)
                .Include(r => r.SubmitterAccount)
                .OrderByDescending(r => r.SubmissionDate)
                .ToListAsync();
        }

        // GET: api/Reports/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Report>> GetReport(long id)
        {
            var report = await _context.Reports
                .AsNoTracking()
                .Include(r => r.Status)
                .Include(r => r.SubmitterAccount)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (report == null)
                return NotFound("Report not found");

            return report;
        }

        // GET: api/Reports/ByUser/{submitterAccountId}
        [HttpGet("ByUser/{submitterAccountId}")]
        public async Task<ActionResult<IEnumerable<Report>>> GetReportsByUser(long submitterAccountId)
        {
            var reports = await _context.Reports
                .AsNoTracking()
                .Include(r => r.Status)
                .Include(r => r.SubmitterAccount)
                .Where(r => r.SubmitterAccountId == submitterAccountId)
                .OrderByDescending(r => r.SubmissionDate)
                .ToListAsync();

            return reports;
        }

        // POST: api/Reports
        [HttpPost]
        public async Task<ActionResult<Report>> CreateReport([FromBody] Report report)
        {
            Console.WriteLine($"ReportsController - CreateReport called with data: {System.Text.Json.JsonSerializer.Serialize(report)}");
            
            if (report == null)
            {
                Console.WriteLine("ReportsController - Report is null");
                return BadRequest("Report data is required");
            }

            // Create a new Report entity with only the basic properties
            var newReport = new Report
            {
                Title = report.Title,
                ReportMessage = report.ReportMessage,
                SubmitterAccountId = report.SubmitterAccountId,
                StatusId = report.StatusId > 0 ? report.StatusId : StatusConstants.GetDefaultReportStatus(),
                SubmissionDate = DateTime.UtcNow
            };

            // Validate required fields
            if (string.IsNullOrWhiteSpace(newReport.Title))
            {
                Console.WriteLine("ReportsController - Title is null or empty");
                return BadRequest("Report title is required");
            }

            if (string.IsNullOrWhiteSpace(newReport.ReportMessage))
            {
                Console.WriteLine("ReportsController - ReportMessage is null or empty");
                return BadRequest("Report message is required");
            }

            if (newReport.SubmitterAccountId <= 0)
            {
                Console.WriteLine($"ReportsController - Invalid SubmitterAccountId: {newReport.SubmitterAccountId}");
                return BadRequest("Valid submitter account ID is required");
            }

            Console.WriteLine($"ReportsController - Adding report to context: {System.Text.Json.JsonSerializer.Serialize(newReport)}");
            
            _context.Reports.Add(newReport);
            await _context.SaveChangesAsync();

            Console.WriteLine($"ReportsController - Report created successfully with ID: {newReport.Id}");
            return CreatedAtAction(nameof(GetReport), new { id = newReport.Id }, newReport);
        }

        // PUT: api/Reports/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateReport(long id, [FromBody] Report reportUpdate)
        {
            if (id != reportUpdate.Id)
                return BadRequest("ID mismatch");

            var existingReport = await _context.Reports.FindAsync(id);
            if (existingReport == null)
                return NotFound("Report not found");

            // Update allowed fields
            existingReport.Title = reportUpdate.Title;
            existingReport.ReportMessage = reportUpdate.ReportMessage;
            existingReport.StatusId = reportUpdate.StatusId;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ReportExists(id))
                    return NotFound("Report not found");
                else
                    throw;
            }

            return NoContent();
        }

        // DELETE: api/Reports/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReport(long id)
        {
            var report = await _context.Reports.FindAsync(id);
            if (report == null)
                return NotFound("Report not found");

            _context.Reports.Remove(report);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ReportExists(long id)
        {
            return _context.Reports.Any(e => e.Id == id);
        }
    }
}
