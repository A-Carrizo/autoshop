import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useCarrito } from '../context/CarritoContext'
import { useIdioma } from '../context/IdiomaContext'
import { API } from '../config/api'

const fmt = (n: number) => n.toLocaleString('es-PY')

export default function Carrito() {
    const { items, actualizarCantidad, quitarItem, totalPrecio, totalItems } = useCarrito()
    const { t } = useIdioma()
    const navigate = useNavigate()

    const handleCheckout = () => {
        const hayToken = !!localStorage.getItem('tienda_token')
        navigate(hayToken ? '/checkout' : '/login?next=/checkout')
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--mc-fondo)' }}>
            <Header />
            <main className="mc-container mc-pagina" style={{ flex: 1 }}>
                <div className="mc-titulo-pagina">
                    <h1>{t.miCarrito}</h1>
                    {items.length > 0 && <p>{totalItems} {totalItems === 1 ? t.productoEncontrado : t.productosEncontrados}</p>}
                </div>

                {items.length === 0 ? (
                    <div className="mc-catalogo__vacio">
                        <i className="fas fa-shopping-cart"></i>
                        <strong>{t.carritoVacio}</strong>
                        <Link to="/catalogo" className="mc-btn mc-btn--primario">{t.irAlCatalogo}</Link>
                    </div>
                ) : (
                    <div className="mc-dos-columnas">
                        <div className="mc-panel">
                            {items.map(item => (
                                <div key={item.productoId} className="mc-carrito-item">
                                    <Link to={`/producto/${item.productoId}`} className="mc-carrito-item__imagen" tabIndex={-1} aria-hidden="true">
                                        {item.imagenUrl
                                            ? <img src={`${API.imagenesBase}${item.imagenUrl}`} alt="" />
                                            : <i className="fas fa-image"></i>}
                                    </Link>
                                    <div className="mc-carrito-item__info">
                                        <Link to={`/producto/${item.productoId}`} className="mc-carrito-item__nombre">{item.nombre}</Link>
                                        <div className="mc-carrito-item__unitario">Gs. {fmt(item.precioUnitario)}</div>
                                    </div>
                                    <div className="mc-cantidad mc-cantidad--chica" role="group" aria-label={t.cantidad}>
                                        <button type="button" onClick={() => actualizarCantidad(item.productoId, item.cantidad - 1)} aria-label="-">
                                            <i className="fas fa-minus"></i>
                                        </button>
                                        <span>{item.cantidad}</span>
                                        <button type="button" onClick={() => actualizarCantidad(item.productoId, item.cantidad + 1)}
                                            disabled={item.cantidad >= item.stockDisponible} aria-label="+">
                                            <i className="fas fa-plus"></i>
                                        </button>
                                    </div>
                                    <div className="mc-carrito-item__subtotal">Gs. {fmt(item.precioUnitario * item.cantidad)}</div>
                                    <button type="button" className="mc-carrito-item__quitar" onClick={() => quitarItem(item.productoId)} aria-label={`Quitar ${item.nombre}`}>
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <aside className="mc-panel mc-resumen">
                            <h2 className="mc-panel__titulo">{t.resumenDelPedido}</h2>
                            <div className="mc-resumen__fila">
                                <span>{t.productos} ({totalItems})</span>
                                <span>Gs. {fmt(totalPrecio)}</span>
                            </div>
                            <div className="mc-resumen__total">
                                <span>{t.total}</span>
                                <strong>Gs. {fmt(totalPrecio)}</strong>
                            </div>
                            <button type="button" onClick={handleCheckout} className="mc-btn mc-btn--primario mc-btn--bloque mc-btn--grande">
                                {t.continuarCompra}<i className="fas fa-arrow-right"></i>
                            </button>
                            <Link to="/catalogo" className="mc-btn mc-btn--borde mc-btn--bloque" style={{ marginTop: '10px' }}>{t.irAlCatalogo}</Link>
                            <p className="mc-resumen__nota">{t.pagoTransferencia}</p>
                        </aside>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    )
}
