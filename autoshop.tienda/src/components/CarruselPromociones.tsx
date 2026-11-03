import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'
import { useIdioma } from '../context/IdiomaContext'
import { API } from '../config/api'
import toast from 'react-hot-toast'
import type { PaginaCatalogo, ProductoResumen } from '../types/catalogo'

// Hero de la portada: rota los productos con descuento a todo el ancho.
// Si no hay promociones muestra un banner fijo de la tienda.
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
                    const res = await fetch(`${API.catalogo}?pagina=1&tamano=50`)
                    if (!res.ok) throw new Error('error')
                    const data: PaginaCatalogo = await res.json()
                    const conDescuento = data.datos.filter(p => p.descuentoPct > 0 && p.enStock).slice(0, 5)
                    if (!cancelado) setProductos(conDescuento)
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

    const cantidad = productos?.length ?? 0

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

    // Sin promociones: banner de la tienda
    if (productos.length === 0) return (
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

    const p = productos[activo]

    return (
        <section className="mc-hero" aria-roledescription="carousel" aria-label={t.promociones}>
            {p.imagenUrl && (
                // Fondo difuminado: llena todo el ancho sin importar el formato de la foto
                <img key={`${p.id}-fondo`} className="mc-hero__fondo" src={`${API.imagenesBase}${p.imagenUrl}`} alt="" />
            )}
            <div className="mc-hero__degradado" />

            <div className="mc-container mc-hero__contenido" key={p.id}>
                <div className="mc-hero__textos">
                    <span className="mc-hero__etiqueta mc-hero__etiqueta--roja">-{p.descuentoPct}% OFF</span>
                    <h2 className="mc-hero__titulo">{p.nombre}</h2>
                    {p.descripcion && <p className="mc-hero__descripcion">{p.descripcion}</p>}
                    <div className="mc-hero__precios">
                        <span className="mc-hero__precio-viejo">Gs. {fmt(p.precioOriginal)}</span>
                        <span className="mc-hero__precio">Gs. {fmt(p.precioVenta)}</span>
                    </div>
                    <div className="mc-hero__botones">
                        <button type="button" className="mc-btn mc-btn--primario" onClick={() => handleAgregar(p)}>
                            <i className="fas fa-cart-plus"></i>{t.agregarAlCarrito}
                        </button>
                        <Link to={`/producto/${p.id}`} className="mc-btn mc-hero__btn-secundario">{t.verDetalle}</Link>
                    </div>
                </div>

                {/* Tarjeta blanca con la imagen completa, para que el fondo blanco de la foto no quede como un parche */}
                {p.imagenUrl && (
                    <Link to={`/producto/${p.id}`} className="mc-hero__imagen" tabIndex={-1} aria-hidden="true">
                        <img src={`${API.imagenesBase}${p.imagenUrl}`} alt="" />
                    </Link>
                )}
            </div>

            {productos.length > 1 && (
                <>
                    <button type="button" className="mc-hero__flecha mc-hero__flecha--izq" onClick={anterior} aria-label={t.anterior}>
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <button type="button" className="mc-hero__flecha mc-hero__flecha--der" onClick={siguiente} aria-label={t.siguiente}>
                        <i className="fas fa-chevron-right"></i>
                    </button>
                    <div className="mc-hero__puntos">
                        {productos.map((_, idx) => (
                            <button key={idx} type="button" onClick={() => irA(idx)}
                                aria-label={`${idx + 1} / ${productos.length}`} aria-current={idx === activo} />
                        ))}
                    </div>
                </>
            )}
        </section>
    )
}
