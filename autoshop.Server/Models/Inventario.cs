namespace autoshop.Server.Models
{
    public class Inventario
    {
        public Guid Id { get; set; }
        public Guid ProductoId { get; set; }
        public int StockActual { get; set; }
        public int StockMinimo { get; set; } = 0;
        public DateTime UltimaActualizacion { get; set; } = DateTime.UtcNow;

        public Producto Producto { get; set; } = null!;
    }
}