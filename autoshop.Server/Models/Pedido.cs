namespace autoshop.Server.Models
{
    public class Pedido
    {
        public Guid Id { get; set; }
        public string NumeroPedido { get; set; } = string.Empty;
        public Guid ClienteTiendaId { get; set; }
        public DateTime Fecha { get; set; } = DateTime.UtcNow;

        // Snapshot de datos de contacto/entrega al momento del pedido
        public string ClienteNombre { get; set; } = string.Empty;
        public string? ClienteTelefono { get; set; }
        public string? DireccionEntrega { get; set; }
        public string? Notas { get; set; }

        // Metodo de pago elegido como referencia (coordinado manualmente)
        public string MetodoPago { get; set; } = "TRANSFERENCIA"; // TRANSFERENCIA, EFECTIVO

        // PENDIENTE -> CONFIRMADO -> ENTREGADO  (o CANCELADO desde cualquiera de los dos primeros)
        public string Estado { get; set; } = "PENDIENTE";

        public decimal Total { get; set; }

        public DateTime? FechaConfirmacion { get; set; }
        public DateTime? FechaEntrega { get; set; }
        public DateTime? FechaCancelacion { get; set; }
        public string? MotivoCancelacion { get; set; }

        public ClienteTienda ClienteTienda { get; set; } = null!;
        public ICollection<PedidoDetalle> Detalles { get; set; } = new List<PedidoDetalle>();
    }
}