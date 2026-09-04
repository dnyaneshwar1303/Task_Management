using System;
using System.Collections.Generic;

namespace MyApp.Models;

public partial class Comment
{
    public int Id { get; set; }

    public int TaskId { get; set; }

    public int UserId { get; set; }

    public string CommentText { get; set; } = null!;

    public DateOnly? CreatedAt { get; set; }

    public virtual Task Task { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
