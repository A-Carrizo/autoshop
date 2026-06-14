namespace autoshop.Server.Models
{
    public class Venta
    {
        public Guid Id { get; set; }
        public string NumeroFactura { get; set; } = string.Empty;
        public DateTime Fecha { get; set; } = DateTime.UtcNow;

        // Datos del cliente
        public string? ClienteNombre { get; set; }
        public string? ClienteRuc { get; set; }

        // Pago
        public string MetodoPago { get; set; } = "EFECTIVO";

        // Tipo de comprobante
        public string TipoComprobante { get; set; } = "TICKET";

        public decimal Subtotal { get; set; }
        public decimal Descuento { get; set; }
        public decimal Total { get; set; }
        public string Estado { get; set; } = "COMPLETADA";

        public ICollection<VentaDetalle> Detalles { get; set; } = new List<VentaDetalle>();
        public ICollection<Devolucion> Devoluciones { get; set; } = new List<Devolucion>();
    }
}