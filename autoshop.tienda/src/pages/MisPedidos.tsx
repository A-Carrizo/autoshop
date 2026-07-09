import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useIdioma } from '../context/IdiomaContext'
import { API } from '../config/api'

interface PedidoResumen { id: string; numeroPedido: string; fecha: string; estado: string; total: number; metodoPago: string; cantidadItems: number }
const COL = { primary: '#CC0000', muted: '#718096', border: '#e0e0e0' }

export default function MisPedidos() {
    const [pedidos, setPedidos] = useState<PedidoResumen[]>([])
    const [cargando, setCargando] = useState(true)
    const { t } = useIdioma()

    const ESTADOS = {
        PENDIENTE: { label: t.pendiente, bg: '#fffbeb', color: '#b7791f' },
        CONFIRMADO: { label: t.confirmado, bg: '#ebf8ff', color: '#2b6cb0' },
        ENTREGADO: { label: t.entregado, bg: '#f0fff4', color: '#2f855a' },
        CANCELADO: { label: t.cancelado, bg: '#fff5f5', color: '#c53030' },
    }

    useEffect(() => {
        let cancelado = false
        const cargar = async () => {
            try {
                const token = localStorage.getItem('tienda_token')
                const res = await fetch(`${API.pedidos}/mis-pedidos`, { headers: { 'Authorization': `Bearer ${token}` } })
                const data = await res.json()
                if (!cancelado) setPedidos(data)
            } catch { if (!cancelado) toast.error('No se pudieron cargar tus pedidos') }
            finally { if (!cancelado) setCargando(false) }
        }
        cargar()
        return () => { cancelado = true }
    }, [])

    const fmt = (n: number) => n.toLocaleString('es-PY')
    const fmtFecha = (f: string) => new Date(f).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
            <Header />
            <main style={{ flex: 1, maxWidth: '900px', margin: '0 auto', padding: '28px 32px', width: '100%' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a202c', margin: '0 0 24px' }}>
                    <i className="fas fa-receipt" style={{ marginRight: '10px', color: COL.primary }}></i>{t.misPedidos}
                </h1>
                {cargando ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: COL.muted }}><i className="fas fa-spinner fa-spin" style={{ fontSize: '28px', color: COL.primary }}></i></div>
                ) : pedidos.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${COL.border}`, padding: '60px 20px', textAlign: 'center', color: COL.muted }}>
                        <i className="fas fa-receipt" style={{ fontSize: '40px', marginBottom: '16px', display: 'block', opacity: 0.4 }}></i>
                        <p style={{ fontSize: '15px', marginBottom: '20px' }}>{t.sinPedidos}</p>
                        <Link to="/" style={{ display: 'inline-block', background: COL.primary, color: '#fff', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>{t.irAlCatalogo}</Link>
                    </div>
                ) : (
                    <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${COL.border}`, overflow: 'hidden' }}>
                        {pedidos.map((p, idx) => {
                            const estado = ESTADOS[p.estado as keyof typeof ESTADOS] || ESTADOS.PENDIENTE
                            return (
                                <Link key={p.id} to={`/mis-pedidos/${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px', borderBottom: idx < pedidos.length - 1 ? `1px solid ${COL.border}` : 'none', textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#1a202c', margin: '0 0 4px' }}>{p.numeroPedido}</p>
                                        <p style={{ fontSize: '12px', color: COL.muted, margin: 0 }}>{fmtFecha(p.fecha)} · {p.cantidadItems} producto{p.cantidadItems !== 1 ? 's' : ''}</p>
                                    </div>
                                    <span style={{ background: estado.bg, color: estado.color, fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px' }}>{estado.label}</span>
                                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#1a202c', width: '110px', textAlign: 'right', margin: 0 }}>Gs. {fmt(p.total)}</p>
                                    <i className="fas fa-chevron-right" style={{ color: '#cbd5e0', fontSize: '13px' }}></i>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    )
}