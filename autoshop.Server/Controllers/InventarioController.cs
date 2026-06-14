using autoshop.Server.Data;
using autoshop.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace autoshop.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventarioController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InventarioController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/inventario?pagina=1&busqueda=&soloStockBajo=false
        [HttpGet]
        public async Task<IActionResult> GetInventario(
            [FromQuery] int pagina = 1,
            [FromQuery] int tamano = 25,
            [FromQuery] string? busqueda = null,
            [FromQuery] bool soloStockBajo = false)
        {
            var query = _context.Productos
                .Include(p => p.Inventario)
                .Include(p => p.Categoria)
                .Where(p => p.Activo)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(busqueda))
                query = query.Where(p =>
                    p.Nombre.ToLower().Contains(busqueda.ToLower()) ||
                    p.CodigoBarras.Contains(busqueda));

            if (soloStockBajo)
                query = query.Where(p =>
                    p.Inventario != null &&
                    p.Inventario.StockActual <= p.Inventario.StockMinimo);

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
                    CategoriaNombre = p.Categoria.Nombre,
                    p.ImagenUrl,
                    StockActual = p.Inventario != null ? p.Inventario.StockActual : 0,
                    StockMinimo = p.Inventario != null ? p.Inventario.StockMinimo : 0,
                    UltimaActualizacion = p.Inventario != null ? p.Inventario.UltimaActualizacion : (DateTime?)null
                })
                .ToListAsync();

            return Ok(new
            {
                datos,
                total,
                pagina,
                tamano,
                totalPaginas = (int)Math.Ceiling((double)total / tamano)
            });
        }

        // GET: api/inventario/{id}/movimientos
        [HttpGet("{id}/movimientos")]
        public async Task<IActionResult> GetMovimientos(
            Guid id,
            [FromQuery] int pagina = 1,
            [FromQuery] int tamano = 20)
        {
            var producto = await _context.Productos.FindAsync(id);
            if (producto == null) return NotFound();

            var total = await _context.MovimientosInventario
                .Where(m => m.ProductoId == id)
                .CountAsync();

            var movimientos = await _context.MovimientosInventario
                .Where(m => m.ProductoId == id)
                .OrderByDescending(m => m.Fecha)
                .Skip((pagina - 1) * tamano)
                .Take(tamano)
                .Select(m => new
                {
                    m.Id,
                    m.Tipo,
                    m.Cantidad,
                    m.Referencia,
                    m.Fecha,
                    m.Notas
                })
                .ToListAsync();

            return Ok(new { movimientos, total, pagina, tamano, totalPaginas = (int)Math.Ceiling((double)total / tamano) });
        }

        // POST: api/inventario/{id}/ajuste
        [HttpPost("{id}/ajuste")]
        public async Task<IActionResult> AjustarStock(Guid id, AjusteStockDto dto)
        {
            var inventario = await _context.Inventarios
                .FirstOrDefaultAsync(i => i.ProductoId == id);

            if (inventario == null)
                return NotFound(new { mensaje = "Inventario no encontrado." });

            var stockAnterior = inventario.StockActual;
            int diferencia;

            switch (dto.TipoAjuste)
            {
                case "ENTRADA":
                    if (dto.Cantidad <= 0)
                        return BadRequest(new { mensaje = "La cantidad debe ser mayor a 0." });
                    inventario.StockActual += dto.Cantidad;
                    diferencia = dto.Cantidad;
                    break;

                case "SALIDA":
                    if (dto.Cantidad <= 0)
                        return BadRequest(new { mensaje = "La cantidad debe ser mayor a 0." });
                    if (inventario.StockActual < dto.Cantidad)
                        return BadRequest(new { mensaje = $"Stock insuficiente. Stock actual: {inventario.StockActual}" });
                    inventario.StockActual -= dto.Cantidad;
                    diferencia = -dto.Cantidad;
                    break;

                case "CORRECCION":
                    if (dto.Cantidad < 0)
                        return BadRequest(new { mensaje = "El stock no puede ser negativo." });
                    diferencia = dto.Cantidad - inventario.StockActual;
                    inventario.StockActual = dto.Cantidad;
                    break;

                default:
                    return BadRequest(new { mensaje = "Tipo de ajuste inválido. Use ENTRADA, SALIDA o CORRECCION." });
            }

            inventario.UltimaActualizacion = DateTime.UtcNow;

            _context.MovimientosInventario.Add(new MovimientoInventario
            {
                Id = Guid.NewGuid(),
                ProductoId = id,
                Tipo = dto.TipoAjuste,
                Cantidad = Math.Abs(diferencia),
                Referencia = "Ajuste manual",
                Fecha = DateTime.UtcNow,
                Notas = dto.Notas ?? $"Ajuste manual: {stockAnterior} → {inventario.StockActual}"
            });

            await _context.SaveChangesAsync();

            return Ok(new
            {
                stockAnterior,
                stockNuevo = inventario.StockActual,
                diferencia,
                mensaje = "Stock ajustado correctamente"
            });
        }
    }

    public class AjusteStockDto
    {
        public string TipoAjuste { get; set; } = "ENTRADA"; // ENTRADA | SALIDA | CORRECCION
        public int Cantidad { get; set; }
        public string? Notas { get; set; }
    }
}