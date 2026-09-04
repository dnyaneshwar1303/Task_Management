using System;
using System.Collections.Generic;

namespace MyApp.Models;

public partial class Notification
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int? TaskId { get; set; }

    public string Message { get; set; } = null!;

    public string Type { get; set; } = null!;

    public bool? IsRead { get; set; }

    public DateOnly? CreatedAt { get; set; }

    public virtual Task? Task { get; set; }

    public virtual User User { get; set; } = null!;
}
