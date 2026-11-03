import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useCarrito } from '../context/CarritoContext'
import { useIdioma } from '../context/IdiomaContext'
import { API } from '../config/api'
import GaleriaImagenes from '../components/GaleriaImagenes'
import CarruselProductos from '../components/producto/CarruselProductos'
import type { Categoria } from '../types/catalogo'

interface ProductoDetalle {
    id: string; nombre: string; descripcion: string | null; precioVenta: number
    precioOriginal: number; descuentoPct: number; imagenes: string[]
    categorias: Categoria[]; enStock: boolean; stockActual: number
}

const fmt = (n: number) => n.toLocaleString('es-PY')

export default function DetalleProducto() {
    const { id } = useParams<{ id: string }>()
    const { agregarItem } = useCarrito()
    const { t } = useIdioma()
    const [producto, setProducto] = useState<ProductoDetalle | null>(null)
    const [cargando, setCargando] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [cantidad, setCantidad] = useState(1)

    useEffect(() => {
        if (!id) return
        let cancelado = false
        const cargar = async () => {
            setCargando(true); setNotFound(false)
            try {
                const res = await fetch(`${API.catalogo}/${id}`)
                if (res.status === 404) { if (!cancelado) setNotFound(true); return }
                const data = await res.json()
                if (!cancelado) { setProducto(data); setCantidad(1); window.scrollTo(0, 0) }
            } catch { if (!cancelado) toast.error('No se pudo cargar el producto') }
            finally { if (!cancelado) setCargando(false) }
        }
        cargar()
        return () => { cancelado = true }
    }, [id])

    const handleAgregar = () => {
        if (!producto || !producto.enStock) return
        agregarItem({ productoId: producto.id, nombre: producto.nombre, precioUnitario: producto.precioVenta, imagenUrl: producto.imagenes[0] ?? null, stockDisponible: producto.stockActual }, cantidad)
        toast.success(`${producto.nombre} - ${t.agregarAlCarrito}`)
    }

    const pagina = (contenido: React.ReactNode) => (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--mc-fondo)' }}>
            <Header />
            <div className="mc-container mc-detalle" style={{ flex: 1 }}>{contenido}</div>
            <Footer />
        </div>
    )

    if (cargando) return pagina(
        <div className="mc-detalle__tarjeta" aria-hidden="true">
            <div className="mc-skeleton mc-galeria__principal"></div>
            <div className="mc-detalle__info">
                <div className="mc-skeleton" style={{ height: '12px', width: '30%' }}></div>
                <div className="mc-skeleton" style={{ height: '30px', width: '85%' }}></div>
                <div className="mc-skeleton" style={{ height: '36px', width: '45%' }}></div>
                <div className="mc-skeleton" style={{ height: '48px', marginTop: '20px' }}></div>
            </div>
        </div>
    )

    if (notFound || !producto) return pagina(
        <div className="mc-catalogo__vacio">
            <i className="fas fa-box-open"></i>
            <strong>{t.productoNoDisponible}</strong>
            <Link to="/catalogo" className="mc-btn mc-btn--primario">
                <i className="fas fa-arrow-left"></i>{t.volverAlCatalogo}
            </Link>
        </div>
    )

    const categoria = producto.categorias[0]

    return pagina(
        <>
            {/* Migas de pan */}
            <nav className="mc-migas" aria-label="breadcrumb">
                <Link to="/">{t.inicio}</Link>
                <i className="fas fa-chevron-right"></i>
                <Link to="/catalogo">{t.catalogo}</Link>
                {categoria && (
                    <>
                        <i className="fas fa-chevron-right"></i>
                        <Link to={`/catalogo?categoriaId=${categoria.id}`}>{categoria.nombre}</Link>
                    </>
                )}
                <i className="fas fa-chevron-right"></i>
                <span aria-current="page">{producto.nombre}</span>
            </nav>

            <div className="mc-detalle__tarjeta">
                <div className="mc-detalle__galeria">
                    <GaleriaImagenes imagenes={producto.imagenes} nombreProducto={producto.nombre} />
                    {producto.descuentoPct > 0 && <span className="mc-detalle__badge">-{producto.descuentoPct}% OFF</span>}
                </div>

                <div className="mc-detalle__info">
                    {producto.categorias.length > 0 && (
                        <div className="mc-detalle__categorias">
                            {producto.categorias.map(c => (
                                <Link key={c.id} to={`/catalogo?categoriaId=${c.id}`}>{c.nombre}</Link>
                            ))}
                        </div>
                    )}

                    <h1 className="mc-detalle__nombre">{producto.nombre}</h1>

                    <div className="mc-detalle__precios">
                        {producto.descuentoPct > 0 && <span className="mc-detalle__precio-viejo">Gs. {fmt(producto.precioOriginal)}</span>}
                        <span className="mc-detalle__precio">Gs. {fmt(producto.precioVenta)}</span>
                    </div>

                    {producto.enStock ? (
                        <span className="mc-detalle__stock">
                            <i className="fas fa-check-circle"></i>{t.enStock}
                        </span>
                    ) : (
                        <span className="mc-detalle__stock mc-detalle__stock--sin">
                            <i className="fas fa-times-circle"></i>{t.sinStockDisponible}
                        </span>
                    )}

                    <div className="mc-detalle__compra">
                        {producto.enStock && (
                            <div className="mc-cantidad" role="group" aria-label={t.cantidad}>
                                <button type="button" onClick={() => setCantidad(c => Math.max(1, c - 1))} disabled={cantidad <= 1} aria-label="-">
                                    <i className="fas fa-minus"></i>
                                </button>
                                <span>{cantidad}</span>
                                <button type="button" onClick={() => setCantidad(c => Math.min(producto.stockActual, c + 1))}
                                    disabled={cantidad >= producto.stockActual} aria-label="+">
                                    <i className="fas fa-plus"></i>
                                </button>
                            </div>
                        )}
                        <button type="button" className="mc-btn mc-btn--primario mc-detalle__agregar" onClick={handleAgregar} disabled={!producto.enStock}>
                            <i className="fas fa-cart-plus"></i>
                            {producto.enStock ? t.agregarAlCarrito : t.sinStock}
                        </button>
                    </div>

                    <p className="mc-detalle__aviso">
                        <i className="fas fa-university"></i>{t.pagoTransferencia}
                    </p>

                    {producto.descripcion && (
                        <div className="mc-detalle__descripcion">
                            <h2>{t.descripcion}</h2>
                            <p>{producto.descripcion}</p>
                        </div>
                    )}
                </div>
            </div>

            {categoria && (
                <div className="mc-detalle__relacionados">
                    <CarruselProductos titulo={t.relacionados} subtitulo={t.relacionadosSub}
                        filtros={{ categoriaId: categoria.id }} filtrar={p => p.id !== producto.id}
                        verTodo={`/catalogo?categoriaId=${categoria.id}`} />
                </div>
            )}
        </>
    )
}
