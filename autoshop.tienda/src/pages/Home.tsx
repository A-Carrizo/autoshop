import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useCarrito } from '../context/CarritoContext'
import { API } from '../config/api'

interface Producto {
    id: string
    nombre: string
    descripcion: string | null
    precioVenta: number
    precioOriginal: number
    descuentoPct: number
    imagenUrl: string | null
    categoriaId: string
    categoriaNombre: string
    enStock: boolean
    stockActual: number
}

const COL = {
    primary: '#2c5282',
    primaryDark: '#1a365d',
    accent: '#D4A017',
    muted: '#718096',
    border: '#e2e8f0',
}

export default function Home() {
    const [searchParams] = useSearchParams()
    const { agregarItem } = useCarrito()

    const [productos, setProductos] = useState<Producto[]>([])
    const [cargando, setCargando] = useState(true)
    const [pagina, setPagina] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(1)
    const [orden, setOrden] = useState('')

    const busqueda = searchParams.get('busqueda') || ''
    const categoriaId = searchParams.get('categoriaId') || ''

    // Referencia para saber si el cambio de pagina vino de los filtros o del usuario navegando
    const filtrosKey = `${busqueda}|${categoriaId}|${orden}`
    const filtrosKeyAnteriorRef = useRef(filtrosKey)

    useEffect(() => {
        // Si cambiaron los filtros respecto del render anterior, la pagina efectiva a pedir es 1
        const filtrosCambiaron = filtrosKeyAnteriorRef.current !== filtrosKey
        filtrosKeyAnteriorRef.current = filtrosKey
        const paginaAPedir = filtrosCambiaron ? 1 : pagina

        let cancelado = false

        const cargar = async () => {
            setCargando(true)
            try {
                const params = new URLSearchParams({ pagina: String(paginaAPedir), tamano: '24' })
                if (busqueda) params.set('busqueda', busqueda)
                if (categoriaId) params.set('categoriaId', categoriaId)
                if (orden) params.set('orden', orden)

                const res = await fetch(`${API.catalogo}?${params.toString()}`)
                const data = await res.json()
                if (cancelado) return
                setProductos(data.datos)
                setTotalPaginas(data.totalPaginas)
                if (filtrosCambiaron) setPagina(1)
            } catch {
                if (!cancelado) toast.error('No se pudieron cargar los productos')
            } finally {
                if (!cancelado) setCargando(false)
            }
        }
        cargar()

        return () => { cancelado = true }
    }, [busqueda, categoriaId, orden, pagina])

    const handleAgregar = (p: Producto) => {
        if (!p.enStock) return
        agregarItem({
            productoId: p.id,
            nombre: p.nombre,
            precioUnitario: p.precioVenta,
            imagenUrl: p.imagenUrl,
            stockDisponible: p.stockActual,
        })
        toast.success(`${p.nombre} agregado al carrito`)
    }

    const fmt = (n: number) => n.toLocaleString('es-PY')

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f3f7' }}>
            <Header />

            <main style={{ flex: 1, maxWidth: '1440px', margin: '0 auto', padding: '28px 32px', width: '100%' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a202c', margin: 0 }}>
                        {busqueda ? `Resultados para "${busqueda}"` : 'Todos los productos'}
                    </h1>
                    <select
                        value={orden}
                        onChange={e => setOrden(e.target.value)}
                        style={{
                            padding: '8px 12px', borderRadius: '8px', border: `1.5px solid ${COL.border}`,
                            fontSize: '13px', color: '#2d3748', outline: 'none', background: '#fff',
                        }}
                    >
                        <option value="">Ordenar por</option>
                        <option value="nombre">Nombre</option>
                        <option value="precio_asc">Precio: menor a mayor</option>
                        <option value="precio_desc">Precio: mayor a menor</option>
                    </select>
                </div>

                {cargando ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: COL.muted }}>
                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '28px' }}></i>
                    </div>
                ) : productos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: COL.muted }}>
                        <i className="fas fa-box-open" style={{ fontSize: '40px', marginBottom: '12px', display: 'block' }}></i>
                        No se encontraron productos.
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '20px',
                    }}>
                        {productos.map(p => (
                            <div key={p.id} style={{
                                background: '#fff', borderRadius: '12px', overflow: 'hidden',
                                border: `1px solid ${COL.border}`, display: 'flex', flexDirection: 'column',
                            }}>
                                <Link to={`/producto/${p.id}`} style={{ textDecoration: 'none' }}>
                                    <div style={{
                                        position: 'relative', height: '160px', background: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        borderBottom: `1px solid #f0f3f7`, overflow: 'hidden',
                                    }}>
                                        {p.imagenUrl ? (
                                            <img src={`${API.imagenesBase}${p.imagenUrl}`} alt={p.nombre}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <i className="fas fa-image" style={{ fontSize: '36px', color: '#cbd5e0' }}></i>
                                        )}
                                        {p.descuentoPct > 0 && (
                                            <span style={{
                                                position: 'absolute', top: '8px', left: '8px',
                                                background: COL.accent, color: COL.primaryDark,
                                                fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                                            }}>
                                                -{p.descuentoPct}%
                                            </span>
                                        )}
                                        {!p.enStock && (
                                            <span style={{
                                                position: 'absolute', top: '8px', right: '8px',
                                                background: '#718096', color: '#fff',
                                                fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
                                            }}>
                                                Sin stock
                                            </span>
                                        )}
                                    </div>
                                </Link>
                                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <Link to={`/producto/${p.id}`} style={{ textDecoration: 'none' }}>
                                        <p style={{
                                            color: '#2d3748', fontSize: '13px', margin: '0 0 8px', lineHeight: 1.4,
                                            minHeight: '36px', display: '-webkit-box', WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                        }}>
                                            {p.nombre}
                                        </p>
                                    </Link>
                                    <div style={{ marginBottom: '10px', marginTop: 'auto' }}>
                                        {p.descuentoPct > 0 && (
                                            <div style={{ color: '#a0aec0', fontSize: '11px', textDecoration: 'line-through' }}>
                                                Gs. {fmt(p.precioOriginal)}
                                            </div>
                                        )}
                                        <div style={{ color: COL.primary, fontSize: '16px', fontWeight: 700 }}>
                                            Gs. {fmt(p.precioVenta)}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAgregar(p)}
                                        disabled={!p.enStock}
                                        style={{
                                            width: '100%', padding: '8px 0', borderRadius: '8px', border: 'none',
                                            background: p.enStock ? COL.primary : '#cbd5e0',
                                            color: '#fff', fontSize: '12px', fontWeight: 700,
                                            cursor: p.enStock ? 'pointer' : 'not-allowed',
                                        }}
                                    >
                                        <i className="fas fa-cart-plus" style={{ marginRight: '6px' }}></i>
                                        {p.enStock ? 'Agregar' : 'Sin stock'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {totalPaginas > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '28px' }}>
                        <button
                            onClick={() => setPagina(p => Math.max(1, p - 1))}
                            disabled={pagina === 1}
                            style={{
                                padding: '8px 14px', borderRadius: '8px', border: `1.5px solid ${COL.border}`,
                                background: '#fff', cursor: pagina === 1 ? 'not-allowed' : 'pointer', fontSize: '13px',
                            }}
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: COL.muted, padding: '0 8px' }}>
                            Pagina {pagina} de {totalPaginas}
                        </span>
                        <button
                            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                            disabled={pagina === totalPaginas}
                            style={{
                                padding: '8px 14px', borderRadius: '8px', border: `1.5px solid ${COL.border}`,
                                background: '#fff', cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer', fontSize: '13px',
                            }}
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    )
}