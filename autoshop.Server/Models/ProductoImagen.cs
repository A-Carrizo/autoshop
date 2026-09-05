namespace autoshop.Server.Models
{
    public class ProductoImagen
    {
        public Guid Id { get; set; }
        public Guid ProductoId { get; set; }
        public string Url { get; set; } = string.Empty;
        public int Orden { get; set; }

        public Producto Producto { get; set; } = null!;
    }
}
