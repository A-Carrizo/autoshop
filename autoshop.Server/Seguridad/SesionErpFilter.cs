using autoshop.Server.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace autoshop.Server.Seguridad
{
    // Filtro global: exige un token vigente de un usuario del ERP en toda la API,
    // salvo lo marcado con [AccesoPublico].
    public class SesionErpFilter : IAsyncAuthorizationFilter
    {
        private const string Prefijo = "Bearer ";
        private readonly AppDbContext _db;

        public SesionErpFilter(AppDbContext db) => _db = db;

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            if (context.ActionDescriptor.EndpointMetadata.OfType<AccesoPublicoAttribute>().Any())
                return;

            var auth = context.HttpContext.Request.Headers.Authorization.ToString();
            var token = auth.StartsWith(Prefijo) ? auth[Prefijo.Length..].Trim() : string.Empty;

            var sesionValida = token.Length > 0 && await _db.Usuarios.AnyAsync(u =>
                u.Token == token && u.TokenExpira > DateTime.UtcNow && u.Activo);

            if (!sesionValida)
                context.Result = new UnauthorizedObjectResult(new { mensaje = "Sesion invalida o expirada." });
        }
    }
}
