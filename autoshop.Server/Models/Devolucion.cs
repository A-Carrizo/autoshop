namespace autoshop.Server.Models
{
    public class Devolucion
    {
        public Guid Id { get; set; }
        public Guid VentaId { get; set; }
        public DateTime Fecha { get; set; } = DateTime.UtcNow;
        public string Motivo { get; set; } = string.Empty;
        public decimal MontoDevuelto { get; set; }

        public Venta Venta { get; set; } = null!;
        public ICollection<DevolucionDetalle> Detalles { get; set; } = new List<DevolucionDetalle>();
    }
}