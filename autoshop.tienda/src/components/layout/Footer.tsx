import { Link } from 'react-router-dom'
import { useIdioma } from '../../context/IdiomaContext'
import { useCategorias } from '../../hooks/useCategorias'
import { TIENDA } from '../../config/tienda'
import Logo from './Logo'

const MAX_CATEGORIAS = 6

export default function Footer() {
    const { t } = useIdioma()
    const categorias = useCategorias()

    const contactos = [
        TIENDA.whatsapp && { icono: 'fab fa-whatsapp', texto: TIENDA.whatsapp.replace(/^595/, '0'), href: `https://wa.me/${TIENDA.whatsapp}` },
        TIENDA.telefono && { icono: 'fas fa-phone', texto: TIENDA.telefono, href: `tel:${TIENDA.telefono.replace(/\s/g, '')}` },
        TIENDA.email && { icono: 'fas fa-envelope', texto: TIENDA.email, href: `mailto:${TIENDA.email}` },
        TIENDA.direccion && { icono: 'fas fa-map-marker-alt', texto: TIENDA.direccion },
        TIENDA.horario && { icono: 'fas fa-clock', texto: TIENDA.horario },
    ].filter(Boolean) as { icono: string; texto: string; href?: string }[]

    const redes = [
        TIENDA.instagram && { icono: 'fab fa-instagram', href: TIENDA.instagram, nombre: 'Instagram' },
        TIENDA.facebook && { icono: 'fab fa-facebook-f', href: TIENDA.facebook, nombre: 'Facebook' },
    ].filter(Boolean) as { icono: string; href: string; nombre: string }[]

    return (
        <footer className="mc-footer">
            <div className="mc-container mc-footer__columnas">
                <div className="mc-footer__marca">
                    <Logo />
                    <p>{t.accesorios}</p>
                    {redes.length > 0 && (
                        <div className="mc-footer__redes">
                            {redes.map(r => (
                                <a key={r.nombre} href={r.href} target="_blank" rel="noopener noreferrer" aria-label={r.nombre}>
                                    <i className={r.icono}></i>
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                <nav>
                    <h3>{t.navegacion}</h3>
                    <Link to="/">{t.inicio}</Link>
                    <Link to="/catalogo">{t.catalogo}</Link>
                    <Link to="/carrito">{t.miCarrito}</Link>
                    <Link to="/mis-pedidos">{t.misPedidos}</Link>
                    <Link to="/perfil">{t.miCuenta}</Link>
                </nav>

                {categorias.length > 0 && (
                    <nav>
                        <h3>{t.categorias}</h3>
                        {categorias.slice(0, MAX_CATEGORIAS).map(c => (
                            <Link key={c.id} to={`/catalogo?categoriaId=${c.id}`}>{c.nombre}</Link>
                        ))}
                        {categorias.length > MAX_CATEGORIAS && <Link to="/catalogo">{t.verTodas} →</Link>}
                    </nav>
                )}

                {contactos.length > 0 && (
                    <div>
                        <h3>{t.contacto}</h3>
                        {contactos.map(c => c.href ? (
                            <a key={c.texto} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined}
                                rel="noopener noreferrer" className="mc-footer__contacto">
                                <i className={c.icono}></i>{c.texto}
                            </a>
                        ) : (
                            <span key={c.texto} className="mc-footer__contacto"><i className={c.icono}></i>{c.texto}</span>
                        ))}
                    </div>
                )}
            </div>

            <div className="mc-footer__base">
                <div className="mc-container mc-footer__base-contenido">
                    <span>{t.derechos}</span>
                    <span><i className="fas fa-university"></i> {t.transferenciaBancaria}</span>
                </div>
            </div>
        </footer>
    )
}
