using autoshop.Server.Data;
using autoshop.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace autoshop.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DevolucionesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DevolucionesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/devoluciones
        [HttpGet]
        public async Task<IActionResult> GetDevoluciones(
            [FromQuery] int pagina = 1,
            [FromQuery] int tamano = 25)
        {
            var total = await _context.Devoluciones.CountAsync();

            var datos = await _context.Devoluciones
                .Include(d => d.Venta)
                .Include(d => d.Detalles)
                .OrderByDescending(d => d.Fecha)
                .Skip((pagina - 1) * tamano)
                .Take(tamano)
                .Select(d => new
                {
                    d.Id,
                    d.Fecha,
                    d.Motivo,
                    d.MontoDevuelto,
                    NumeroFactura = d.Venta.NumeroFactura,
                    ClienteNombre = d.Venta.ClienteNombre,
                    CantidadItems = d.Detalles.Count
                })
                .ToListAsync();

            return Ok(new { datos, total, pagina, tamano, totalPaginas = (int)Math.Ceiling((double)total / tamano) });
        }

        // GET: api/devoluciones/venta/{ventaId}
        // Devuelve los detalles de una venta para poder seleccionar qué devolver
        [HttpGet("venta/{ventaId}")]
        public async Task<IActionResult> GetVentaParaDevolucion(Guid ventaId)
        {
            var venta = await _context.Ventas
                .Include(v => v.Detalles)
                    .ThenInclude(d => d.Producto)
                .Include(v => v.Devoluciones)
                    .ThenInclude(dev => dev.Detalles)
                .FirstOrDefaultAsync(v => v.Id == ventaId);

            if (venta == null) return NotFound(new { mensaje = "Venta no encontrada." });
            if (venta.Estado == "ANULADA") return BadRequest(new { mensaje = "La venta ya está anulada." });

            // Calcular cantidades ya devueltas por producto
            var yaDevuelto = venta.Devoluciones
                .SelectMany(d => d.Detalles)
                .GroupBy(d => d.ProductoId)
                .ToDictionary(g => g.Key, g => g.Sum(d => d.Cantidad));

            var detalles = venta.Detalles.Select(d => new
            {
                d.Id,
                d.ProductoId,
                NombreProducto = d.Producto.Nombre,
                d.Cantidad,
                CantidadDevuelta = yaDevuelto.GetValueOrDefault(d.ProductoId, 0),
                CantidadDisponible = d.Cantidad - yaDevuelto.GetValueOrDefault(d.ProductoId, 0),
                d.PrecioUnitario,
                d.DescuentoPct,
                d.Subtotal
            }).Where(d => d.CantidadDisponible > 0).ToList();

            return Ok(new
            {
                venta.Id,
                venta.NumeroFactura,
                venta.Fecha,
                venta.ClienteNombre,
                venta.Total,
                venta.MetodoPago,
                Detalles = detalles
            });
        }

        // POST: api/devoluciones
        [HttpPost]
        public async Task<IActionResult> PostDevolucion(DevolucionCreateDto dto)
        {
            var venta = await _context.Ventas
                .Include(v => v.Detalles)
                    .ThenInclude(d => d.Producto)
                        .ThenInclude(p => p.Inventario)
                .Include(v => v.Devoluciones)
                    .ThenInclude(dev => dev.Detalles)
                .FirstOrDefaultAsync(v => v.Id == dto.VentaId);

            if (venta == null) return NotFound(new { mensaje = "Venta no encontrada." });
            if (venta.Estado == "ANULADA") return BadRequest(new { mensaje = "La venta ya está anulada." });
            if (dto.Items == null || dto.Items.Count == 0) return BadRequest(new { mensaje = "Debe seleccionar al menos un producto." });

            // Validar cantidades
            var yaDevuelto = venta.Devoluciones
                .SelectMany(d => d.Detalles)
                .GroupBy(d => d.ProductoId)
                .ToDictionary(g => g.Key, g => g.Sum(d => d.Cantidad));

            decimal montoTotal = 0;
            var detalles = new List<DevolucionDetalle>();
            var movimientos = new List<MovimientoInventario>();

            foreach (var item in dto.Items)
            {
                var detalle = venta.Detalles.FirstOrDefault(d => d.ProductoId == item.ProductoId);
                if (detalle == null) return BadRequest(new { mensaje = "Producto no encontrado en la venta." });

                var devueltoAntes = yaDevuelto.GetValueOrDefault(item.ProductoId, 0);
                var disponible = detalle.Cantidad - devueltoAntes;

                if (item.Cantidad <= 0 || item.Cantidad > disponible)
                    return BadRequest(new { mensaje = $"Cantidad inválida para '{detalle.Producto.Nombre}'. Máximo disponible: {disponible}" });

                var montoItem = detalle.PrecioUnitario * item.Cantidad * (1 - detalle.DescuentoPct / 100);
                montoTotal += montoItem;

                detalles.Add(new DevolucionDetalle
                {
                    Id = Guid.NewGuid(),
                    ProductoId = item.ProductoId,
                    Cantidad = item.Cantidad,
                    Monto = montoItem
                });

                // Devolver stock
                if (detalle.Producto.Inventario != null)
                {
                    detalle.Producto.Inventario.StockActual += item.Cantidad;
                    detalle.Producto.Inventario.UltimaActualizacion = DateTime.UtcNow;
                }

                movimientos.Add(new MovimientoInventario
                {
                    Id = Guid.NewGuid(),
                    ProductoId = item.ProductoId,
                    Tipo = "DEVOLUCION",
                    Cantidad = item.Cantidad,
                    Referencia = venta.NumeroFactura,
                    Fecha = DateTime.UtcNow,
                    Notas = $"Devolución de venta {venta.NumeroFactura}"
                });
            }

            var devolucion = new Devolucion
            {
                Id = Guid.NewGuid(),
                VentaId = dto.VentaId,
                Fecha = DateTime.UtcNow,
                Motivo = dto.Motivo,
                MontoDevuelto = montoTotal
            };

            foreach (var d in detalles) d.DevolucionId = devolucion.Id;

            _context.Devoluciones.Add(devolucion);
            _context.DevolucionDetalles.AddRange(detalles);
            _context.MovimientosInventario.AddRange(movimientos);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = devolucion.Id,
                montoDevuelto = montoTotal,
                mensaje = "Devolución registrada correctamente"
            });
        }
    }

    public class DevolucionItemDto
    {
        public Guid ProductoId { get; set; }
        public int Cantidad { get; set; }
    }

    public class DevolucionCreateDto
    {
        public Guid VentaId { get; set; }
        public string Motivo { get; set; } = string.Empty;
        public List<DevolucionItemDto> Items { get; set; } = new();
    }
}