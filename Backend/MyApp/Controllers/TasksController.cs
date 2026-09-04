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
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TasksController(AppDbContext context)
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

        // GET: /api/get-tasks (With Filtering by status, priority, deadline)
        [HttpGet("get-tasks")]
        [HttpGet("tasks")]
        public IActionResult GetTasks(
            [FromQuery] string? status,
            [FromQuery] string? priority,
            [FromQuery] string? deadline,
            [FromQuery] string? search)
        {
            var role = GetCurrentUserRole();
            var currentUserId = GetCurrentUserId();

            var query = _context.Tasks
                .Include(t => t.AssignedToNavigation)
                .Include(t => t.CreatedByNavigation)
                .Include(t => t.Team)
                .AsQueryable();

            // Role Isolation: Regular User can ONLY view tasks assigned to them
            if (role == "User" && currentUserId > 0)
            {
                query = query.Where(t => t.AssignedTo == currentUserId);
            }

            // Filtering by Status (To Do, In Progress, Done)
            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(t => t.Status == status);
            }

            // Filtering by Priority (Low, Medium, High)
            if (!string.IsNullOrWhiteSpace(priority))
            {
                query = query.Where(t => t.Priority == priority);
            }

            // Filtering by Deadline
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            if (!string.IsNullOrWhiteSpace(deadline))
            {
                switch (deadline.ToLower())
                {
                    case "overdue":
                        query = query.Where(t => t.Deadline.HasValue && t.Deadline.Value < today && t.Status != "Done");
                        break;
                    case "today":
                        query = query.Where(t => t.Deadline.HasValue && t.Deadline.Value == today);
                        break;
                    case "upcoming":
                        query = query.Where(t => t.Deadline.HasValue && t.Deadline.Value >= today);
                        break;
                }
            }

            // Search by Title
            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.ToLower().Trim();
                query = query.Where(t => t.Title.ToLower().Contains(term) || (t.Description != null && t.Description.ToLower().Contains(term)));
            }

            var tasks = query
                .OrderByDescending(t => t.Id)
                .Select(t => new
                {
                    t.Id,
                    t.Title,
                    t.Description,
                    t.Status,
                    t.Priority,
                    t.Deadline,
                    t.CreatedAt,
                    t.UpdatedAt,
                    t.TeamId,
                    TeamName = t.Team != null ? t.Team.Name : null,
                    t.AssignedTo,
                    AssignedToName = t.AssignedToNavigation != null ? t.AssignedToNavigation.Name : null,
                    t.CreatedBy,
                    CreatedByName = t.CreatedByNavigation.Name,
                    CommentCount = t.Comments.Count()
                })
                .ToList();

            return Ok(tasks);
        }

        // GET: /api/get-task/{id}
        [HttpGet("get-task/{id}")]
        [HttpGet("tasks/{id}")]
        public IActionResult GetTaskById([FromRoute] int id)
        {
            var task = _context.Tasks
                .Include(t => t.AssignedToNavigation)
                .Include(t => t.CreatedByNavigation)
                .Include(t => t.Team)
                .Include(t => t.Comments)
                    .ThenInclude(c => c.User)
                .FirstOrDefault(t => t.Id == id);

            if (task == null)
            {
                return NotFound(new { message = "Task not found" });
            }

            var role = GetCurrentUserRole();
            var currentUserId = GetCurrentUserId();

            // User can only view their own assigned task
            if (role == "User" && currentUserId > 0 && task.AssignedTo != currentUserId)
            {
                return StatusCode(403, new { message = "Access denied. You can only view tasks assigned to you." });
            }

            return Ok(new
            {
                task.Id,
                task.Title,
                task.Description,
                task.Status,
                task.Priority,
                task.Deadline,
                task.CreatedAt,
                task.UpdatedAt,
                task.TeamId,
                TeamName = task.Team?.Name,
                task.AssignedTo,
                AssignedToName = task.AssignedToNavigation?.Name,
                task.CreatedBy,
                CreatedByName = task.CreatedByNavigation?.Name,
                Comments = task.Comments.OrderBy(c => c.CreatedAt).Select(c => new
                {
                    c.Id,
                    c.TaskId,
                    c.UserId,
                    UserName = c.User.Name,
                    UserRole = c.User.Role,
                    c.CommentText,
                    c.CreatedAt
                }).ToList()
            });
        }

        // POST: /api/add-task (Admin: assigns to managers/users, Manager: creates & assigns to team members)
        [HttpPost("add-task")]
        [HttpPost("tasks")]
        public IActionResult CreateTask([FromBody] CreateTaskDto dto)
        {
            var role = GetCurrentUserRole();
            if (role == "User")
            {
                return StatusCode(403, new { message = "Access denied. Normal users cannot create tasks." });
            }

            if (string.IsNullOrWhiteSpace(dto.Title))
            {
                return BadRequest(new { message = "Task title is required." });
            }

            var currentUserId = GetCurrentUserId();
            if (currentUserId == 0)
            {
                var fallbackUser = _context.Users.FirstOrDefault(u => u.Role == "Admin" || u.Role == "Manager") ?? _context.Users.FirstOrDefault();
                if (fallbackUser != null) currentUserId = fallbackUser.Id;
            }

            var task = new MyApp.Models.Task
            {
                Title = dto.Title.Trim(),
                Description = dto.Description?.Trim(),
                AssignedTo = dto.AssignedTo,
                TeamId = dto.TeamId,
                CreatedBy = currentUserId,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "To Do" : dto.Status,
                Priority = string.IsNullOrWhiteSpace(dto.Priority) ? "Medium" : dto.Priority,
                Deadline = dto.Deadline,
                CreatedAt = DateOnly.FromDateTime(DateTime.UtcNow),
                UpdatedAt = DateOnly.FromDateTime(DateTime.UtcNow)
            };

            _context.Tasks.Add(task);
            _context.SaveChanges();

            // Trigger Mock Notification on Task Assignment
            if (task.AssignedTo.HasValue)
            {
                var notification = new Notification
                {
                    UserId = task.AssignedTo.Value,
                    TaskId = task.Id,
                    Message = $"You have been assigned to task: '{task.Title}'",
                    Type = "TaskAssigned",
                    IsRead = false,
                    CreatedAt = DateOnly.FromDateTime(DateTime.UtcNow)
                };
                _context.Notifications.Add(notification);
                _context.SaveChanges();
            }

            return Created($"/api/get-task/{task.Id}", new { message = "Task created successfully", taskId = task.Id, task });
        }

        // POST: /api/update-task-status/{id} (To Do, In Progress, Done)
        [HttpPost("update-task-status/{id}")]
        [HttpPatch("update-task-status/{id}")]
        [HttpPut("tasks/{id}/status")]
        public IActionResult UpdateTaskStatus([FromRoute] int id, [FromBody] UpdateStatusDto dto)
        {
            var task = _context.Tasks.FirstOrDefault(t => t.Id == id);
            if (task == null)
            {
                return NotFound(new { message = "Task not found" });
            }

            var role = GetCurrentUserRole();
            var currentUserId = GetCurrentUserId();

            // User can only update their own assigned task status
            if (role == "User" && currentUserId > 0 && task.AssignedTo != currentUserId)
            {
                return StatusCode(403, new { message = "Access denied. You can only update tasks assigned to you." });
            }

            var validStatuses = new[] { "To Do", "In Progress", "Done" };
            if (!validStatuses.Contains(dto.Status))
            {
                return BadRequest(new { message = "Status must be 'To Do', 'In Progress', or 'Done'." });
            }

            task.Status = dto.Status;
            task.UpdatedAt = DateOnly.FromDateTime(DateTime.UtcNow);
            _context.SaveChanges();

            // Trigger Mock Notification on Task Status Update
            var notifyUserId = (currentUserId == task.CreatedBy && task.AssignedTo.HasValue)
                ? task.AssignedTo.Value
                : task.CreatedBy;

            if (notifyUserId > 0 && notifyUserId != currentUserId)
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = notifyUserId,
                    TaskId = task.Id,
                    Message = $"Task '{task.Title}' status updated to '{task.Status}'",
                    Type = "TaskStatusUpdated",
                    IsRead = false,
                    CreatedAt = DateOnly.FromDateTime(DateTime.UtcNow)
                });
                _context.SaveChanges();
            }

            return Ok(new { message = "Status updated successfully", taskId = task.Id, status = task.Status });
        }

        // DELETE: /api/delete-task/{id} (Admin & Manager)
        [HttpDelete("delete-task/{id}")]
        [HttpDelete("tasks/{id}")]
        public IActionResult DeleteTask([FromRoute] int id)
        {
            var role = GetCurrentUserRole();
            if (role == "User")
            {
                return StatusCode(403, new { message = "Access denied. Normal users cannot delete tasks." });
            }

            var task = _context.Tasks.FirstOrDefault(t => t.Id == id);
            if (task == null)
            {
                return NotFound(new { message = "Task not found" });
            }

            var comments = _context.Comments.Where(c => c.TaskId == id);
            _context.Comments.RemoveRange(comments);

            var notifs = _context.Notifications.Where(n => n.TaskId == id);
            _context.Notifications.RemoveRange(notifs);

            _context.Tasks.Remove(task);
            _context.SaveChanges();

            return Ok(new { message = "Task deleted successfully" });
        }
    }
}
