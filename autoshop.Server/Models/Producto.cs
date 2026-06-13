namespace autoshop.Server.Models
{
    public class Producto
    {
        public Guid Id { get; set; }
        public Guid CategoriaId { get; set; }
        public string CodigoBarras { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public decimal PrecioCompra { get; set; }
        public decimal PrecioVenta { get; set; }
        public decimal DescuentoPct { get; set; } = 0;
        public bool VisibleWeb { get; set; } = true;
        public string? ImagenUrl { get; set; }
        public bool Activo { get; set; } = true;

        public Categoria Categoria { get; set; } = null!;
        public Inventario? Inventario { get; set; }
        public ICollection<VentaDetalle> VentaDetalles { get; set; } = new List<VentaDetalle>();
        public ICollection<MovimientoInventario> Movimientos { get; set; } = new List<MovimientoInventario>();
        public ICollection<DevolucionDetalle> DevolucionDetalles { get; set; } = new List<DevolucionDetalle>();
    }
}