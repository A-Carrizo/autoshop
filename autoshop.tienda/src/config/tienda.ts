// Foto de la tienda que se muestra en el carrusel de la portada
export interface BannerHero {
    // Ruta de la imagen dentro de la carpeta public, ej: '/banners/local.jpg'
    imagen: string
    titulo: string
    subtitulo?: string
    // A donde lleva el boton; por defecto al catalogo
    link?: string
    textoBoton?: string
}

// Datos de contacto y de pago que se muestran en el footer y en el checkout.
// Los campos vacios no se muestran; completar con los datos reales del negocio.
export const TIENDA = {
    // Solo numeros con codigo de pais, ej: '595981123456'
    whatsapp: '595992188164',
    // Alias para transferencias bancarias (se muestra en el checkout)
    aliasTransferencia: '0983846161',
    telefono: '',
    email: '',
    direccion: '',
    horario: '',
    instagram: '',  // URL completa del perfil
    facebook: '',   // URL completa de la pagina

    // Fotos del local para el carrusel de la portada, intercaladas con productos.
    // Copiar las imagenes en public/banners y agregarlas aca, por ejemplo:
    // { imagen: '/banners/local.jpg', titulo: 'Visita nuestro local', subtitulo: 'Te asesoramos' },
    bannersHero: [] as BannerHero[],
}
