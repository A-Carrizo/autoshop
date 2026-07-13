import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCarrito } from '../../context/CarritoContext'
import { useIdioma } from '../../context/IdiomaContext'

const COL = {
    headerBg: '#1a1a1a',
    accent: '#CC0000',
}

export default function Header() {
    const navigate = useNavigate()
    const { totalItems } = useCarrito()
    const { t, idioma, cambiarIdioma } = useIdioma()
    const [busqueda, setBusqueda] = useState('')
    const [nombreCliente] = useState<string | null>(() => localStorage.getItem('tienda_nombre'))

    const handleBuscar = (e: React.SyntheticEvent) => {
        e.preventDefault()
        navigate(`/?busqueda=${encodeURIComponent(busqueda.trim())}`)
    }

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
        </header>
    )
}