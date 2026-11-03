import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useIdioma } from '../context/IdiomaContext'
import { API } from '../config/api'

interface PedidoResumen { id: string; numeroPedido: string; fecha: string; estado: string; total: number; metodoPago: string; cantidadItems: number }

export default function MisPedidos() {
    const [pedidos, setPedidos] = useState<PedidoResumen[]>([])
    const [cargando, setCargando] = useState(true)
    const { t } = useIdioma()

    const ESTADOS = {
        PENDIENTE: t.pendiente,
        CONFIRMADO: t.confirmado,
        ENTREGADO: t.entregado,
        CANCELADO: t.cancelado,
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
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--mc-fondo)' }}>
            <Header />
            <main className="mc-container mc-pagina mc-pagina--angosta" style={{ flex: 1 }}>
                <div className="mc-titulo-pagina">
                    <h1>{t.misPedidos}</h1>
                </div>
                {cargando ? (
                    <div className="mc-panel mc-filas" aria-hidden="true">
                        {Array.from({ length: 3 }, (_, i) => (
                            <div key={i} className="mc-fila">
                                <div className="mc-fila__principal">
                                    <div className="mc-skeleton" style={{ height: '14px', width: '40%', marginBottom: '6px' }}></div>
                                    <div className="mc-skeleton" style={{ height: '11px', width: '25%' }}></div>
                                </div>
                                <div className="mc-skeleton" style={{ height: '22px', width: '90px' }}></div>
                            </div>
                        ))}
                    </div>
                ) : pedidos.length === 0 ? (
                    <div className="mc-catalogo__vacio">
                        <i className="fas fa-receipt"></i>
                        <strong>{t.sinPedidos}</strong>
                        <Link to="/catalogo" className="mc-btn mc-btn--primario">{t.irAlCatalogo}</Link>
                    </div>
                ) : (
                    <div className="mc-panel mc-filas">
                        {pedidos.map(p => {
                            const estado = ESTADOS[p.estado as keyof typeof ESTADOS] ? p.estado : 'PENDIENTE'
                            return (
                                <Link key={p.id} to={`/mis-pedidos/${p.id}`} className="mc-fila">
                                    <div className="mc-fila__principal">
                                        <strong>{p.numeroPedido}</strong>
                                        <small>{fmtFecha(p.fecha)} · {p.cantidadItems} {p.cantidadItems === 1 ? t.productoEncontrado : t.productosEncontrados}</small>
                                    </div>
                                    <span className={`mc-estado mc-estado--${estado}`}>{ESTADOS[estado as keyof typeof ESTADOS]}</span>
                                    <span className="mc-fila__monto">Gs. {fmt(p.total)}</span>
                                    <i className="fas fa-chevron-right"></i>
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
