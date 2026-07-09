namespace autoshop.Server.Models
{
    public class PresupuestoDetalle
    {
        public Guid Id { get; set; }
        public Guid PresupuestoId { get; set; }

        // Tipo: PRODUCTO o SERVICIO
        public string Tipo { get; set; } = "PRODUCTO";

        // Solo para productos
        public Guid? ProductoId { get; set; }

        // Descripcion del item (nombre del producto o del servicio)
        public string Descripcion { get; set; } = string.Empty;

        public decimal PrecioUnitario { get; set; }
        public int Cantidad { get; set; }
        public decimal DescuentoPct { get; set; } = 0;
        public decimal Subtotal { get; set; }

        public Presupuesto Presupuesto { get; set; } = null!;
        public Producto? Producto { get; set; }
    }
}