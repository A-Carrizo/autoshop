namespace autoshop.Server.Models
{
    public class VentaDetalle
    {
        public Guid Id { get; set; }
        public Guid VentaId { get; set; }

        // Nullable para permitir servicios sin producto
        public Guid? ProductoId { get; set; }

        // Tipo: PRODUCTO o SERVICIO
        public string Tipo { get; set; } = "PRODUCTO";

        // Descripcion del item (nombre del producto o descripcion del servicio)
        public string? Descripcion { get; set; }

        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal DescuentoPct { get; set; }
        public decimal Subtotal { get; set; }

        public Venta Venta { get; set; } = null!;
        public Producto? Producto { get; set; }
    }
}