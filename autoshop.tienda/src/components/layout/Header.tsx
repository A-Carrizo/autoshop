import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCarrito } from '../../context/CarritoContext'
import { API } from '../../config/api'

interface Categoria { id: string, nombre: string }

const COL = {
    headerBg: '#1e3a5f',
    navBg: '#2c5282',
    accent: '#D4A017',
    accentDark: '#1a365d',
}

export default function Header() {
    const navigate = useNavigate()
    const { totalItems } = useCarrito()
    const [busqueda, setBusqueda] = useState('')
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [nombreCliente] = useState<string | null>(() => localStorage.getItem('tienda_nombre'))

    useEffect(() => {
        fetch(`${API.catalogo}/categorias`)
            .then(r => r.json())
            .then(setCategorias)
            .catch(() => setCategorias([]))
    }, [])

    const handleBuscar = (e: React.FormEvent) => {
        e.preventDefault()
        navigate(`/?busqueda=${encodeURIComponent(busqueda.trim())}`)
    }

    return (
        <header style={{ fontFamily: "'Segoe UI', sans-serif" }}>
            {/* Barra superior */}
            <div style={{
                background: COL.headerBg,
                borderBottom: `3px solid ${COL.accent}`,
                padding: '14px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
            }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
                    <div style={{
                        width: '38px', height: '38px', borderRadius: '10px',
                        background: COL.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <i className="fas fa-car" style={{ color: COL.accentDark, fontSize: '18px' }}></i>
                    </div>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '19px' }}>MagCar</span>
                </Link>

                <form onSubmit={handleBuscar} style={{ flex: 1, position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        style={{
                            width: '100%', height: '38px', borderRadius: '8px', border: 'none',
                            padding: '0 40px 0 14px', fontSize: '14px', outline: 'none',
                        }}
                    />
                    <button type="submit" style={{
                        position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: '#718096', fontSize: '15px',
                    }}>
                        <i className="fas fa-search"></i>
                    </button>
                </form>

                <Link to={nombreCliente ? '/perfil' : '/login'} style={{ color: '#fff', textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fas fa-user-circle" style={{ fontSize: '20px' }}></i>
                    <span style={{ fontSize: '13px', display: 'none' }}>{nombreCliente}</span>
                </Link>

                <Link to="/carrito" style={{ position: 'relative', color: '#fff', textDecoration: 'none', flexShrink: 0 }}>
                    <i className="fas fa-shopping-cart" style={{ fontSize: '20px' }}></i>
                    {totalItems > 0 && (
                        <span style={{
                            position: 'absolute', top: '-8px', right: '-10px',
                            background: COL.accent, color: COL.accentDark,
                            fontSize: '10px', fontWeight: 800, borderRadius: '50%',
                            width: '18px', height: '18px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            {totalItems}
                        </span>
                    )}
                </Link>
            </div>

            {/* Barra de categorias */}
            <nav style={{
                background: COL.navBg,
                padding: '10px 24px',
                display: 'flex',
                gap: '22px',
                overflowX: 'auto',
            }}>
                <Link to="/" style={{ color: '#fff', fontSize: '13px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Todos los productos
                </Link>
                {categorias.map(cat => (
                    <Link
                        key={cat.id}
                        to={`/?categoriaId=${cat.id}`}
                        style={{ color: '#fff', fontSize: '13px', textDecoration: 'none', whiteSpace: 'nowrap' }}
                    >
                        {cat.nombre}
                    </Link>
                ))}
            </nav>
        </header>
    )
}