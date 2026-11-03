import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useCarrito } from '../../context/CarritoContext'
import { useIdioma } from '../../context/IdiomaContext'
import { API } from '../../config/api'
import type { ProductoResumen } from '../../types/catalogo'

const fmt = (n: number) => n.toLocaleString('es-PY')

type Vista = 'grilla' | 'lista'

const clase = (vista: Vista) => `mc-tarjeta${vista === 'lista' ? ' mc-tarjeta--lista' : ''}`

// Tarjeta de producto usada en grillas, listas y carruseles
export default function TarjetaProducto({ producto: p, vista = 'grilla' }: { producto: ProductoResumen; vista?: Vista }) {
    const { agregarItem } = useCarrito()
    const { t } = useIdioma()

    const handleAgregar = () => {
        if (!p.enStock) return
        agregarItem({ productoId: p.id, nombre: p.nombre, precioUnitario: p.precioVenta, imagenUrl: p.imagenUrl, stockDisponible: p.stockActual })
        toast.success(`${p.nombre} - ${t.agregarAlCarrito}`)
    }

    return (
        <article className={clase(vista)}>
            <Link to={`/producto/${p.id}`} className="mc-tarjeta__imagen" tabIndex={-1} aria-hidden="true">
                {p.imagenUrl
                    ? <img src={`${API.imagenesBase}${p.imagenUrl}`} alt="" loading="lazy" />
                    : <i className="fas fa-image mc-tarjeta__sin-imagen"></i>}
                {p.descuentoPct > 0 && <span className="mc-tarjeta__badge">-{p.descuentoPct}%</span>}
                {!p.enStock && <span className="mc-tarjeta__badge mc-tarjeta__badge--gris">{t.sinStock}</span>}
            </Link>

            <div className="mc-tarjeta__cuerpo">
                {p.categorias.length > 0 && (
                    <span className="mc-tarjeta__categoria">{p.categorias[0].nombre}</span>
                )}
                <Link to={`/producto/${p.id}`} className="mc-tarjeta__nombre">{p.nombre}</Link>
                {vista === 'lista' && p.descripcion && <p className="mc-tarjeta__descripcion">{p.descripcion}</p>}

                <div className="mc-tarjeta__precios">
                    {p.descuentoPct > 0 && <span className="mc-tarjeta__precio-viejo">Gs. {fmt(p.precioOriginal)}</span>}
                    <span className="mc-tarjeta__precio">Gs. {fmt(p.precioVenta)}</span>
                </div>

                <button type="button" className="mc-btn mc-btn--primario mc-tarjeta__boton"
                    onClick={handleAgregar} disabled={!p.enStock}>
                    <i className="fas fa-cart-plus"></i>
                    {p.enStock ? t.agregarAlCarrito : t.sinStock}
                </button>
            </div>
        </article>
    )
}

// Placeholder con la misma forma de la tarjeta, mientras cargan los productos
export function TarjetaProductoSkeleton({ vista = 'grilla' }: { vista?: Vista }) {
    return (
        <div className={clase(vista)} aria-hidden="true">
            <div className="mc-tarjeta__imagen mc-skeleton"></div>
            <div className="mc-tarjeta__cuerpo">
                <div className="mc-skeleton" style={{ height: '10px', width: '40%' }}></div>
                <div className="mc-skeleton" style={{ height: '14px', width: '90%' }}></div>
                <div className="mc-skeleton" style={{ height: '14px', width: '60%' }}></div>
                <div className="mc-skeleton" style={{ height: '22px', width: '50%', marginTop: 'auto' }}></div>
                <div className="mc-skeleton" style={{ height: '38px' }}></div>
            </div>
        </div>
    )
}
