namespace autoshop.Server.Models
{
    public class Cliente
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Ruc { get; set; }
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }
        public string? Email { get; set; }
        public bool Activo { get; set; } = true;
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        // Acceso a la tienda online (opcional)
        public bool TieneAccesoWeb { get; set; } = false;
        public string? PasswordHash { get; set; }
        public string? Token { get; set; }
        public DateTime? TokenExpira { get; set; }
        public string? TokenReset { get; set; }
        public DateTime? TokenResetExpira { get; set; }

        // Pedidos online
        public ICollection<Pedido> Pedidos { get; set; } = new List<Pedido>();
    }
}