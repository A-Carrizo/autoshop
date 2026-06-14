using autoshop.Server.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Crear carpeta de imágenes si no existe
var imagenesPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "imagenes", "productos");
if (!Directory.Exists(imagenesPath))
    Directory.CreateDirectory(imagenesPath);

app.UseDefaultFiles();
app.UseStaticFiles();

// Servir imágenes subidas
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "imagenes")),
    RequestPath = "/imagenes"
});

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseCors("AllowAll");
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.MapFallbackToFile("/index.html");

app.Run();