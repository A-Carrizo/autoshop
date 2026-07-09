using autoshop.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace autoshop.Server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Categoria> Categorias { get; set; }
        public DbSet<Producto> Productos { get; set; }
        public DbSet<Inventario> Inventarios { get; set; }
        public DbSet<Venta> Ventas { get; set; }
        public DbSet<VentaDetalle> VentaDetalles { get; set; }
        public DbSet<Devolucion> Devoluciones { get; set; }
        public DbSet<DevolucionDetalle> DevolucionDetalles { get; set; }
        public DbSet<MovimientoInventario> MovimientosInventario { get; set; }

        public DbSet<Presupuesto> Presupuestos { get; set; }
        public DbSet<PresupuestoDetalle> PresupuestoDetalles { get; set; }

        public DbSet<Cliente> Clientes { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }

        // Tienda online
        public DbSet<ClienteTienda> ClientesTienda { get; set; }
        public DbSet<Pedido> Pedidos { get; set; }
        public DbSet<PedidoDetalle> PedidoDetalles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Categoria
            modelBuilder.Entity<Categoria>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.Nombre).IsRequired().HasMaxLength(100);
            });

            // Producto
            modelBuilder.Entity<Producto>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.Nombre).IsRequired().HasMaxLength(200);
                e.Property(x => x.CodigoBarras).IsRequired().HasMaxLength(50);
                e.Property(x => x.PrecioCompra).HasPrecision(18, 2);
                e.Property(x => x.PrecioVenta).HasPrecision(18, 2);
                e.Property(x => x.DescuentoPct).HasPrecision(5, 2);
                e.HasOne(x => x.Categoria)
                 .WithMany(x => x.Productos)
                 .HasForeignKey(x => x.CategoriaId);
            });

            // Inventario
            modelBuilder.Entity<Inventario>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
                e.HasOne(x => x.Producto)
                 .WithOne(x => x.Inventario)
                 .HasForeignKey<Inventario>(x => x.ProductoId);
            });

            // Venta
            modelBuilder.Entity<Venta>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.NumeroFactura).IsRequired().HasMaxLength(20);
                e.Property(x => x.Subtotal).HasPrecision(18, 2);
                e.Property(x => x.Descuento).HasPrecision(18, 2);
                e.Property(x => x.Total).HasPrecision(18, 2);
            });

            // VentaDetalle — actualizado para soportar servicios sin producto
            modelBuilder.Entity<VentaDetalle>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.Tipo).IsRequired().HasMaxLength(20).HasDefaultValue("PRODUCTO");
                e.Property(x => x.Descripcion).HasMaxLength(300);
                e.Property(x => x.PrecioUnitario).HasPrecision(18, 2);
                e.Property(x => x.DescuentoPct).HasPrecision(5, 2);
                e.Property(x => x.Subtotal).HasPrecision(18, 2);
                e.HasOne(x => x.Venta)
                 .WithMany(x => x.Detalles)
                 .HasForeignKey(x => x.VentaId);
                e.HasOne(x => x.Producto)
                 .WithMany(x => x.VentaDetalles)
                 .HasForeignKey(x => x.ProductoId)
                 .IsRequired(false);
            });

            // Devolucion
            modelBuilder.Entity<Devolucion>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.MontoDevuelto).HasPrecision(18, 2);
                e.HasOne(x => x.Venta)
                 .WithMany(x => x.Devoluciones)
                 .HasForeignKey(x => x.VentaId);
            });

            // DevolucionDetalle
            modelBuilder.Entity<DevolucionDetalle>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.Monto).HasPrecision(18, 2);
                e.HasOne(x => x.Devolucion)
                 .WithMany(x => x.Detalles)
                 .HasForeignKey(x => x.DevolucionId);
                e.HasOne(x => x.Producto)
                 .WithMany(x => x.DevolucionDetalles)
                 .HasForeignKey(x => x.ProductoId);
            });

            // MovimientoInventario
            modelBuilder.Entity<MovimientoInventario>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.Tipo).IsRequired().HasMaxLength(20);
                e.HasOne(x => x.Producto)
                 .WithMany(x => x.Movimientos)
                 .HasForeignKey(x => x.ProductoId);
            });

            // ClienteTienda
            modelBuilder.Entity<ClienteTienda>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.Nombre).IsRequired().HasMaxLength(150);
                e.Property(x => x.Email).IsRequired().HasMaxLength(150);
                e.HasIndex(x => x.Email).IsUnique();
            });

            // Presupuesto
            modelBuilder.Entity<Presupuesto>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.NumeroPresupuesto).IsRequired().HasMaxLength(20);
                e.Property(x => x.Subtotal).HasPrecision(18, 2);
                e.Property(x => x.Descuento).HasPrecision(18, 2);
                e.Property(x => x.Total).HasPrecision(18, 2);
                e.HasOne(x => x.Venta)
                 .WithMany()
                 .HasForeignKey(x => x.VentaId)
                 .IsRequired(false);
            });

            // PresupuestoDetalle
            modelBuilder.Entity<PresupuestoDetalle>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.Tipo).IsRequired().HasMaxLength(20);
                e.Property(x => x.Descripcion).IsRequired().HasMaxLength(300);
                e.Property(x => x.PrecioUnitario).HasPrecision(18, 2);
                e.Property(x => x.DescuentoPct).HasPrecision(5, 2);
                e.Property(x => x.Subtotal).HasPrecision(18, 2);
                e.HasOne(x => x.Presupuesto)
                 .WithMany(x => x.Detalles)
                 .HasForeignKey(x => x.PresupuestoId);
                e.HasOne(x => x.Producto)
                 .WithMany()
                 .HasForeignKey(x => x.ProductoId)
                 .IsRequired(false);
            });

            // Pedido
            modelBuilder.Entity<Pedido>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.NumeroPedido).IsRequired().HasMaxLength(20);
                e.Property(x => x.Total).HasPrecision(18, 2);
                e.HasOne(x => x.ClienteTienda)
                 .WithMany(x => x.Pedidos)
                 .HasForeignKey(x => x.ClienteTiendaId);
            });

            // PedidoDetalle
            modelBuilder.Entity<PedidoDetalle>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.PrecioUnitario).HasPrecision(18, 2);
                e.Property(x => x.Subtotal).HasPrecision(18, 2);
                e.HasOne(x => x.Pedido)
                 .WithMany(x => x.Detalles)
                 .HasForeignKey(x => x.PedidoId);
                e.HasOne(x => x.Producto)
                 .WithMany()
                 .HasForeignKey(x => x.ProductoId);
            });
        }
    }
}