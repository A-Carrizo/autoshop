namespace autoshop.Server.Seguridad
{
    // Marca un controlador o accion que no exige sesion del ERP.
    // Todo lo que no lleve este atributo queda protegido por SesionErpFilter.
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class AccesoPublicoAttribute : Attribute { }
}
