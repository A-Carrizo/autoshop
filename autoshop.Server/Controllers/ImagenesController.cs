using Microsoft.AspNetCore.Mvc;

namespace autoshop.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImagenesController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public ImagenesController(IWebHostEnvironment env)
        {
            _env = env;
        }

        // POST: api/imagenes/productos
        [HttpPost("productos")]
        public async Task<IActionResult> SubirImagen(IFormFile archivo)
        {
            if (archivo == null || archivo.Length == 0)
                return BadRequest(new { mensaje = "No se recibió ningún archivo." });

            var extensionesPermitidas = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(archivo.FileName).ToLower();

            if (!extensionesPermitidas.Contains(extension))
                return BadRequest(new { mensaje = "Solo se permiten imágenes JPG, PNG o WEBP." });

            if (archivo.Length > 5 * 1024 * 1024)
                return BadRequest(new { mensaje = "La imagen no puede superar los 5MB." });

            var carpeta = Path.Combine(
                _env.ContentRootPath, "wwwroot", "imagenes", "productos");

            if (!Directory.Exists(carpeta))
                Directory.CreateDirectory(carpeta);

            var nombreArchivo = $"{Guid.NewGuid()}{extension}";
            var rutaCompleta = Path.Combine(carpeta, nombreArchivo);

            using (var stream = new FileStream(rutaCompleta, FileMode.Create))
            {
                await archivo.CopyToAsync(stream);
            }

            var url = $"/imagenes/productos/{nombreArchivo}";
            return Ok(new { url, nombreArchivo });
        }

        // DELETE: api/imagenes/productos/{nombreArchivo}
        [HttpDelete("productos/{nombreArchivo}")]
        public IActionResult EliminarImagen(string nombreArchivo)
        {
            var carpeta = Path.Combine(
                _env.ContentRootPath, "wwwroot", "imagenes", "productos");
            var rutaCompleta = Path.Combine(carpeta, nombreArchivo);

            if (!System.IO.File.Exists(rutaCompleta))
                return NotFound(new { mensaje = "Imagen no encontrada." });

            System.IO.File.Delete(rutaCompleta);
            return NoContent();
        }
    }
}