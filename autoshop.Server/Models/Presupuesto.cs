namespace autoshop.Server.Models
{
    public class Presupuesto
    {
        public Guid Id { get; set; }
        public string NumeroPresupuesto { get; set; } = string.Empty;
        public DateTime Fecha { get; set; } = DateTime.UtcNow;

        public string? ClienteNombre { get; set; }
        public string? ClienteRuc { get; set; }
        public string? ClienteTelefono { get; set; }
        public string? Notas { get; set; }

        // PENDIENTE, APROBADO, RECHAZADO, CONVERTIDO
        public string Estado { get; set; } = "PENDIENTE";

        public decimal Subtotal { get; set; }
        public decimal Descuento { get; set; }
        public decimal Total { get; set; }

        // Si se convirtió en venta
        public Guid? VentaId { get; set; }
        public Venta? Venta { get; set; }

        public ICollection<PresupuestoDetalle> Detalles { get; set; } = new List<PresupuestoDetalle>();
    }
}