import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import ConfirmModal from '../components/ui/ConfirmModal'
import { API } from '../config/api'

interface PedidoResumen {
    id: string
    numeroPedido: string
    fecha: string
    estado: string
    total: number
    metodoPago: string
    clienteNombre: string
    clienteEmail: string | null
    direccionEntrega: string | null
    cantidadItems: number
}

interface PedidoDetalle extends PedidoResumen {
    clienteTelefono: string | null
    notas: string | null
    fechaConfirmacion: string | null
    fechaEntrega: string | null
    fechaCancelacion: string | null
    motivoCancelacion: string | null
    detalles: {
        productoId: string
        productoNombre: string
        precioUnitario: number
        cantidad: number
        subtotal: number
    }[]
}

const fmt = (n: number) => Math.round(n).toLocaleString('es-PY')
const fmtFecha = (f: string) => new Date(f).toLocaleDateString('es-PY', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
} as Intl.DateTimeFormatOptions)

const ESTADOS: Record<string, { label: string, bg: string, color: string }> = {
    PENDIENTE: { label: 'Pendiente', bg: '#fffbeb', color: '#b7791f' },
    CONFIRMADO: { label: 'Confirmado', bg: '#ebf8ff', color: '#2b6cb0' },
    ENTREGADO: { label: 'Entregado', bg: '#f0fff4', color: '#2f855a' },
    CANCELADO: { label: 'Cancelado', bg: '#fff5f5', color: '#c53030' },
}

export default function PedidosOnline() {
    const [pedidos, setPedidos] = useState<PedidoResumen[]>([])
    const [loading, setLoading] = useState(true)
    const [filtroEstado, setFiltroEstado] = useState('')
    const [pedidoDetalle, setPedidoDetalle] = useState<PedidoDetalle | null>(null)
    const [modalConfirmar, setModalConfirmar] = useState(false)
    const [modalEntregar, setModalEntregar] = useState(false)
    const [modalCancelar, setModalCancelar] = useState(false)
    const [motivoCancelacion, setMotivoCancelacion] = useState('')
    const [procesando, setProcesando] = useState(false)

    const cargarPedidos = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API.pedidos}/admin?tamano=100`)
            const data = await res.json()
            setPedidos(data.datos || [])
        } catch {
            toast.error('Error al cargar pedidos')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        cargarPedidos()
    }, [cargarPedidos])

    const verDetalle = async (id: string) => {
        try {
            const res = await fetch(`${API.pedidos}/admin/${id}`)
            const data = await res.json()
            setPedidoDetalle(data)
        } catch {
            toast.error('Error al cargar el detalle')
        }
    }

    const confirmarPedido = async () => {
        if (!pedidoDetalle) return
        setProcesando(true)
        try {
            const res = await fetch(`${API.pedidos}/admin/${pedidoDetalle.id}/confirmar`, { method: 'PUT' })
            const data = await res.json()
            if (!res.ok) { toast.error(data.mensaje || 'Error al confirmar'); return }
            toast.success(`Pedido confirmado. Factura: ${data.numeroFactura}`)
            setModalConfirmar(false)
            setPedidoDetalle(prev => prev ? { ...prev, estado: 'CONFIRMADO' } : null)
            cargarPedidos()
        } catch { toast.error('Error de conexión') }
        finally { setProcesando(false) }
    }

    const entregarPedido = async () => {
        if (!pedidoDetalle) return
        setProcesando(true)
        try {
            const res = await fetch(`${API.pedidos}/admin/${pedidoDetalle.id}/entregar`, { method: 'PUT' })
            if (!res.ok) { toast.error('Error al marcar como entregado'); return }
            toast.success('Pedido marcado como entregado')
            setModalEntregar(false)
            setPedidoDetalle(prev => prev ? { ...prev, estado: 'ENTREGADO' } : null)
            cargarPedidos()
        } catch { toast.error('Error de conexión') }
        finally { setProcesando(false) }
    }

    const cancelarPedido = async () => {
        if (!pedidoDetalle) return
        setProcesando(true)
        try {
            const res = await fetch(`${API.pedidos}/admin/${pedidoDetalle.id}/cancelar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ motivo: motivoCancelacion })
            })
            if (!res.ok) { toast.error('Error al cancelar'); return }
            toast.success('Pedido cancelado')
            setModalCancelar(false)
            setMotivoCancelacion('')
            setPedidoDetalle(prev => prev ? { ...prev, estado: 'CANCELADO' } : null)
            cargarPedidos()
        } catch { toast.error('Error de conexión') }
        finally { setProcesando(false) }
    }

    const pedidosFiltrados = pedidos.filter(p => !filtroEstado || p.estado === filtroEstado)

    const thStyle: React.CSSProperties = {
        background: 'var(--dark)', color: 'white',
        padding: '10px 16px', fontWeight: 600, fontSize: '13px', textAlign: 'left'
    }

    return (
        <Layout titulo="Pedidos Online">
            <div style={{ display: 'grid', gridTemplateColumns: pedidoDetalle ? '1fr 380px' : '1fr', gap: '20px', alignItems: 'start' }}>

                {/* Lista */}
                <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        {['', 'PENDIENTE', 'CONFIRMADO', 'ENTREGADO', 'CANCELADO'].map(e => (
                            <button key={e} onClick={() => setFiltroEstado(e)}
                                style={{
                                    padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px',
                                    border: `1.5px solid ${filtroEstado === e ? 'var(--primary)' : 'var(--border)'}`,
                                    background: filtroEstado === e ? 'var(--primary-light)' : 'white',
                                    color: filtroEstado === e ? 'var(--primary-dark)' : 'var(--text-muted)',
                                    fontWeight: filtroEstado === e ? 700 : 400,
                                }}>
                                {e === '' ? 'Todos' : ESTADOS[e]?.label}
                                {e !== '' && (
                                    <span style={{ marginLeft: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '10px', padding: '1px 6px', fontSize: '11px' }}>
                                        {pedidos.filter(p => p.estado === e).length}
                                    </span>
                                )}
                            </button>
                        ))}
                        <button onClick={cargarPedidos} style={{ marginLeft: 'auto', background: 'none', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <i className="fas fa-sync-alt"></i>
                        </button>
                    </div>

                    <div className="card">
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                                <i className="fas fa-spinner fa-spin fa-2x"></i>
                            </div>
                        ) : pedidosFiltrados.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                                <i className="fas fa-shopping-bag fa-3x" style={{ opacity: 0.15, display: 'block', marginBottom: '12px' }}></i>
                                <p>No hay pedidos{filtroEstado ? ` con estado "${ESTADOS[filtroEstado]?.label}"` : ''}.</p>
                            </div>
                        ) : (
                            <table className="table mb-0">
                                <thead>
                                    <tr>
                                        <th style={thStyle}>N° Pedido</th>
                                        <th style={thStyle}>Fecha</th>
                                        <th style={thStyle}>Cliente</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Estado</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                                        <th style={thStyle}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pedidosFiltrados.map(p => {
                                        const est = ESTADOS[p.estado] || ESTADOS.PENDIENTE
                                        return (
                                            <tr key={p.id} style={{ cursor: 'pointer', background: pedidoDetalle?.id === p.id ? 'var(--primary-light)' : 'white' }}
                                                onClick={() => verDetalle(p.id)}
                                                onMouseEnter={e => { if (pedidoDetalle?.id !== p.id) e.currentTarget.style.background = 'var(--primary-light)' }}
                                                onMouseLeave={e => { if (pedidoDetalle?.id !== p.id) e.currentTarget.style.background = 'white' }}>
                                                <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: '14px' }}>{p.numeroPedido}</td>
                                                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtFecha(p.fecha)}</td>
                                                <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                                                    <div>{p.clienteNombre}</div>
                                                    {p.clienteEmail && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.clienteEmail}</div>}
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                    <span style={{ background: est.bg, color: est.color, fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>{est.label}</span>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '14px' }}>₲ {fmt(p.total)}</td>
                                                <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                                    <i className="fas fa-chevron-right" style={{ color: 'var(--text-muted)', fontSize: '12px' }}></i>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Detalle */}
                {pedidoDetalle && (
                    <div style={{ position: 'sticky', top: '20px' }}>
                        <div className="card mb-3">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <span style={{ fontWeight: 700 }}>{pedidoDetalle.numeroPedido}</span>
                                <button onClick={() => setPedidoDetalle(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px' }}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="card-body" style={{ fontSize: '13px' }}>
                                <div style={{ marginBottom: '12px' }}>
                                    {(() => { const est = ESTADOS[pedidoDetalle.estado] || ESTADOS.PENDIENTE; return <span style={{ background: est.bg, color: est.color, fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px' }}>{est.label}</span> })()}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>CLIENTE</div>
                                        <div style={{ fontWeight: 600 }}>{pedidoDetalle.clienteNombre}</div>
                                        {pedidoDetalle.clienteEmail && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pedidoDetalle.clienteEmail}</div>}
                                        {pedidoDetalle.clienteTelefono && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pedidoDetalle.clienteTelefono}</div>}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>FECHA</div>
                                        <div>{fmtFecha(pedidoDetalle.fecha)}</div>
                                    </div>
                                    {pedidoDetalle.direccionEntrega && (
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>DIRECCIÓN</div>
                                            <div>{pedidoDetalle.direccionEntrega}</div>
                                        </div>
                                    )}
                                    {pedidoDetalle.notas && (
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>NOTAS</div>
                                            <div style={{ color: 'var(--text-muted)' }}>{pedidoDetalle.notas}</div>
                                        </div>
                                    )}
                                </div>

                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--dark)' }}>
                                            <th style={{ padding: '7px 10px', fontSize: '11px', color: 'white', textAlign: 'left' }}>Producto</th>
                                            <th style={{ padding: '7px 10px', fontSize: '11px', color: 'white', textAlign: 'center' }}>Cant.</th>
                                            <th style={{ padding: '7px 10px', fontSize: '11px', color: 'white', textAlign: 'right' }}>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pedidoDetalle.detalles.map((d, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '8px 10px', fontSize: '12px' }}>{d.productoNombre}</td>
                                                <td style={{ padding: '8px 10px', fontSize: '12px', textAlign: 'center' }}>{d.cantidad}</td>
                                                <td style={{ padding: '8px 10px', fontSize: '12px', textAlign: 'right', fontWeight: 600 }}>₲ {fmt(d.subtotal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ borderTop: '2px solid var(--border)' }}>
                                            <td colSpan={2} style={{ padding: '10px', fontWeight: 700 }}>Total</td>
                                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, fontSize: '16px', color: 'var(--primary-dark)' }}>₲ {fmt(pedidoDetalle.total)}</td>
                                        </tr>
                                    </tfoot>
                                </table>

                                {/* Acciones */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {pedidoDetalle.estado === 'PENDIENTE' && (
                                        <>
                                            <button onClick={() => setModalConfirmar(true)} className="btn btn-primary btn-sm" style={{ fontWeight: 600 }}>
                                                <i className="fas fa-check mr-2"></i>Confirmar pedido
                                            </button>
                                            <button onClick={() => setModalCancelar(true)} className="btn btn-sm" style={{ background: '#fff5f5', color: '#c53030', border: '1px solid #fed7d7', fontWeight: 600 }}>
                                                <i className="fas fa-times mr-2"></i>Cancelar pedido
                                            </button>
                                        </>
                                    )}
                                    {pedidoDetalle.estado === 'CONFIRMADO' && (
                                        <>
                                            <button onClick={() => setModalEntregar(true)} className="btn btn-sm" style={{ background: '#f0fff4', color: '#2f855a', border: '1px solid #c6f6d5', fontWeight: 600 }}>
                                                <i className="fas fa-box mr-2"></i>Marcar como entregado
                                            </button>
                                            <button onClick={() => setModalCancelar(true)} className="btn btn-sm" style={{ background: '#fff5f5', color: '#c53030', border: '1px solid #fed7d7', fontWeight: 600 }}>
                                                <i className="fas fa-times mr-2"></i>Cancelar pedido
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal show={modalConfirmar} titulo="Confirmar pedido"
                mensaje="Se descontará el stock y se creará una venta en el sistema."
                onConfirmar={confirmarPedido} onCancelar={() => setModalConfirmar(false)}
                tipo="warning" textoConfirmar={procesando ? 'Procesando...' : 'Confirmar'} />

            <ConfirmModal show={modalEntregar} titulo="Marcar como entregado"
                mensaje="¿Confirmas que el pedido fue entregado al cliente?"
                onConfirmar={entregarPedido} onCancelar={() => setModalEntregar(false)}
                tipo="warning" textoConfirmar={procesando ? 'Procesando...' : 'Marcar entregado'} />

            <ConfirmModal show={modalCancelar} titulo="Cancelar pedido"
                mensaje=""
                onConfirmar={cancelarPedido} onCancelar={() => { setModalCancelar(false); setMotivoCancelacion('') }}
                tipo="danger" textoConfirmar={procesando ? 'Procesando...' : 'Cancelar pedido'}>
                <div style={{ marginTop: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Motivo de cancelación (opcional)</label>
                    <textarea className="form-control" rows={3} placeholder="Ej: Cliente desistió del pedido..."
                        value={motivoCancelacion} onChange={e => setMotivoCancelacion(e.target.value)} />
                </div>
            </ConfirmModal>
        </Layout>
    )
}