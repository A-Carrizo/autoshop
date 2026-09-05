using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace autoshop.Server.Migrations
{
    /// <inheritdoc />
    public partial class AgregarImagenesMultiplesProducto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProductoImagenes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Orden = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductoImagenes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductoImagenes_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductoImagenes_ProductoId",
                table: "ProductoImagenes",
                column: "ProductoId");

            // Preserva la imagen unica que tenia cada producto como su primera
            // entrada (Orden = 0) en la tabla de galeria, antes de borrar la columna original.
            migrationBuilder.Sql(
                "INSERT INTO \"ProductoImagenes\" (\"ProductoId\", \"Url\", \"Orden\") " +
                "SELECT \"Id\", \"ImagenUrl\", 0 FROM \"Productos\" " +
                "WHERE \"ImagenUrl\" IS NOT NULL AND \"ImagenUrl\" <> '';");

            migrationBuilder.DropColumn(
                name: "ImagenUrl",
                table: "Productos");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Best-effort: un producto con 0 o 2+ imagenes no tiene un mapeo 1:1
            // limpio de vuelta a una sola ImagenUrl. Se toma la de menor Orden (portada).
            migrationBuilder.AddColumn<string>(
                name: "ImagenUrl",
                table: "Productos",
                type: "text",
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE ""Productos"" p
                SET ""ImagenUrl"" = sub.""Url""
                FROM (
                    SELECT DISTINCT ON (""ProductoId"") ""ProductoId"", ""Url""
                    FROM ""ProductoImagenes""
                    ORDER BY ""ProductoId"", ""Orden"" ASC
                ) sub
                WHERE p.""Id"" = sub.""ProductoId"";
            ");

            migrationBuilder.DropTable(
                name: "ProductoImagenes");
        }
    }
}
