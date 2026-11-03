import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useCarrito } from '../../context/CarritoContext'
import { useIdioma } from '../../context/IdiomaContext'
import { useCategorias } from '../../hooks/useCategorias'
import Logo from './Logo'

export default function Header() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { totalItems, totalPrecio } = useCarrito()
    const { t, idioma, cambiarIdioma } = useIdioma()
    const [busqueda, setBusqueda] = useState(() => searchParams.get('busqueda') || '')
    const [nombreCliente] = useState<string | null>(() => localStorage.getItem('tienda_nombre'))
    const categorias = useCategorias()
    const [menuAbierto, setMenuAbierto] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Cerrar el menu al hacer click afuera o presionar Escape
    useEffect(() => {
        if (!menuAbierto) return
        const alClickear = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuAbierto(false)
        }
        const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuAbierto(false) }
        document.addEventListener('mousedown', alClickear)
        document.addEventListener('keydown', alTeclear)
        return () => {
            document.removeEventListener('mousedown', alClickear)
            document.removeEventListener('keydown', alTeclear)
        }
    }, [menuAbierto])

    const handleBuscar = (e: React.SyntheticEvent) => {
        e.preventDefault()
        const texto = busqueda.trim()
        navigate(texto ? `/catalogo?busqueda=${encodeURIComponent(texto)}` : '/catalogo')
    }

    const fmt = (n: number) => n.toLocaleString('es-PY')

    return (
        <header className="mc-header">
            <div className="mc-container mc-header__barra">
                <Logo />

                <form className="mc-buscador" onSubmit={handleBuscar} role="search">
                    <input type="text" placeholder={t.buscarPlaceholder} aria-label={t.buscarPlaceholder}
                        value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                    <button type="submit" aria-label={t.buscar}>
                        <i className="fas fa-search"></i>
                        <span>{t.buscar}</span>
                    </button>
                </form>

                {/* Menu de categorias */}
                <div className="mc-categorias" ref={menuRef}>
                    <button type="button" className="mc-header__accion mc-header__todos"
                        aria-expanded={menuAbierto} aria-haspopup="true"
                        onClick={() => setMenuAbierto(v => !v)}>
                        <i className="fas fa-th-large mc-header__icono"></i>
                        <span>{t.todos}</span>
                    </button>
                    {menuAbierto && (
                        // Cualquier click en un link del menu lo cierra
                        <nav className="mc-categorias__menu" onClick={() => setMenuAbierto(false)}>
                            <div className="mc-categorias__titulo">{t.categorias}</div>
                            {categorias.map(cat => (
                                <Link key={cat.id} to={`/catalogo?categoriaId=${cat.id}`} className="mc-categorias__item">
                                    {cat.nombre}
                                    <i className="fas fa-chevron-right"></i>
                                </Link>
                            ))}
                            <Link to="/catalogo" className="mc-categorias__item mc-categorias__item--destacado">
                                {t.verCatalogoCompleto}
                                <i className="fas fa-arrow-right"></i>
                            </Link>
                        </nav>
                    )}
                </div>

                {/* Selector de idioma */}
                <div className="mc-idioma" role="group" aria-label="Idioma">
                    {(['es', 'pt'] as const).map(lang => (
                        <button key={lang} type="button" aria-pressed={idioma === lang} onClick={() => cambiarIdioma(lang)}>
                            {lang.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* Cuenta */}
                <Link to={nombreCliente ? '/perfil' : '/login'} className="mc-header__accion mc-header__accion--rojo"
                    aria-label={nombreCliente ? t.miCuenta : t.ingresar}>
                    <i className="far fa-user mc-header__icono"></i>
                    <span className="mc-header__cuenta-texto">
                        {nombreCliente ? `${t.hola}, ${nombreCliente.split(' ')[0]}` : t.ingresar}
                    </span>
                </Link>

                {/* Carrito con total */}
                <Link to="/carrito" className="mc-header__accion mc-header__accion--rojo" aria-label={t.miCarrito}>
                    <span className="mc-header__carrito-icono">
                        <i className="fas fa-shopping-cart mc-header__icono"></i>
                        {totalItems > 0 && <span className="mc-header__badge">{totalItems}</span>}
                    </span>
                    <span className="mc-header__texto-doble mc-header__carrito-texto">
                        <small>{t.tuCompra}</small>
                        <strong>Gs. {fmt(totalPrecio)}</strong>
                    </span>
                </Link>
            </div>
        </header>
    )
}
