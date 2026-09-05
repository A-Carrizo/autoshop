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
        private const int MAX_IMAGENES = 6;

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
                .Include(p => p.Categorias)
                .Include(p => p.Inventario)
                .Where(p => p.Activo)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(busqueda))
                query = query.Where(p =>
                    p.Nombre.ToLower().Contains(busqueda.ToLower()) ||
                    p.CodigoBarras.Contains(busqueda));

            if (categoriaId.HasValue)
                query = query.Where(p => p.Categorias.Any(c => c.Id == categoriaId.Value));

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
                    ImagenUrl = p.Imagenes.OrderBy(i => i.Orden).Select(i => i.Url).FirstOrDefault(),
                    Imagenes = p.Imagenes.OrderBy(i => i.Orden).Select(i => i.Url),
                    p.Activo,
                    Categorias = p.Categorias.Select(c => new { c.Id, c.Nombre }),
                    CategoriaNombre = string.Join(", ", p.Categorias.Select(c => c.Nombre)),
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
                .Include(p => p.Categorias)
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
                    ImagenUrl = p.Imagenes.OrderBy(i => i.Orden).Select(i => i.Url).FirstOrDefault(),
                    Imagenes = p.Imagenes.OrderBy(i => i.Orden).Select(i => i.Url),
                    Categorias = p.Categorias.Select(c => new { c.Id, c.Nombre }),
                    CategoriaNombre = string.Join(", ", p.Categorias.Select(c => c.Nombre)),
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
                .Include(p => p.Inventario)
                .Where(p => p.Id == id)
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
                    ImagenUrl = p.Imagenes.OrderBy(i => i.Orden).Select(i => i.Url).FirstOrDefault(),
                    Imagenes = p.Imagenes.OrderBy(i => i.Orden).Select(i => i.Url),
                    p.Activo,
                    Categorias = p.Categorias.Select(c => new { c.Id, c.Nombre }),
                    StockActual = p.Inventario != null ? p.Inventario.StockActual : 0,
                    StockMinimo = p.Inventario != null ? p.Inventario.StockMinimo : 0
                })
                .FirstOrDefaultAsync();

            if (producto == null) return NotFound();
            return Ok(producto);
        }

        [HttpPost]
        public async Task<IActionResult> PostProducto(ProductoCreateDto dto)
        {
            if (dto.CategoriaIds == null || dto.CategoriaIds.Count == 0)
                return BadRequest(new { mensaje = "Debe seleccionar al menos una categoría." });

            if (dto.ImagenUrls != null && dto.ImagenUrls.Count > MAX_IMAGENES)
                return BadRequest(new { mensaje = $"No se pueden cargar más de {MAX_IMAGENES} imágenes por producto." });

            var existe = await _context.Productos
                .AnyAsync(p => p.CodigoBarras == dto.CodigoBarras && p.Activo);

            if (existe)
                return BadRequest(new { mensaje = "Ya existe un producto con ese código de barras." });

            var categorias = await _context.Categorias
                .Where(c => dto.CategoriaIds.Contains(c.Id)).ToListAsync();

            if (categorias.Count != dto.CategoriaIds.Distinct().Count())
                return BadRequest(new { mensaje = "Una o más categorías seleccionadas no son válidas." });

            var producto = new Producto
            {
                Id = Guid.NewGuid(),
                CodigoBarras = dto.CodigoBarras,
                Nombre = dto.Nombre,
                Descripcion = dto.Descripcion,
                PrecioCompra = dto.PrecioCompra,
                PrecioVenta = dto.PrecioVenta,
                DescuentoPct = dto.DescuentoPct,
                Categorias = categorias,
                Imagenes = (dto.ImagenUrls ?? new List<string>()).Select((url, idx) => new ProductoImagen
                {
                    Id = Guid.NewGuid(),
                    Url = url,
                    Orden = idx
                }).ToList(),
                VisibleWeb = dto.VisibleWeb,
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
            var producto = await _context.Productos
                .Include(p => p.Categorias)
                .Include(p => p.Imagenes)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (producto == null) return NotFound();

            if (dto.CategoriaIds == null || dto.CategoriaIds.Count == 0)
                return BadRequest(new { mensaje = "Debe seleccionar al menos una categoría." });

            if (dto.ImagenUrls != null && dto.ImagenUrls.Count > MAX_IMAGENES)
                return BadRequest(new { mensaje = $"No se pueden cargar más de {MAX_IMAGENES} imágenes por producto." });

            var existe = await _context.Productos
                .AnyAsync(p => p.CodigoBarras == dto.CodigoBarras && p.Id != id && p.Activo);

            if (existe)
                return BadRequest(new { mensaje = "Ya existe otro producto con ese código de barras." });

            var categorias = await _context.Categorias
                .Where(c => dto.CategoriaIds.Contains(c.Id)).ToListAsync();

            if (categorias.Count != dto.CategoriaIds.Distinct().Count())
                return BadRequest(new { mensaje = "Una o más categorías seleccionadas no son válidas." });

            // Elimina del servidor los archivos de las imagenes que ya no estan en la lista nueva
            var urlsNuevas = dto.ImagenUrls ?? new List<string>();
            var urlsEliminadas = producto.Imagenes.Select(i => i.Url).Except(urlsNuevas).ToList();
            foreach (var url in urlsEliminadas)
                EliminarImagenFisica(url);

            producto.CodigoBarras = dto.CodigoBarras;
            producto.Nombre = dto.Nombre;
            producto.Descripcion = dto.Descripcion;
            producto.PrecioCompra = dto.PrecioCompra;
            producto.PrecioVenta = dto.PrecioVenta;
            producto.DescuentoPct = dto.DescuentoPct;
            producto.Categorias.Clear();
            foreach (var c in categorias) producto.Categorias.Add(c);

            _context.ProductoImagenes.RemoveRange(producto.Imagenes);
            var nuevasImagenes = urlsNuevas.Select((url, idx) => new ProductoImagen
            {
                Id = Guid.NewGuid(),
                ProductoId = producto.Id,
                Url = url,
                Orden = idx
            }).ToList();
            _context.ProductoImagenes.AddRange(nuevasImagenes);

            producto.VisibleWeb = dto.VisibleWeb;

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
            var producto = await _context.Productos
                .Include(p => p.Imagenes)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (producto == null) return NotFound();

            var tieneVentas = await _context.VentaDetalles.AnyAsync(v => v.ProductoId == id);
            if (tieneVentas)
                return BadRequest(new { mensaje = "No se puede eliminar un producto que tiene ventas registradas." });

            // Eliminar todas las imagenes del servidor
            foreach (var img in producto.Imagenes)
                EliminarImagenFisica(img.Url);

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
        public List<Guid> CategoriaIds { get; set; } = new();
        public bool VisibleWeb { get; set; } = true;
        public List<string> ImagenUrls { get; set; } = new();
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
        public List<Guid> CategoriaIds { get; set; } = new();
        public bool VisibleWeb { get; set; } = true;
        public List<string> ImagenUrls { get; set; } = new();
        public int StockMinimo { get; set; }
    }
}