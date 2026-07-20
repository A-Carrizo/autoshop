using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace autoshop.Server.Migrations
{
    /// <inheritdoc />
    public partial class AgregarFechaReactivacionAutoCliente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FechaReactivacionAuto",
                table: "Clientes",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FechaReactivacionAuto",
                table: "Clientes");
        }
    }
}
