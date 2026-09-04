using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApp.Models;

namespace MyApp.Controllers
{
    [ApiController]
    [Route("api")]
    public class CommentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CommentsController(AppDbContext context)
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

        [HttpGet("tasks/{taskId}/comments")]
        [HttpGet("get-comments/{taskId}")]
        public IActionResult GetComments([FromRoute] int taskId)
        {
            var comments = _context.Comments
                .Where(c => c.TaskId == taskId)
                .Include(c => c.User)
                .OrderBy(c => c.Id)
                .Select(c => new
                {
                    c.Id,
                    c.TaskId,
                    c.UserId,
                    UserName = c.User.Name,
                    UserEmail = c.User.Email,
                    UserRole = c.User.Role,
                    c.CommentText,
                    c.CreatedAt
                })
                .ToList();

            return Ok(comments);
        }

        public class NewCommentRequest
        {
            public int? TaskId { get; set; }
            public int? UserId { get; set; }
            public string CommentText { get; set; } = string.Empty;
        }

        [HttpPost("tasks/{taskId}/comments")]
        public IActionResult AddCommentToTask([FromRoute] int taskId, [FromBody] CreateCommentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CommentText))
            {
                return BadRequest(new { message = "Comment text cannot be empty" });
            }

            var task = _context.Tasks.FirstOrDefault(t => t.Id == taskId);
            if (task == null)
            {
                return NotFound(new { message = "Task not found" });
            }

            var userId = GetCurrentUserId();
            if (userId == 0)
            {
                var fallbackUser = _context.Users.FirstOrDefault();
                if (fallbackUser != null) userId = fallbackUser.Id;
            }

            var comment = new Comment
            {
                TaskId = taskId,
                UserId = userId,
                CommentText = dto.CommentText.Trim(),
                CreatedAt = DateOnly.FromDateTime(DateTime.UtcNow)
            };

            _context.Comments.Add(comment);
            _context.SaveChanges();

            var author = _context.Users.FirstOrDefault(u => u.Id == userId);

            return Created($"/api/tasks/{taskId}/comments", new
            {
                comment.Id,
                comment.TaskId,
                comment.UserId,
                UserName = author?.Name ?? "User",
                UserRole = author?.Role ?? "User",
                comment.CommentText,
                comment.CreatedAt
            });
        }

        [HttpPost("add-comment")]
        public IActionResult AddCommentDirect([FromBody] NewCommentRequest req)
        {
            if (!req.TaskId.HasValue || string.IsNullOrWhiteSpace(req.CommentText))
            {
                return BadRequest(new { message = "TaskId and CommentText are required" });
            }

            var userId = req.UserId ?? GetCurrentUserId();
            if (userId == 0)
            {
                var fallbackUser = _context.Users.FirstOrDefault();
                if (fallbackUser != null) userId = fallbackUser.Id;
            }

            var comment = new Comment
            {
                TaskId = req.TaskId.Value,
                UserId = userId,
                CommentText = req.CommentText.Trim(),
                CreatedAt = DateOnly.FromDateTime(DateTime.UtcNow)
            };

            _context.Comments.Add(comment);
            _context.SaveChanges();

            var author = _context.Users.FirstOrDefault(u => u.Id == userId);

            return Created($"/api/tasks/{req.TaskId}/comments", new
            {
                comment.Id,
                comment.TaskId,
                comment.UserId,
                UserName = author?.Name ?? "User",
                UserRole = author?.Role ?? "User",
                comment.CommentText,
                comment.CreatedAt
            });
        }
    }
}
