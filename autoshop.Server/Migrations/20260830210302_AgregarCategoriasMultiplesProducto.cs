using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace autoshop.Server.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCategoriasMultiplesProducto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProductoCategoria",
                columns: table => new
                {
                    CategoriasId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductosId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductoCategoria", x => new { x.CategoriasId, x.ProductosId });
                    table.ForeignKey(
                        name: "FK_ProductoCategoria_Categorias_CategoriasId",
                        column: x => x.CategoriasId,
                        principalTable: "Categorias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductoCategoria_Productos_ProductosId",
                        column: x => x.ProductosId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductoCategoria_ProductosId",
                table: "ProductoCategoria",
                column: "ProductosId");

            // Preserva la categoria unica que tenia cada producto como su primera
            // entrada en la tabla intermedia, antes de borrar la columna original.
            migrationBuilder.Sql(
                "INSERT INTO \"ProductoCategoria\" (\"ProductosId\", \"CategoriasId\") " +
                "SELECT \"Id\", \"CategoriaId\" FROM \"Productos\" WHERE \"CategoriaId\" IS NOT NULL;");

            migrationBuilder.DropForeignKey(
                name: "FK_Productos_Categorias_CategoriaId",
                table: "Productos");

            migrationBuilder.DropIndex(
                name: "IX_Productos_CategoriaId",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "CategoriaId",
                table: "Productos");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Nullable a proposito: un producto con 0 o 2+ categorias no tiene un
            // mapeo 1:1 limpio de vuelta a una sola CategoriaId. Este rollback es
            // best-effort y pierde informacion si ya existen productos multi-categoria.
            migrationBuilder.AddColumn<Guid>(
                name: "CategoriaId",
                table: "Productos",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE ""Productos"" p
                SET ""CategoriaId"" = sub.""CategoriasId""
                FROM (
                    SELECT DISTINCT ON (""ProductosId"") ""ProductosId"", ""CategoriasId""
                    FROM ""ProductoCategoria""
                    ORDER BY ""ProductosId""
                ) sub
                WHERE p.""Id"" = sub.""ProductosId"";
            ");

            migrationBuilder.DropTable(
                name: "ProductoCategoria");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_CategoriaId",
                table: "Productos",
                column: "CategoriaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Productos_Categorias_CategoriaId",
                table: "Productos",
                column: "CategoriaId",
                principalTable: "Categorias",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
