namespace autoshop.Server.Models
{
    public class DevolucionDetalle
    {
        public Guid Id { get; set; }
        public Guid DevolucionId { get; set; }
        public Guid ProductoId { get; set; }
        public int Cantidad { get; set; }
        public decimal Monto { get; set; }

        public Devolucion Devolucion { get; set; } = null!;
        public Producto Producto { get; set; } = null!;
    }
}