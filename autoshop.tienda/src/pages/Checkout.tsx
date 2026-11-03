import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useCarrito } from '../context/CarritoContext'
import { useIdioma } from '../context/IdiomaContext'
import { API } from '../config/api'
import { TIENDA } from '../config/tienda'

const fmt = (n: number) => n.toLocaleString('es-PY')
// Numero de WhatsApp en formato local (0992...) para mostrar
const whatsappLocal = TIENDA.whatsapp.replace(/^595/, '0')
const TRANSPORTADORAS_BASE = ['Transportadora TSI', 'Multi Envios', 'Transportadora Occidental', 'Ruta3', 'Nuestra Señora']

export default function Checkout() {
    const { items, totalPrecio, vaciarCarrito } = useCarrito()
    const { t } = useIdioma()
    const navigate = useNavigate()
    const [telefono, setTelefono] = useState('')
    const [direccion, setDireccion] = useState('')
    const [transportadora, setTransportadora] = useState('')
    const [transportadoraOtros, setTransportadoraOtros] = useState('')
    const [notas, setNotas] = useState('')
    const [loading, setLoading] = useState(false)

    const TRANSPORTADORAS = [...TRANSPORTADORAS_BASE, t.otros]

    const handleConfirmar = async () => {
        if (items.length === 0) { toast.error(t.carritoVacio); return }
        if (!direccion.trim()) { toast.error(t.direccionDeEntrega); return }
        if (!transportadora) { toast.error(t.transportadora); return }
        if (transportadora === t.otros && !transportadoraOtros.trim()) { toast.error(t.nombreTransportadora); return }
        const transportadoraFinal = transportadora === t.otros ? transportadoraOtros.trim() : transportadora
        const notasFinal = [notas.trim(), `Transportadora: ${transportadoraFinal}`].filter(Boolean).join(' | ')
        setLoading(true)
        try {
            const token = localStorage.getItem('tienda_token')
            const res = await fetch(API.pedidos, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ items: items.map(i => ({ productoId: i.productoId, cantidad: i.cantidad })), metodoPago: 'TRANSFERENCIA', telefono: telefono.trim() || null, direccionEntrega: direccion.trim(), notas: notasFinal || null })
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.mensaje || 'No se pudo crear el pedido'); return }
            vaciarCarrito()
            toast.success('¡Pedido creado correctamente!')
            navigate(`/mis-pedidos/${data.id}`, { replace: true })
        } catch { toast.error('Error de conexion') }
        finally { setLoading(false) }
    }

    if (items.length === 0) return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--mc-fondo)' }}>
            <Header />
            <main className="mc-container mc-pagina" style={{ flex: 1 }}>
                <div className="mc-catalogo__vacio">
                    <i className="fas fa-shopping-cart"></i>
                    <strong>{t.carritoVacio}</strong>
                    <Link to="/catalogo" className="mc-btn mc-btn--primario"><i className="fas fa-arrow-left"></i>{t.volverAlCatalogo}</Link>
                </div>
            </main>
            <Footer />
        </div>
    )

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--mc-fondo)' }}>
            <Header />
            <main className="mc-container mc-pagina" style={{ flex: 1 }}>
                <Link to="/carrito" className="mc-volver"><i className="fas fa-arrow-left"></i>{t.volverAlCarrito}</Link>
                <div className="mc-titulo-pagina">
                    <h1>{t.finalizarPedido}</h1>
                </div>

                <div className="mc-dos-columnas">
                    <div>
                        {/* 1. Entrega */}
                        <section className="mc-panel">
                            <h2 className="mc-panel__titulo"><span className="mc-panel__paso">1</span>{t.datosDeEntrega}</h2>
                            <div className="mc-campo">
                                <label className="mc-label" htmlFor="checkout-direccion">{t.direccionDeEntrega}</label>
                                <input id="checkout-direccion" type="text" className="mc-input" placeholder={t.direccionPlaceholder}
                                    value={direccion} onChange={e => setDireccion(e.target.value)} />
                            </div>
                            <div className="mc-campo" style={{ marginBottom: 0 }}>
                                <label className="mc-label" htmlFor="checkout-telefono">{t.telefonoDeContacto}</label>
                                <input id="checkout-telefono" type="tel" className="mc-input" placeholder={t.telefonoPH}
                                    value={telefono} onChange={e => setTelefono(e.target.value)} />
                            </div>
                        </section>

                        {/* 2. Transportadora */}
                        <section className="mc-panel">
                            <h2 className="mc-panel__titulo"><span className="mc-panel__paso">2</span>{t.transportadora}</h2>
                            <div className="mc-opciones">
                                {TRANSPORTADORAS.map(tr => (
                                    <button key={tr} type="button" className="mc-opcion" aria-pressed={transportadora === tr}
                                        onClick={() => { setTransportadora(tr); setTransportadoraOtros('') }}>
                                        {tr === t.otros && <i className="fas fa-ellipsis-h"></i>}
                                        {tr}
                                    </button>
                                ))}
                            </div>
                            {transportadora === t.otros && (
                                <input type="text" className="mc-input" style={{ marginTop: '12px' }} placeholder={t.nombreTransportadora}
                                    value={transportadoraOtros} onChange={e => setTransportadoraOtros(e.target.value)} autoFocus />
                            )}
                            <div className="mc-alerta mc-alerta--aviso" style={{ marginTop: '14px' }}>
                                <i className="fas fa-truck"></i>
                                <span>El costo del envío corre por cuenta del cliente y se abona directamente a la transportadora al recibir el pedido.</span>
                            </div>
                        </section>

                        {/* 3. Pago */}
                        <section className="mc-panel">
                            <h2 className="mc-panel__titulo"><span className="mc-panel__paso">3</span>{t.metodoDePago}</h2>
                            <div className="mc-opcion mc-opcion--fija">
                                <i className="fas fa-university"></i>
                                <div>
                                    <strong>{t.transferenciaBancaria}</strong>
                                    <small>{t.transferenciaSubtexto}</small>
                                </div>
                            </div>
                            <div className="mc-alerta mc-alerta--aviso" style={{ margin: '12px 0' }}>
                                <i className="fas fa-info-circle"></i><span>{t.avisoTransferencia}</span>
                            </div>
                            {(TIENDA.aliasTransferencia || TIENDA.whatsapp) && (
                                <div className="mc-datos-pago">
                                    <div className="mc-datos-pago__titulo"><i className="fas fa-university"></i> Datos para transferencia</div>
                                    {TIENDA.aliasTransferencia && (
                                        <div className="mc-datos-pago__fila">
                                            <span>Alias:</span>
                                            <strong>{TIENDA.aliasTransferencia}</strong>
                                        </div>
                                    )}
                                    {TIENDA.whatsapp && (
                                        <div className="mc-datos-pago__fila">
                                            <span>WhatsApp / Consultas / Comprobantes</span>
                                            <a href={`https://wa.me/${TIENDA.whatsapp}`} target="_blank" rel="noopener noreferrer" className="mc-whatsapp">
                                                <i className="fab fa-whatsapp"></i> {whatsappLocal}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="mc-campo" style={{ margin: '16px 0 0' }}>
                                <label className="mc-label" htmlFor="checkout-notas">{t.notasAdicionales}</label>
                                <textarea id="checkout-notas" className="mc-input" placeholder={t.notasPlaceholder} rows={3}
                                    value={notas} onChange={e => setNotas(e.target.value)} />
                            </div>
                        </section>
                    </div>

                    <aside className="mc-panel mc-resumen">
                        <h2 className="mc-panel__titulo">{t.resumen}</h2>
                        {items.map(item => (
                            <div key={item.productoId} className="mc-resumen__fila">
                                <span>{item.cantidad}x {item.nombre}</span>
                                <span>Gs. {fmt(item.precioUnitario * item.cantidad)}</span>
                            </div>
                        ))}
                        <div className="mc-resumen__total">
                            <span>{t.total}</span>
                            <strong>Gs. {fmt(totalPrecio)}</strong>
                        </div>
                        <button type="button" onClick={handleConfirmar} disabled={loading} className="mc-btn mc-btn--primario mc-btn--bloque mc-btn--grande">
                            {loading ? <><i className="fas fa-spinner fa-spin"></i>{t.procesando}</> : <><i className="fas fa-check"></i>{t.confirmarPedido}</>}
                        </button>
                        <p className="mc-resumen__nota">{t.pagoTransferenciaResumen}</p>
                    </aside>
                </div>
            </main>
            <Footer />
        </div>
    )
}
