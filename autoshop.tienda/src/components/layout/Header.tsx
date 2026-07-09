import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useCarrito } from '../../context/CarritoContext'
import { useIdioma } from '../../context/IdiomaContext'
import { API } from '../../config/api'

interface Categoria { id: string, nombre: string }

const COL = {
    headerBg: '#1a1a1a',
    navBg: '#111111',
    accent: '#CC0000',
    accentDark: '#880000',
}

export default function Header() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { totalItems } = useCarrito()
    const { t, idioma, cambiarIdioma } = useIdioma()
    const [busqueda, setBusqueda] = useState('')
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [nombreCliente] = useState<string | null>(() => localStorage.getItem('tienda_nombre'))
    const [verTodas, setVerTodas] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const categoriaActiva = searchParams.get('categoriaId') || ''
    const sinFiltros = !categoriaActiva && !searchParams.get('busqueda')

    useEffect(() => {
        let cancelado = false
        const esperar = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
        const cargarCategorias = async () => {
            const MAX_INTENTOS = 4
            for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
                try {
                    const res = await fetch(`${API.catalogo}/categorias`)
                    if (!res.ok) throw new Error('Respuesta no exitosa')
                    const data = await res.json()
                    if (!cancelado) setCategorias(data)
                    return
                } catch {
                    if (cancelado) return
                    if (intento < MAX_INTENTOS) await esperar(1000)
                }
            }
        }
        cargarCategorias()
        return () => { cancelado = true }
    }, [])

    useEffect(() => {
        const handleClickFuera = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setVerTodas(false)
            }
        }
        document.addEventListener('mousedown', handleClickFuera)
        return () => document.removeEventListener('mousedown', handleClickFuera)
    }, [])

    const handleBuscar = (e: React.SyntheticEvent) => {
        e.preventDefault()
        navigate(`/?busqueda=${encodeURIComponent(busqueda.trim())}`)
    }

    const pillBase: React.CSSProperties = {
        fontSize: '13px', fontWeight: 600, textDecoration: 'none',
        whiteSpace: 'nowrap', padding: '7px 16px', borderRadius: '20px',
        transition: 'all 0.15s', flexShrink: 0,
    }

    const pillStyle = (activo: boolean): React.CSSProperties => activo
        ? { ...pillBase, background: COL.accent, color: '#ffffff' }
        : { ...pillBase, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }

    const LIMITE_VISIBLES = 7
    const categoriasVisibles = categorias.slice(0, LIMITE_VISIBLES)
    const hayMasCategorias = categorias.length > LIMITE_VISIBLES

    return (
        <header style={{ fontFamily: "'Segoe UI', sans-serif" }}>
            <div style={{
                background: COL.headerBg,
                borderBottom: `3px solid ${COL.accent}`,
                padding: '14px 24px',
                display: 'flex', alignItems: 'center', gap: '20px',
            }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
                    <div style={{
                        width: '38px', height: '38px', borderRadius: '10px',
                        background: COL.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <i className="fas fa-car" style={{ color: '#fff', fontSize: '18px' }}></i>
                    </div>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '19px' }}>MagCar</span>
                </Link>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <form onSubmit={handleBuscar} style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
                        <input type="text" placeholder={t.buscarPlaceholder}
                            value={busqueda} onChange={e => setBusqueda(e.target.value)}
                            style={{
                                width: '100%', height: '36px', borderRadius: '20px', border: 'none',
                                padding: '0 40px 0 16px', fontSize: '13px', outline: 'none', background: '#fff',
                            }}
                        />
                        <button type="submit" style={{
                            position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                            background: COL.accent, border: 'none', borderRadius: '50%',
                            width: '26px', height: '26px', cursor: 'pointer', color: '#fff', fontSize: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <i className="fas fa-search"></i>
                        </button>
                    </form>
                </div>

                {/* Selector de idioma */}
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    {(['es', 'pt'] as const).map(lang => (
                        <button key={lang} onClick={() => cambiarIdioma(lang)}
                            style={{
                                background: idioma === lang ? COL.accent : 'rgba(255,255,255,0.1)',
                                border: 'none', borderRadius: '6px', cursor: 'pointer',
                                padding: '4px 8px', fontSize: '11px', fontWeight: 700,
                                color: '#fff', transition: 'all 0.15s', fontFamily: 'inherit',
                            }}>
                            {lang === 'es' ? '🇵🇾 ES' : '🇧🇷 PT'}
                        </button>
                    ))}
                </div>

                <Link to={nombreCliente ? '/perfil' : '/login'} style={{ color: '#fff', textDecoration: 'none', flexShrink: 0 }}>
                    <i className="fas fa-user-circle" style={{ fontSize: '20px' }}></i>
                </Link>

                <Link to="/carrito" style={{ position: 'relative', color: '#fff', textDecoration: 'none', flexShrink: 0 }}>
                    <i className="fas fa-shopping-cart" style={{ fontSize: '20px' }}></i>
                    {totalItems > 0 && (
                        <span style={{
                            position: 'absolute', top: '-8px', right: '-10px',
                            background: COL.accent, color: '#fff',
                            fontSize: '10px', fontWeight: 800, borderRadius: '50%',
                            width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {totalItems}
                        </span>
                    )}
                </Link>
            </div>

            <nav style={{
                background: COL.navBg, padding: '10px 24px',
                display: 'flex', gap: '10px', alignItems: 'center',
                overflowX: 'auto', scrollbarWidth: 'none', position: 'relative',
            }}>
                <Link to="/" style={pillStyle(sinFiltros)}>
                    <i className="fas fa-th-large" style={{ marginRight: '6px', fontSize: '11px' }}></i>
                    {t.todos}
                </Link>
                {categoriasVisibles.map(cat => (
                    <Link key={cat.id} to={`/?categoriaId=${cat.id}`} style={pillStyle(categoriaActiva === cat.id)}>
                        {cat.nombre}
                    </Link>
                ))}
                {hayMasCategorias && (
                    <div ref={dropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
                        <button onClick={() => setVerTodas(v => !v)}
                            style={{ ...pillBase, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', border: 'none', cursor: 'pointer' }}>
                            {t.verTodas}
                            <i className={`fas fa-chevron-${verTodas ? 'up' : 'down'}`} style={{ marginLeft: '6px', fontSize: '10px' }}></i>
                        </button>
                        {verTodas && (
                            <div style={{
                                position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                                background: '#fff', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                padding: '10px', minWidth: '220px', maxHeight: '320px', overflowY: 'auto', zIndex: 1000,
                            }}>
                                {categorias.map(cat => (
                                    <Link key={cat.id} to={`/?categoriaId=${cat.id}`} onClick={() => setVerTodas(false)}
                                        style={{
                                            display: 'block', padding: '9px 12px', borderRadius: '8px',
                                            fontSize: '13px', textDecoration: 'none', marginBottom: '2px',
                                            background: categoriaActiva === cat.id ? '#fff0f0' : 'transparent',
                                            color: categoriaActiva === cat.id ? COL.accentDark : '#2d3748',
                                            fontWeight: categoriaActiva === cat.id ? 700 : 400,
                                        }}>
                                        {cat.nombre}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </nav>
        </header>
    )
}