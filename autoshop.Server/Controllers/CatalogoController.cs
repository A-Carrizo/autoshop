using autoshop.Server.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace autoshop.Server.Controllers
{
    [ApiController]
    [Route("api/tienda/catalogo")]
    public class CatalogoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CatalogoController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetProductos(
            [FromQuery] int pagina = 1,
            [FromQuery] int tamano = 24,
            [FromQuery] string? busqueda = null,
            [FromQuery] Guid? categoriaId = null,
            [FromQuery] string? orden = null)
        {
            var query = _context.Productos
                .Include(p => p.Categoria)
                .Include(p => p.Inventario)
                .Where(p => p.Activo && p.VisibleWeb)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(busqueda))
                query = query.Where(p => p.Nombre.ToLower().Contains(busqueda.ToLower()));

            if (categoriaId.HasValue)
                query = query.Where(p => p.CategoriaId == categoriaId.Value);

            query = orden switch
            {
                "precio_asc" => query.OrderBy(p => p.PrecioVenta),
                "precio_desc" => query.OrderByDescending(p => p.PrecioVenta),
                "nombre" => query.OrderBy(p => p.Nombre),
                _ => query.OrderByDescending(p => p.Nombre) // por defecto: mas recientes primero (sin FechaCreacion en Producto, usamos nombre como fallback)
            };

            var total = await query.CountAsync();

            var datos = await query
                .Skip((pagina - 1) * tamano)
                .Take(tamano)
                .Select(p => new
                {
                    p.Id,
                    p.Nombre,
                    p.Descripcion,
                    PrecioVenta = p.PrecioVenta - (p.PrecioVenta * p.DescuentoPct / 100),
                    PrecioOriginal = p.PrecioVenta,
                    p.DescuentoPct,
                    p.ImagenUrl,
                    CategoriaId = p.CategoriaId,
                    CategoriaNombre = p.Categoria.Nombre,
                    EnStock = p.Inventario != null && p.Inventario.StockActual > 0,
                    StockActual = p.Inventario != null ? p.Inventario.StockActual : 0
                })
                .ToListAsync();

            return Ok(new { datos, total, pagina, tamano, totalPaginas = (int)Math.Ceiling((double)total / tamano) });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProducto(Guid id)
        {
            var producto = await _context.Productos
                .Include(p => p.Categoria)
                .Include(p => p.Inventario)
                .Where(p => p.Id == id && p.Activo && p.VisibleWeb)
                .Select(p => new
                {
                    p.Id,
                    p.Nombre,
                    p.Descripcion,
                    PrecioVenta = p.PrecioVenta - (p.PrecioVenta * p.DescuentoPct / 100),
                    PrecioOriginal = p.PrecioVenta,
                    p.DescuentoPct,
                    p.ImagenUrl,
                    CategoriaId = p.CategoriaId,
                    CategoriaNombre = p.Categoria.Nombre,
                    EnStock = p.Inventario != null && p.Inventario.StockActual > 0,
                    StockActual = p.Inventario != null ? p.Inventario.StockActual : 0
                })
                .FirstOrDefaultAsync();

            if (producto == null) return NotFound(new { mensaje = "Producto no encontrado o no disponible." });
            return Ok(producto);
        }

        [HttpGet("categorias")]
        public async Task<IActionResult> GetCategorias()
        {
            // Solo categorias que tengan al menos un producto visible en la web
            var categorias = await _context.Categorias
                .Where(c => c.Activo && c.Productos.Any(p => p.Activo && p.VisibleWeb))
                .Select(c => new { c.Id, c.Nombre })
                .OrderBy(c => c.Nombre)
                .ToListAsync();

            return Ok(categorias);
        }
    }
}