using System;
using System.Collections.Generic;

namespace MyApp.Models;

public partial class Task
{
    public int Id { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public int? AssignedTo { get; set; }

    public int CreatedBy { get; set; }

    public int? TeamId { get; set; }

    public string Status { get; set; } = null!;

    public string Priority { get; set; } = null!;

    public DateOnly? Deadline { get; set; }

    public DateOnly? CreatedAt { get; set; }

    public DateOnly? UpdatedAt { get; set; }

    public virtual User? AssignedToNavigation { get; set; }

    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();

    public virtual User CreatedByNavigation { get; set; } = null!;

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual Team? Team { get; set; }
}
