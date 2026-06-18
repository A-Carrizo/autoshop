namespace autoshop.Server.Models
{
    public class ClienteTienda
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }
        public bool Activo { get; set; } = true;
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        // Sesion (mismo patron que Usuario del ERP)
        public string? Token { get; set; }
        public DateTime? TokenExpira { get; set; }

        // Recuperacion de contrasena
        public string? TokenReset { get; set; }
        public DateTime? TokenResetExpira { get; set; }

        public ICollection<Pedido> Pedidos { get; set; } = new List<Pedido>();
    }
}