import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useCarrito } from '../context/CarritoContext'
import { useIdioma } from '../context/IdiomaContext'
import { API } from '../config/api'

interface ProductoDetalle {
    id: string; nombre: string; descripcion: string | null; precioVenta: number
    precioOriginal: number; descuentoPct: number; imagenUrl: string | null
    categoriaId: string; categoriaNombre: string; enStock: boolean; stockActual: number
}

const COL = { primary: '#CC0000', primaryDark: '#880000', muted: '#718096', border: '#e0e0e0' }

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
                if (!cancelado) { setProducto(data); setCantidad(1) }
            } catch { if (!cancelado) toast.error('No se pudo cargar el producto') }
            finally { if (!cancelado) setCargando(false) }
        }
        cargar()
        return () => { cancelado = true }
    }, [id])

    const fmt = (n: number) => n.toLocaleString('es-PY')

    const handleAgregar = () => {
        if (!producto || !producto.enStock) return
        agregarItem({ productoId: producto.id, nombre: producto.nombre, precioUnitario: producto.precioVenta, imagenUrl: producto.imagenUrl, stockDisponible: producto.stockActual }, cantidad)
        toast.success(`${producto.nombre} - ${t.agregarAlCarrito}`)
    }

    if (cargando) return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
            <Header /><div style={{ flex: 1, textAlign: 'center', padding: '80px 0', color: COL.muted }}><i className="fas fa-spinner fa-spin" style={{ fontSize: '28px', color: COL.primary }}></i></div><Footer />
        </div>
    )

    if (notFound || !producto) return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
            <Header />
            <div style={{ flex: 1, textAlign: 'center', padding: '80px 20px', color: COL.muted }}>
                <i className="fas fa-box-open" style={{ fontSize: '40px', marginBottom: '16px', display: 'block' }}></i>
                <p style={{ fontSize: '15px', marginBottom: '20px' }}>{t.productoNoDisponible}</p>
                <Link to="/" style={{ color: COL.primary, fontWeight: 600, textDecoration: 'none' }}><i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i>{t.volverAlCatalogo}</Link>
            </div>
            <Footer />
        </div>
    )

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
            <Header />
            <main style={{ flex: 1, maxWidth: '1440px', margin: '0 auto', padding: '28px 32px', width: '100%' }}>
                <Link to="/" style={{ color: COL.muted, fontSize: '13px', textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
                    <i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i>{t.volverAlCatalogo}
                </Link>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', background: '#fff', borderRadius: '16px', padding: '32px', border: `1px solid ${COL.border}` }}>
                    <div style={{ position: 'relative', background: '#f5f5f5', borderRadius: '12px', minHeight: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {producto.imagenUrl ? (
                            <img src={`${API.imagenesBase}${producto.imagenUrl}`} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <i className="fas fa-image" style={{ fontSize: '60px', color: '#cbd5e0' }}></i>
                        )}
                        {producto.descuentoPct > 0 && (
                            <span style={{ position: 'absolute', top: '16px', left: '16px', background: COL.primary, color: '#fff', fontSize: '13px', fontWeight: 700, padding: '5px 12px', borderRadius: '8px' }}>-{producto.descuentoPct}% OFF</span>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: COL.primary, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{producto.categoriaNombre}</span>
                        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a202c', margin: '0 0 16px', lineHeight: 1.3 }}>{producto.nombre}</h1>
                        <div style={{ marginBottom: '20px' }}>
                            {producto.descuentoPct > 0 && <div style={{ color: '#a0aec0', fontSize: '15px', textDecoration: 'line-through' }}>Gs. {fmt(producto.precioOriginal)}</div>}
                            <div style={{ color: COL.primary, fontSize: '32px', fontWeight: 800 }}>Gs. {fmt(producto.precioVenta)}</div>
                        </div>
                        {producto.descripcion && <p style={{ color: '#718096', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>{producto.descripcion}</p>}
                        <div style={{ marginBottom: '8px' }}>
                            {producto.enStock ? (
                                <span style={{ color: '#2f855a', fontSize: '13px', fontWeight: 600 }}><i className="fas fa-check-circle" style={{ marginRight: '6px' }}></i>{t.enStock} ({producto.stockActual} {t.disponibles})</span>
                            ) : (
                                <span style={{ color: '#a0aec0', fontSize: '13px', fontWeight: 600 }}><i className="fas fa-times-circle" style={{ marginRight: '6px' }}></i>{t.sinStockDisponible}</span>
                            )}
                        </div>
                        <div style={{ flex: 1 }}></div>
                        {producto.enStock && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <span style={{ fontSize: '13px', color: '#2d3748', fontWeight: 600 }}>{t.cantidad}</span>
                                <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${COL.border}`, borderRadius: '8px' }}>
                                    <button onClick={() => setCantidad(c => Math.max(1, c - 1))} style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#2d3748' }}><i className="fas fa-minus"></i></button>
                                    <span style={{ width: '40px', textAlign: 'center', fontSize: '14px', fontWeight: 600 }}>{cantidad}</span>
                                    <button onClick={() => setCantidad(c => Math.min(producto.stockActual, c + 1))} style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#2d3748' }}><i className="fas fa-plus"></i></button>
                                </div>
                            </div>
                        )}
                        <button onClick={handleAgregar} disabled={!producto.enStock}
                            style={{ width: '100%', padding: '14px 0', borderRadius: '10px', border: 'none', background: producto.enStock ? COL.primary : '#cbd5e0', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: producto.enStock ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                            <i className="fas fa-cart-plus" style={{ marginRight: '8px' }}></i>
                            {producto.enStock ? t.agregarAlCarrito : t.sinStock}
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}