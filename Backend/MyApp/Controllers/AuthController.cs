using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MyApp.Models;

namespace MyApp.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingUser = _context.Users.FirstOrDefault(x => x.Email.ToLower() == dto.Email.ToLower().Trim());
            if (existingUser != null)
            {
                return BadRequest(new { message = "User with this email already exists" });
            }

            var validRoles = new[] { "Admin", "Manager", "User" };
            var role = validRoles.Contains(dto.Role) ? dto.Role : "User";

            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            var user = new User
            {
                Name = dto.Name.Trim(),
                Email = dto.Email.ToLower().Trim(),
                Password = hashedPassword,
                Role = role,
                CreatedAt = DateOnly.FromDateTime(DateTime.UtcNow)
            };

            _context.Users.Add(user);
            _context.SaveChanges();

            var userDto = new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            };

            return CreatedAtAction(nameof(GetMe), new { id = user.Id }, new { message = "User registered successfully", user = userDto });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] Login l)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = _context.Users.FirstOrDefault(x => x.Email.ToLower() == l.Email.ToLower().Trim());
            if (user == null)
            {
                return NotFound(new { message = "User not found with this email" });
            }

            var isPasswordValid = BCrypt.Net.BCrypt.Verify(l.Password, user.Password);
            if (!isPasswordValid)
            {
                return BadRequest(new { message = "Invalid password" });
            }

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("id", user.Id.ToString())
            };

            var jwtKey = _configuration["Jwt:Key"] ?? "TaskManagementSecretKey_SuperSecure2026!#LongKeyForHmacSha256";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"] ?? "TaskManagementApp",
                audience: _configuration["Jwt:Audience"] ?? "TaskManagementApp",
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            var userDto = new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            };

            return Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(token),
                user = userDto
            });
        }

        [HttpGet("users")]
        public IActionResult GetUsers([FromQuery] string? role)
        {
            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrEmpty(role))
            {
                query = query.Where(u => u.Role == role);
            }

            var users = query.Select(u => new UserDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                Role = u.Role,
                CreatedAt = u.CreatedAt
            }).ToList();

            return Ok(users);
        }

        [Authorize]
        [HttpGet("me")]
        public IActionResult GetMe()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid token claims" });
            }

            var user = _context.Users.FirstOrDefault(x => x.Id == userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            });
        }
    }
}