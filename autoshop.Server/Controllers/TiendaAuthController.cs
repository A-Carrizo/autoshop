using autoshop.Server.Data;
using autoshop.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace autoshop.Server.Controllers
{
    [ApiController]
    [Route("api/tienda/auth")]
    public class TiendaAuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;

        public TiendaAuthController(AppDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        private static string Hashear(string texto)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(texto + "magcar_salt_2026"));
            return Convert.ToHexString(bytes).ToLower();
        }

        private static string GenerarToken() =>
            Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
                .Replace("+", "-").Replace("/", "_").Replace("=", "");

        private Cliente? ObtenerClienteDesdeToken()
        {
            var auth = Request.Headers["Authorization"].ToString();
            if (!auth.StartsWith("Bearer ")) return null;
            var token = auth["Bearer ".Length..].Trim();
            return _db.Clientes.FirstOrDefault(c =>
                c.Token == token &&
                c.TokenExpira > DateTime.UtcNow &&
                c.TieneAccesoWeb);
        }

        // POST /api/tienda/auth/registro
        [HttpPost("registro")]
        public async Task<IActionResult> Registro([FromBody] RegistroTiendaDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nombre) ||
                string.IsNullOrWhiteSpace(dto.Email) ||
                string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest(new { mensaje = "Nombre, email y contraseña son requeridos" });

            if (dto.Password.Length < 6)
                return BadRequest(new { mensaje = "La contraseña debe tener al menos 6 caracteres" });

            var emailLower = dto.Email.Trim().ToLower();

            // Buscar si ya existe un cliente con ese email
            var clienteExistente = await _db.Clientes
                .FirstOrDefaultAsync(c => c.Email != null && c.Email.ToLower() == emailLower);

            var token = GenerarToken();

            if (clienteExistente != null)
            {
                // Si ya tiene acceso web, no puede registrarse de nuevo
                if (clienteExistente.TieneAccesoWeb)
                    return BadRequest(new { mensaje = "Ya existe una cuenta con ese email. Iniciá sesión." });

                // Existe en el ERP sin acceso web
                // Opcion A: activar ahora con contraseña elegida en el formulario
                if (dto.ActivarAhora && !string.IsNullOrEmpty(dto.Password))
                {
                    if (dto.Password.Length < 6)
                        return BadRequest(new { mensaje = "La contraseña debe tener al menos 6 caracteres" });

                    var tokenActivacion = GenerarToken();
                    clienteExistente.TieneAccesoWeb = true;
                    clienteExistente.PasswordHash = Hashear(dto.Password);
                    clienteExistente.Token = tokenActivacion;
                    clienteExistente.TokenExpira = DateTime.UtcNow.AddDays(30);
                    await _db.SaveChangesAsync();

                    return Ok(new { token = tokenActivacion, nombre = clienteExistente.Nombre, email = clienteExistente.Email });
                }

                // Opcion B: enviar email para crear contraseña
                if (string.IsNullOrEmpty(clienteExistente.Email))
                    return BadRequest(new { mensaje = "No se puede activar la cuenta. Contactá con el vendedor." });

                var tokenReset = GenerarToken();
                clienteExistente.TokenReset = tokenReset;
                clienteExistente.TokenResetExpira = DateTime.UtcNow.AddHours(24);
                await _db.SaveChangesAsync();

                try
                {
                    var smtpConfig = _config.GetSection("Smtp");
                    using var smtp = new MailKit.Net.Smtp.SmtpClient();
                    await smtp.ConnectAsync(smtpConfig["Host"], int.Parse(smtpConfig["Port"] ?? "587"), SecureSocketOptions.StartTls);
                    await smtp.AuthenticateAsync(smtpConfig["User"], smtpConfig["Pass"]);

                    var tiendaUrl = _config["TiendaUrl"];
                    var mensaje = new MimeMessage();
                    mensaje.From.Add(InternetAddress.Parse(smtpConfig["User"]!));
                    mensaje.To.Add(InternetAddress.Parse(clienteExistente.Email));
                    mensaje.Subject = "Activá tu cuenta en MagCar Auto Shop";
                    mensaje.Body = new TextPart("html")
                    {
                        Text = $@"
                            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                                <div style='background: #CC0000; padding: 24px; text-align: center;'>
                                    <h1 style='color: white; margin: 0;'>MagCar Auto Shop</h1>
                                </div>
                                <div style='padding: 32px; background: #f9f9f9;'>
                                    <h2>¡Hola, {clienteExistente.Nombre}!</h2>
                                    <p>Ya tenés una cuenta en nuestra tienda. Solo necesitás crear tu contraseña para acceder:</p>
                                    <a href='{tiendaUrl}/reset-password?token={tokenReset}'
                                       style='display: inline-block; background: #CC0000; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;'>
                                       Crear mi contraseña
                                    </a>
                                    <p style='color: #718096; font-size: 13px;'>Este enlace expira en 24 horas.</p>
                                </div>
                            </div>"
                    };

                    await smtp.SendAsync(mensaje);
                    await smtp.DisconnectAsync(true);
                }
                catch { /* Email falla silenciosamente */ }

                return Ok(new { mensaje = "Te enviamos un correo para que establezcas tu contraseña.", activacion = true });
            }

            // Cliente nuevo — crear registro completo
            var cliente = new Cliente
            {
                Nombre = dto.Nombre.Trim(),
                Email = emailLower,
                Telefono = dto.Telefono?.Trim(),
                TieneAccesoWeb = true,
                PasswordHash = Hashear(dto.Password),
                Token = token,
                TokenExpira = DateTime.UtcNow.AddDays(30),
            };

            _db.Clientes.Add(cliente);
            await _db.SaveChangesAsync();

            return Ok(new { token, nombre = cliente.Nombre, email = cliente.Email });
        }

        // POST /api/tienda/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginTiendaDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest(new { mensaje = "Email y contraseña son requeridos" });

            var emailLower = dto.Email.Trim().ToLower();
            var cliente = await _db.Clientes.FirstOrDefaultAsync(c =>
                c.Email != null && c.Email.ToLower() == emailLower &&
                c.TieneAccesoWeb && c.Activo);

            if (cliente == null || cliente.PasswordHash != Hashear(dto.Password))
                return Unauthorized(new { mensaje = "Email o contraseña incorrectos" });

            var token = GenerarToken();
            cliente.Token = token;
            cliente.TokenExpira = DateTime.UtcNow.AddDays(30);
            await _db.SaveChangesAsync();

            return Ok(new { token, nombre = cliente.Nombre, email = cliente.Email });
        }

        // POST /api/tienda/auth/logout
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var cliente = ObtenerClienteDesdeToken();
            if (cliente != null)
            {
                cliente.Token = null;
                cliente.TokenExpira = null;
                await _db.SaveChangesAsync();
            }
            return Ok(new { mensaje = "Sesión cerrada" });
        }

        // GET /api/tienda/auth/verificar
        [HttpGet("verificar")]
        public IActionResult Verificar()
        {
            var cliente = ObtenerClienteDesdeToken();
            if (cliente == null) return Unauthorized(new { mensaje = "Token inválido o expirado" });

            return Ok(new
            {
                id = cliente.Id,
                nombre = cliente.Nombre,
                email = cliente.Email,
                telefono = cliente.Telefono,
                direccion = cliente.Direccion,
            });
        }

        // PUT /api/tienda/auth/perfil
        [HttpPut("perfil")]
        public async Task<IActionResult> ActualizarPerfil([FromBody] ActualizarPerfilDto dto)
        {
            var cliente = ObtenerClienteDesdeToken();
            if (cliente == null) return Unauthorized(new { mensaje = "Token inválido" });

            if (string.IsNullOrWhiteSpace(dto.Nombre))
                return BadRequest(new { mensaje = "El nombre es requerido" });

            cliente.Nombre = dto.Nombre.Trim();
            cliente.Telefono = dto.Telefono?.Trim();
            cliente.Direccion = dto.Direccion?.Trim();
            await _db.SaveChangesAsync();

            return Ok(new { mensaje = "Perfil actualizado" });
        }

        // POST /api/tienda/auth/recuperar
        [HttpPost("recuperar")]
        public async Task<IActionResult> RecuperarPassword([FromBody] RecuperarTiendaDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest(new { mensaje = "Email requerido" });

            var emailLower = dto.Email.Trim().ToLower();
            var cliente = await _db.Clientes.FirstOrDefaultAsync(c =>
                c.Email != null && c.Email.ToLower() == emailLower && c.TieneAccesoWeb);

            if (cliente == null)
                return Ok(new { mensaje = "Si el email existe, recibirás las instrucciones" });

            var tokenReset = GenerarToken();
            cliente.TokenReset = tokenReset;
            cliente.TokenResetExpira = DateTime.UtcNow.AddHours(2);
            await _db.SaveChangesAsync();

            try
            {
                var smtpConfig = _config.GetSection("Smtp");
                using var smtp = new SmtpClient();
                await smtp.ConnectAsync(smtpConfig["Host"], int.Parse(smtpConfig["Port"] ?? "587"), SecureSocketOptions.StartTls);
                await smtp.AuthenticateAsync(smtpConfig["User"], smtpConfig["Pass"]);

                var tiendaUrl = _config["TiendaUrl"];
                var mensaje = new MimeMessage();
                mensaje.From.Add(InternetAddress.Parse(smtpConfig["User"]!));
                mensaje.To.Add(InternetAddress.Parse(cliente.Email!));
                mensaje.Subject = "Recuperar contraseña - MagCar Auto Shop";
                mensaje.Body = new TextPart("html")
                {
                    Text = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                            <div style='background: #CC0000; padding: 24px; text-align: center;'>
                                <h1 style='color: white; margin: 0;'>MagCar Auto Shop</h1>
                            </div>
                            <div style='padding: 32px; background: #f9f9f9;'>
                                <h2>Recuperar contraseña</h2>
                                <p>Hola <strong>{cliente.Nombre}</strong>,</p>
                                <p>Hacé click en el siguiente enlace para restablecer tu contraseña:</p>
                                <a href='{tiendaUrl}/reset-password?token={tokenReset}'
                                   style='display: inline-block; background: #CC0000; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;'>
                                   Restablecer contraseña
                                </a>
                                <p style='color: #718096; font-size: 13px;'>Este enlace expira en 2 horas.</p>
                            </div>
                        </div>"
                };

                await smtp.SendAsync(mensaje);
                await smtp.DisconnectAsync(true);
            }
            catch { /* Email falla silenciosamente */ }

            return Ok(new { mensaje = "Si el email existe, recibirás las instrucciones" });
        }

        // POST /api/tienda/auth/reset-password
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordTiendaDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Token) || string.IsNullOrWhiteSpace(dto.NuevaPassword))
                return BadRequest(new { mensaje = "Token y nueva contraseña son requeridos" });

            if (dto.NuevaPassword.Length < 6)
                return BadRequest(new { mensaje = "La contraseña debe tener al menos 6 caracteres" });

            var cliente = await _db.Clientes.FirstOrDefaultAsync(c =>
                c.TokenReset == dto.Token &&
                c.TokenResetExpira > DateTime.UtcNow &&
                c.TieneAccesoWeb);

            if (cliente == null)
                return BadRequest(new { mensaje = "Token inválido o expirado" });

            cliente.PasswordHash = Hashear(dto.NuevaPassword);
            cliente.TokenReset = null;
            cliente.TokenResetExpira = null;
            cliente.Token = null;
            cliente.TokenExpira = null;
            await _db.SaveChangesAsync();

            return Ok(new { mensaje = "Contraseña restablecida correctamente" });
        }
    }

    public class RegistroTiendaDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? Telefono { get; set; }
        public bool ActivarAhora { get; set; } = false;
    }

    public class LoginTiendaDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class ActualizarPerfilDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }
    }

    // Renombrados para no chocar con RecuperarDto / ResetPasswordDto ya definidos
    // en otro controlador dentro del mismo namespace (autoshop.Server.Controllers).
    public class RecuperarTiendaDto { public string Email { get; set; } = string.Empty; }
    public class ResetPasswordTiendaDto
    {
        public string Token { get; set; } = string.Empty;
        public string NuevaPassword { get; set; } = string.Empty;
    }
}