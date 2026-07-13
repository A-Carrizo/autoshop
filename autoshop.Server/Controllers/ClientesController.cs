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
            // Si existe un cliente desactivado con el mismo email, reactivarlo
            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var emailLower = dto.Email.Trim().ToLower();
                var desactivado = await _context.Clientes
                    .FirstOrDefaultAsync(c => c.Email != null &&
                        c.Email.ToLower() == emailLower && !c.Activo);

                if (desactivado != null)
                {
                    desactivado.Activo = true;
                    desactivado.Nombre = dto.Nombre;
                    desactivado.Ruc = dto.Ruc;
                    desactivado.Telefono = dto.Telefono;
                    desactivado.Direccion = dto.Direccion;
                    desactivado.Email = dto.Email.Trim();
                    await _context.SaveChangesAsync();
                    return Ok(desactivado);
                }
            }

            // Si existe desactivado con mismo nombre y sin email, reactivarlo
            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                var desactivadoSinEmail = await _context.Clientes
                    .FirstOrDefaultAsync(c => c.Nombre.ToLower() == dto.Nombre.Trim().ToLower()
                        && string.IsNullOrWhiteSpace(c.Email) && !c.Activo);

                if (desactivadoSinEmail != null)
                {
                    desactivadoSinEmail.Activo = true;
                    desactivadoSinEmail.Nombre = dto.Nombre;
                    desactivadoSinEmail.Ruc = dto.Ruc;
                    desactivadoSinEmail.Telefono = dto.Telefono;
                    desactivadoSinEmail.Direccion = dto.Direccion;
                    await _context.SaveChangesAsync();
                    return Ok(desactivadoSinEmail);
                }
            }

            // Cliente nuevo
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

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCliente(Guid id)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null) return NotFound();
            cliente.Activo = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}