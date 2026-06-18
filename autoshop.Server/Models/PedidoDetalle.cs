namespace autoshop.Server.Models
{
    public class PedidoDetalle
    {
        public Guid Id { get; set; }
        public Guid PedidoId { get; set; }
        public Guid ProductoId { get; set; }

        // Snapshot del producto al momento de comprar (por si cambia despues)
        public string ProductoNombre { get; set; } = string.Empty;
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }

        public Pedido Pedido { get; set; } = null!;
        public Producto Producto { get; set; } = null!;
    }
}