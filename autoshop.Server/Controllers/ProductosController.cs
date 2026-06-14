using autoshop.Server.Data;
using autoshop.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace autoshop.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ProductosController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet]
        public async Task<IActionResult> GetProductos(
            [FromQuery] int pagina = 1,
            [FromQuery] int tamano = 25,
            [FromQuery] string? busqueda = null,
            [FromQuery] Guid? categoriaId = null)
        {
            var query = _context.Productos
                .Include(p => p.Categoria)
                .Include(p => p.Inventario)
                .Where(p => p.Activo)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(busqueda))
                query = query.Where(p =>
                    p.Nombre.ToLower().Contains(busqueda.ToLower()) ||
                    p.CodigoBarras.Contains(busqueda));

            if (categoriaId.HasValue)
                query = query.Where(p => p.CategoriaId == categoriaId.Value);

            var total = await query.CountAsync();

            var datos = await query
                .OrderBy(p => p.Nombre)
                .Skip((pagina - 1) * tamano)
                .Take(tamano)
                .Select(p => new
                {
                    p.Id,
                    p.CodigoBarras,
                    p.Nombre,
                    p.Descripcion,
                    p.PrecioCompra,
                    p.PrecioVenta,
                    p.DescuentoPct,
                    p.VisibleWeb,
                    p.ImagenUrl,
                    p.Activo,
                    p.CategoriaId,
                    CategoriaNombre = p.Categoria.Nombre,
                    StockActual = p.Inventario != null ? p.Inventario.StockActual : 0,
                    StockMinimo = p.Inventario != null ? p.Inventario.StockMinimo : 0
                })
                .ToListAsync();

            return Ok(new { datos, total, pagina, tamano, totalPaginas = (int)Math.Ceiling((double)total / tamano) });
        }

        [HttpGet("barcode/{codigo}")]
        public async Task<IActionResult> GetPorCodigoBarras(string codigo)
        {
            var producto = await _context.Productos
                .Include(p => p.Categoria)
                .Include(p => p.Inventario)
                .Where(p => p.Activo && p.CodigoBarras == codigo)
                .Select(p => new
                {
                    p.Id,
                    p.CodigoBarras,
                    p.Nombre,
                    p.Descripcion,
                    p.PrecioCompra,
                    p.PrecioVenta,
                    p.DescuentoPct,
                    p.ImagenUrl,
                    p.CategoriaId,
                    CategoriaNombre = p.Categoria.Nombre,
                    StockActual = p.Inventario != null ? p.Inventario.StockActual : 0
                })
                .FirstOrDefaultAsync();

            if (producto == null)
                return NotFound(new { mensaje = $"No se encontró producto con código {codigo}" });

            return Ok(producto);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProducto(Guid id)
        {
            var producto = await _context.Productos
                .Include(p => p.Categoria)
                .Include(p => p.Inventario)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (producto == null) return NotFound();
            return Ok(producto);
        }

        [HttpPost]
        public async Task<IActionResult> PostProducto(ProductoCreateDto dto)
        {
            var existe = await _context.Productos
                .AnyAsync(p => p.CodigoBarras == dto.CodigoBarras && p.Activo);

            if (existe)
                return BadRequest(new { mensaje = "Ya existe un producto con ese código de barras." });

            var producto = new Producto
            {
                Id = Guid.NewGuid(),
                CodigoBarras = dto.CodigoBarras,
                Nombre = dto.Nombre,
                Descripcion = dto.Descripcion,
                PrecioCompra = dto.PrecioCompra,
                PrecioVenta = dto.PrecioVenta,
                DescuentoPct = dto.DescuentoPct,
                CategoriaId = dto.CategoriaId,
                VisibleWeb = dto.VisibleWeb,
                ImagenUrl = dto.ImagenUrl,
                Activo = true
            };

            _context.Productos.Add(producto);

            _context.Inventarios.Add(new Inventario
            {
                Id = Guid.NewGuid(),
                ProductoId = producto.Id,
                StockActual = dto.StockInicial,
                StockMinimo = dto.StockMinimo,
                UltimaActualizacion = DateTime.UtcNow
            });

            if (dto.StockInicial > 0)
            {
                _context.MovimientosInventario.Add(new MovimientoInventario
                {
                    Id = Guid.NewGuid(),
                    ProductoId = producto.Id,
                    Tipo = "COMPRA",
                    Cantidad = dto.StockInicial,
                    Referencia = "Stock inicial",
                    Fecha = DateTime.UtcNow,
                    Notas = "Carga inicial del producto"
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { id = producto.Id, mensaje = "Producto creado correctamente" });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutProducto(Guid id, ProductoUpdateDto dto)
        {
            var producto = await _context.Productos.FindAsync(id);
            if (producto == null) return NotFound();

            var existe = await _context.Productos
                .AnyAsync(p => p.CodigoBarras == dto.CodigoBarras && p.Id != id && p.Activo);

            if (existe)
                return BadRequest(new { mensaje = "Ya existe otro producto con ese código de barras." });

            // Si cambia la imagen, eliminar la anterior del servidor
            if (!string.IsNullOrEmpty(producto.ImagenUrl) && producto.ImagenUrl != dto.ImagenUrl)
            {
                EliminarImagenFisica(producto.ImagenUrl);
            }

            producto.CodigoBarras = dto.CodigoBarras;
            producto.Nombre = dto.Nombre;
            producto.Descripcion = dto.Descripcion;
            producto.PrecioCompra = dto.PrecioCompra;
            producto.PrecioVenta = dto.PrecioVenta;
            producto.DescuentoPct = dto.DescuentoPct;
            producto.CategoriaId = dto.CategoriaId;
            producto.VisibleWeb = dto.VisibleWeb;
            producto.ImagenUrl = dto.ImagenUrl;

            var inventario = await _context.Inventarios.FirstOrDefaultAsync(i => i.ProductoId == id);
            if (inventario != null)
            {
                inventario.StockMinimo = dto.StockMinimo;
                inventario.UltimaActualizacion = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProducto(Guid id)
        {
            var producto = await _context.Productos.FindAsync(id);
            if (producto == null) return NotFound();

            var tieneVentas = await _context.VentaDetalles.AnyAsync(v => v.ProductoId == id);
            if (tieneVentas)
                return BadRequest(new { mensaje = "No se puede eliminar un producto que tiene ventas registradas." });

            // Eliminar imagen del servidor si existe
            if (!string.IsNullOrEmpty(producto.ImagenUrl))
                EliminarImagenFisica(producto.ImagenUrl);

            _context.Productos.Remove(producto);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private void EliminarImagenFisica(string imagenUrl)
        {
            try
            {
                var nombreArchivo = Path.GetFileName(imagenUrl);
                var ruta = Path.Combine(_env.ContentRootPath, "wwwroot", "imagenes", "productos", nombreArchivo);
                if (System.IO.File.Exists(ruta))
                    System.IO.File.Delete(ruta);
            }
            catch { /* Si falla no bloqueamos la operación */ }
        }
    }

    public class ProductoCreateDto
    {
        public string CodigoBarras { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public decimal PrecioCompra { get; set; }
        public decimal PrecioVenta { get; set; }
        public decimal DescuentoPct { get; set; }
        public Guid CategoriaId { get; set; }
        public bool VisibleWeb { get; set; } = true;
        public string? ImagenUrl { get; set; }
        public int StockInicial { get; set; }
        public int StockMinimo { get; set; }
    }

    public class ProductoUpdateDto
    {
        public string CodigoBarras { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public decimal PrecioCompra { get; set; }
        public decimal PrecioVenta { get; set; }
        public decimal DescuentoPct { get; set; }
        public Guid CategoriaId { get; set; }
        public bool VisibleWeb { get; set; } = true;
        public string? ImagenUrl { get; set; }
        public int StockMinimo { get; set; }
    }
}