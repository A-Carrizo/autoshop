import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useCarrito } from '../context/CarritoContext'
import { useIdioma } from '../context/IdiomaContext'
import { API } from '../config/api'
import CarruselPromociones from '../components/CarruselPromociones'

interface Producto {
    id: string; nombre: string; descripcion: string | null
    precioVenta: number; precioOriginal: number; descuentoPct: number
    imagenUrl: string | null; categoriaId: string; categoriaNombre: string
    enStock: boolean; stockActual: number
}

interface Categoria { id: string; nombre: string }

const COL = {
    primary: '#CC0000', primaryDark: '#880000',
    accent: '#CC0000', muted: '#718096', border: '#e0e0e0',
}

const SIDEBAR_W = 240

export default function Home() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { agregarItem } = useCarrito()
    const { t } = useIdioma()

    const [productos, setProductos] = useState<Producto[]>([])
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [cargando, setCargando] = useState(true)
    const [pagina, setPagina] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(1)
    const [orden, setOrden] = useState('')
    const [sidebarAbierto, setSidebarAbierto] = useState(true)


    const busqueda = searchParams.get('busqueda') || ''
    const categoriaId = searchParams.get('categoriaId') || ''

    const filtrosKey = `${busqueda}|${categoriaId}|${orden}`
    const filtrosKeyAnteriorRef = useRef(filtrosKey)

    // Cargar categorías con reintento
    useEffect(() => {
        let cancelado = false
        const esperar = (ms: number) => new Promise(r => setTimeout(r, ms))
        const cargar = async () => {
            for (let i = 1; i <= 4; i++) {
                try {
                    const res = await fetch(`${API.catalogo}/categorias`)
                    if (!res.ok) throw new Error()
                    const data = await res.json()
                    if (!cancelado) setCategorias(data)
                    return
                } catch {
                    if (cancelado) return
                    if (i < 4) await esperar(1000)
                }
            }
        }
        cargar()
        return () => { cancelado = true }
    }, [])

    // Cargar productos
    useEffect(() => {
        const filtrosCambiaron = filtrosKeyAnteriorRef.current !== filtrosKey
        filtrosKeyAnteriorRef.current = filtrosKey
        const paginaAPedir = filtrosCambiaron ? 1 : pagina

        let cancelado = false
        const esperar = (ms: number) => new Promise(r => setTimeout(r, ms))

        const intentarCargar = async (): Promise<boolean> => {
            try {
                const params = new URLSearchParams({ pagina: String(paginaAPedir), tamano: '24' })
                if (busqueda) params.set('busqueda', busqueda)
                if (categoriaId) params.set('categoriaId', categoriaId)
                if (orden) params.set('orden', orden)

                const res = await fetch(`${API.catalogo}?${params.toString()}`)
                if (!res.ok) throw new Error()
                const data = await res.json()
                if (cancelado) return true
                setProductos(data.datos)
                setTotalPaginas(data.totalPaginas)
                if (filtrosCambiaron) setPagina(1)
                return true
            } catch { return false }
        }

        const cargar = async () => {
            setCargando(true)
            for (let i = 1; i <= 4; i++) {
                const ok = await intentarCargar()
                if (cancelado) return
                if (ok) break
                if (i === 4) toast.error('No se pudieron cargar los productos.')
                else await esperar(1000)
            }
            if (!cancelado) setCargando(false)
        }
        cargar()
        return () => { cancelado = true }
    }, [busqueda, categoriaId, orden, pagina, filtrosKey])

    const handleAgregar = (p: Producto) => {
        if (!p.enStock) return
        agregarItem({ productoId: p.id, nombre: p.nombre, precioUnitario: p.precioVenta, imagenUrl: p.imagenUrl, stockDisponible: p.stockActual })
        toast.success(`${p.nombre} agregado al carrito`)
    }

    const limpiarFiltros = () => {
        setOrden('')
        navigate('/')
    }

    const hayFiltros = categoriaId || busqueda || orden

    const fmt = (n: number) => n.toLocaleString('es-PY')

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
            <Header />

            <div style={{ flex: 1, display: 'flex', maxWidth: '1440px', margin: '0 auto', width: '100%', padding: '20px 24px', gap: '20px' }}>

                {/* Sidebar */}
                <aside style={{
                    width: sidebarAbierto ? `${SIDEBAR_W}px` : '0px',
                    minWidth: sidebarAbierto ? `${SIDEBAR_W}px` : '0px',
                    overflow: 'hidden',
                    transition: 'all 0.25s ease',
                    flexShrink: 0,
                }}>
                    <div style={{ width: `${SIDEBAR_W}px`, paddingRight: '8px' }}>

                        {/* Categorias */}
                        <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${COL.border}`, overflow: 'hidden', marginBottom: '12px' }}>
                            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COL.border}`, fontWeight: 700, fontSize: '13px', color: '#1a202c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-th-large" style={{ color: COL.primary, fontSize: '12px' }}></i>
                                Categorías
                            </div>
                            <div style={{ padding: '8px' }}>
                                <Link to="/" style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '8px 10px', borderRadius: '8px', textDecoration: 'none',
                                    background: !categoriaId && !busqueda ? '#fff0f0' : 'transparent',
                                    color: !categoriaId && !busqueda ? COL.primary : '#4a5568',
                                    fontWeight: !categoriaId && !busqueda ? 700 : 400,
                                    fontSize: '13px', marginBottom: '2px',
                                }}>
                                    <i className="fas fa-border-all" style={{ fontSize: '11px', width: '14px', textAlign: 'center' }}></i>
                                    {t.todos}
                                </Link>
                                {categorias.map(cat => (
                                    <Link key={cat.id} to={`/?categoriaId=${cat.id}`}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '8px 10px', borderRadius: '8px', textDecoration: 'none',
                                            background: categoriaId === cat.id ? '#fff0f0' : 'transparent',
                                            color: categoriaId === cat.id ? COL.primary : '#4a5568',
                                            fontWeight: categoriaId === cat.id ? 700 : 400,
                                            fontSize: '13px', marginBottom: '2px',
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => { if (categoriaId !== cat.id) e.currentTarget.style.background = '#f5f5f5' }}
                                        onMouseLeave={e => { if (categoriaId !== cat.id) e.currentTarget.style.background = 'transparent' }}
                                    >
                                        <i className="fas fa-chevron-right" style={{ fontSize: '9px', width: '14px', textAlign: 'center', color: categoriaId === cat.id ? COL.primary : '#cbd5e0' }}></i>
                                        {cat.nombre}
                                    </Link>
                                ))}
                            </div>
                        </div>



                        {/* Limpiar filtros */}
                        {hayFiltros && (
                            <button onClick={limpiarFiltros}
                                style={{ width: '100%', padding: '8px', background: 'none', border: `1px solid ${COL.border}`, borderRadius: '8px', fontSize: '12px', color: COL.muted, cursor: 'pointer', fontFamily: 'inherit' }}>
                                <i className="fas fa-times" style={{ marginRight: '6px' }}></i>Limpiar filtros
                            </button>
                        )}
                    </div>
                </aside>

                {/* Contenido principal */}
                <main style={{ flex: 1, minWidth: 0 }}>
                    <CarruselPromociones />

                    {/* Barra superior */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        {/* Boton toggle sidebar */}
                        <button onClick={() => setSidebarAbierto(v => !v)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '7px 12px', borderRadius: '8px', border: `1px solid ${COL.border}`,
                                background: '#fff', color: '#4a5568', fontSize: '13px',
                                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, flexShrink: 0,
                            }}>
                            <i className={`fas fa-${sidebarAbierto ? 'indent' : 'outdent'}`} style={{ fontSize: '13px' }}></i>
                            {sidebarAbierto ? 'Ocultar filtros' : 'Mostrar filtros'}
                        </button>

                        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1a202c', margin: 0, flex: 1 }}>
                            {busqueda ? `${t.resultadosPara} "${busqueda}"` : categoriaId ? categorias.find(c => c.id === categoriaId)?.nombre || t.todosLosProductos : t.todosLosProductos}
                        </h1>

                        <select value={orden} onChange={e => setOrden(e.target.value)}
                            style={{ padding: '7px 12px', borderRadius: '8px', border: `1.5px solid ${COL.border}`, fontSize: '13px', color: '#2d3748', outline: 'none', background: '#fff', flexShrink: 0 }}>
                            <option value="">{t.ordenarPor}</option>
                            <option value="nombre">{t.nombre}</option>
                            <option value="precio_asc">{t.precioMenorMayor}</option>
                            <option value="precio_desc">{t.precioMayorMenor}</option>
                        </select>

                    </div>

                    {/* Grilla de productos */}
                    {cargando ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: COL.muted }}>
                            <i className="fas fa-spinner fa-spin" style={{ fontSize: '28px', color: COL.primary }}></i>
                        </div>
                    ) : productos.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: COL.muted }}>
                            <i className="fas fa-box-open" style={{ fontSize: '40px', marginBottom: '12px', display: 'block' }}></i>
                            {t.noSeEncontraronProductos}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                            {productos.map(p => (
                                <div key={p.id}
                                    style={{
                                        background: '#fff', borderRadius: '12px', overflow: 'hidden',
                                        border: `1px solid ${COL.border}`, display: 'flex', flexDirection: 'column',
                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(204,0,0,0.12)' }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                                >
                                    <Link to={`/producto/${p.id}`} style={{ textDecoration: 'none' }}>
                                        <div className="tienda-img-zoom-container" style={{ position: 'relative', height: '160px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid #f0f0f0`, overflow: 'hidden' }}>
                                            {p.imagenUrl ? (
                                                <img src={`${API.imagenesBase}${p.imagenUrl}`} alt={p.nombre}
                                                    className="tienda-img-zoom"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} />
                                            ) : (
                                                <i className="fas fa-image" style={{ fontSize: '36px', color: '#cbd5e0' }}></i>
                                            )}
                                            {p.descuentoPct > 0 && (
                                                <span style={{ position: 'absolute', top: '8px', left: '8px', background: COL.accent, color: '#fff', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>
                                                    -{p.descuentoPct}%
                                                </span>
                                            )}
                                            {!p.enStock && (
                                                <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#718096', color: '#fff', fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px' }}>
                                                    {t.sinStock}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <Link to={`/producto/${p.id}`} style={{ textDecoration: 'none' }}>
                                            <p style={{ color: '#2d3748', fontSize: '13px', margin: '0 0 8px', lineHeight: 1.4, minHeight: '36px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {p.nombre}
                                            </p>
                                        </Link>
                                        <div style={{ marginBottom: '10px', marginTop: 'auto' }}>
                                            {p.descuentoPct > 0 && (
                                                <div style={{ color: '#a0aec0', fontSize: '11px', textDecoration: 'line-through' }}>Gs. {fmt(p.precioOriginal)}</div>
                                            )}
                                            <div style={{ color: COL.primary, fontSize: '16px', fontWeight: 700 }}>Gs. {fmt(p.precioVenta)}</div>
                                        </div>
                                        <button onClick={() => handleAgregar(p)} disabled={!p.enStock}
                                            style={{ width: '100%', padding: '8px 0', borderRadius: '8px', border: 'none', background: p.enStock ? COL.primary : '#cbd5e0', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: p.enStock ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                                            <i className="fas fa-cart-plus" style={{ marginRight: '6px' }}></i>
                                            {p.enStock ? t.agregar : t.sinStock}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Paginacion */}
                    {totalPaginas > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '28px' }}>
                            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                                style={{ padding: '8px 14px', borderRadius: '8px', border: `1.5px solid ${COL.border}`, background: '#fff', cursor: pagina === 1 ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
                                <i className="fas fa-chevron-left"></i>
                            </button>
                            <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: COL.muted, padding: '0 8px' }}>
                                {t.pagina} {pagina} {t.de} {totalPaginas}
                            </span>
                            <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                                style={{ padding: '8px 14px', borderRadius: '8px', border: `1.5px solid ${COL.border}`, background: '#fff', cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    )}
                </main>
            </div>

            <Footer />
        </div>
    )
}