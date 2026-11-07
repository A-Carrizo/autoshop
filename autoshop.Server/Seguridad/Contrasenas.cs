using Microsoft.AspNetCore.Identity;
using System.Security.Cryptography;
using System.Text;

namespace autoshop.Server.Seguridad
{
    // Cifrado de contrasenas de usuarios del ERP y clientes de la tienda.
    // Las claves viejas (SHA-256 con sal fija) se siguen aceptando y se reemplazan
    // por el formato nuevo la proxima vez que su titular inicia sesion.
    public static class Contrasenas
    {
        private const string SalAntigua = "magcar_salt_2026";
        private const int LargoHashAntiguo = 64;

        private static readonly PasswordHasher<object> Hasher = new();
        private static readonly object SinUsuario = new();

        public static string Hashear(string contrasena) => Hasher.HashPassword(SinUsuario, contrasena);

        public static bool EsAntigua(string? hash) =>
            hash?.Length == LargoHashAntiguo && hash.All(Uri.IsHexDigit);

        public static bool Verificar(string contrasena, string? hash)
        {
            if (string.IsNullOrEmpty(hash)) return false;

            if (EsAntigua(hash))
                return CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(HashAntiguo(contrasena)),
                    Encoding.UTF8.GetBytes(hash));

            try
            {
                return Hasher.VerifyHashedPassword(SinUsuario, hash, contrasena) != PasswordVerificationResult.Failed;
            }
            catch (FormatException)
            {
                return false;
            }
        }

        private static string HashAntiguo(string contrasena)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(contrasena + SalAntigua));
            return Convert.ToHexString(bytes).ToLower();
        }
    }
}
