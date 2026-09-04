using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApp.Models;

namespace MyApp.Controllers
{
    [ApiController]
    [Route("api")]
    public class TeamMemberController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TeamMemberController(AppDbContext context)
        {
            _context = context;
        }

        private string GetCurrentUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
        }

        // POST: /api/add-team-member (Admin & Manager can assign users to teams)
        [HttpPost("add-team-member")]
        [HttpPost("team-members")]
        public IActionResult AddTeamMember([FromBody] AddMemberDto dto)
        {
            var role = GetCurrentUserRole();
            if (role == "User")
            {
                return StatusCode(403, new { message = "Access denied. Regular users cannot assign team members." });
            }

            var team = _context.Teams.FirstOrDefault(x => x.Id == dto.TeamId);
            if (team == null)
            {
                return NotFound(new { message = "Team not found." });
            }

            var user = _context.Users.FirstOrDefault(x => x.Id == dto.UserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            var exists = _context.Teammembers.Any(x => x.TeamId == dto.TeamId && x.UserId == dto.UserId);
            if (exists)
            {
                return BadRequest(new { message = "User is already a member of this team." });
            }

            var member = new Teammember
            {
                TeamId = dto.TeamId,
                UserId = dto.UserId
            };

            _context.Teammembers.Add(member);
            _context.SaveChanges();

            return Created($"/api/team-members/{dto.TeamId}", new
            {
                message = "Team member added successfully",
                memberId = member.Id,
                teamId = member.TeamId,
                userId = member.UserId,
                userName = user.Name
            });
        }

        // GET: /api/team-members/{teamId}
        [HttpGet("team-member/{teamId}")]
        [HttpGet("team-members/{teamId}")]
        public IActionResult GetTeamMembersByTeamId([FromRoute] int teamId)
        {
            var team = _context.Teams.FirstOrDefault(x => x.Id == teamId);
            if (team == null)
            {
                return NotFound(new { message = "Team not found." });
            }

            var members = _context.Teammembers
                .Where(x => x.TeamId == teamId)
                .Include(x => x.User)
                .Select(x => new
                {
                    MemberId = x.Id,
                    UserId = x.UserId,
                    UserName = x.User.Name,
                    UserEmail = x.User.Email,
                    UserRole = x.User.Role
                })
                .ToList();

            return Ok(members);
        }

        // DELETE: /api/team-members/{teamId}/{userId} (Admin & Manager can remove members)
        [HttpDelete("team-members/{teamId}/{userId}")]
        [HttpDelete("remove-team-member/{teamId}/{userId}")]
        public IActionResult RemoveMemberByTeamAndUser([FromRoute] int teamId, [FromRoute] int userId)
        {
            var role = GetCurrentUserRole();
            if (role == "User")
            {
                return StatusCode(403, new { message = "Access denied. Regular users cannot remove team members." });
            }

            var member = _context.Teammembers.FirstOrDefault(x => x.TeamId == teamId && x.UserId == userId);
            if (member == null)
            {
                return NotFound(new { message = "Team member not found." });
            }

            _context.Teammembers.Remove(member);
            _context.SaveChanges();

            return Ok(new { message = "Team member removed successfully" });
        }
    }
}