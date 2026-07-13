namespace autoshop.Server.Models
{
    public class Pedido
    {
        public Guid Id { get; set; }
        public string NumeroPedido { get; set; } = string.Empty;
        public Guid ClienteId { get; set; }  // antes ClienteTiendaId
        public DateTime Fecha { get; set; } = DateTime.UtcNow;

        public string ClienteNombre { get; set; } = string.Empty;
        public string? ClienteTelefono { get; set; }
        public string? DireccionEntrega { get; set; }
        public string? Notas { get; set; }

        public string MetodoPago { get; set; } = "TRANSFERENCIA";
        public string Estado { get; set; } = "PENDIENTE";
        public decimal Total { get; set; }

        public DateTime? FechaConfirmacion { get; set; }
        public DateTime? FechaEntrega { get; set; }
        public DateTime? FechaCancelacion { get; set; }
        public string? MotivoCancelacion { get; set; }

        public Cliente Cliente { get; set; } = null!;  // antes ClienteTienda
        public ICollection<PedidoDetalle> Detalles { get; set; } = new List<PedidoDetalle>();
    }
}