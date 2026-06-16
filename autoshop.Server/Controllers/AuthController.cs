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
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, IConfiguration config)
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

        private string EmailBody(string nombre, string link) => $@"
<!DOCTYPE html>
<html lang='es'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <title>Recuperacion de contrasena</title>
</head>
<body style='margin:0;padding:0;background:#edf2f7;font-family:Segoe UI,Arial,sans-serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#edf2f7;padding:48px 20px;'>
    <tr><td align='center'>
      <table width='580' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);'>

        <!-- Header con gradiente -->
        <tr>
          <td style='background:linear-gradient(135deg,#1a365d 0%,#2c5282 60%,#2b6cb0 100%);padding:48px 40px 36px;text-align:center;'>
            <!-- Icono circular -->
            <div style='display:inline-block;background:#D4A017;border-radius:16px;padding:16px 20px;margin-bottom:20px;box-shadow:0 8px 24px rgba(212,160,23,0.35);'>
              <span style='font-size:32px;line-height:1;'>&#128663;</span>
            </div>
            <h1 style='color:#ffffff;margin:0 0 6px;font-size:26px;font-weight:800;letter-spacing:0.5px;'>MagCar Auto Shop</h1>
            <p style='color:rgba(255,255,255,0.55);margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:600;'>Accesorios y Luces Automotrices</p>
          </td>
        </tr>

        <!-- Banda decorativa -->
        <tr>
          <td style='background:#D4A017;height:4px;'></td>
        </tr>

        <!-- Cuerpo principal -->
        <tr>
          <td style='padding:44px 48px 36px;'>

            <!-- Icono de seguridad -->
            <div style='text-align:center;margin-bottom:28px;'>
              <div style='display:inline-block;background:#ebf4ff;border-radius:50%;width:64px;height:64px;line-height:64px;text-align:center;'>
                <span style='font-size:28px;'>&#128274;</span>
              </div>
            </div>

            <h2 style='color:#1a202c;font-size:22px;font-weight:700;margin:0 0 8px;text-align:center;'>Restablecer contrasena</h2>
            <p style='color:#718096;font-size:14px;text-align:center;margin:0 0 32px;'>Recibimos una solicitud de cambio de contrasena</p>

            <!-- Saludo personalizado -->
            <p style='color:#2d3748;font-size:15px;line-height:1.7;margin:0 0 16px;'>
              Hola <strong style='color:#1a365d;'>{nombre}</strong>,
            </p>
            <p style='color:#718096;font-size:14px;line-height:1.8;margin:0 0 32px;'>
              Alguien solicitó restablecer la contrasena de tu cuenta en <strong style='color:#2d3748;'>MagCar Auto Shop</strong>. 
              Si fuiste tú, haz clic en el boton para continuar. Si no reconoces esta solicitud, puedes ignorar este mensaje con tranquilidad.
            </p>

            <!-- Boton principal -->
            <div style='text-align:center;margin:0 0 36px;'>
              <a href='{link}' style='display:inline-block;background:linear-gradient(135deg,#1a365d,#2c5282);color:#ffffff;padding:16px 48px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(44,82,130,0.35);'>
                &#128273; &nbsp; Restablecer contrasena
              </a>
            </div>

            <!-- Separador -->
            <div style='border-top:1px solid #e2e8f0;margin:0 0 24px;'></div>

            <!-- Enlace de respaldo -->
            <div style='background:#f7fafc;border-radius:10px;padding:18px 20px;margin-bottom:24px;border-left:4px solid #D4A017;'>
              <p style='color:#718096;font-size:12px;margin:0 0 6px;font-weight:700;text-transform:uppercase;letter-spacing:1px;'>Si el boton no funciona, copiá este enlace:</p>
              <p style='color:#3182ce;font-size:12px;margin:0;word-break:break-all;line-height:1.6;'>{link}</p>
            </div>

            <!-- Aviso de expiracion -->
            <div style='background:#fffbeb;border-radius:10px;padding:14px 18px;border:1px solid #f6e05e;'>
              <p style='color:#744210;font-size:13px;margin:0;'>
                &#9201; &nbsp;<strong>Este enlace expira en 1 hora</strong> por razones de seguridad.
              </p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style='background:#f7fafc;padding:24px 48px;border-top:1px solid #e2e8f0;text-align:center;'>
            <p style='color:#a0aec0;font-size:12px;margin:0 0 6px;'>
              Este correo fue enviado automaticamente por el sistema de MagCar Auto Shop.
            </p>
            <p style='color:#cbd5e0;font-size:11px;margin:0;'>
              © 2026 MagCar Auto Shop &nbsp;·&nbsp; Todos los derechos reservados
            </p>
          </td>
        </tr>

      </table>

      <!-- Texto debajo del card -->
      <p style='color:#a0aec0;font-size:12px;text-align:center;margin-top:24px;'>
        ¿Necesitas ayuda? Contacta a tu administrador del sistema.
      </p>

    </td></tr>
  </table>
</body>
</html>";

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest(new { mensaje = "Email y contrasena son requeridos." });

            var hash = HashPassword(dto.Password);
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower() && u.PasswordHash == hash && u.Activo);

            if (usuario == null) return Unauthorized(new { mensaje = "Email o contrasena incorrectos." });

            var token = GenerarToken();
            usuario.Token = token;
            usuario.TokenExpira = DateTime.UtcNow.AddDays(30);
            usuario.UltimoAcceso = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                token,
                nombre = usuario.Nombre,
                email = usuario.Email,
                primerLogin = usuario.PrimerLogin,
                expira = usuario.TokenExpira
            });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromHeader(Name = "Authorization")] string? auth)
        {
            var token = auth?.Replace("Bearer ", "");
            if (!string.IsNullOrEmpty(token))
            {
                var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Token == token);
                if (usuario != null) { usuario.Token = null; usuario.TokenExpira = null; await _context.SaveChangesAsync(); }
            }
            return Ok(new { mensaje = "Sesion cerrada." });
        }

        [HttpPost("recuperar")]
        public async Task<IActionResult> RecuperarPassword([FromBody] RecuperarDto dto)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower() && u.Activo);
            if (usuario == null) return Ok(new { mensaje = "Si el email existe, recibiras un correo con instrucciones." });

            var tokenReset = GenerarToken();
            usuario.TokenReset = tokenReset;
            usuario.TokenResetExpira = DateTime.UtcNow.AddHours(1);
            await _context.SaveChangesAsync();

            var smtpHost = _config["Smtp:Host"];
            var smtpPort = int.Parse(_config["Smtp:Port"] ?? "587");
            var smtpUser = _config["Smtp:User"] ?? "";
            var smtpPass = _config["Smtp:Pass"] ?? "";
            var frontendUrl = _config["FrontendUrl"] ?? "https://localhost:56546";

            try
            {
                var link = $"{frontendUrl}/reset-password?token={tokenReset}";
                var body = EmailBody(usuario.Nombre, link);

                var mensaje = new MimeMessage();
                mensaje.From.Add(new MailboxAddress("MagCar Auto Shop", smtpUser));
                mensaje.To.Add(new MailboxAddress(usuario.Nombre, usuario.Email));
                mensaje.Subject = "Recuperacion de contrasena - MagCar Auto Shop";
                mensaje.Body = new TextPart("html") { Text = body };

                using var client = new SmtpClient();
                await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(smtpUser, smtpPass);
                await client.SendAsync(mensaje);
                await client.DisconnectAsync(true);
            }
            catch (Exception ex) { Console.WriteLine($"Error email: {ex.Message}"); }

            return Ok(new { mensaje = "Si el email existe, recibiras un correo con instrucciones." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u =>
                u.TokenReset == dto.Token && u.TokenResetExpira > DateTime.UtcNow && u.Activo);

            if (usuario == null) return BadRequest(new { mensaje = "El enlace es invalido o ha expirado." });
            if (dto.NuevaPassword.Length < 6) return BadRequest(new { mensaje = "Minimo 6 caracteres." });

            usuario.PasswordHash = HashPassword(dto.NuevaPassword);
            usuario.TokenReset = null; usuario.TokenResetExpira = null;
            usuario.Token = null; usuario.TokenExpira = null;
            usuario.PrimerLogin = false;
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Contrasena actualizada correctamente." });
        }

        [HttpPost("cambiar-password")]
        public async Task<IActionResult> CambiarPassword(
            [FromHeader(Name = "Authorization")] string? auth,
            [FromBody] CambiarPasswordDto dto)
        {
            var token = auth?.Replace("Bearer ", "");
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u =>
                u.Token == token && u.TokenExpira > DateTime.UtcNow && u.Activo);

            if (usuario == null) return Unauthorized(new { mensaje = "Sesion invalida." });
            if (usuario.PasswordHash != HashPassword(dto.PasswordActual))
                return BadRequest(new { mensaje = "La contrasena actual es incorrecta." });
            if (dto.NuevaPassword.Length < 6) return BadRequest(new { mensaje = "Minimo 6 caracteres." });

            usuario.PasswordHash = HashPassword(dto.NuevaPassword);
            usuario.Token = null; usuario.TokenExpira = null;
            usuario.PrimerLogin = false;
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Contrasena actualizada. Inicia sesion nuevamente." });
        }

        [HttpPost("cambiar-password-obligatorio")]
        public async Task<IActionResult> CambiarPasswordObligatorio(
            [FromHeader(Name = "Authorization")] string? auth,
            [FromBody] CambiarPasswordObligatorioDto dto)
        {
            var token = auth?.Replace("Bearer ", "");
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u =>
                u.Token == token && u.TokenExpira > DateTime.UtcNow && u.Activo);

            if (usuario == null) return Unauthorized(new { mensaje = "Sesion invalida." });
            if (dto.NuevaPassword.Length < 6) return BadRequest(new { mensaje = "Minimo 6 caracteres." });

            usuario.PasswordHash = HashPassword(dto.NuevaPassword);
            usuario.PrimerLogin = false;
            usuario.Token = null; usuario.TokenExpira = null;
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Contrasena establecida correctamente. Ya podes iniciar sesion." });
        }

        [HttpGet("verificar")]
        public async Task<IActionResult> Verificar([FromHeader(Name = "Authorization")] string? auth)
        {
            var token = auth?.Replace("Bearer ", "");
            if (string.IsNullOrEmpty(token)) return Unauthorized();
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u =>
                u.Token == token && u.TokenExpira > DateTime.UtcNow && u.Activo);
            if (usuario == null) return Unauthorized();
            return Ok(new { nombre = usuario.Nombre, email = usuario.Email, primerLogin = usuario.PrimerLogin });
        }
    }

    public record LoginDto(string Email, string Password);
    public record RecuperarDto(string Email);
    public record ResetPasswordDto(string Token, string NuevaPassword);
    public record CambiarPasswordDto(string PasswordActual, string NuevaPassword);
    public record CambiarPasswordObligatorioDto(string NuevaPassword);
}