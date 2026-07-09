import { createContext, useContext, useState, ReactNode } from 'react'

export type Idioma = 'es' | 'pt'

export const TEXTOS = {
    es: {
        // Header
        buscarPlaceholder: 'Buscar productos...',
        todos: 'Todos',
        verTodas: 'Ver todas',

        // Home
        todosLosProductos: 'Todos los productos',
        resultadosPara: 'Resultados para',
        ordenarPor: 'Ordenar por',
        nombre: 'Nombre',
        precioMenorMayor: 'Precio: menor a mayor',
        precioMayorMenor: 'Precio: mayor a menor',
        noSeEncontraronProductos: 'No se encontraron productos.',
        agregar: 'Agregar',
        sinStock: 'Sin stock',
        pagina: 'Pagina',
        de: 'de',

        // Carrusel
        ofertaEspecial: 'Oferta especial',
        agregarAlCarrito: 'Agregar al carrito',
        verDetalle: 'Ver detalle',
        promociones: 'Promociones',

        // Detalle Producto
        volverAlCatalogo: 'Volver al catalogo',
        enStock: 'En stock',
        disponibles: 'disponibles',
        sinStockDisponible: 'Sin stock disponible',
        cantidad: 'Cantidad:',
        productoNoDisponible: 'Este producto no esta disponible.',

        // Carrito
        miCarrito: 'Mi carrito',
        carritoVacio: 'Tu carrito esta vacio.',
        irAlCatalogo: 'Ir al catalogo',
        resumenDelPedido: 'Resumen del pedido',
        productos: 'Productos',
        total: 'Total',
        continuarCompra: 'Continuar compra',
        pagoTransferencia: 'El pago se coordina por transferencia al confirmar tu pedido.',

        // Checkout
        finalizarPedido: 'Finalizar pedido',
        volverAlCarrito: 'Volver al carrito',
        datosDeEntrega: 'Datos de entrega',
        direccionDeEntrega: 'Direccion de entrega',
        direccionPlaceholder: 'Calle, numero, barrio, ciudad',
        telefonoDeContacto: 'Telefono de contacto',
        transportadora: 'Transportadora',
        metodoDePago: 'Metodo de pago',
        transferenciaBancaria: 'Transferencia bancaria',
        transferenciaSubtexto: 'Te enviaremos los datos de la cuenta al confirmar',
        avisoTransferencia: 'El pago se coordina directamente con vos despues de confirmar el pedido. No se realiza ningun cobro online.',
        notasAdicionales: 'Notas adicionales (opcional)',
        notasPlaceholder: 'Indicaciones para la entrega, horarios, etc.',
        resumen: 'Resumen',
        confirmarPedido: 'Confirmar pedido',
        procesando: 'Procesando...',
        pagoTransferenciaResumen: 'Pago por transferencia bancaria',

        // Login
        iniciarSesion: 'Iniciar sesion',
        ingresaATuCuenta: 'Ingresa a tu cuenta para continuar tu compra',
        correoElectronico: 'Correo electronico',
        correoPH: 'tu@email.com',
        contrasena: 'Contrasena',
        ingresando: 'Ingresando...',
        noTenesCuenta: '¿No tenes cuenta?',
        registrate: 'Registrate',

        // Registro
        crearCuenta: 'Crear cuenta',
        registratePH: 'Registrate para hacer pedidos y ver tu historial',
        nombreCompleto: 'Nombre completo',
        tuNombre: 'Tu nombre',
        telefono: 'Telefono',
        telefonoPH: '0981 234 567',
        telefonoOpcional: 'Telefono (opcional)',
        minimoCaracteres: 'Minimo 6 caracteres',
        confirmarContrasena: 'Confirmar contrasena',
        repetirContrasena: 'Repeti tu contrasena',
        creandoCuenta: 'Creando cuenta...',
        yaTenesCuenta: '¿Ya tenes cuenta?',
        iniciaSesion: 'Inicia sesion',

        // Mis Pedidos
        misPedidos: 'Mis pedidos',
        sinPedidos: 'Todavia no realizaste ningun pedido.',
        verMisPedidos: 'Ver mis pedidos',

        // Detalle Pedido
        volverAMisPedidos: 'Volver a mis pedidos',
        motivoCancelacion: 'Motivo de cancelacion:',
        metodoDePagoLabel: 'Metodo de pago',
        notas: 'Notas',
        transferencia: 'Transferencia',

        // Estados
        pendiente: 'Pendiente',
        confirmado: 'Confirmado',
        entregado: 'Entregado',
        cancelado: 'Cancelado',
        pendienteConfirmacion: 'Pendiente de confirmacion',

        // Perfil
        miPerfil: 'Mi perfil',
        datosPersonales: 'Datos personales',
        direccionHabitual: 'Direccion habitual',
        guardarCambios: 'Guardar cambios',
        guardando: 'Guardando...',
        cerrarSesion: 'Cerrar sesion',

        // Footer
        accesorios: 'Accesorios y Luces Automotrices',
        derechos: '© 2026 MagCar Auto Shop. Todos los derechos reservados.',

        // Transportadoras
        otros: 'Otros',
        nombreTransportadora: 'Nombre de la transportadora...',
    },

    pt: {
        // Header
        buscarPlaceholder: 'Buscar produtos...',
        todos: 'Todos',
        verTodas: 'Ver todas',

        // Home
        todosLosProductos: 'Todos os produtos',
        resultadosPara: 'Resultados para',
        ordenarPor: 'Ordenar por',
        nombre: 'Nome',
        precioMenorMayor: 'Preco: menor para maior',
        precioMayorMenor: 'Preco: maior para menor',
        noSeEncontraronProductos: 'Nenhum produto encontrado.',
        agregar: 'Adicionar',
        sinStock: 'Sem estoque',
        pagina: 'Pagina',
        de: 'de',

        // Carrusel
        ofertaEspecial: 'Oferta especial',
        agregarAlCarrito: 'Adicionar ao carrinho',
        verDetalle: 'Ver detalhes',
        promociones: 'Promocoes',

        // Detalle Producto
        volverAlCatalogo: 'Voltar ao catalogo',
        enStock: 'Em estoque',
        disponibles: 'disponiveis',
        sinStockDisponible: 'Sem estoque disponivel',
        cantidad: 'Quantidade:',
        productoNoDisponible: 'Este produto nao esta disponivel.',

        // Carrito
        miCarrito: 'Meu carrinho',
        carritoVacio: 'Seu carrinho esta vazio.',
        irAlCatalogo: 'Ir ao catalogo',
        resumenDelPedido: 'Resumo do pedido',
        productos: 'Produtos',
        total: 'Total',
        continuarCompra: 'Continuar compra',
        pagoTransferencia: 'O pagamento e coordenado por transferencia ao confirmar seu pedido.',

        // Checkout
        finalizarPedido: 'Finalizar pedido',
        volverAlCarrito: 'Voltar ao carrinho',
        datosDeEntrega: 'Dados de entrega',
        direccionDeEntrega: 'Endereco de entrega',
        direccionPlaceholder: 'Rua, numero, bairro, cidade',
        telefonoDeContacto: 'Telefone de contato',
        transportadora: 'Transportadora',
        metodoDePago: 'Metodo de pagamento',
        transferenciaBancaria: 'Transferencia bancaria',
        transferenciaSubtexto: 'Enviaremos os dados da conta ao confirmar',
        avisoTransferencia: 'O pagamento e coordenado diretamente com voce apos confirmar o pedido. Nenhuma cobranca online e realizada.',
        notasAdicionales: 'Observacoes adicionais (opcional)',
        notasPlaceholder: 'Instrucoes para entrega, horarios, etc.',
        resumen: 'Resumo',
        confirmarPedido: 'Confirmar pedido',
        procesando: 'Processando...',
        pagoTransferenciaResumen: 'Pagamento por transferencia bancaria',

        // Login
        iniciarSesion: 'Entrar',
        ingresaATuCuenta: 'Entre na sua conta para continuar sua compra',
        correoElectronico: 'Email',
        correoPH: 'seu@email.com',
        contrasena: 'Senha',
        ingresando: 'Entrando...',
        noTenesCuenta: 'Nao tem conta?',
        registrate: 'Cadastre-se',

        // Registro
        crearCuenta: 'Criar conta',
        registratePH: 'Cadastre-se para fazer pedidos e ver seu historico',
        nombreCompleto: 'Nome completo',
        tuNombre: 'Seu nome',
        telefono: 'Telefone',
        telefonoPH: '(00) 00000-0000',
        telefonoOpcional: 'Telefone (opcional)',
        minimoCaracteres: 'Minimo 6 caracteres',
        confirmarContrasena: 'Confirmar senha',
        repetirContrasena: 'Repita sua senha',
        creandoCuenta: 'Criando conta...',
        yaTenesCuenta: 'Ja tem conta?',
        iniciaSesion: 'Entre',

        // Mis Pedidos
        misPedidos: 'Meus pedidos',
        sinPedidos: 'Voce ainda nao fez nenhum pedido.',
        verMisPedidos: 'Ver meus pedidos',

        // Detalle Pedido
        volverAMisPedidos: 'Voltar aos meus pedidos',
        motivoCancelacion: 'Motivo do cancelamento:',
        metodoDePagoLabel: 'Metodo de pagamento',
        notas: 'Observacoes',
        transferencia: 'Transferencia',

        // Estados
        pendiente: 'Pendente',
        confirmado: 'Confirmado',
        entregado: 'Entregue',
        cancelado: 'Cancelado',
        pendienteConfirmacion: 'Aguardando confirmacao',

        // Perfil
        miPerfil: 'Meu perfil',
        datosPersonales: 'Dados pessoais',
        direccionHabitual: 'Endereco habitual',
        guardarCambios: 'Salvar alteracoes',
        guardando: 'Salvando...',
        cerrarSesion: 'Sair',

        // Footer
        accesorios: 'Acessorios e Luzes Automotivas',
        derechos: '© 2026 MagCar Auto Shop. Todos os direitos reservados.',

        // Transportadoras
        otros: 'Outros',
        nombreTransportadora: 'Nome da transportadora...',
    }
}

interface IdiomaContextType {
    idioma: Idioma
    t: typeof TEXTOS.es
    cambiarIdioma: (i: Idioma) => void
}

const IdiomaContext = createContext<IdiomaContextType | undefined>(undefined)

const STORAGE_KEY = 'tienda_idioma'

export function IdiomaProvider({ children }: { children: ReactNode }) {
    const [idioma, setIdioma] = useState<Idioma>(() => {
        const guardado = localStorage.getItem(STORAGE_KEY)
        return (guardado === 'pt' ? 'pt' : 'es') as Idioma
    })

    const cambiarIdioma = (i: Idioma) => {
        setIdioma(i)
        localStorage.setItem(STORAGE_KEY, i)
    }

    return (
        <IdiomaContext.Provider value={{ idioma, t: TEXTOS[idioma], cambiarIdioma }}>
            {children}
        </IdiomaContext.Provider>
    )
}

export function useIdioma() {
    const ctx = useContext(IdiomaContext)
    if (!ctx) throw new Error('useIdioma debe usarse dentro de IdiomaProvider')
    return ctx
}