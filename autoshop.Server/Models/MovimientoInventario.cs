namespace autoshop.Server.Models
{
    public class MovimientoInventario
    {
        public Guid Id { get; set; }
        public Guid ProductoId { get; set; }
        public string Tipo { get; set; } = string.Empty; // COMPRA, VENTA, DEVOLUCION, AJUSTE
        public int Cantidad { get; set; }
        public string? Referencia { get; set; }
        public DateTime Fecha { get; set; } = DateTime.UtcNow;
        public string? Notas { get; set; }

        public Producto Producto { get; set; } = null!;
    }
}