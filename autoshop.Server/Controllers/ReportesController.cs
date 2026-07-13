using autoshop.Server.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace autoshop.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ReportesController(AppDbContext context) { _context = context; }

        private static DateTime ToUtc(DateTime dt) => DateTime.SpecifyKind(dt, DateTimeKind.Utc);

        // GET: api/reportes/dashboard?desde=&hasta=
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard(
            [FromQuery] DateTime? desde = null,
            [FromQuery] DateTime? hasta = null)
        {
            var ahora = DateTime.UtcNow;
            var hoy = ahora.Date;
            var inicioMes = new DateTime(hoy.Year, hoy.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var finMes = inicioMes.AddMonths(1).AddTicks(-1);
            var diasEnMes = DateTime.DaysInMonth(hoy.Year, hoy.Month);
            var diaActual = hoy.Day;

            // Rango del filtro
            var desdeUtc = desde.HasValue ? ToUtc(desde.Value) : inicioMes;
            var hastaUtc = hasta.HasValue ? ToUtc(hasta.Value).AddDays(1) : ahora;

            // Ventas del período filtrado
            var ventasPeriodo = await _context.Ventas
                .Include(v => v.Detalles).ThenInclude(d => d.Producto)
                .Where(v => v.Estado == "COMPLETADA" && v.Fecha >= desdeUtc && v.Fecha <= hastaUtc)
                .ToListAsync();

            // Ventas del mes completo (para proyección)
            var ventasMes = await _context.Ventas
                .Include(v => v.Detalles).ThenInclude(d => d.Producto)
                .Where(v => v.Estado == "COMPLETADA" && v.Fecha >= inicioMes)
                .ToListAsync();

            // Ventas de hoy
            var ventasHoy = await _context.Ventas
                .Where(v => v.Estado == "COMPLETADA" && v.Fecha >= hoy)
                .ToListAsync();

            // Ventas semana
            var inicioSemana = hoy.AddDays(-(int)hoy.DayOfWeek);
            var ventasSemana = await _context.Ventas
                .Where(v => v.Estado == "COMPLETADA" && v.Fecha >= inicioSemana)
                .ToListAsync();

            // Stock
            var stockBajo = await _context.Inventarios.Include(i => i.Producto)
                .Where(i => i.Producto.Activo && i.StockActual <= i.StockMinimo && i.StockActual > 0).CountAsync();
            var sinStock = await _context.Inventarios.Include(i => i.Producto)
                .Where(i => i.Producto.Activo && i.StockActual == 0).CountAsync();

            // Últimas 5 ventas
            var ultimasVentas = await _context.Ventas
                .Where(v => v.Estado == "COMPLETADA")
                .OrderByDescending(v => v.Fecha).Take(5)
                .Select(v => new { v.NumeroFactura, v.Fecha, v.ClienteNombre, v.Total, v.MetodoPago })
                .ToListAsync();

            // Top 5 clientes del período
            var topClientes = await _context.Ventas
                .Where(v => v.Estado == "COMPLETADA" && v.Fecha >= desdeUtc && v.Fecha <= hastaUtc && v.ClienteNombre != null)
                .GroupBy(v => v.ClienteNombre)
                .Select(g => new { Cliente = g.Key, Compras = g.Count(), Total = g.Sum(v => v.Total) })
                .OrderByDescending(x => x.Total).Take(5).ToListAsync();

            // Top 5 productos del período
            var topProductos = await _context.VentaDetalles
                .Include(d => d.Producto).Include(d => d.Venta)
                .Where(d => d.Venta.Estado == "COMPLETADA" && d.Venta.Fecha >= desdeUtc && d.Venta.Fecha <= hastaUtc)
                .GroupBy(d => new { d.ProductoId, d.Producto.Nombre, d.Producto.ImagenUrl })
                .Select(g => new { g.Key.Nombre, g.Key.ImagenUrl, CantidadVendida = g.Sum(d => d.Cantidad), TotalVendido = g.Sum(d => d.Subtotal) })
                .OrderByDescending(x => x.CantidadVendida).Take(5).ToListAsync();

            // Métodos de pago del período
            var metodosPago = await _context.Ventas
                .Where(v => v.Estado == "COMPLETADA" && v.Fecha >= desdeUtc && v.Fecha <= hastaUtc)
                .GroupBy(v => v.MetodoPago)
                .Select(g => new { Metodo = g.Key, Cantidad = g.Count(), Total = g.Sum(v => v.Total) })
                .ToListAsync();

            // Ganancia del período
            var gananciaPeriodo = ventasPeriodo.SelectMany(v => v.Detalles)
            .Where(d => d.Tipo == "PRODUCTO" && d.Producto != null)
            .Sum(d => (d.PrecioUnitario - d.Producto!.PrecioCompra) * d.Cantidad * (1 - d.DescuentoPct / 100));

            // Proyección mes
            var totalMesActual = ventasMes.Sum(v => v.Total);
            var promedioDiario = diaActual > 0 ? totalMesActual / diaActual : 0;
            var proyeccionMes = promedioDiario * diasEnMes;
            var diasRestantes = diasEnMes - diaActual;

            // Proyección anual (basada en promedio diario del mes actual)
            var proyeccionAnual = promedioDiario * 365;
            var diasDelAnio = DateTime.IsLeapYear(hoy.Year) ? 366 : 365;
            var diaDelAnio = hoy.DayOfYear;
            var proyeccionRestoAnio = promedioDiario * (diasDelAnio - diaDelAnio);

            // Tendencia (este mes vs mes anterior)
            var inicioMesAnterior = inicioMes.AddMonths(-1);
            var finMesAnterior = inicioMes.AddTicks(-1);
            var totalMesAnterior = await _context.Ventas
                .Where(v => v.Estado == "COMPLETADA" && v.Fecha >= inicioMesAnterior && v.Fecha <= finMesAnterior)
                .SumAsync(v => v.Total);
            var tendenciaPct = totalMesAnterior > 0
                ? ((double)(totalMesActual - totalMesAnterior) / (double)totalMesAnterior) * 100
                : 0;

            // Recomendaciones de reposicion
            // Productos con mayor rotación pero bajo stock
            var recomendaciones = await _context.VentaDetalles
                .Include(d => d.Producto).ThenInclude(p => p.Inventario)
                .Include(d => d.Venta)
                .Where(d => d.Venta.Estado == "COMPLETADA" && d.Venta.Fecha >= inicioMes && d.Producto.Activo)
                .GroupBy(d => new { d.ProductoId, d.Producto.Nombre, d.Producto.Inventario.StockActual, d.Producto.Inventario.StockMinimo })
                .Select(g => new
                {
                    g.Key.Nombre,
                    g.Key.StockActual,
                    g.Key.StockMinimo,
                    VentasMes = g.Sum(d => d.Cantidad),
                    PromedioVentaDiaria = g.Sum(d => d.Cantidad) / 30.0
                })
                .Where(x => x.StockActual <= x.StockMinimo * 2)
                .OrderByDescending(x => x.VentasMes)
                .Take(5)
                .ToListAsync();

            // Productos con MENOR movimiento (no solo cero — los 5 con menos ventas)
            var productosBajoMovimiento = await _context.Productos
                .Include(p => p.Inventario)
                .Where(p => p.Activo && p.Inventario != null && p.Inventario.StockActual > 0)
                .Select(p => new
                {
                    p.Nombre,
                    StockActual = p.Inventario.StockActual,
                    VentasMes = _context.VentaDetalles
                        .Where(d => d.ProductoId == p.Id && d.Venta.Fecha >= inicioMes && d.Venta.Estado == "COMPLETADA")
                        .Sum(d => (int?)d.Cantidad) ?? 0
                })
                .OrderBy(x => x.VentasMes)
                .ThenByDescending(x => x.StockActual)
                .Take(5)
                .ToListAsync();

            return Ok(new
            {
                // Período filtrado
                cantidadVentas = ventasPeriodo.Count,
                totalVentas = ventasPeriodo.Sum(v => v.Total),
                totalDescuentos = ventasPeriodo.Sum(v => v.Descuento),
                gananciaBruta = gananciaPeriodo,
                ticketPromedio = ventasPeriodo.Count > 0 ? ventasPeriodo.Sum(v => v.Total) / ventasPeriodo.Count : 0,

                // Resumen hoy/semana/mes (siempre fijo)
                ventasHoy = ventasHoy.Count,
                totalHoy = ventasHoy.Sum(v => v.Total),
                ventasSemana = ventasSemana.Count,
                totalSemana = ventasSemana.Sum(v => v.Total),
                ventasMesCount = ventasMes.Count,
                totalMes = totalMesActual,

                // Stock
                stockBajo,
                sinStock,

                // Proyecciones
                proyeccionMes,
                diasRestantesMes = diasRestantes,
                proyeccionAnual,
                proyeccionRestoAnio,
                tendenciaPct,
                promedioDiario,

                // Listas
                ultimasVentas,
                topClientes,
                topProductos,
                metodosPago,
                recomendacionesReposicion = recomendaciones,
                productosBajoMovimiento
            });
        }

        // GET: api/reportes/ventas-por-dia?dias=30
        [HttpGet("ventas-por-dia")]
        public async Task<IActionResult> GetVentasPorDia([FromQuery] int dias = 30)
        {
            var desde = DateTime.UtcNow.Date.AddDays(-dias);
            var ventas = await _context.Ventas
                .Where(v => v.Estado == "COMPLETADA" && v.Fecha >= desde).ToListAsync();
            var porDia = ventas.GroupBy(v => v.Fecha.Date)
                .Select(g => new { fecha = g.Key.ToString("yyyy-MM-dd"), cantidad = g.Count(), total = g.Sum(v => v.Total) })
                .OrderBy(x => x.fecha).ToList();
            var resultado = new List<object>();
            for (int i = dias; i >= 0; i--)
            {
                var fecha = DateTime.UtcNow.Date.AddDays(-i);
                var fechaStr = fecha.ToString("yyyy-MM-dd");
                var dia = porDia.FirstOrDefault(d => d.fecha == fechaStr);
                resultado.Add(new { fecha = fechaStr, cantidad = dia?.cantidad ?? 0, total = dia?.total ?? 0 });
            }
            return Ok(resultado);
        }
    }
}