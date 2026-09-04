using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using MyApp.Models;

namespace MyApp.Controllers
{
    [ApiController]
    [Route("api")]
    public class TeamController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TeamController(AppDbContext context)
        {
            _context = context;
        }

        private string GetCurrentUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
        }

        // POST: /api/add-team (Admin & Manager can create teams)
        [HttpPost("add-team")]
        [HttpPost("teams")]
        public IActionResult AddTeam([FromBody] CreateTeamDto dto)
        {
            var role = GetCurrentUserRole();
            if (role == "User")
            {
                return StatusCode(403, new { message = "Access denied. Regular users cannot manage teams." });
            }

            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { message = "Team name is required" });
            }

            var team = new Team
            {
                Name = dto.Name.Trim(),
                CreatedAt = DateOnly.FromDateTime(DateTime.UtcNow)
            };

            _context.Teams.Add(team);
            _context.SaveChanges();

            return Created($"/api/get-team/{team.Id}", team);
        }

        // GET: /api/get-teams
        [HttpGet("get-teams")]
        [HttpGet("teams")]
        public IActionResult FetchTeams()
        {
            var teams = _context.Teams
                .Select(t => new
                {
                    t.Id,
                    t.Name,
                    t.CreatedAt,
                    MemberCount = t.Teammembers.Count(),
                    Members = t.Teammembers.Select(m => new
                    {
                        m.Id,
                        m.UserId,
                        UserName = m.User.Name,
                        UserEmail = m.User.Email,
                        UserRole = m.User.Role
                    }).ToList(),
                    TaskCount = t.Tasks.Count()
                })
                .ToList();

            return Ok(teams);
        }

        // GET: /api/get-team/{id}
        [HttpGet("get-team/{id}")]
        [HttpGet("teams/{id}")]
        public IActionResult GetTeamById([FromRoute] int id)
        {
            var team = _context.Teams
                .Where(t => t.Id == id)
                .Select(t => new
                {
                    t.Id,
                    t.Name,
                    t.CreatedAt,
                    MemberCount = t.Teammembers.Count(),
                    Members = t.Teammembers.Select(m => new
                    {
                        m.Id,
                        m.UserId,
                        UserName = m.User.Name,
                        UserEmail = m.User.Email,
                        UserRole = m.User.Role
                    }).ToList(),
                    TaskCount = t.Tasks.Count()
                })
                .FirstOrDefault();

            if (team == null)
            {
                return NotFound(new { message = "Team not found" });
            }

            return Ok(team);
        }

        // DELETE: /api/delete-team/{id} (Admin only)
        [HttpDelete("delete-team/{id}")]
        [HttpDelete("teams/{id}")]
        public IActionResult DeleteTeam([FromRoute] int id)
        {
            var role = GetCurrentUserRole();
            if (role != "Admin")
            {
                return StatusCode(403, new { message = "Access denied. Only Admin can delete teams." });
            }

            var team = _context.Teams.FirstOrDefault(x => x.Id == id);
            if (team == null)
            {
                return NotFound(new { message = "Team not found" });
            }

            var members = _context.Teammembers.Where(m => m.TeamId == id);
            _context.Teammembers.RemoveRange(members);

            _context.Teams.Remove(team);
            _context.SaveChanges();
            return Ok(new { message = "Team removed successfully" });
        }
    }
}