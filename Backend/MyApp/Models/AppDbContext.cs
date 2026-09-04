using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Pomelo.EntityFrameworkCore.MySql.Scaffolding.Internal;

namespace MyApp.Models;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Comment> Comments { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<Task> Tasks { get; set; }

    public virtual DbSet<Team> Teams { get; set; }

    public virtual DbSet<Teammember> Teammembers { get; set; }

    public virtual DbSet<User> Users { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseMySql("server=localhost;database=TaskManagement;user=root;password=Dkvd@123", Microsoft.EntityFrameworkCore.ServerVersion.Parse("8.0.43-mysql"));

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb4_0900_ai_ci")
            .HasCharSet("utf8mb4");

        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("comments");

            entity.HasIndex(e => e.TaskId, "TaskId");

            entity.HasIndex(e => e.UserId, "UserId");

            entity.Property(e => e.CommentText).HasColumnType("text");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("curdate()");

            entity.HasOne(d => d.Task).WithMany(p => p.Comments)
                .HasForeignKey(d => d.TaskId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("comments_ibfk_1");

            entity.HasOne(d => d.User).WithMany(p => p.Comments)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("comments_ibfk_2");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("notifications");

            entity.HasIndex(e => e.TaskId, "TaskId");

            entity.HasIndex(e => e.UserId, "UserId");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("curdate()");
            entity.Property(e => e.IsRead).HasDefaultValueSql("'0'");
            entity.Property(e => e.Message).HasMaxLength(500);
            entity.Property(e => e.Type).HasColumnType("enum('TaskAssigned','TaskStatusUpdated')");

            entity.HasOne(d => d.Task).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.TaskId)
                .HasConstraintName("notifications_ibfk_2");

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("notifications_ibfk_1");
        });

        modelBuilder.Entity<Task>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("tasks");

            entity.HasIndex(e => e.AssignedTo, "AssignedTo");

            entity.HasIndex(e => e.CreatedBy, "CreatedBy");

            entity.HasIndex(e => e.TeamId, "TeamId");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("curdate()");
            entity.Property(e => e.Description).HasColumnType("text");
            entity.Property(e => e.Priority)
                .HasDefaultValueSql("'Medium'")
                .HasColumnType("enum('Low','Medium','High')");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'To Do'")
                .HasColumnType("enum('To Do','In Progress','Done')");
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("curdate()");

            entity.HasOne(d => d.AssignedToNavigation).WithMany(p => p.TaskAssignedToNavigations)
                .HasForeignKey(d => d.AssignedTo)
                .HasConstraintName("tasks_ibfk_1");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.TaskCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("tasks_ibfk_2");

            entity.HasOne(d => d.Team).WithMany(p => p.Tasks)
                .HasForeignKey(d => d.TeamId)
                .HasConstraintName("tasks_ibfk_3");
        });

        modelBuilder.Entity<Team>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("teams");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("curdate()");
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<Teammember>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("teammembers");

            entity.HasIndex(e => new { e.TeamId, e.UserId }, "TeamId").IsUnique();

            entity.HasIndex(e => e.UserId, "UserId");

            entity.HasOne(d => d.Team).WithMany(p => p.Teammembers)
                .HasForeignKey(d => d.TeamId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("teammembers_ibfk_1");

            entity.HasOne(d => d.User).WithMany(p => p.Teammembers)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("teammembers_ibfk_2");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("users");

            entity.HasIndex(e => e.Email, "Email").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("curdate()");
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Password).HasMaxLength(255);
            entity.Property(e => e.Role).HasColumnType("enum('Admin','Manager','User')");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
