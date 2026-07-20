using autoshop.Server.Data;
using autoshop.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace autoshop.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ClientesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetClientes(
            [FromQuery] int pagina = 1,
            [FromQuery] int tamano = 25,
            [FromQuery] string? busqueda = null)
        {
            var query = _context.Clientes.Where(c => c.Activo).AsQueryable();

            if (!string.IsNullOrWhiteSpace(busqueda))
                query = query.Where(c =>
                    c.Nombre.ToLower().Contains(busqueda.ToLower()) ||
                    (c.Ruc != null && c.Ruc.Contains(busqueda)) ||
                    (c.Telefono != null && c.Telefono.Contains(busqueda)));

            var total = await query.CountAsync();
            var datos = await query
                .OrderBy(c => c.Nombre)
                .Skip((pagina - 1) * tamano)
                .Take(tamano)
                .ToListAsync();

            return Ok(new { datos, total, pagina, tamano, totalPaginas = (int)Math.Ceiling((double)total / tamano) });
        }

        [HttpGet("buscar")]
        public async Task<IActionResult> Buscar([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q)) return Ok(new List<object>());

            var clientes = await _context.Clientes
                .Where(c => c.Activo && (
                    c.Nombre.ToLower().Contains(q.ToLower()) ||
                    (c.Ruc != null && c.Ruc.Contains(q))))
                .OrderBy(c => c.Nombre)
                .Take(8)
                .ToListAsync();

            return Ok(clientes);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCliente(Guid id)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null) return NotFound();
            return Ok(cliente);
        }

        [HttpPost]
        public async Task<IActionResult> PostCliente(Cliente dto)
        {
            // Verificar duplicado de email contra CUALQUIER cliente (activo o inactivo).
            // Antes solo se chequeaba contra inactivos, lo que permitía que un email
            // ya usado por un cliente ACTIVO llegara sin control hasta el INSERT y
            // reventara con un DbUpdateException por el índice único IX_Clientes_Email.
            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var emailLower = dto.Email.Trim().ToLower();
                var existenteEmail = await _context.Clientes
                    .FirstOrDefaultAsync(c => c.Email != null && c.Email.ToLower() == emailLower);

                if (existenteEmail != null)
                {
                    if (!existenteEmail.Activo)
                        return Conflict(new
                        {
                            mensaje = $"Ya existe un cliente inactivo con el email '{dto.Email}'. ¿Deseas reactivarlo?",
                            clienteInactivoId = existenteEmail.Id,
                            clienteNombre = existenteEmail.Nombre,
                            tipo = "CLIENTE_INACTIVO"
                        });

                    return Conflict(new
                    {
                        mensaje = $"Ya existe un cliente activo con el email '{dto.Email}': {existenteEmail.Nombre}.",
                        tipo = "EMAIL_DUPLICADO"
                    });
                }
            }

            // Verificar duplicado de RUC/CI contra clientes activos.
            if (!string.IsNullOrWhiteSpace(dto.Ruc))
            {
                var rucTrim = dto.Ruc.Trim();
                var existenteRuc = await _context.Clientes
                    .FirstOrDefaultAsync(c => c.Ruc != null && c.Ruc == rucTrim && c.Activo);

                if (existenteRuc != null)
                    return Conflict(new
                    {
                        mensaje = $"Ya existe un cliente activo con el RUC/CI '{rucTrim}': {existenteRuc.Nombre}.",
                        tipo = "RUC_DUPLICADO"
                    });
            }

            var cliente = new Cliente
            {
                Id = Guid.NewGuid(),
                Nombre = dto.Nombre,
                Ruc = dto.Ruc,
                Telefono = dto.Telefono,
                Direccion = dto.Direccion,
                Email = dto.Email?.Trim(),
                Activo = true,
                FechaCreacion = DateTime.UtcNow,
            };
            _context.Clientes.Add(cliente);
            await _context.SaveChangesAsync();
            return Ok(cliente);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutCliente(Guid id, Cliente dto)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null) return NotFound();
            cliente.Nombre = dto.Nombre;
            cliente.Ruc = dto.Ruc;
            cliente.Telefono = dto.Telefono;
            cliente.Direccion = dto.Direccion;
            cliente.Email = dto.Email?.Trim();
            await _context.SaveChangesAsync();
            return Ok(cliente);
        }

        // PUT /api/clientes/:id/reactivar
        [HttpPut("{id}/reactivar")]
        public async Task<IActionResult> ReactivarCliente(Guid id, Cliente dto)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null) return NotFound();
            if (cliente.Activo) return BadRequest(new { mensaje = "El cliente ya está activo" });

            cliente.Activo = true;
            cliente.Nombre = dto.Nombre;
            cliente.Ruc = dto.Ruc;
            cliente.Telefono = dto.Telefono;
            cliente.Direccion = dto.Direccion;
            cliente.Email = dto.Email?.Trim();
            await _context.SaveChangesAsync();
            return Ok(cliente);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCliente(Guid id)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null) return NotFound();
            cliente.Activo = false;
            // Revocar acceso web al desactivar
            cliente.TieneAccesoWeb = false;
            cliente.Token = null;
            cliente.TokenExpira = null;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}