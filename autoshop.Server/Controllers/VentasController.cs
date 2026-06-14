using autoshop.Server.Data;
using autoshop.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace autoshop.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VentasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VentasController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/ventas?pagina=1&tamano=25
        [HttpGet]
        public async Task<IActionResult> GetVentas(
            [FromQuery] int pagina = 1,
            [FromQuery] int tamano = 25,
            [FromQuery] string? busqueda = null,
            [FromQuery] DateTime? desde = null,
            [FromQuery] DateTime? hasta = null)
        {
            var query = _context.Ventas
                .Where(v => v.Estado != "ANULADA")
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(busqueda))
                query = query.Where(v =>
                    v.NumeroFactura.Contains(busqueda) ||
                    (v.ClienteNombre != null && v.ClienteNombre.ToLower().Contains(busqueda.ToLower())));

            if (desde.HasValue)
                query = query.Where(v => v.Fecha >= desde.Value);

            if (hasta.HasValue)
                query = query.Where(v => v.Fecha <= hasta.Value.AddDays(1));

            var total = await query.CountAsync();

            var datos = await query
                .OrderByDescending(v => v.Fecha)
                .Skip((pagina - 1) * tamano)
                .Take(tamano)
                .Select(v => new
                {
                    v.Id,
                    v.NumeroFactura,
                    v.Fecha,
                    v.ClienteNombre,
                    v.ClienteRuc,
                    v.MetodoPago,
                    v.TipoComprobante,
                    v.Subtotal,
                    v.Descuento,
                    v.Total,
                    v.Estado,
                    CantidadItems = v.Detalles.Count
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

        // GET: api/ventas/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetVenta(Guid id)
        {
            var venta = await _context.Ventas
                .Include(v => v.Detalles)
                    .ThenInclude(d => d.Producto)
                .FirstOrDefaultAsync(v => v.Id == id);

            if (venta == null) return NotFound();

            return Ok(new
            {
                venta.Id,
                venta.NumeroFactura,
                venta.Fecha,
                venta.ClienteNombre,
                venta.ClienteRuc,
                venta.MetodoPago,
                venta.TipoComprobante,
                venta.Subtotal,
                venta.Descuento,
                venta.Total,
                venta.Estado,
                Detalles = venta.Detalles.Select(d => new
                {
                    d.Id,
                    d.ProductoId,
                    d.Producto.Nombre,
                    d.Producto.CodigoBarras,
                    d.Cantidad,
                    d.PrecioUnitario,
                    d.DescuentoPct,
                    d.Subtotal
                })
            });
        }

        // POST: api/ventas
        [HttpPost]
        public async Task<IActionResult> PostVenta(VentaCreateDto dto)
        {
            if (dto.Items == null || dto.Items.Count == 0)
                return BadRequest(new { mensaje = "La venta debe tener al menos un producto." });

            // Generar número de factura
            var ultimaVenta = await _context.Ventas
                .OrderByDescending(v => v.Fecha)
                .FirstOrDefaultAsync();

            int siguiente = 1;
            if (ultimaVenta != null && ultimaVenta.NumeroFactura.StartsWith("F-"))
            {
                if (int.TryParse(ultimaVenta.NumeroFactura.Replace("F-", ""), out int ultimo))
                    siguiente = ultimo + 1;
            }

            var numeroFactura = $"F-{siguiente:D6}";

            // Verificar stock y calcular totales
            decimal subtotal = 0;
            decimal descuentoTotal = 0;
            var detalles = new List<VentaDetalle>();
            var movimientos = new List<MovimientoInventario>();

            foreach (var item in dto.Items)
            {
                var producto = await _context.Productos
                    .Include(p => p.Inventario)
                    .FirstOrDefaultAsync(p => p.Id == item.ProductoId && p.Activo);

                if (producto == null)
                    return BadRequest(new { mensaje = $"Producto no encontrado." });

                if (producto.Inventario == null || producto.Inventario.StockActual < item.Cantidad)
                    return BadRequest(new { mensaje = $"Stock insuficiente para '{producto.Nombre}'. Stock disponible: {producto.Inventario?.StockActual ?? 0}" });

                var descPct = item.DescuentoPct > 0 ? item.DescuentoPct : producto.DescuentoPct;
                var precioUnitario = producto.PrecioVenta;
                var subtotalItem = precioUnitario * item.Cantidad;
                var descuentoItem = subtotalItem * (descPct / 100);

                subtotal += subtotalItem;
                descuentoTotal += descuentoItem;

                detalles.Add(new VentaDetalle
                {
                    Id = Guid.NewGuid(),
                    ProductoId = producto.Id,
                    Cantidad = item.Cantidad,
                    PrecioUnitario = precioUnitario,
                    DescuentoPct = descPct,
                    Subtotal = subtotalItem - descuentoItem
                });

                // Actualizar stock
                producto.Inventario.StockActual -= item.Cantidad;
                producto.Inventario.UltimaActualizacion = DateTime.UtcNow;

                movimientos.Add(new MovimientoInventario
                {
                    Id = Guid.NewGuid(),
                    ProductoId = producto.Id,
                    Tipo = "VENTA",
                    Cantidad = item.Cantidad,
                    Referencia = numeroFactura,
                    Fecha = DateTime.UtcNow,
                    Notas = $"Venta {numeroFactura}"
                });
            }

            var venta = new Venta
            {
                Id = Guid.NewGuid(),
                NumeroFactura = numeroFactura,
                Fecha = DateTime.UtcNow,
                ClienteNombre = dto.ClienteNombre,
                ClienteRuc = dto.ClienteRuc,
                MetodoPago = dto.MetodoPago,
                TipoComprobante = dto.TipoComprobante,
                Subtotal = subtotal,
                Descuento = descuentoTotal,
                Total = subtotal - descuentoTotal,
                Estado = "COMPLETADA"
            };

            foreach (var detalle in detalles)
                detalle.VentaId = venta.Id;

            _context.Ventas.Add(venta);
            _context.VentaDetalles.AddRange(detalles);
            _context.MovimientosInventario.AddRange(movimientos);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = venta.Id,
                numeroFactura = venta.NumeroFactura,
                total = venta.Total,
                mensaje = "Venta registrada correctamente"
            });
        }

        // DELETE: api/ventas/5 (anular venta)
        [HttpDelete("{id}")]
        public async Task<IActionResult> AnularVenta(Guid id)
        {
            var venta = await _context.Ventas
                .Include(v => v.Detalles)
                .FirstOrDefaultAsync(v => v.Id == id);

            if (venta == null) return NotFound();
            if (venta.Estado == "ANULADA")
                return BadRequest(new { mensaje = "La venta ya está anulada." });

            // Devolver stock
            foreach (var detalle in venta.Detalles)
            {
                var inventario = await _context.Inventarios
                    .FirstOrDefaultAsync(i => i.ProductoId == detalle.ProductoId);

                if (inventario != null)
                {
                    inventario.StockActual += detalle.Cantidad;
                    inventario.UltimaActualizacion = DateTime.UtcNow;
                }

                _context.MovimientosInventario.Add(new MovimientoInventario
                {
                    Id = Guid.NewGuid(),
                    ProductoId = detalle.ProductoId,
                    Tipo = "DEVOLUCION",
                    Cantidad = detalle.Cantidad,
                    Referencia = venta.NumeroFactura,
                    Fecha = DateTime.UtcNow,
                    Notas = $"Anulación de venta {venta.NumeroFactura}"
                });
            }

            venta.Estado = "ANULADA";
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = $"Venta {venta.NumeroFactura} anulada correctamente" });
        }
    }

    public class VentaItemDto
    {
        public Guid ProductoId { get; set; }
        public int Cantidad { get; set; }
        public decimal DescuentoPct { get; set; }
    }

    public class VentaCreateDto
    {
        public string? ClienteNombre { get; set; }
        public string? ClienteRuc { get; set; }
        public string MetodoPago { get; set; } = "EFECTIVO";
        public string TipoComprobante { get; set; } = "TICKET";
        public List<VentaItemDto> Items { get; set; } = new();
    }
}