using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using MyApp.Models;

namespace MyApp.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
            if (int.TryParse(claim, out int id))
            {
                return id;
            }
            return 0;
        }

        private string GetCurrentUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
        }

        [HttpGet("stats")]
        public IActionResult GetStats([FromQuery] int? userId)
        {
            var role = GetCurrentUserRole();
            var currentUserId = userId ?? GetCurrentUserId();

            var query = _context.Tasks.AsQueryable();

            if (role == "User" && currentUserId > 0)
            {
                query = query.Where(t => t.AssignedTo == currentUserId);
            }
            else if (userId.HasValue)
            {
                query = query.Where(t => t.AssignedTo == userId.Value);
            }

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var totalTasks = query.Count();
            var todoCount = query.Count(t => t.Status == "To Do");
            var inProgressCount = query.Count(t => t.Status == "In Progress");
            var doneCount = query.Count(t => t.Status == "Done");
            var overdueCount = query.Count(t => t.Deadline.HasValue && t.Deadline.Value < today && t.Status != "Done");

            var priorityHigh = query.Count(t => t.Priority == "High");
            var priorityMedium = query.Count(t => t.Priority == "Medium");
            var priorityLow = query.Count(t => t.Priority == "Low");

            var totalTeams = _context.Teams.Count();
            var totalUsers = _context.Users.Count();

            return Ok(new
            {
                totalTasks,
                todoCount,
                inProgressCount,
                doneCount,
                overdueCount,
                priorities = new
                {
                    high = priorityHigh,
                    medium = priorityMedium,
                    low = priorityLow
                },
                totalTeams,
                totalUsers
            });
        }
    }
}
