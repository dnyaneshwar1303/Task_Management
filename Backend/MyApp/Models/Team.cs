using System;
using System.Collections.Generic;

namespace MyApp.Models;

public partial class Team
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public DateOnly? CreatedAt { get; set; }

    public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();

    public virtual ICollection<Teammember> Teammembers { get; set; } = new List<Teammember>();
}
