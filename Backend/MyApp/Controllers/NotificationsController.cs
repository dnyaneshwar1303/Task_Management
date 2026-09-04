using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using MyApp.Models;

namespace MyApp.Controllers
{
    [ApiController]
    [Route("api")]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationsController(AppDbContext context)
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

        [HttpGet("get-notifications")]
        [HttpGet("notifications")]
        [HttpGet("user-notifications")]
        public IActionResult GetNotifications([FromQuery] int? userId)
        {
            var targetUserId = userId ?? GetCurrentUserId();

            var query = _context.Notifications.AsQueryable();

            if (targetUserId > 0)
            {
                query = query.Where(n => n.UserId == targetUserId);
            }

            var notifications = query
                .OrderByDescending(n => n.Id)
                .Select(n => new
                {
                    n.Id,
                    n.UserId,
                    n.TaskId,
                    n.Message,
                    n.Type,
                    IsRead = n.IsRead ?? false,
                    n.CreatedAt
                })
                .Take(50)
                .ToList();

            return Ok(notifications);
        }

        [HttpGet("notifications/unread-count")]
        public IActionResult GetUnreadCount([FromQuery] int? userId)
        {
            var targetUserId = userId ?? GetCurrentUserId();
            var count = _context.Notifications
                .Where(n => (targetUserId == 0 || n.UserId == targetUserId) && (n.IsRead == false || n.IsRead == null))
                .Count();

            return Ok(new { unreadCount = count });
        }

        [HttpPut("notifications/{id}/read")]
        [HttpPost("mark-read/{id}")]
        public IActionResult MarkAsRead([FromRoute] int id)
        {
            var notification = _context.Notifications.FirstOrDefault(n => n.Id == id);
            if (notification == null)
            {
                return NotFound(new { message = "Notification not found" });
            }

            notification.IsRead = true;
            _context.SaveChanges();

            return Ok(new { message = "Notification marked as read", id });
        }

        [HttpPut("notifications/read-all")]
        public IActionResult MarkAllAsRead([FromQuery] int? userId)
        {
            var targetUserId = userId ?? GetCurrentUserId();
            var list = _context.Notifications
                .Where(n => (targetUserId == 0 || n.UserId == targetUserId) && (n.IsRead == false || n.IsRead == null))
                .ToList();

            foreach (var n in list)
            {
                n.IsRead = true;
            }

            _context.SaveChanges();

            return Ok(new { message = "All notifications marked as read", count = list.Count });
        }
    }
}
