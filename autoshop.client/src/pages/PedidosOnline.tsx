import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import ConfirmModal from '../components/ui/ConfirmModal'
import { API } from '../config/api'

interface Pedido {
    id: string
    numeroPedido: string
    fecha: string
    estado: string
    total: number
    metodoPago: string
    clienteNombre: string
    clienteTelefono: string | null
    direccionEntrega: string | null
    clienteEmail: string
    cantidadItems: number
}

interface DetalleItem {
    productoId: string
    productoNombre: string
    cantidad: number
    precioUnitario: number
    subtotal: number
}

interface PedidoDetalle extends Pedido {
    notas: string | null
    fechaConfirmacion: string | null
    fechaEntrega: string | null
    fechaCancelacion: string | null
    motivoCancelacion: string | null
    detalles: DetalleItem[]
}

const ESTADO_CONFIG: Record<string, { label: string, bg: string, color: string, icon: string }> = {
    PENDIENTE: { label: 'Pendiente', bg: '#fffbeb', color: '#b7791f', icon: 'fa-clock' },
    CONFIRMADO: { label: 'Confirmado', bg: '#ebf8ff', color: '#2b6cb0', icon: 'fa-check-circle' },
    ENTREGADO: { label: 'Entregado', bg: '#f0fff4', color: '#2f855a', icon: 'fa-box' },
    CANCELADO: { label: 'Cancelado', bg: '#fff5f5', color: '#c53030', icon: 'fa-times-circle' },
}

export default function PedidosOnline() {
    const [pedidos, setPedidos] = useState<Pedido[]>([])
    const [loading, setLoading] = useState(true)
    const [filtroEstado, setFiltroEstado] = useState('')
    const [detalle, setDetalle] = useState<PedidoDetalle | null>(null)
    const [showDetalle, setShowDetalle] = useState(false)
    const [procesando, setProcesando] = useState(false)
    const [motivoCancelacion, setMotivoCancelacion] = useState('')
    const [showCancelar, setShowCancelar] = useState(false)
    const [showConfirmar, setShowConfirmar] = useState(false)
    const [showEntregar, setShowEntregar] = useState(false)

    const cargar = async (estado = filtroEstado) => {
        setLoading(true)
        try {
            const url = estado
                ? `${API.pedidos}/admin?estado=${estado}`
                : `${API.pedidos}/admin`
            const res = await fetch(url)
            const data = await res.json()
            setPedidos(data)
        } catch {
            toast.error('No se pudieron cargar los pedidos')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        let cancelado = false
        const init = async () => {
            setLoading(true)
            try {
                const res = await fetch(`${API.pedidos}/admin`)
                const data = await res.json()
                if (!cancelado) setPedidos(data)
            } catch {
                if (!cancelado) toast.error('No se pudieron cargar los pedidos')
            } finally {
                if (!cancelado) setLoading(false)
            }
        }
        init()
        return () => { cancelado = true }
    }, [])

    const verDetalle = async (id: string) => {
        try {
            const res = await fetch(`${API.pedidos}/admin/${id}`)
            const data = await res.json()
            setDetalle(data)
            setShowDetalle(true)
            setMotivoCancelacion('')
        } catch {
            toast.error('No se pudo cargar el detalle')
        }
    }

    const confirmarPedido = async () => {
        if (!detalle) return
        setProcesando(true)
        try {
            const res = await fetch(`${API.pedidos}/admin/${detalle.id}/confirmar`, { method: 'PUT' })
            const data = await res.json()
            if (!res.ok) { toast.error(data.mensaje || 'Error al confirmar'); return }
            toast.success('Pedido confirmado. Stock actualizado.')
            setShowConfirmar(false)
            setShowDetalle(false)
            await cargar()
        } catch {
            toast.error('Error de conexion')
        } finally {
            setProcesando(false)
        }
    }

    const entregarPedido = async () => {
        if (!detalle) return
        setProcesando(true)
        try {
            const res = await fetch(`${API.pedidos}/admin/${detalle.id}/entregar`, { method: 'PUT' })
            const data = await res.json()
            if (!res.ok) { toast.error(data.mensaje || 'Error al marcar como entregado'); return }
            toast.success('Pedido marcado como entregado.')
            setShowEntregar(false)
            setShowDetalle(false)
            await cargar()
        } catch {
            toast.error('Error de conexion')
        } finally {
            setProcesando(false)
        }
    }

    const cancelarPedido = async () => {
        if (!detalle) return
        setProcesando(true)
        try {
            const res = await fetch(`${API.pedidos}/admin/${detalle.id}/cancelar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ motivo: motivoCancelacion.trim() || null })
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.mensaje || 'Error al cancelar'); return }
            toast.success('Pedido cancelado.')
            setShowCancelar(false)
            setShowDetalle(false)
            await cargar()
        } catch {
            toast.error('Error de conexion')
        } finally {
            setProcesando(false)
        }
    }

    const fmt = (n: number) => n.toLocaleString('es-PY')
    const fmtFecha = (f: string) => new Date(f).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' } as Intl.DateTimeFormatOptions)

    const pendientes = pedidos.filter(p => p.estado === 'PENDIENTE').length

    return (
        <Layout titulo="Pedidos Online">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 style={{ fontWeight: 700, margin: 0 }}>Pedidos Online</h5>
                    <small style={{ color: 'var(--text-muted)' }}>
                        {pedidos.length} pedidos
                        {pendientes > 0 && <span style={{ color: '#b7791f', fontWeight: 700 }}> · {pendientes} pendiente{pendientes !== 1 ? 's' : ''}</span>}
                    </small>
                </div>
                <div className="d-flex gap-2">
                    {['', 'PENDIENTE', 'CONFIRMADO', 'ENTREGADO', 'CANCELADO'].map(estado => {
                        const cfg = estado ? ESTADO_CONFIG[estado] : null
                        return (
                            <button key={estado} onClick={() => { setFiltroEstado(estado); cargar(estado) }}
                                className="btn btn-sm"
                                style={{
                                    background: filtroEstado === estado ? 'var(--primary)' : 'white',
                                    color: filtroEstado === estado ? 'white' : 'var(--text-muted)',
                                    border: '1px solid var(--primary)', fontWeight: 500, fontSize: '12px',
                                }}>
                                {cfg && <i className={`fas ${cfg.icon} mr-1`}></i>}
                                {estado === '' ? 'Todos' : cfg?.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Tabla */}
            <div className="card">
                <div className="card-header">
                    <i className="fas fa-store mr-2" style={{ color: 'var(--primary)' }}></i>
                    Pedidos de la tienda online
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-bordered mb-0">
                            <thead>
                                <tr>
                                    <th>Numero</th>
                                    <th>Fecha</th>
                                    <th>Cliente</th>
                                    <th>Contacto</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Pago</th>
                                    <th>Estado</th>
                                    <th style={{ width: '80px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={9} className="text-center py-4">
                                        <i className="fas fa-spinner fa-spin mr-2" style={{ color: 'var(--primary)' }}></i>Cargando...
                                    </td></tr>
                                ) : pedidos.length === 0 ? (
                                    <tr><td colSpan={9} className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                                        No hay pedidos{filtroEstado ? ` con estado "${ESTADO_CONFIG[filtroEstado]?.label}"` : ''}.
                                    </td></tr>
                                ) : pedidos.map(p => {
                                    const cfg = ESTADO_CONFIG[p.estado] || ESTADO_CONFIG.PENDIENTE
                                    return (
                                        <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => verDetalle(p.id)}>
                                            <td>
                                                <span style={{ fontFamily: 'monospace', fontSize: '12px', background: 'var(--primary-light)', padding: '2px 6px', borderRadius: '4px', color: 'var(--primary-dark)', fontWeight: 700 }}>
                                                    {p.numeroPedido}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtFecha(p.fecha)}</td>
                                            <td>
                                                <div style={{ fontWeight: 600, fontSize: '13px' }}>{p.clienteNombre}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.clienteEmail}</div>
                                            </td>
                                            <td style={{ fontSize: '12px' }}>{p.clienteTelefono || '—'}</td>
                                            <td style={{ textAlign: 'center', fontSize: '13px' }}>{p.cantidadItems}</td>
                                            <td style={{ fontWeight: 700, color: 'var(--primary-dark)', whiteSpace: 'nowrap' }}>Gs. {fmt(p.total)}</td>
                                            <td>
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                    <i className={`fas ${p.metodoPago === 'TRANSFERENCIA' ? 'fa-university' : 'fa-money-bill-wave'} mr-1`}></i>
                                                    {p.metodoPago === 'TRANSFERENCIA' ? 'Transferencia' : 'Efectivo'}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ background: cfg.bg, color: cfg.color, fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                                                    <i className={`fas ${cfg.icon} mr-1`}></i>{cfg.label}
                                                </span>
                                            </td>
                                            <td onClick={e => e.stopPropagation()}>
                                                <button className="btn btn-sm btn-primary" onClick={() => verDetalle(p.id)} style={{ padding: '5px 10px' }}>
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal detalle */}
            {showDetalle && detalle && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '14px', width: '100%', maxWidth: '640px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>

                        <div style={{ padding: '20px 24px', borderBottom: '2px solid var(--primary-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h5 style={{ fontWeight: 700, margin: 0 }}>
                                    <i className="fas fa-receipt mr-2" style={{ color: 'var(--primary)' }}></i>
                                    {detalle.numeroPedido}
                                </h5>
                                <small style={{ color: 'var(--text-muted)' }}>{fmtFecha(detalle.fecha)}</small>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {(() => {
                                    const cfg = ESTADO_CONFIG[detalle.estado] || ESTADO_CONFIG.PENDIENTE
                                    return (
                                        <span style={{ background: cfg.bg, color: cfg.color, fontSize: '12px', fontWeight: 700, padding: '5px 14px', borderRadius: '20px' }}>
                                            <i className={`fas ${cfg.icon} mr-1`}></i>{cfg.label}
                                        </span>
                                    )
                                })()}
                                <button onClick={() => setShowDetalle(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                            </div>
                        </div>

                        <div style={{ padding: '24px' }}>

                            {/* Datos cliente */}
                            <div style={{ background: 'var(--primary-light)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                                <div className="row">
                                    <div className="col-6 mb-2">
                                        <small style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px' }}>Cliente</small>
                                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{detalle.clienteNombre}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{detalle.clienteEmail}</div>
                                    </div>
                                    <div className="col-6 mb-2">
                                        <small style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px' }}>Telefono</small>
                                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{detalle.clienteTelefono || '—'}</div>
                                    </div>
                                    <div className="col-6">
                                        <small style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px' }}>Direccion entrega</small>
                                        <div style={{ fontSize: '13px' }}>{detalle.direccionEntrega || '—'}</div>
                                    </div>
                                    <div className="col-6">
                                        <small style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px' }}>Metodo de pago</small>
                                        <div style={{ fontSize: '13px', fontWeight: 600 }}>
                                            <i className={`fas ${detalle.metodoPago === 'TRANSFERENCIA' ? 'fa-university' : 'fa-money-bill-wave'} mr-1`} style={{ color: 'var(--primary)' }}></i>
                                            {detalle.metodoPago === 'TRANSFERENCIA' ? 'Transferencia' : 'Efectivo'}
                                        </div>
                                    </div>
                                    {detalle.notas && (
                                        <div className="col-12 mt-2">
                                            <small style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px' }}>Notas del cliente</small>
                                            <div style={{ fontSize: '13px', fontStyle: 'italic' }}>{detalle.notas}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Items */}
                            <table className="table table-bordered mb-0" style={{ marginBottom: '20px !important' }}>
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th style={{ textAlign: 'center', width: '60px' }}>Cant.</th>
                                        <th style={{ textAlign: 'right' }}>Precio unit.</th>
                                        <th style={{ textAlign: 'right' }}>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detalle.detalles.map((d, i) => (
                                        <tr key={i}>
                                            <td style={{ fontSize: '13px' }}>{d.productoNombre}</td>
                                            <td style={{ textAlign: 'center', fontSize: '13px' }}>{d.cantidad}</td>
                                            <td style={{ textAlign: 'right', fontSize: '13px' }}>Gs. {fmt(d.precioUnitario)}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '13px' }}>Gs. {fmt(d.subtotal)}</td>
                                        </tr>
                                    ))}
                                    <tr style={{ background: 'var(--primary-light)' }}>
                                        <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700 }}>Total</td>
                                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--primary-dark)', fontSize: '16px' }}>Gs. {fmt(detalle.total)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Motivo cancelacion */}
                            {detalle.estado === 'CANCELADO' && detalle.motivoCancelacion && (
                                <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#c53030' }}>
                                    <strong>Motivo de cancelacion:</strong> {detalle.motivoCancelacion}
                                </div>
                            )}

                            {/* Input motivo cancelacion */}
                            {showCancelar && (
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block' }}>Motivo de cancelacion (opcional)</label>
                                    <input type="text" className="form-control" placeholder="Ej: Sin stock, cliente desistio..."
                                        value={motivoCancelacion} onChange={e => setMotivoCancelacion(e.target.value)} autoFocus />
                                </div>
                            )}

                            {/* Botones de accion */}
                            {detalle.estado === 'PENDIENTE' && !showCancelar && (
                                <div className="d-flex gap-2">
                                    <button onClick={() => setShowConfirmar(true)}
                                        className="btn btn-primary flex-grow-1" disabled={procesando}>
                                        <i className="fas fa-check mr-1"></i> Confirmar pedido
                                    </button>
                                    <button onClick={() => setShowCancelar(true)}
                                        className="btn btn-sm" style={{ background: 'var(--secondary)', color: 'white', border: 'none', padding: '8px 16px' }}>
                                        <i className="fas fa-times mr-1"></i> Cancelar
                                    </button>
                                </div>
                            )}

                            {detalle.estado === 'PENDIENTE' && showCancelar && (
                                <div className="d-flex gap-2">
                                    <button onClick={cancelarPedido} disabled={procesando}
                                        className="btn btn-sm flex-grow-1" style={{ background: 'var(--secondary)', color: 'white', border: 'none', padding: '10px' }}>
                                        {procesando ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-times mr-1"></i>}
                                        Confirmar cancelacion
                                    </button>
                                    <button onClick={() => { setShowCancelar(false); setMotivoCancelacion('') }}
                                        className="btn btn-sm" style={{ background: 'var(--light)', border: '1px solid var(--border)', padding: '10px 16px' }}>
                                        Volver
                                    </button>
                                </div>
                            )}

                            {detalle.estado === 'CONFIRMADO' && (
                                <div className="d-flex gap-2">
                                    <button onClick={() => setShowEntregar(true)}
                                        className="btn flex-grow-1" style={{ background: '#2f855a', color: 'white', border: 'none', padding: '10px' }} disabled={procesando}>
                                        <i className="fas fa-box mr-1"></i> Marcar como entregado
                                    </button>
                                    <button onClick={() => setShowCancelar(true)}
                                        className="btn btn-sm" style={{ background: 'var(--secondary)', color: 'white', border: 'none', padding: '10px 16px' }}>
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                show={showConfirmar}
                titulo="¿Confirmar pedido?"
                mensaje="Se va a descontar el stock de todos los productos del pedido. Esta accion no se puede deshacer."
                onConfirmar={confirmarPedido}
                onCancelar={() => setShowConfirmar(false)}
                tipo="warning"
            />

            <ConfirmModal
                show={showEntregar}
                titulo="¿Marcar como entregado?"
                mensaje="El pedido se marcara como entregado definitivamente."
                onConfirmar={entregarPedido}
                onCancelar={() => setShowEntregar(false)}
                tipo="warning"
            />
        </Layout>
    )
}