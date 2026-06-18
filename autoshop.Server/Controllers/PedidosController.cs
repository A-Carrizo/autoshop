using autoshop.Server.Data;
using autoshop.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace autoshop.Server.Controllers
{
    [ApiController]
    [Route("api/tienda/pedidos")]
    public class PedidosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PedidosController(AppDbContext context)
        {
            _context = context;
        }

        // Obtiene el cliente de tienda autenticado a partir del token, o null si no hay sesion valida
        private async Task<ClienteTienda?> ObtenerClienteAutenticado(string? auth)
        {
            var token = auth?.Replace("Bearer ", "");
            if (string.IsNullOrEmpty(token)) return null;
            return await _context.ClientesTienda.FirstOrDefaultAsync(c =>
                c.Token == token && c.TokenExpira > DateTime.UtcNow && c.Activo);
        }

        private static string GenerarNumeroPedido() =>
            "PED-" + DateTime.UtcNow.ToString("yyyyMMddHHmmss");

        // ===================== ENDPOINTS DEL CLIENTE (TIENDA) =====================

        [HttpPost]
        public async Task<IActionResult> CrearPedido(
            [FromHeader(Name = "Authorization")] string? auth,
            [FromBody] CrearPedidoDto dto)
        {
            var cliente = await ObtenerClienteAutenticado(auth);
            if (cliente == null) return Unauthorized(new { mensaje = "Debes iniciar sesion para realizar un pedido." });

            if (dto.Items == null || dto.Items.Count == 0)
                return BadRequest(new { mensaje = "El carrito esta vacio." });

            // Validar productos y calcular totales con datos reales de la BD (no confiar en el frontend)
            var productoIds = dto.Items.Select(i => i.ProductoId).ToList();
            var productos = await _context.Productos
                .Include(p => p.Inventario)
                .Where(p => productoIds.Contains(p.Id) && p.Activo && p.VisibleWeb)
                .ToListAsync();

            if (productos.Count != productoIds.Distinct().Count())
                return BadRequest(new { mensaje = "Uno o mas productos del carrito ya no estan disponibles." });

            var detalles = new List<PedidoDetalle>();
            decimal total = 0;

            foreach (var item in dto.Items)
            {
                var producto = productos.First(p => p.Id == item.ProductoId);

                if (item.Cantidad <= 0)
                    return BadRequest(new { mensaje = $"Cantidad invalida para {producto.Nombre}." });

                var stockDisponible = producto.Inventario?.StockActual ?? 0;
                if (item.Cantidad > stockDisponible)
                    return BadRequest(new { mensaje = $"No hay suficiente stock de '{producto.Nombre}'. Disponible: {stockDisponible}." });

                var precioConDescuento = producto.PrecioVenta - (producto.PrecioVenta * producto.DescuentoPct / 100);
                var subtotal = precioConDescuento * item.Cantidad;
                total += subtotal;

                detalles.Add(new PedidoDetalle
                {
                    Id = Guid.NewGuid(),
                    ProductoId = producto.Id,
                    ProductoNombre = producto.Nombre,
                    Cantidad = item.Cantidad,
                    PrecioUnitario = precioConDescuento,
                    Subtotal = subtotal
                });
            }

            var pedido = new Pedido
            {
                Id = Guid.NewGuid(),
                NumeroPedido = GenerarNumeroPedido(),
                ClienteTiendaId = cliente.Id,
                Fecha = DateTime.UtcNow,
                ClienteNombre = cliente.Nombre,
                ClienteTelefono = dto.Telefono ?? cliente.Telefono,
                DireccionEntrega = dto.DireccionEntrega ?? cliente.Direccion,
                Notas = dto.Notas,
                MetodoPago = dto.MetodoPago,
                Estado = "PENDIENTE",
                Total = total,
                Detalles = detalles
            };

            _context.Pedidos.Add(pedido);
            await _context.SaveChangesAsync();

            return Ok(new { id = pedido.Id, numeroPedido = pedido.NumeroPedido, total = pedido.Total, mensaje = "Pedido creado correctamente. Nos pondremos en contacto para coordinar el pago y la entrega." });
        }

        [HttpGet("mis-pedidos")]
        public async Task<IActionResult> MisPedidos([FromHeader(Name = "Authorization")] string? auth)
        {
            var cliente = await ObtenerClienteAutenticado(auth);
            if (cliente == null) return Unauthorized(new { mensaje = "Sesion invalida." });

            var pedidos = await _context.Pedidos
                .Where(p => p.ClienteTiendaId == cliente.Id)
                .OrderByDescending(p => p.Fecha)
                .Select(p => new
                {
                    p.Id,
                    p.NumeroPedido,
                    p.Fecha,
                    p.Estado,
                    p.Total,
                    p.MetodoPago,
                    CantidadItems = p.Detalles.Count
                })
                .ToListAsync();

            return Ok(pedidos);
        }

        [HttpGet("mis-pedidos/{id}")]
        public async Task<IActionResult> MiPedidoDetalle(Guid id, [FromHeader(Name = "Authorization")] string? auth)
        {
            var cliente = await ObtenerClienteAutenticado(auth);
            if (cliente == null) return Unauthorized(new { mensaje = "Sesion invalida." });

            var pedido = await _context.Pedidos
                .Include(p => p.Detalles)
                .FirstOrDefaultAsync(p => p.Id == id && p.ClienteTiendaId == cliente.Id);

            if (pedido == null) return NotFound();

            return Ok(new
            {
                pedido.Id,
                pedido.NumeroPedido,
                pedido.Fecha,
                pedido.Estado,
                pedido.Total,
                pedido.MetodoPago,
                pedido.DireccionEntrega,
                pedido.ClienteTelefono,
                pedido.Notas,
                pedido.FechaConfirmacion,
                pedido.FechaEntrega,
                pedido.FechaCancelacion,
                pedido.MotivoCancelacion,
                Detalles = pedido.Detalles.Select(d => new { d.ProductoNombre, d.Cantidad, d.PrecioUnitario, d.Subtotal })
            });
        }

        // ===================== ENDPOINTS DEL ERP (ADMIN) =====================

        [HttpGet("admin")]
        public async Task<IActionResult> GetPedidosAdmin([FromQuery] string? estado = null)
        {
            var query = _context.Pedidos
                .Include(p => p.ClienteTienda)
                .Include(p => p.Detalles)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(estado))
                query = query.Where(p => p.Estado == estado.ToUpper());

            var pedidos = await query
                .OrderByDescending(p => p.Fecha)
                .Select(p => new
                {
                    p.Id,
                    p.NumeroPedido,
                    p.Fecha,
                    p.Estado,
                    p.Total,
                    p.MetodoPago,
                    p.ClienteNombre,
                    p.ClienteTelefono,
                    p.DireccionEntrega,
                    ClienteEmail = p.ClienteTienda.Email,
                    CantidadItems = p.Detalles.Count
                })
                .ToListAsync();

            return Ok(pedidos);
        }

        [HttpGet("admin/{id}")]
        public async Task<IActionResult> GetPedidoAdmin(Guid id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.ClienteTienda)
                .Include(p => p.Detalles)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null) return NotFound();

            return Ok(new
            {
                pedido.Id,
                pedido.NumeroPedido,
                pedido.Fecha,
                pedido.Estado,
                pedido.Total,
                pedido.MetodoPago,
                pedido.ClienteNombre,
                pedido.ClienteTelefono,
                pedido.DireccionEntrega,
                pedido.Notas,
                ClienteEmail = pedido.ClienteTienda.Email,
                pedido.FechaConfirmacion,
                pedido.FechaEntrega,
                pedido.FechaCancelacion,
                pedido.MotivoCancelacion,
                Detalles = pedido.Detalles.Select(d => new { d.ProductoId, d.ProductoNombre, d.Cantidad, d.PrecioUnitario, d.Subtotal })
            });
        }

        [HttpPut("admin/{id}/confirmar")]
        public async Task<IActionResult> ConfirmarPedido(Guid id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Detalles)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null) return NotFound();
            if (pedido.Estado != "PENDIENTE")
                return BadRequest(new { mensaje = "Solo se pueden confirmar pedidos pendientes." });

            // Validar stock y descontar
            foreach (var detalle in pedido.Detalles)
            {
                var inventario = await _context.Inventarios.FirstOrDefaultAsync(i => i.ProductoId == detalle.ProductoId);
                if (inventario == null || inventario.StockActual < detalle.Cantidad)
                    return BadRequest(new { mensaje = $"Stock insuficiente para '{detalle.ProductoNombre}'. No se puede confirmar el pedido." });
            }

            foreach (var detalle in pedido.Detalles)
            {
                var inventario = await _context.Inventarios.FirstAsync(i => i.ProductoId == detalle.ProductoId);
                inventario.StockActual -= detalle.Cantidad;
                inventario.UltimaActualizacion = DateTime.UtcNow;

                _context.MovimientosInventario.Add(new MovimientoInventario
                {
                    Id = Guid.NewGuid(),
                    ProductoId = detalle.ProductoId,
                    Tipo = "VENTA",
                    Cantidad = -detalle.Cantidad,
                    Referencia = pedido.NumeroPedido,
                    Fecha = DateTime.UtcNow,
                    Notas = $"Pedido online {pedido.NumeroPedido} confirmado"
                });
            }

            pedido.Estado = "CONFIRMADO";
            pedido.FechaConfirmacion = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Pedido confirmado. Stock actualizado." });
        }

        [HttpPut("admin/{id}/entregar")]
        public async Task<IActionResult> MarcarEntregado(Guid id)
        {
            var pedido = await _context.Pedidos.FindAsync(id);
            if (pedido == null) return NotFound();
            if (pedido.Estado != "CONFIRMADO")
                return BadRequest(new { mensaje = "Solo se pueden marcar como entregados los pedidos confirmados." });

            pedido.Estado = "ENTREGADO";
            pedido.FechaEntrega = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Pedido marcado como entregado." });
        }

        [HttpPut("admin/{id}/cancelar")]
        public async Task<IActionResult> CancelarPedido(Guid id, [FromBody] CancelarPedidoDto dto)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Detalles)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null) return NotFound();
            if (pedido.Estado == "ENTREGADO" || pedido.Estado == "CANCELADO")
                return BadRequest(new { mensaje = "Este pedido no se puede cancelar." });

            // Si ya estaba confirmado (stock ya descontado), hay que devolverlo
            if (pedido.Estado == "CONFIRMADO")
            {
                foreach (var detalle in pedido.Detalles)
                {
                    var inventario = await _context.Inventarios.FirstOrDefaultAsync(i => i.ProductoId == detalle.ProductoId);
                    if (inventario != null)
                    {
                        inventario.StockActual += detalle.Cantidad;
                        inventario.UltimaActualizacion = DateTime.UtcNow;

                        _context.MovimientosInventario.Add(new MovimientoInventario
                        {
                            Id = Guid.NewGuid(),
                            ProductoId = detalle.ProductoId,
                            Tipo = "AJUSTE",
                            Cantidad = detalle.Cantidad,
                            Referencia = pedido.NumeroPedido,
                            Fecha = DateTime.UtcNow,
                            Notas = $"Cancelacion de pedido online {pedido.NumeroPedido} - devolucion de stock"
                        });
                    }
                }
            }

            pedido.Estado = "CANCELADO";
            pedido.FechaCancelacion = DateTime.UtcNow;
            pedido.MotivoCancelacion = dto.Motivo;
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Pedido cancelado." });
        }
    }

    public record ItemCarritoDto(Guid ProductoId, int Cantidad);
    public record CrearPedidoDto(List<ItemCarritoDto> Items, string MetodoPago, string? Telefono, string? DireccionEntrega, string? Notas);
    public record CancelarPedidoDto(string? Motivo);
}