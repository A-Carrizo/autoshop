namespace autoshop.Server.Models
{
    public class Usuario
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public bool Activo { get; set; } = true;
        public bool PrimerLogin { get; set; } = true;
        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
        public DateTime? UltimoAcceso { get; set; }
        public string? Token { get; set; }
        public DateTime? TokenExpira { get; set; }
        public string? TokenReset { get; set; }
        public DateTime? TokenResetExpira { get; set; }
    }
}