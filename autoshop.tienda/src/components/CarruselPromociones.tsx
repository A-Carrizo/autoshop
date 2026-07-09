import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'
import { useIdioma } from '../context/IdiomaContext'
import { API } from '../config/api'
import toast from 'react-hot-toast'

interface ProductoPromo {
    id: string
    nombre: string
    descripcion: string | null
    precioVenta: number
    precioOriginal: number
    descuentoPct: number
    imagenUrl: string | null
    enStock: boolean
    stockActual: number
}

const ACCENT = '#CC0000'

export default function CarruselPromociones() {
    const { agregarItem } = useCarrito()
    const { t } = useIdioma()
    const [productos, setProductos] = useState<ProductoPromo[]>([])
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
                    const data = await res.json()
                    const conDescuento = (data.datos as ProductoPromo[]).filter(p => p.descuentoPct > 0 && p.enStock).slice(0, 5)
                    if (!cancelado) setProductos(conDescuento)
                    return
                } catch {
                    if (cancelado) return
                    if (intento < MAX_INTENTOS) await esperar(1000)
                }
            }
        }
        cargar()
        return () => { cancelado = true }
    }, [])

    const reiniciarIntervalo = () => {
        if (intervaloRef.current) clearInterval(intervaloRef.current)
        intervaloRef.current = setInterval(() => setActivo(a => (a + 1) % productos.length), 4500)
    }

    useEffect(() => {
        if (productos.length <= 1) return
        intervaloRef.current = setInterval(() => setActivo(a => (a + 1) % productos.length), 4500)
        return () => { if (intervaloRef.current) clearInterval(intervaloRef.current) }
    }, [productos.length])

    const irA = (idx: number) => { setActivo(idx); reiniciarIntervalo() }
    const anterior = () => { setActivo(a => (a - 1 + productos.length) % productos.length); reiniciarIntervalo() }
    const siguiente = () => { setActivo(a => (a + 1) % productos.length); reiniciarIntervalo() }

    const handleAgregar = (p: ProductoPromo) => {
        agregarItem({ productoId: p.id, nombre: p.nombre, precioUnitario: p.precioVenta, imagenUrl: p.imagenUrl, stockDisponible: p.stockActual })
        toast.success(`${p.nombre} - ${t.agregarAlCarrito}`)
    }

    const fmt = (n: number) => n.toLocaleString('es-PY')
    if (productos.length === 0) return null
    const p = productos[activo]

    const btnFlecha: React.CSSProperties = {
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        zIndex: 4, width: '40px', height: '40px', borderRadius: '50%',
        background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
        color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', transition: 'background 0.2s',
    }

    return (
        <div style={{ marginBottom: '32px', marginLeft: '-32px', marginRight: '-32px' }}>
            <div style={{ position: 'relative', height: '280px', overflow: 'hidden', background: '#1a1a1a', borderRadius: '16px', margin: '0 32px' }}>
                {p.imagenUrl ? (
                    <img key={p.id} src={`${API.imagenesBase}${p.imagenUrl}`} alt={p.nombre}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55, transition: 'opacity 0.5s ease' }} />
                ) : (
                    <div style={{ position: 'absolute', inset: 0, background: '#111' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.2) 100%)' }} />
                {productos.length > 1 && (
                    <button onClick={anterior} style={{ ...btnFlecha, left: '16px' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(204,0,0,0.7)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.5)')}>
                        <i className="fas fa-chevron-left"></i>
                    </button>
                )}
                {productos.length > 1 && (
                    <button onClick={siguiente} style={{ ...btnFlecha, right: '16px' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(204,0,0,0.7)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.5)')}>
                        <i className="fas fa-chevron-right"></i>
                    </button>
                )}
                <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 72px 0 48px', maxWidth: '600px' }}>
                    <span style={{ background: ACCENT, color: '#fff', fontSize: '12px', fontWeight: 800, padding: '4px 14px', borderRadius: '20px', display: 'inline-block', marginBottom: '12px', width: 'fit-content', letterSpacing: '0.5px' }}>
                        -{p.descuentoPct}% OFF
                    </span>
                    <h3 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, margin: '0 0 8px', lineHeight: 1.25 }}>{p.nombre}</h3>
                    {p.descripcion && (
                        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', margin: '0 0 14px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {p.descripcion}
                        </p>
                    )}
                    <div style={{ marginBottom: '20px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', textDecoration: 'line-through', marginRight: '10px' }}>Gs. {fmt(p.precioOriginal)}</span>
                        <span style={{ color: ACCENT, fontSize: '28px', fontWeight: 800 }}>Gs. {fmt(p.precioVenta)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleAgregar(p)} style={{ background: ACCENT, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            <i className="fas fa-cart-plus" style={{ marginRight: '7px' }}></i>{t.agregarAlCarrito}
                        </button>
                        <Link to={`/producto/${p.id}`} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', textDecoration: 'none', display: 'inline-block' }}>
                            {t.verDetalle}
                        </Link>
                    </div>
                </div>
                {productos.length > 1 && (
                    <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 3, display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {productos.map((_, idx) => (
                            <button key={idx} onClick={() => irA(idx)} style={{ width: idx === activo ? '24px' : '8px', height: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer', padding: 0, background: idx === activo ? ACCENT : 'rgba(255,255,255,0.4)', transition: 'all 0.3s ease' }} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}