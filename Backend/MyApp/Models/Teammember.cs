using System;
using System.Collections.Generic;

namespace MyApp.Models;

public partial class Teammember
{
    public int Id { get; set; }

    public int TeamId { get; set; }

    public int UserId { get; set; }

    public virtual Team Team { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
