import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useCarrito } from '../context/CarritoContext'
import { API } from '../config/api'

const COL = {
    primary: '#2c5282',
    primaryDark: '#1a365d',
    accent: '#D4A017',
    muted: '#718096',
    border: '#e2e8f0',
}

export default function Checkout() {
    const { items, totalPrecio, vaciarCarrito } = useCarrito()
    const navigate = useNavigate()

    const [telefono, setTelefono] = useState('')
    const [direccion, setDireccion] = useState('')
    const [metodoPago, setMetodoPago] = useState('TRANSFERENCIA')
    const [notas, setNotas] = useState('')
    const [loading, setLoading] = useState(false)

    const fmt = (n: number) => n.toLocaleString('es-PY')

    const handleConfirmar = async () => {
        if (items.length === 0) { toast.error('Tu carrito esta vacio'); return }
        if (!direccion.trim()) { toast.error('Indica una direccion de entrega'); return }

        setLoading(true)
        try {
            const token = localStorage.getItem('tienda_token')
            const res = await fetch(API.pedidos, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    items: items.map(i => ({ productoId: i.productoId, cantidad: i.cantidad })),
                    metodoPago,
                    telefono: telefono.trim() || null,
                    direccionEntrega: direccion.trim(),
                    notas: notas.trim() || null,
                })
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.mensaje || 'No se pudo crear el pedido'); return }

            vaciarCarrito()
            toast.success('¡Pedido creado correctamente!')
            navigate(`/mis-pedidos/${data.id}`, { replace: true })
        } catch {
            toast.error('Error de conexion')
        } finally {
            setLoading(false)
        }
    }

    if (items.length === 0) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f3f7' }}>
                <Header />
                <div style={{ flex: 1, textAlign: 'center', padding: '80px 20px', color: COL.muted }}>
                    <i className="fas fa-shopping-cart" style={{ fontSize: '40px', marginBottom: '16px', display: 'block', opacity: 0.4 }}></i>
                    <p style={{ fontSize: '15px', marginBottom: '20px' }}>Tu carrito esta vacio.</p>
                    <Link to="/" style={{ color: COL.primary, fontWeight: 600, textDecoration: 'none' }}>
                        <i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i>Volver al catalogo
                    </Link>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f3f7' }}>
            <Header />

            <main style={{ flex: 1, maxWidth: '1000px', margin: '0 auto', padding: '28px 32px', width: '100%' }}>

                <Link to="/carrito" style={{ color: COL.muted, fontSize: '13px', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>
                    <i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i>Volver al carrito
                </Link>

                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a202c', margin: '0 0 24px' }}>
                    Finalizar pedido
                </h1>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

                    {/* Formulario */}
                    <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${COL.border}`, padding: '28px' }}>

                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a202c', margin: '0 0 16px' }}>Datos de entrega</h2>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Direccion de entrega</label>
                            <input type="text" placeholder="Calle, numero, barrio, ciudad"
                                value={direccion} onChange={e => setDireccion(e.target.value)}
                                style={{ width: '100%', padding: '11px 12px', border: `1.5px solid ${COL.border}`, borderRadius: '8px', fontSize: '14px', color: '#2d3748', outline: 'none' }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Telefono de contacto</label>
                            <input type="tel" placeholder="0981 234 567"
                                value={telefono} onChange={e => setTelefono(e.target.value)}
                                style={{ width: '100%', padding: '11px 12px', border: `1.5px solid ${COL.border}`, borderRadius: '8px', fontSize: '14px', color: '#2d3748', outline: 'none' }}
                            />
                        </div>

                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a202c', margin: '0 0 16px' }}>Metodo de pago</h2>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                            {[
                                { value: 'TRANSFERENCIA', label: 'Transferencia', icon: 'fa-university' },
                                { value: 'EFECTIVO', label: 'Efectivo', icon: 'fa-money-bill-wave' },
                            ].map(opt => (
                                <button key={opt.value} onClick={() => setMetodoPago(opt.value)}
                                    style={{
                                        flex: 1, padding: '14px', borderRadius: '10px', cursor: 'pointer',
                                        border: metodoPago === opt.value ? `2px solid ${COL.primary}` : `1.5px solid ${COL.border}`,
                                        background: metodoPago === opt.value ? '#ebf4ff' : '#fff',
                                        color: metodoPago === opt.value ? COL.primary : '#718096',
                                        fontWeight: 600, fontSize: '13px', textAlign: 'center',
                                    }}>
                                    <i className={`fas ${opt.icon}`} style={{ display: 'block', fontSize: '18px', marginBottom: '6px' }}></i>
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div style={{
                            background: '#fffbeb', border: '1px solid #f6e05e', borderRadius: '10px',
                            padding: '12px 16px', fontSize: '12px', color: '#744210', marginBottom: '20px',
                        }}>
                            <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
                            El pago se coordina directamente con vos despues de confirmar el pedido. No se realiza ningun cobro online.
                        </div>

                        <div>
                            <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Notas adicionales (opcional)</label>
                            <textarea placeholder="Indicaciones para la entrega, horarios, etc."
                                value={notas} onChange={e => setNotas(e.target.value)}
                                rows={3}
                                style={{ width: '100%', padding: '11px 12px', border: `1.5px solid ${COL.border}`, borderRadius: '8px', fontSize: '14px', color: '#2d3748', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                            />
                        </div>
                    </div>

                    {/* Resumen */}
                    <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${COL.border}`, padding: '24px', position: 'sticky', top: '20px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a202c', margin: '0 0 16px' }}>Resumen</h2>
                        {items.map(item => (
                            <div key={item.productoId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#2d3748', marginBottom: '8px' }}>
                                <span style={{ flex: 1, marginRight: '8px' }}>{item.cantidad}x {item.nombre}</span>
                                <span style={{ fontWeight: 600, flexShrink: 0 }}>Gs. {fmt(item.precioUnitario * item.cantidad)}</span>
                            </div>
                        ))}
                        <div style={{ borderTop: `1px solid ${COL.border}`, marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1a202c' }}>Total</span>
                            <span style={{ fontSize: '18px', fontWeight: 800, color: COL.primary }}>Gs. {fmt(totalPrecio)}</span>
                        </div>
                        <button onClick={handleConfirmar} disabled={loading} style={{
                            width: '100%', marginTop: '20px', padding: '12px 0', borderRadius: '10px',
                            border: 'none', background: loading ? '#a0aec0' : COL.primary,
                            color: '#fff', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                        }}>
                            {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Procesando...</> : 'Confirmar pedido'}
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}