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
        private readonly AppDbContext _db;
        public PedidosController(AppDbContext db) => _db = db;

        private Cliente? ObtenerCliente()
        {
            var auth = Request.Headers["Authorization"].ToString();
            if (!auth.StartsWith("Bearer ")) return null;
            var token = auth["Bearer ".Length..].Trim();
            return _db.Clientes.FirstOrDefault(c =>
                c.Token == token &&
                c.TokenExpira > DateTime.UtcNow &&
                c.TieneAccesoWeb);
        }

        // POST /api/tienda/pedidos — crear pedido (cliente)
        [HttpPost]
        public async Task<IActionResult> CrearPedido([FromBody] CrearPedidoDto dto)
        {
            var cliente = ObtenerCliente();
            if (cliente == null) return Unauthorized(new { mensaje = "Sesión inválida" });

            if (dto.Items == null || dto.Items.Count == 0)
                return BadRequest(new { mensaje = "El pedido debe tener al menos un item" });

            var ultimo = await _db.Pedidos.OrderByDescending(p => p.Fecha).FirstOrDefaultAsync();
            int sig = 1;
            if (ultimo != null && ultimo.NumeroPedido.StartsWith("PED-"))
                if (int.TryParse(ultimo.NumeroPedido.Replace("PED-", ""), out int n)) sig = n + 1;
            var numero = $"PED-{sig:D6}";

            decimal total = 0;
            var detalles = new List<PedidoDetalle>();

            foreach (var item in dto.Items)
            {
                var prod = await _db.Productos.Include(p => p.Inventario)
                    .FirstOrDefaultAsync(p => p.Id == item.ProductoId && p.Activo && p.VisibleWeb);
                if (prod == null) return BadRequest(new { mensaje = $"Producto no encontrado" });
                if (prod.Inventario == null || prod.Inventario.StockActual < item.Cantidad)
                    return BadRequest(new { mensaje = $"Stock insuficiente para '{prod.Nombre}'" });

                var precio = prod.PrecioVenta * (1 - prod.DescuentoPct / 100m);
                var sub = precio * item.Cantidad;
                total += sub;

                detalles.Add(new PedidoDetalle
                {
                    ProductoId = prod.Id,
                    ProductoNombre = prod.Nombre,
                    PrecioUnitario = precio,
                    Cantidad = item.Cantidad,
                    Subtotal = sub,
                });
            }

            var pedido = new Pedido
            {
                NumeroPedido = numero,
                ClienteId = cliente.Id,
                ClienteNombre = cliente.Nombre,
                ClienteTelefono = dto.Telefono ?? cliente.Telefono,
                DireccionEntrega = dto.DireccionEntrega,
                Notas = dto.Notas,
                MetodoPago = dto.MetodoPago ?? "TRANSFERENCIA",
                Total = total,
                Detalles = detalles,
            };

            _db.Pedidos.Add(pedido);
            await _db.SaveChangesAsync();

            return Ok(new { pedido.Id, pedido.NumeroPedido, pedido.Total });
        }

        // GET /api/tienda/pedidos/mis-pedidos
        [HttpGet("mis-pedidos")]
        public async Task<IActionResult> MisPedidos()
        {
            var cliente = ObtenerCliente();
            if (cliente == null) return Unauthorized();

            var pedidos = await _db.Pedidos
                .Where(p => p.ClienteId == cliente.Id)
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
                }).ToListAsync();

            return Ok(pedidos);
        }

        // GET /api/tienda/pedidos/mis-pedidos/:id
        [HttpGet("mis-pedidos/{id}")]
        public async Task<IActionResult> DetallePedido(Guid id)
        {
            var cliente = ObtenerCliente();
            if (cliente == null) return Unauthorized();

            var pedido = await _db.Pedidos
                .Include(p => p.Detalles)
                .FirstOrDefaultAsync(p => p.Id == id && p.ClienteId == cliente.Id);

            if (pedido == null) return NotFound(new { mensaje = "Pedido no encontrado" });

            return Ok(new
            {
                pedido.Id,
                pedido.NumeroPedido,
                pedido.Fecha,
                pedido.Estado,
                pedido.Total,
                pedido.MetodoPago,
                pedido.DireccionEntrega,
                ClienteTelefono = pedido.ClienteTelefono,
                pedido.Notas,
                pedido.FechaConfirmacion,
                pedido.FechaEntrega,
                pedido.FechaCancelacion,
                pedido.MotivoCancelacion,
                Detalles = pedido.Detalles.Select(d => new
                {
                    d.ProductoId,
                    d.ProductoNombre,
                    d.PrecioUnitario,
                    d.Cantidad,
                    d.Subtotal
                })
            });
        }

        // GET /api/tienda/pedidos/admin — listar todos (ERP)
        [HttpGet("admin")]
        public async Task<IActionResult> ListarAdmin(
            [FromQuery] string? estado,
            [FromQuery] int pagina = 1,
            [FromQuery] int tamano = 25)
        {
            var q = _db.Pedidos.Include(p => p.Cliente).AsQueryable();
            if (!string.IsNullOrEmpty(estado)) q = q.Where(p => p.Estado == estado.ToUpper());

            var total = await q.CountAsync();
            var datos = await q.OrderByDescending(p => p.Fecha)
                .Skip((pagina - 1) * tamano).Take(tamano)
                .Select(p => new
                {
                    p.Id,
                    p.NumeroPedido,
                    p.Fecha,
                    p.Estado,
                    p.Total,
                    p.MetodoPago,
                    p.ClienteNombre,
                    p.DireccionEntrega,
                    ClienteEmail = p.Cliente.Email,
                    CantidadItems = p.Detalles.Count
                }).ToListAsync();

            return Ok(new { datos, total, pagina, totalPaginas = (int)Math.Ceiling((double)total / tamano) });
        }

        // GET /api/tienda/pedidos/admin/:id
        [HttpGet("admin/{id}")]
        public async Task<IActionResult> DetalleAdmin(Guid id)
        {
            var pedido = await _db.Pedidos
                .Include(p => p.Cliente)
                .Include(p => p.Detalles).ThenInclude(d => d.Producto)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null) return NotFound(new { mensaje = "Pedido no encontrado" });

            return Ok(new
            {
                pedido.Id,
                pedido.NumeroPedido,
                pedido.Fecha,
                pedido.Estado,
                pedido.Total,
                pedido.MetodoPago,
                pedido.DireccionEntrega,
                pedido.ClienteNombre,
                pedido.ClienteTelefono,
                pedido.Notas,
                ClienteEmail = pedido.Cliente.Email,
                pedido.FechaConfirmacion,
                pedido.FechaEntrega,
                pedido.FechaCancelacion,
                pedido.MotivoCancelacion,
                Detalles = pedido.Detalles.Select(d => new
                {
                    d.ProductoId,
                    d.ProductoNombre,
                    d.PrecioUnitario,
                    d.Cantidad,
                    d.Subtotal
                })
            });
        }

        // PUT /api/tienda/pedidos/admin/:id/confirmar
        [HttpPut("admin/{id}/confirmar")]
        public async Task<IActionResult> Confirmar(Guid id)
        {
            var pedido = await _db.Pedidos.Include(p => p.Detalles)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (pedido == null) return NotFound();
            if (pedido.Estado != "PENDIENTE")
                return BadRequest(new { mensaje = "Solo se pueden confirmar pedidos pendientes" });

            using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                foreach (var det in pedido.Detalles)
                {
                    var inv = await _db.Inventarios.FirstOrDefaultAsync(i => i.ProductoId == det.ProductoId);
                    if (inv == null || inv.StockActual < det.Cantidad)
                        return BadRequest(new { mensaje = $"Stock insuficiente para '{det.ProductoNombre}'" });
                    inv.StockActual -= det.Cantidad;
                    _db.MovimientosInventario.Add(new MovimientoInventario
                    {
                        ProductoId = det.ProductoId,
                        Tipo = "SALIDA",
                        Cantidad = det.Cantidad,
                        Referencia = pedido.NumeroPedido,
                        Notas = $"Pedido online {pedido.NumeroPedido}",
                        Fecha = DateTime.UtcNow,
                    });
                }

                // Crear venta en el ERP
                var ultimaVenta = await _db.Ventas.OrderByDescending(v => v.Fecha).FirstOrDefaultAsync();
                int sigNum = 1;
                if (ultimaVenta != null && int.TryParse(ultimaVenta.NumeroFactura, out int nv)) sigNum = nv + 1;

                var venta = new Venta
                {
                    NumeroFactura = sigNum.ToString("D8"),
                    ClienteNombre = pedido.ClienteNombre,
                    MetodoPago = pedido.MetodoPago,
                    TipoComprobante = "PEDIDO_ONLINE",
                    Subtotal = pedido.Total,
                    Descuento = 0,
                    Total = pedido.Total,
                    Estado = "COMPLETADA",
                    Detalles = pedido.Detalles.Select(d => new VentaDetalle
                    {
                        Tipo = "PRODUCTO",
                        ProductoId = d.ProductoId,
                        Descripcion = d.ProductoNombre,
                        Cantidad = d.Cantidad,
                        PrecioUnitario = d.PrecioUnitario,
                        DescuentoPct = 0,
                        Subtotal = d.Subtotal
                    }).ToList()
                };
                _db.Ventas.Add(venta);

                pedido.Estado = "CONFIRMADO";
                pedido.FechaConfirmacion = DateTime.UtcNow;
                await _db.SaveChangesAsync();
                await tx.CommitAsync();

                return Ok(new { mensaje = "Pedido confirmado", numeroFactura = venta.NumeroFactura });
            }
            catch { await tx.RollbackAsync(); return StatusCode(500, new { mensaje = "Error al confirmar" }); }
        }

        // PUT /api/tienda/pedidos/admin/:id/entregar
        [HttpPut("admin/{id}/entregar")]
        public async Task<IActionResult> Entregar(Guid id)
        {
            var pedido = await _db.Pedidos.FindAsync(id);
            if (pedido == null) return NotFound();
            if (pedido.Estado != "CONFIRMADO")
                return BadRequest(new { mensaje = "Solo se pueden entregar pedidos confirmados" });
            pedido.Estado = "ENTREGADO";
            pedido.FechaEntrega = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { mensaje = "Pedido marcado como entregado" });
        }

        // PUT /api/tienda/pedidos/admin/:id/cancelar
        [HttpPut("admin/{id}/cancelar")]
        public async Task<IActionResult> Cancelar(Guid id, [FromBody] CancelarPedidoDto dto)
        {
            var pedido = await _db.Pedidos.Include(p => p.Detalles)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (pedido == null) return NotFound();
            if (pedido.Estado == "ENTREGADO" || pedido.Estado == "CANCELADO")
                return BadRequest(new { mensaje = "No se puede cancelar este pedido" });

            if (pedido.Estado == "CONFIRMADO")
            {
                foreach (var det in pedido.Detalles)
                {
                    var inv = await _db.Inventarios.FirstOrDefaultAsync(i => i.ProductoId == det.ProductoId);
                    if (inv != null) inv.StockActual += det.Cantidad;
                }
            }

            pedido.Estado = "CANCELADO";
            pedido.FechaCancelacion = DateTime.UtcNow;
            pedido.MotivoCancelacion = dto.Motivo;
            await _db.SaveChangesAsync();
            return Ok(new { mensaje = "Pedido cancelado" });
        }
    }

    public class ItemPedidoDto { public Guid ProductoId { get; set; } public int Cantidad { get; set; } }
    public class CrearPedidoDto
    {
        public List<ItemPedidoDto> Items { get; set; } = new();
        public string? MetodoPago { get; set; }
        public string? Telefono { get; set; }
        public string? DireccionEntrega { get; set; }
        public string? Notas { get; set; }
    }
    public class CancelarPedidoDto { public string? Motivo { get; set; } }
}