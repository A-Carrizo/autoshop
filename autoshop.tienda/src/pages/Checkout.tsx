import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useCarrito } from '../context/CarritoContext'
import { useIdioma } from '../context/IdiomaContext'
import { API } from '../config/api'

const COL = { primary: '#CC0000', primaryDark: '#880000', muted: '#718096', border: '#e0e0e0' }
const TRANSPORTADORAS_BASE = ['Jet', 'Flash Courier', 'Logros', 'Coordinadora', 'DHL']

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
    const fmt = (n: number) => n.toLocaleString('es-PY')

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
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
            <Header />
            <div style={{ flex: 1, textAlign: 'center', padding: '80px 20px', color: COL.muted }}>
                <i className="fas fa-shopping-cart" style={{ fontSize: '40px', marginBottom: '16px', display: 'block', opacity: 0.4 }}></i>
                <p style={{ fontSize: '15px', marginBottom: '20px' }}>{t.carritoVacio}</p>
                <Link to="/" style={{ color: COL.primary, fontWeight: 600, textDecoration: 'none' }}><i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i>{t.volverAlCatalogo}</Link>
            </div>
            <Footer />
        </div>
    )

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
            <Header />
            <main style={{ flex: 1, maxWidth: '1000px', margin: '0 auto', padding: '28px 32px', width: '100%' }}>
                <Link to="/carrito" style={{ color: COL.muted, fontSize: '13px', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>
                    <i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i>{t.volverAlCarrito}
                </Link>
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a202c', margin: '0 0 24px' }}>{t.finalizarPedido}</h1>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${COL.border}`, padding: '28px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a202c', margin: '0 0 16px' }}>{t.datosDeEntrega}</h2>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>{t.direccionDeEntrega}</label>
                            <input type="text" placeholder={t.direccionPlaceholder} value={direccion} onChange={e => setDireccion(e.target.value)}
                                style={{ width: '100%', padding: '11px 12px', border: `1.5px solid ${COL.border}`, borderRadius: '8px', fontSize: '14px', color: '#2d3748', outline: 'none' }} />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>{t.telefonoDeContacto}</label>
                            <input type="tel" placeholder={t.telefonoPH} value={telefono} onChange={e => setTelefono(e.target.value)}
                                style={{ width: '100%', padding: '11px 12px', border: `1.5px solid ${COL.border}`, borderRadius: '8px', fontSize: '14px', color: '#2d3748', outline: 'none' }} />
                        </div>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a202c', margin: '0 0 12px' }}>{t.transportadora}</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: transportadora === t.otros ? '12px' : '20px' }}>
                            {TRANSPORTADORAS.map(tr => (
                                <button key={tr} onClick={() => { setTransportadora(tr); setTransportadoraOtros('') }}
                                    style={{ padding: '12px 8px', borderRadius: '10px', cursor: 'pointer', border: transportadora === tr ? `2px solid ${COL.primary}` : `1.5px solid ${COL.border}`, background: transportadora === tr ? '#fff0f0' : '#fff', color: transportadora === tr ? COL.primary : '#718096', fontWeight: 600, fontSize: '13px', textAlign: 'center', fontFamily: 'inherit' }}>
                                    {tr === t.otros && <i className="fas fa-ellipsis-h" style={{ display: 'block', fontSize: '16px', marginBottom: '4px' }}></i>}
                                    {tr}
                                </button>
                            ))}
                        </div>
                        {transportadora === t.otros && (
                            <div style={{ marginBottom: '20px' }}>
                                <input type="text" placeholder={t.nombreTransportadora} value={transportadoraOtros} onChange={e => setTransportadoraOtros(e.target.value)} autoFocus
                                    style={{ width: '100%', padding: '11px 12px', border: `1.5px solid ${COL.primary}`, borderRadius: '8px', fontSize: '14px', color: '#2d3748', outline: 'none' }} />
                            </div>
                        )}
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a202c', margin: '0 0 12px' }}>{t.metodoDePago}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fff0f0', border: `1.5px solid ${COL.primary}`, borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
                            <i className="fas fa-university" style={{ fontSize: '20px', color: COL.primary }}></i>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '14px', color: COL.primary }}>{t.transferenciaBancaria}</div>
                                <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>{t.transferenciaSubtexto}</div>
                            </div>
                        </div>
                        <div style={{ background: '#fff8f0', border: '1px solid #fbd38d', borderRadius: '10px', padding: '12px 16px', fontSize: '12px', color: '#744210', marginBottom: '20px' }}>
                            <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>{t.avisoTransferencia}
                        </div>
                        <div>
                            <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>{t.notasAdicionales}</label>
                            <textarea placeholder={t.notasPlaceholder} value={notas} onChange={e => setNotas(e.target.value)} rows={3}
                                style={{ width: '100%', padding: '11px 12px', border: `1.5px solid ${COL.border}`, borderRadius: '8px', fontSize: '14px', color: '#2d3748', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                        </div>
                    </div>
                    <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${COL.border}`, padding: '24px', position: 'sticky', top: '20px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a202c', margin: '0 0 16px' }}>{t.resumen}</h2>
                        {items.map(item => (
                            <div key={item.productoId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#2d3748', marginBottom: '8px' }}>
                                <span style={{ flex: 1, marginRight: '8px' }}>{item.cantidad}x {item.nombre}</span>
                                <span style={{ fontWeight: 600, flexShrink: 0 }}>Gs. {fmt(item.precioUnitario * item.cantidad)}</span>
                            </div>
                        ))}
                        <div style={{ borderTop: `1px solid ${COL.border}`, marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1a202c' }}>{t.total}</span>
                            <span style={{ fontSize: '18px', fontWeight: 800, color: COL.primary }}>Gs. {fmt(totalPrecio)}</span>
                        </div>
                        <button onClick={handleConfirmar} disabled={loading} style={{ width: '100%', marginTop: '20px', padding: '12px 0', borderRadius: '10px', border: 'none', background: loading ? '#a0aec0' : COL.primary, color: '#fff', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                            {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>{t.procesando}</> : t.confirmarPedido}
                        </button>
                        <p style={{ fontSize: '11px', color: COL.muted, textAlign: 'center', margin: '12px 0 0' }}>{t.pagoTransferenciaResumen}</p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}