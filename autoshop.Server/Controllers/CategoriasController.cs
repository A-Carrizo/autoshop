using autoshop.Server.Data;
using autoshop.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace autoshop.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoriasController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/categorias?pagina=1&tamano=25&busqueda=
        [HttpGet]
        public async Task<IActionResult> GetCategorias(
            [FromQuery] int pagina = 1,
            [FromQuery] int tamano = 25,
            [FromQuery] string? busqueda = null)
        {
            var query = _context.Categorias
                .Where(c => c.Activo)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(busqueda))
                query = query.Where(c => c.Nombre.ToLower().Contains(busqueda.ToLower()));

            var total = await query.CountAsync();

            var datos = await query
                .OrderBy(c => c.Nombre)
                .Skip((pagina - 1) * tamano)
                .Take(tamano)
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

        // GET: api/categorias/todas (para dropdowns sin paginacion)
        [HttpGet("todas")]
        public async Task<ActionResult<IEnumerable<Categoria>>> GetTodasCategorias()
        {
            return await _context.Categorias
                .Where(c => c.Activo)
                .OrderBy(c => c.Nombre)
                .ToListAsync();
        }

        // GET: api/categorias/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Categoria>> GetCategoria(Guid id)
        {
            var categoria = await _context.Categorias.FindAsync(id);
            if (categoria == null) return NotFound();
            return categoria;
        }

        // POST: api/categorias
        [HttpPost]
        public async Task<ActionResult<Categoria>> PostCategoria(Categoria categoria)
        {
            categoria.Id = Guid.NewGuid();
            categoria.Activo = true;
            _context.Categorias.Add(categoria);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetCategoria), new { id = categoria.Id }, categoria);
        }

        // PUT: api/categorias/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCategoria(Guid id, Categoria categoria)
        {
            if (id != categoria.Id) return BadRequest();
            _context.Entry(categoria).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/categorias/5 (eliminacion real)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategoria(Guid id)
        {
            var categoria = await _context.Categorias.FindAsync(id);
            if (categoria == null) return NotFound();

            var tieneProductos = await _context.Productos
                .AnyAsync(p => p.CategoriaId == id && p.Activo);

            if (tieneProductos)
                return BadRequest(new { mensaje = "No se puede eliminar una categoría que tiene productos activos asociados." });

            _context.Categorias.Remove(categoria);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}