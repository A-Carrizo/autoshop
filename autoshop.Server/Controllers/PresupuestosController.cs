using autoshop.Server.Data;
using autoshop.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace autoshop.Server.Controllers
{
    [ApiController]
    [Route("api/presupuestos")]
    public class PresupuestosController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _configuration;
        public PresupuestosController(AppDbContext db, IConfiguration configuration) { _db = db; _configuration = configuration; }

        // GET /api/presupuestos
        [HttpGet]
        public async Task<IActionResult> Listar([FromQuery] string? estado, [FromQuery] string? busqueda, [FromQuery] int pagina = 1, [FromQuery] int tamano = 20)
        {
            var q = _db.Presupuestos
                .Include(p => p.Detalles).ThenInclude(d => d.Producto)
                .AsQueryable();

            if (!string.IsNullOrEmpty(estado))
                q = q.Where(p => p.Estado == estado.ToUpper());

            if (!string.IsNullOrEmpty(busqueda))
                q = q.Where(p => p.NumeroPresupuesto.Contains(busqueda) ||
                                 (p.ClienteNombre != null && p.ClienteNombre.ToLower().Contains(busqueda.ToLower())));

            var total = await q.CountAsync();
            var datos = await q.OrderByDescending(p => p.Fecha)
                .Skip((pagina - 1) * tamano).Take(tamano)
                .ToListAsync();

            return Ok(new
            {
                total,
                totalPaginas = (int)Math.Ceiling((double)total / tamano),
                pagina,
                datos = datos.Select(p => new
                {
                    p.Id,
                    p.NumeroPresupuesto,
                    p.Fecha,
                    p.Estado,
                    p.ClienteNombre,
                    p.ClienteRuc,
                    p.ClienteTelefono,
                    p.Subtotal,
                    p.Descuento,
                    p.Total,
                    p.Notas,
                    p.VentaId,
                    detalles = p.Detalles.Select(d => new
                    {
                        d.Id,
                        d.Tipo,
                        d.Descripcion,
                        d.ProductoId,
                        d.PrecioUnitario,
                        d.Cantidad,
                        d.DescuentoPct,
                        d.Subtotal
                    })
                })
            });
        }

        // GET /api/presupuestos/:id
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerUno(Guid id)
        {
            var p = await _db.Presupuestos
                .Include(x => x.Detalles).ThenInclude(d => d.Producto)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (p == null) return NotFound(new { mensaje = "Presupuesto no encontrado" });

            return Ok(new
            {
                p.Id,
                p.NumeroPresupuesto,
                p.Fecha,
                p.Estado,
                p.ClienteNombre,
                p.ClienteRuc,
                p.ClienteTelefono,
                p.Subtotal,
                p.Descuento,
                p.Total,
                p.Notas,
                p.VentaId,
                detalles = p.Detalles.Select(d => new
                {
                    d.Id,
                    d.Tipo,
                    d.Descripcion,
                    d.ProductoId,
                    d.PrecioUnitario,
                    d.Cantidad,
                    d.DescuentoPct,
                    d.Subtotal
                })
            });
        }

        // POST /api/presupuestos
        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearPresupuestoDto dto)
        {
            if (dto.Items == null || dto.Items.Count == 0)
                return BadRequest(new { mensaje = "El presupuesto debe tener al menos un item" });

            // Generar numero de presupuesto
            var ultimo = await _db.Presupuestos.OrderByDescending(p => p.Fecha).FirstOrDefaultAsync();
            int siguiente = 1;
            if (ultimo != null && ultimo.NumeroPresupuesto.StartsWith("PRES-"))
            {
                if (int.TryParse(ultimo.NumeroPresupuesto.Replace("PRES-", ""), out int num))
                    siguiente = num + 1;
            }
            var numero = $"PRES-{siguiente:D6}";

            var detalles = new List<PresupuestoDetalle>();
            decimal subtotal = 0, descuento = 0;

            foreach (var item in dto.Items)
            {
                string descripcion = item.Descripcion ?? "";

                // Si es producto, traer el nombre
                if (item.Tipo == "PRODUCTO" && item.ProductoId.HasValue)
                {
                    var prod = await _db.Productos.FindAsync(item.ProductoId.Value);
                    if (prod == null) return BadRequest(new { mensaje = $"Producto no encontrado: {item.ProductoId}" });
                    if (string.IsNullOrEmpty(descripcion)) descripcion = prod.Nombre;
                }

                var desc = Math.Min(100, Math.Max(0, item.DescuentoPct));
                var sub = item.PrecioUnitario * item.Cantidad * (1 - desc / 100m);
                subtotal += item.PrecioUnitario * item.Cantidad;
                descuento += item.PrecioUnitario * item.Cantidad * desc / 100m;

                detalles.Add(new PresupuestoDetalle
                {
                    Tipo = item.Tipo ?? "PRODUCTO",
                    ProductoId = item.Tipo == "PRODUCTO" ? item.ProductoId : null,
                    Descripcion = descripcion,
                    PrecioUnitario = item.PrecioUnitario,
                    Cantidad = item.Cantidad,
                    DescuentoPct = desc,
                    Subtotal = sub,
                });
            }

            var presupuesto = new Presupuesto
            {
                NumeroPresupuesto = numero,
                ClienteNombre = dto.ClienteNombre?.Trim(),
                ClienteRuc = dto.ClienteRuc?.Trim(),
                ClienteTelefono = dto.ClienteTelefono?.Trim(),
                Notas = dto.Notas?.Trim(),
                Estado = "PENDIENTE",
                Subtotal = subtotal,
                Descuento = descuento,
                Total = subtotal - descuento,
                Detalles = detalles,
            };

            _db.Presupuestos.Add(presupuesto);
            await _db.SaveChangesAsync();

            return Ok(new { presupuesto.Id, presupuesto.NumeroPresupuesto, presupuesto.Total });
        }

        // PUT /api/presupuestos/:id/estado
        [HttpPut("{id}/estado")]
        public async Task<IActionResult> CambiarEstado(Guid id, [FromBody] CambiarEstadoDto dto)
        {
            var p = await _db.Presupuestos.Include(x => x.Detalles).FirstOrDefaultAsync(x => x.Id == id);
            if (p == null) return NotFound(new { mensaje = "Presupuesto no encontrado" });

            var estadosValidos = new[] { "PENDIENTE", "APROBADO", "RECHAZADO" };
            if (!estadosValidos.Contains(dto.Estado.ToUpper()))
                return BadRequest(new { mensaje = "Estado inválido" });

            p.Estado = dto.Estado.ToUpper();
            await _db.SaveChangesAsync();

            // Si se aprueba, intentar enviar email si el cliente esta registrado
            if (p.Estado == "APROBADO" && !string.IsNullOrEmpty(p.ClienteNombre))
            {
                try
                {
                    var cliente = await _db.ClientesTienda
                        .FirstOrDefaultAsync(c => c.Nombre.ToLower() == p.ClienteNombre.ToLower());

                    if (cliente != null && !string.IsNullOrEmpty(cliente.Email))
                    {
                        var smtpConfig = _configuration.GetSection("Smtp");
                        var host = smtpConfig["Host"];
                        var port = int.Parse(smtpConfig["Port"] ?? "587");
                        var user = smtpConfig["User"];
                        var pass = smtpConfig["Pass"];

                        using var smtp = new MailKit.Net.Smtp.SmtpClient();
                        await smtp.ConnectAsync(host, port, MailKit.Security.SecureSocketOptions.StartTls);
                        await smtp.AuthenticateAsync(user, pass);

                        var mensaje = new MimeKit.MimeMessage();
                        mensaje.From.Add(MimeKit.InternetAddress.Parse(user!));
                        mensaje.To.Add(MimeKit.InternetAddress.Parse(cliente.Email));
                        mensaje.Subject = $"Presupuesto {p.NumeroPresupuesto} aprobado - MagCar Auto Shop";

                        var totalStr = p.Total.ToString("N0");
                        mensaje.Body = new MimeKit.TextPart("html")
                        {
                            Text = $@"
                                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                                    <div style='background: #CC0000; padding: 24px; text-align: center;'>
                                        <h1 style='color: white; margin: 0; font-size: 24px;'>MagCar Auto Shop</h1>
                                    </div>
                                    <div style='padding: 32px; background: #f9f9f9;'>
                                        <h2 style='color: #1a1a1a;'>¡Su presupuesto fue aprobado!</h2>
                                        <p>Estimado/a <strong>{p.ClienteNombre}</strong>,</p>
                                        <p>Nos complace informarle que su presupuesto <strong>{p.NumeroPresupuesto}</strong> ha sido aprobado.</p>
                                        <div style='background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;'>
                                            <p style='margin: 0; font-size: 14px; color: #718096;'>Total del presupuesto</p>
                                            <p style='margin: 4px 0 0; font-size: 28px; font-weight: 800; color: #CC0000;'>Gs. {totalStr}</p>
                                        </div>
                                        <p>Por favor comuníquese con nosotros para coordinar los próximos pasos.</p>
                                        <p style='color: #718096; font-size: 13px;'>MagCar Auto Shop — Accesorios y Luces Automotrices</p>
                                    </div>
                                </div>"
                        };

                        await smtp.SendAsync(mensaje);
                        await smtp.DisconnectAsync(true);
                    }
                }
                catch { /* Email falla silenciosamente, no interrumpe el flujo */ }
            }

            return Ok(new { mensaje = "Estado actualizado", p.Estado });
        }

        // POST /api/presupuestos/:id/convertir
        [HttpPost("{id}/convertir")]
        public async Task<IActionResult> ConvertirEnVenta(Guid id, [FromBody] ConvertirDto dto)
        {
            var p = await _db.Presupuestos
                .Include(x => x.Detalles)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (p == null) return NotFound(new { mensaje = "Presupuesto no encontrado" });
            if (p.VentaId != null) return BadRequest(new { mensaje = "Este presupuesto ya fue convertido en venta" });

            // Todos los items se convierten: productos descuentan stock, servicios van como items sin producto
            if (p.Detalles.Count == 0)
                return BadRequest(new { mensaje = "El presupuesto no tiene items para convertir en venta" });

            // Generar numero de factura
            var ultimaVenta = await _db.Ventas.OrderByDescending(v => v.Fecha).FirstOrDefaultAsync();
            int sigNum = 1;
            if (ultimaVenta != null && int.TryParse(ultimaVenta.NumeroFactura, out int n)) sigNum = n + 1;
            var numeroFactura = sigNum.ToString("D8");

            using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                var detallesVenta = new List<VentaDetalle>();
                decimal subtotal = 0, descuento = 0;

                foreach (var item in p.Detalles)
                {
                    var sub = item.PrecioUnitario * item.Cantidad * (1 - item.DescuentoPct / 100m);
                    subtotal += item.PrecioUnitario * item.Cantidad;
                    descuento += item.PrecioUnitario * item.Cantidad * item.DescuentoPct / 100m;

                    if (item.Tipo == "PRODUCTO" && item.ProductoId != null)
                    {
                        var prod = await _db.Productos.Include(x => x.Inventario).FirstOrDefaultAsync(x => x.Id == item.ProductoId);
                        if (prod != null && prod.Inventario != null)
                        {
                            prod.Inventario.StockActual -= item.Cantidad;
                            _db.MovimientosInventario.Add(new MovimientoInventario
                            {
                                ProductoId = prod.Id,
                                Tipo = "SALIDA",
                                Cantidad = item.Cantidad,
                                Referencia = p.NumeroPresupuesto,
                                Notas = $"Venta desde presupuesto {p.NumeroPresupuesto}",
                                Fecha = DateTime.UtcNow,
                            });
                        }
                        detallesVenta.Add(new VentaDetalle
                        {
                            Tipo = "PRODUCTO",
                            ProductoId = item.ProductoId,
                            Descripcion = item.Descripcion,
                            Cantidad = item.Cantidad,
                            PrecioUnitario = item.PrecioUnitario,
                            DescuentoPct = item.DescuentoPct,
                            Subtotal = sub,
                        });
                    }
                    else if (item.Tipo == "SERVICIO")
                    {
                        detallesVenta.Add(new VentaDetalle
                        {
                            Tipo = "SERVICIO",
                            ProductoId = null,
                            Descripcion = item.Descripcion,
                            Cantidad = item.Cantidad,
                            PrecioUnitario = item.PrecioUnitario,
                            DescuentoPct = item.DescuentoPct,
                            Subtotal = sub,
                        });
                    }
                }

                var venta = new Venta
                {
                    NumeroFactura = numeroFactura,
                    ClienteNombre = p.ClienteNombre,
                    ClienteRuc = p.ClienteRuc,
                    MetodoPago = dto.MetodoPago ?? "EFECTIVO",
                    TipoComprobante = dto.TipoComprobante ?? "TICKET",
                    Subtotal = subtotal,
                    Descuento = descuento,
                    Total = subtotal - descuento,
                    Estado = "COMPLETADA",
                    Detalles = detallesVenta,
                };

                _db.Ventas.Add(venta);
                await _db.SaveChangesAsync();

                p.VentaId = venta.Id;
                p.Estado = "CONVERTIDO";
                await _db.SaveChangesAsync();

                await tx.CommitAsync();
                return Ok(new { ventaId = venta.Id, numeroFactura = venta.NumeroFactura, total = venta.Total });
            }
            catch
            {
                await tx.RollbackAsync();
                return StatusCode(500, new { mensaje = "Error al convertir el presupuesto" });
            }
        }

        // DELETE /api/presupuestos/:id
        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(Guid id)
        {
            var p = await _db.Presupuestos.Include(x => x.Detalles).FirstOrDefaultAsync(x => x.Id == id);
            if (p == null) return NotFound(new { mensaje = "Presupuesto no encontrado" });
            if (p.VentaId != null) return BadRequest(new { mensaje = "No se puede eliminar un presupuesto ya convertido en venta" });
            _db.Presupuestos.Remove(p);
            await _db.SaveChangesAsync();
            return Ok(new { mensaje = "Presupuesto eliminado" });
        }
    }

    public class CrearPresupuestoDto
    {
        public string? ClienteNombre { get; set; }
        public string? ClienteRuc { get; set; }
        public string? ClienteTelefono { get; set; }
        public string? Notas { get; set; }
        public List<ItemPresupuestoDto> Items { get; set; } = new();
    }

    public class ItemPresupuestoDto
    {
        public string Tipo { get; set; } = "PRODUCTO"; // PRODUCTO o SERVICIO
        public Guid? ProductoId { get; set; }
        public string? Descripcion { get; set; }
        public decimal PrecioUnitario { get; set; }
        public int Cantidad { get; set; } = 1;
        public decimal DescuentoPct { get; set; } = 0;
    }

    public class CambiarEstadoDto
    {
        public string Estado { get; set; } = string.Empty;
    }

    public class ConvertirDto
    {
        public string? MetodoPago { get; set; }
        public string? TipoComprobante { get; set; }
    }
}