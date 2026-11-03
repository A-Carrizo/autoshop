import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useIdioma } from '../context/IdiomaContext'
import { API } from '../config/api'

interface DetalleItem { productoNombre: string; cantidad: number; precioUnitario: number; subtotal: number }
interface PedidoDetalleCompleto {
    id: string; numeroPedido: string; fecha: string; estado: string; total: number;
    metodoPago: string; direccionEntrega: string | null; clienteTelefono: string | null;
    notas: string | null; fechaConfirmacion: string | null; fechaEntrega: string | null;
    fechaCancelacion: string | null; motivoCancelacion: string | null; detalles: DetalleItem[]
}

export default function DetallePedido() {
    const { id } = useParams<{ id: string }>()
    const [pedido, setPedido] = useState<PedidoDetalleCompleto | null>(null)
    const [cargando, setCargando] = useState(true)
    const { t } = useIdioma()

    const ESTADOS = {
        PENDIENTE: { label: t.pendienteConfirmacion, icon: 'fa-clock' },
        CONFIRMADO: { label: t.confirmado, icon: 'fa-check-circle' },
        ENTREGADO: { label: t.entregado, icon: 'fa-box' },
        CANCELADO: { label: t.cancelado, icon: 'fa-times-circle' },
    }

    useEffect(() => {
        if (!id) return
        let cancelado = false
        const cargar = async () => {
            try {
                const token = localStorage.getItem('tienda_token')
                const res = await fetch(`${API.pedidos}/mis-pedidos/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
                if (!res.ok) { if (!cancelado) toast.error('No se encontro el pedido'); return }
                const data = await res.json()
                if (!cancelado) setPedido(data)
            } catch { if (!cancelado) toast.error('Error de conexion') }
            finally { if (!cancelado) setCargando(false) }
        }
        cargar()
        return () => { cancelado = true }
    }, [id])

    const fmt = (n: number) => n.toLocaleString('es-PY')
    const fmtFecha = (f: string) => new Date(f).toLocaleString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' } as Intl.DateTimeFormatOptions)

    const pagina = (contenido: React.ReactNode) => (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--mc-fondo)' }}>
            <Header />
            <main className="mc-container mc-pagina mc-pagina--angosta" style={{ flex: 1 }}>{contenido}</main>
            <Footer />
        </div>
    )

    if (cargando) return pagina(
        <div className="mc-panel" aria-hidden="true">
            <div className="mc-skeleton" style={{ height: '22px', width: '40%', marginBottom: '10px' }}></div>
            <div className="mc-skeleton" style={{ height: '12px', width: '25%', marginBottom: '24px' }}></div>
            <div className="mc-skeleton" style={{ height: '120px' }}></div>
        </div>
    )

    if (!pedido) return pagina(
        <div className="mc-catalogo__vacio">
            <i className="fas fa-receipt"></i>
            <strong>No se encontro este pedido.</strong>
            <Link to="/mis-pedidos" className="mc-btn mc-btn--primario"><i className="fas fa-arrow-left"></i>{t.volverAMisPedidos}</Link>
        </div>
    )

    const claveEstado = (pedido.estado in ESTADOS ? pedido.estado : 'PENDIENTE') as keyof typeof ESTADOS
    const estado = ESTADOS[claveEstado]
    const datos = [
        { label: t.direccionDeEntrega, val: pedido.direccionEntrega },
        { label: t.telefonoDeContacto, val: pedido.clienteTelefono },
        { label: t.metodoDePagoLabel, val: pedido.metodoPago === 'TRANSFERENCIA' ? t.transferencia : pedido.metodoPago },
        ...(pedido.notas ? [{ label: t.notas, val: pedido.notas }] : []),
    ]

    return pagina(
        <>
            <Link to="/mis-pedidos" className="mc-volver"><i className="fas fa-arrow-left"></i>{t.volverAMisPedidos}</Link>
            <div className="mc-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                    <div className="mc-titulo-pagina" style={{ marginBottom: 0 }}>
                        <h1>{pedido.numeroPedido}</h1>
                        <p>{fmtFecha(pedido.fecha)}</p>
                    </div>
                    <span className={`mc-estado mc-estado--${claveEstado}`}>
                        <i className={`fas ${estado.icon}`}></i>{estado.label}
                    </span>
                </div>

                {pedido.estado === 'CANCELADO' && pedido.motivoCancelacion && (
                    <div className="mc-alerta mc-alerta--error" style={{ marginBottom: '20px' }}>
                        <i className="fas fa-times-circle"></i>
                        <span><strong>{t.motivoCancelacion}</strong> {pedido.motivoCancelacion}</span>
                    </div>
                )}

                <dl className="mc-datos">
                    {datos.map(item => (
                        <div key={item.label}>
                            <dt>{item.label}</dt>
                            <dd>{item.val || '-'}</dd>
                        </div>
                    ))}
                </dl>

                <div className="mc-resumen" style={{ paddingTop: '16px', borderTop: '1px solid var(--mc-borde)' }}>
                    {pedido.detalles.map((d, idx) => (
                        <div key={idx} className="mc-resumen__fila">
                            <span>{d.cantidad}x {d.productoNombre}</span>
                            <span>Gs. {fmt(d.subtotal)}</span>
                        </div>
                    ))}
                    <div className="mc-resumen__total">
                        <span>{t.total}</span>
                        <strong>Gs. {fmt(pedido.total)}</strong>
                    </div>
                </div>
            </div>
        </>
    )
}
