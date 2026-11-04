import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'
import { useIdioma } from '../context/IdiomaContext'
import { API } from '../config/api'
import { TIENDA } from '../config/tienda'
import type { BannerHero } from '../config/tienda'
import toast from 'react-hot-toast'
import { pedirCatalogoCompleto } from '../hooks/useCatalogoCompleto'
import type { ProductoResumen } from '../types/catalogo'

type Diapositiva =
    | { tipo: 'banner'; banner: BannerHero }
    | { tipo: 'producto'; producto: ProductoResumen }

const MAX_PRODUCTOS = 5

function mezclar<T>(lista: T[]): T[] {
    const copia = [...lista]
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copia[i], copia[j]] = [copia[j], copia[i]]
    }
    return copia
}

// Primero las ofertas; el resto se completa con un producto por categoria, para que haya variedad
function elegirProductos(lista: ProductoResumen[]): ProductoResumen[] {
    const disponibles = lista.filter(p => p.imagenUrl && p.enStock)
    const ofertas = disponibles.filter(p => p.descuentoPct > 0)
    const categoriasUsadas = new Set<string>()
    const variados = mezclar(disponibles.filter(p => p.descuentoPct === 0)).filter(p => {
        const categoria = p.categorias[0]?.id ?? p.id
        if (categoriasUsadas.has(categoria)) return false
        categoriasUsadas.add(categoria)
        return true
    })
    return [...ofertas, ...variados].slice(0, MAX_PRODUCTOS)
}

// Intercala las fotos de la tienda con los productos: foto, producto, foto, producto...
function armarDiapositivas(banners: BannerHero[], productos: ProductoResumen[]): Diapositiva[] {
    const diapositivas: Diapositiva[] = []
    for (let i = 0; i < Math.max(banners.length, productos.length); i++) {
        if (banners[i]) diapositivas.push({ tipo: 'banner', banner: banners[i] })
        if (productos[i]) diapositivas.push({ tipo: 'producto', producto: productos[i] })
    }
    return diapositivas
}

// Hero de la portada: rota fotos de la tienda y productos destacados a todo el ancho.
// Si no hay ninguno de los dos muestra un banner fijo.
export default function CarruselPromociones() {
    const { agregarItem } = useCarrito()
    const { t } = useIdioma()
    const [productos, setProductos] = useState<ProductoResumen[] | null>(null)
    const [activo, setActivo] = useState(0)
    const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        let cancelado = false
        const esperar = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
        const cargar = async () => {
            const MAX_INTENTOS = 4
            for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
                try {
                    const datos = await pedirCatalogoCompleto()
                    if (!cancelado) setProductos(elegirProductos(datos))
                    return
                } catch {
                    if (cancelado) return
                    if (intento < MAX_INTENTOS) await esperar(1000)
                }
            }
            if (!cancelado) setProductos([])
        }
        cargar()
        return () => { cancelado = true }
    }, [])

    const diapositivas = productos === null ? [] : armarDiapositivas(TIENDA.bannersHero, productos)
    const cantidad = diapositivas.length

    const reiniciarIntervalo = () => {
        if (intervaloRef.current) clearInterval(intervaloRef.current)
        intervaloRef.current = setInterval(() => setActivo(a => (a + 1) % cantidad), 5500)
    }

    useEffect(() => {
        if (cantidad <= 1) return
        intervaloRef.current = setInterval(() => setActivo(a => (a + 1) % cantidad), 5500)
        return () => { if (intervaloRef.current) clearInterval(intervaloRef.current) }
    }, [cantidad])

    const irA = (idx: number) => { setActivo(idx); reiniciarIntervalo() }
    const anterior = () => { setActivo(a => (a - 1 + cantidad) % cantidad); reiniciarIntervalo() }
    const siguiente = () => { setActivo(a => (a + 1) % cantidad); reiniciarIntervalo() }

    const handleAgregar = (p: ProductoResumen) => {
        agregarItem({ productoId: p.id, nombre: p.nombre, precioUnitario: p.precioVenta, imagenUrl: p.imagenUrl, stockDisponible: p.stockActual })
        toast.success(`${p.nombre} - ${t.agregarAlCarrito}`)
    }

    const fmt = (n: number) => n.toLocaleString('es-PY')

    // Mientras carga se reserva el alto para que la pagina no salte
    if (productos === null) return <section className="mc-hero mc-hero--cargando" aria-hidden="true" />

    // Sin fotos ni productos: banner fijo de la tienda
    if (cantidad === 0) return (
        <section className="mc-hero">
            <div className="mc-hero__degradado" />
            <div className="mc-container mc-hero__contenido">
                <div className="mc-hero__textos">
                    <span className="mc-hero__etiqueta">{t.accesorios}</span>
                    <h1 className="mc-hero__titulo">{t.heroTitulo}</h1>
                    <div className="mc-hero__botones">
                        <Link to="/catalogo" className="mc-btn mc-btn--primario">
                            {t.verCatalogo}<i className="fas fa-arrow-right"></i>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )

    const diapositiva = diapositivas[activo]

    return (
        <section className="mc-hero" aria-roledescription="carousel" aria-label={t.promociones}>
            {diapositiva.tipo === 'banner' ? (
                <>
                    <img key={diapositiva.banner.imagen} className="mc-hero__foto" src={diapositiva.banner.imagen} alt="" />
                    <div className="mc-hero__degradado" />
                    <div className="mc-container mc-hero__contenido mc-hero__contenido--foto" key={`contenido-${diapositiva.banner.imagen}`}>
                        <div className="mc-hero__textos">
                            <h2 className="mc-hero__titulo">{diapositiva.banner.titulo}</h2>
                            {diapositiva.banner.subtitulo && <p className="mc-hero__descripcion">{diapositiva.banner.subtitulo}</p>}
                            <div className="mc-hero__botones">
                                <Link to={diapositiva.banner.link ?? '/catalogo'} className="mc-btn mc-btn--primario">
                                    {diapositiva.banner.textoBoton ?? t.verCatalogo}<i className="fas fa-arrow-right"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <DiapositivaProducto p={diapositiva.producto} fmt={fmt} onAgregar={handleAgregar} />
            )}

            {cantidad > 1 && (
                <>
                    <button type="button" className="mc-hero__flecha mc-hero__flecha--izq" onClick={anterior} aria-label={t.anterior}>
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <button type="button" className="mc-hero__flecha mc-hero__flecha--der" onClick={siguiente} aria-label={t.siguiente}>
                        <i className="fas fa-chevron-right"></i>
                    </button>
                    <div className="mc-hero__puntos">
                        {diapositivas.map((_, idx) => (
                            <button key={idx} type="button" onClick={() => irA(idx)}
                                aria-label={`${idx + 1} / ${cantidad}`} aria-current={idx === activo} />
                        ))}
                    </div>
                </>
            )}
        </section>
    )
}

interface PropsProducto {
    p: ProductoResumen
    fmt: (n: number) => string
    onAgregar: (p: ProductoResumen) => void
}

function DiapositivaProducto({ p, fmt, onAgregar }: PropsProducto) {
    const { t } = useIdioma()
    const imagen = `${API.imagenesBase}${p.imagenUrl}`

    return (
        <>
            {/* Fondo difuminado: llena todo el ancho sin importar el formato de la foto */}
            <img key={`${p.id}-fondo`} className="mc-hero__fondo" src={imagen} alt="" />
            <div className="mc-hero__degradado" />

            <div className="mc-container mc-hero__contenido" key={p.id}>
                <div className="mc-hero__textos">
                    {p.descuentoPct > 0
                        ? <span className="mc-hero__etiqueta mc-hero__etiqueta--roja">-{p.descuentoPct}% OFF</span>
                        : p.categorias.length > 0 && <span className="mc-hero__etiqueta">{p.categorias[0].nombre}</span>}
                    <h2 className="mc-hero__titulo">{p.nombre}</h2>
                    {p.descripcion && <p className="mc-hero__descripcion">{p.descripcion}</p>}
                    <div className="mc-hero__precios">
                        {p.descuentoPct > 0 && <span className="mc-hero__precio-viejo">Gs. {fmt(p.precioOriginal)}</span>}
                        <span className="mc-hero__precio">Gs. {fmt(p.precioVenta)}</span>
                    </div>
                    <div className="mc-hero__botones">
                        <button type="button" className="mc-btn mc-btn--primario" onClick={() => onAgregar(p)}>
                            <i className="fas fa-cart-plus"></i>{t.agregarAlCarrito}
                        </button>
                        <Link to={`/producto/${p.id}`} className="mc-btn mc-hero__btn-secundario">{t.verDetalle}</Link>
                    </div>
                </div>

                {/* Tarjeta blanca con la imagen completa, para que el fondo blanco de la foto no quede como un parche */}
                <Link to={`/producto/${p.id}`} className="mc-hero__imagen" tabIndex={-1} aria-hidden="true">
                    <img src={imagen} alt="" />
                </Link>
            </div>
        </>
    )
}
