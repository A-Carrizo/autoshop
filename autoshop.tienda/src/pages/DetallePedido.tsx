import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { API } from '../config/api'

interface DetalleItem {
    productoNombre: string
    cantidad: number
    precioUnitario: number
    subtotal: number
}

interface PedidoDetalleCompleto {
    id: string
    numeroPedido: string
    fecha: string
    estado: string
    total: number
    metodoPago: string
    direccionEntrega: string | null
    clienteTelefono: string | null
    notas: string | null
    fechaConfirmacion: string | null
    fechaEntrega: string | null
    fechaCancelacion: string | null
    motivoCancelacion: string | null
    detalles: DetalleItem[]
}

const COL = {
    primary: '#2c5282',
    muted: '#718096',
    border: '#e2e8f0',
}

const ESTADOS: Record<string, { label: string, bg: string, color: string, icon: string }> = {
    PENDIENTE: { label: 'Pendiente de confirmacion', bg: '#fffbeb', color: '#b7791f', icon: 'fa-clock' },
    CONFIRMADO: { label: 'Confirmado', bg: '#ebf8ff', color: '#2b6cb0', icon: 'fa-check-circle' },
    ENTREGADO: { label: 'Entregado', bg: '#f0fff4', color: '#2f855a', icon: 'fa-box' },
    CANCELADO: { label: 'Cancelado', bg: '#fff5f5', color: '#c53030', icon: 'fa-times-circle' },
}

export default function DetallePedido() {
    const { id } = useParams<{ id: string }>()
    const [pedido, setPedido] = useState<PedidoDetalleCompleto | null>(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        if (!id) return
        let cancelado = false
        const cargar = async () => {
            try {
                const token = localStorage.getItem('tienda_token')
                const res = await fetch(`${API.pedidos}/mis-pedidos/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (!res.ok) { if (!cancelado) toast.error('No se encontro el pedido'); return }
                const data = await res.json()
                if (!cancelado) setPedido(data)
            } catch {
                if (!cancelado) toast.error('Error de conexion')
            } finally {
                if (!cancelado) setCargando(false)
            }
        }
        cargar()
        return () => { cancelado = true }
    }, [id])

    const fmt = (n: number) => n.toLocaleString('es-PY')
    const fmtFecha = (f: string) => new Date(f).toLocaleString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

    if (cargando) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f3f7' }}>
                <Header />
                <div style={{ flex: 1, textAlign: 'center', padding: '80px 0', color: COL.muted }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '28px' }}></i>
                </div>
                <Footer />
            </div>
        )
    }

    if (!pedido) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f3f7' }}>
                <Header />
                <div style={{ flex: 1, textAlign: 'center', padding: '80px 20px', color: COL.muted }}>
                    <p style={{ fontSize: '15px', marginBottom: '20px' }}>No se encontro este pedido.</p>
                    <Link to="/mis-pedidos" style={{ color: COL.primary, fontWeight: 600, textDecoration: 'none' }}>
                        <i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i>Volver a mis pedidos
                    </Link>
                </div>
                <Footer />
            </div>
        )
    }

    const estado = ESTADOS[pedido.estado] || ESTADOS.PENDIENTE

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f3f7' }}>
            <Header />

            <main style={{ flex: 1, maxWidth: '700px', margin: '0 auto', padding: '28px 32px', width: '100%' }}>

                <Link to="/mis-pedidos" style={{ color: COL.muted, fontSize: '13px', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>
                    <i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i>Volver a mis pedidos
                </Link>

                <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${COL.border}`, padding: '28px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1a202c', margin: '0 0 4px' }}>{pedido.numeroPedido}</h1>
                            <p style={{ fontSize: '12px', color: COL.muted, margin: 0 }}>{fmtFecha(pedido.fecha)}</p>
                        </div>
                        <span style={{
                            background: estado.bg, color: estado.color,
                            fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '20px', whiteSpace: 'nowrap',
                        }}>
                            <i className={`fas ${estado.icon}`} style={{ marginRight: '6px' }}></i>
                            {estado.label}
                        </span>
                    </div>

                    {pedido.estado === 'CANCELADO' && pedido.motivoCancelacion && (
                        <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#c53030', marginBottom: '16px' }}>
                            <strong>Motivo de cancelacion:</strong> {pedido.motivoCancelacion}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div>
                            <p style={{ fontSize: '11px', color: COL.muted, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>Direccion de entrega</p>
                            <p style={{ fontSize: '13px', color: '#2d3748', margin: 0 }}>{pedido.direccionEntrega || '-'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '11px', color: COL.muted, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>Telefono de contacto</p>
                            <p style={{ fontSize: '13px', color: '#2d3748', margin: 0 }}>{pedido.clienteTelefono || '-'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '11px', color: COL.muted, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>Metodo de pago</p>
                            <p style={{ fontSize: '13px', color: '#2d3748', margin: 0 }}>{pedido.metodoPago === 'TRANSFERENCIA' ? 'Transferencia' : 'Efectivo'}</p>
                        </div>
                        {pedido.notas && (
                            <div>
                                <p style={{ fontSize: '11px', color: COL.muted, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>Notas</p>
                                <p style={{ fontSize: '13px', color: '#2d3748', margin: 0 }}>{pedido.notas}</p>
                            </div>
                        )}
                    </div>

                    <div style={{ borderTop: `1px solid ${COL.border}`, paddingTop: '16px' }}>
                        {pedido.detalles.map((d, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#2d3748', marginBottom: '10px' }}>
                                <span>{d.cantidad}x {d.productoNombre}</span>
                                <span style={{ fontWeight: 600 }}>Gs. {fmt(d.subtotal)}</span>
                            </div>
                        ))}
                        <div style={{ borderTop: `1px solid ${COL.border}`, marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1a202c' }}>Total</span>
                            <span style={{ fontSize: '18px', fontWeight: 800, color: COL.primary }}>Gs. {fmt(pedido.total)}</span>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}