using System;
using System.ComponentModel.DataAnnotations;

namespace MyApp.Models
{
    public class Login
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        public string Role { get; set; } = "User"; // Admin, Manager, User
    }

    public class UserDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateOnly? CreatedAt { get; set; }
    }

    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public UserDto User { get; set; } = null!;
    }

    public class CreateTaskDto
    {
        [Required]
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? AssignedTo { get; set; }
        public int? TeamId { get; set; }
        public string Status { get; set; } = "To Do"; // To Do, In Progress, Done
        public string Priority { get; set; } = "Medium"; // Low, Medium, High
        public DateOnly? Deadline { get; set; }
    }

    public class UpdateTaskDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public int? AssignedTo { get; set; }
        public int? TeamId { get; set; }
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public DateOnly? Deadline { get; set; }
    }

    public class UpdateStatusDto
    {
        [Required]
        public string Status { get; set; } = "To Do";
    }

    public class CreateCommentDto
    {
        [Required]
        public string CommentText { get; set; } = string.Empty;
    }

    public class CreateTeamDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
    }

    public class AddMemberDto
    {
        [Required]
        public int TeamId { get; set; }
        [Required]
        public int UserId { get; set; }
    }
}