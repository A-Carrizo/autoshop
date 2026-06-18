using autoshop.Server.Data;
using autoshop.Server.Models;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MimeKit;
using System.Security.Cryptography;
using System.Text;

namespace autoshop.Server.Controllers
{
    [ApiController]
    [Route("api/tienda/auth")]
    public class TiendaAuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public TiendaAuthController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        private static string HashPassword(string password)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password + "magcar_salt_2026"));
            return Convert.ToHexString(bytes).ToLower();
        }

        private static string GenerarToken() =>
            Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLower();

        [HttpPost("registro")]
        public async Task<IActionResult> Registro([FromBody] RegistroClienteDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest(new { mensaje = "Nombre, email y contrasena son requeridos." });

            if (dto.Password.Length < 6)
                return BadRequest(new { mensaje = "La contrasena debe tener al menos 6 caracteres." });

            var emailNormalizado = dto.Email.Trim().ToLower();
            var existe = await _context.ClientesTienda.AnyAsync(c => c.Email == emailNormalizado);
            if (existe)
                return BadRequest(new { mensaje = "Ya existe una cuenta registrada con ese email." });

            var cliente = new ClienteTienda
            {
                Id = Guid.NewGuid(),
                Nombre = dto.Nombre.Trim(),
                Email = emailNormalizado,
                PasswordHash = HashPassword(dto.Password),
                Telefono = dto.Telefono,
                Direccion = dto.Direccion,
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };

            _context.ClientesTienda.Add(cliente);
            await _context.SaveChangesAsync();

            // Inicia sesion automaticamente despues de registrarse
            var token = GenerarToken();
            cliente.Token = token;
            cliente.TokenExpira = DateTime.UtcNow.AddDays(30);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                token,
                nombre = cliente.Nombre,
                email = cliente.Email,
                mensaje = "Cuenta creada correctamente."
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginClienteDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest(new { mensaje = "Email y contrasena son requeridos." });

            var hash = HashPassword(dto.Password);
            var emailNormalizado = dto.Email.Trim().ToLower();
            var cliente = await _context.ClientesTienda
                .FirstOrDefaultAsync(c => c.Email == emailNormalizado && c.PasswordHash == hash && c.Activo);

            if (cliente == null) return Unauthorized(new { mensaje = "Email o contrasena incorrectos." });

            var token = GenerarToken();
            cliente.Token = token;
            cliente.TokenExpira = DateTime.UtcNow.AddDays(30);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                token,
                nombre = cliente.Nombre,
                email = cliente.Email,
                telefono = cliente.Telefono,
                direccion = cliente.Direccion,
                expira = cliente.TokenExpira
            });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromHeader(Name = "Authorization")] string? auth)
        {
            var token = auth?.Replace("Bearer ", "");
            if (!string.IsNullOrEmpty(token))
            {
                var cliente = await _context.ClientesTienda.FirstOrDefaultAsync(c => c.Token == token);
                if (cliente != null) { cliente.Token = null; cliente.TokenExpira = null; await _context.SaveChangesAsync(); }
            }
            return Ok(new { mensaje = "Sesion cerrada." });
        }

        [HttpGet("verificar")]
        public async Task<IActionResult> Verificar([FromHeader(Name = "Authorization")] string? auth)
        {
            var token = auth?.Replace("Bearer ", "");
            if (string.IsNullOrEmpty(token)) return Unauthorized();
            var cliente = await _context.ClientesTienda.FirstOrDefaultAsync(c =>
                c.Token == token && c.TokenExpira > DateTime.UtcNow && c.Activo);
            if (cliente == null) return Unauthorized();
            return Ok(new { nombre = cliente.Nombre, email = cliente.Email, telefono = cliente.Telefono, direccion = cliente.Direccion });
        }

        [HttpPut("perfil")]
        public async Task<IActionResult> ActualizarPerfil(
            [FromHeader(Name = "Authorization")] string? auth,
            [FromBody] ActualizarPerfilDto dto)
        {
            var token = auth?.Replace("Bearer ", "");
            var cliente = await _context.ClientesTienda.FirstOrDefaultAsync(c =>
                c.Token == token && c.TokenExpira > DateTime.UtcNow && c.Activo);

            if (cliente == null) return Unauthorized(new { mensaje = "Sesion invalida." });

            cliente.Nombre = dto.Nombre.Trim();
            cliente.Telefono = dto.Telefono;
            cliente.Direccion = dto.Direccion;
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Perfil actualizado correctamente." });
        }

        [HttpPost("recuperar")]
        public async Task<IActionResult> RecuperarPassword([FromBody] RecuperarClienteDto dto)
        {
            var emailNormalizado = dto.Email.Trim().ToLower();
            var cliente = await _context.ClientesTienda.FirstOrDefaultAsync(c => c.Email == emailNormalizado && c.Activo);
            if (cliente == null) return Ok(new { mensaje = "Si el email existe, recibiras un correo con instrucciones." });

            var tokenReset = GenerarToken();
            cliente.TokenReset = tokenReset;
            cliente.TokenResetExpira = DateTime.UtcNow.AddHours(1);
            await _context.SaveChangesAsync();

            var smtpHost = _config["Smtp:Host"];
            var smtpPort = int.Parse(_config["Smtp:Port"] ?? "587");
            var smtpUser = _config["Smtp:User"] ?? "";
            var smtpPass = _config["Smtp:Pass"] ?? "";
            var tiendaUrl = _config["TiendaUrl"] ?? "https://localhost:5180";

            try
            {
                var link = $"{tiendaUrl}/reset-password?token={tokenReset}";
                var body = EmailBodyRecuperacion(cliente.Nombre, link);

                var mensaje = new MimeMessage();
                mensaje.From.Add(new MailboxAddress("MagCar Auto Shop", smtpUser));
                mensaje.To.Add(new MailboxAddress(cliente.Nombre, cliente.Email));
                mensaje.Subject = "Recuperacion de contrasena - MagCar Auto Shop";
                mensaje.Body = new TextPart("html") { Text = body };

                using var client = new SmtpClient();
                await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(smtpUser, smtpPass);
                await client.SendAsync(mensaje);
                await client.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR EMAIL TIENDA: {ex.Message}");
            }

            return Ok(new { mensaje = "Si el email existe, recibiras un correo con instrucciones." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordClienteDto dto)
        {
            var cliente = await _context.ClientesTienda.FirstOrDefaultAsync(c =>
                c.TokenReset == dto.Token && c.TokenResetExpira > DateTime.UtcNow && c.Activo);

            if (cliente == null) return BadRequest(new { mensaje = "El enlace es invalido o ha expirado." });
            if (dto.NuevaPassword.Length < 6) return BadRequest(new { mensaje = "Minimo 6 caracteres." });

            cliente.PasswordHash = HashPassword(dto.NuevaPassword);
            cliente.TokenReset = null; cliente.TokenResetExpira = null;
            cliente.Token = null; cliente.TokenExpira = null;
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Contrasena actualizada correctamente." });
        }

        private string EmailBodyRecuperacion(string nombre, string link) => $@"
<!DOCTYPE html>
<html lang='es'>
<head><meta charset='UTF-8'></head>
<body style='margin:0;padding:0;background:#edf2f7;font-family:Segoe UI,Arial,sans-serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#edf2f7;padding:48px 20px;'>
    <tr><td align='center'>
      <table width='560' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);'>
        <tr>
          <td style='background:linear-gradient(135deg,#1a365d,#2c5282);padding:40px;text-align:center;'>
            <div style='display:inline-block;background:#D4A017;border-radius:14px;padding:14px 18px;margin-bottom:16px;'>
              <span style='font-size:28px;'>&#128663;</span>
            </div>
            <h1 style='color:#ffffff;margin:0;font-size:24px;font-weight:800;'>MagCar Auto Shop</h1>
            <p style='color:rgba(255,255,255,0.55);margin:6px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;'>Tienda Online</p>
          </td>
        </tr>
        <tr>
          <td style='padding:40px 44px 32px;'>
            <h2 style='color:#1a202c;font-size:20px;font-weight:700;margin:0 0 12px;text-align:center;'>Restablecer contrasena</h2>
            <p style='color:#718096;font-size:14px;line-height:1.6;margin:0 0 24px;'>Hola <strong style='color:#2d3748;'>{nombre}</strong>, recibimos una solicitud para restablecer la contrasena de tu cuenta en la tienda.</p>
            <div style='text-align:center;margin:0 0 28px;'>
              <a href='{link}' style='display:inline-block;background:#2c5282;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;'>
                Restablecer contrasena
              </a>
            </div>
            <p style='color:#a0aec0;font-size:13px;line-height:1.6;margin:0;text-align:center;'>Este enlace expira en <strong>1 hora</strong>.</p>
          </td>
        </tr>
        <tr>
          <td style='background:#f7fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;'>
            <p style='color:#a0aec0;font-size:12px;margin:0;'>© 2026 MagCar Auto Shop</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";
    }

    public record RegistroClienteDto(string Nombre, string Email, string Password, string? Telefono, string? Direccion);
    public record LoginClienteDto(string Email, string Password);
    public record ActualizarPerfilDto(string Nombre, string? Telefono, string? Direccion);
    public record RecuperarClienteDto(string Email);
    public record ResetPasswordClienteDto(string Token, string NuevaPassword);
}