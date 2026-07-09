import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useCarrito } from '../context/CarritoContext'
import { useIdioma } from '../context/IdiomaContext'
import { API } from '../config/api'

const COL = { primary: '#CC0000', muted: '#718096', border: '#e0e0e0', danger: '#CC0000' }

export default function Carrito() {
    const { items, actualizarCantidad, quitarItem, totalPrecio } = useCarrito()
    const { t } = useIdioma()
    const navigate = useNavigate()
    const fmt = (n: number) => n.toLocaleString('es-PY')

    const handleCheckout = () => {
        const hayToken = !!localStorage.getItem('tienda_token')
        navigate(hayToken ? '/checkout' : '/login?next=/checkout')
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
            <Header />
            <main style={{ flex: 1, maxWidth: '1000px', margin: '0 auto', padding: '28px 32px', width: '100%' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a202c', margin: '0 0 24px' }}>
                    <i className="fas fa-shopping-cart" style={{ marginRight: '10px', color: COL.primary }}></i>{t.miCarrito}
                </h1>
                {items.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${COL.border}`, padding: '60px 20px', textAlign: 'center', color: COL.muted }}>
                        <i className="fas fa-shopping-cart" style={{ fontSize: '40px', marginBottom: '16px', display: 'block', opacity: 0.4 }}></i>
                        <p style={{ fontSize: '15px', marginBottom: '20px' }}>{t.carritoVacio}</p>
                        <Link to="/" style={{ display: 'inline-block', background: COL.primary, color: '#fff', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>{t.irAlCatalogo}</Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
                        <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${COL.border}`, overflow: 'hidden' }}>
                            {items.map((item, idx) => (
                                <div key={item.productoId} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderBottom: idx < items.length - 1 ? `1px solid ${COL.border}` : 'none' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                        {item.imagenUrl ? <img src={`${API.imagenesBase}${item.imagenUrl}`} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fas fa-image" style={{ fontSize: '22px', color: '#cbd5e0' }}></i>}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: '14px', color: '#2d3748', margin: '0 0 4px', fontWeight: 500 }}>{item.nombre}</p>
                                        <p style={{ fontSize: '13px', color: COL.primary, fontWeight: 700, margin: 0 }}>Gs. {fmt(item.precioUnitario)}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${COL.border}`, borderRadius: '8px', flexShrink: 0 }}>
                                        <button onClick={() => actualizarCantidad(item.productoId, item.cantidad - 1)} style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#2d3748' }}><i className="fas fa-minus"></i></button>
                                        <span style={{ width: '32px', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>{item.cantidad}</span>
                                        <button onClick={() => actualizarCantidad(item.productoId, item.cantidad + 1)} disabled={item.cantidad >= item.stockDisponible} style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: item.cantidad >= item.stockDisponible ? 'not-allowed' : 'pointer', fontSize: '12px', color: '#2d3748' }}><i className="fas fa-plus"></i></button>
                                    </div>
                                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#1a202c', width: '90px', textAlign: 'right', margin: 0, flexShrink: 0 }}>Gs. {fmt(item.precioUnitario * item.cantidad)}</p>
                                    <button onClick={() => quitarItem(item.productoId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COL.danger, fontSize: '15px', flexShrink: 0 }}><i className="fas fa-trash-alt"></i></button>
                                </div>
                            ))}
                        </div>
                        <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${COL.border}`, padding: '24px', position: 'sticky', top: '20px' }}>
                            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a202c', margin: '0 0 16px' }}>{t.resumenDelPedido}</h2>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: COL.muted, marginBottom: '8px' }}>
                                <span>{t.productos} ({items.reduce((a, i) => a + i.cantidad, 0)})</span>
                                <span>Gs. {fmt(totalPrecio)}</span>
                            </div>
                            <div style={{ borderTop: `1px solid ${COL.border}`, marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#1a202c' }}>{t.total}</span>
                                <span style={{ fontSize: '18px', fontWeight: 800, color: COL.primary }}>Gs. {fmt(totalPrecio)}</span>
                            </div>
                            <button onClick={handleCheckout} style={{ width: '100%', marginTop: '20px', padding: '12px 0', borderRadius: '10px', border: 'none', background: COL.primary, color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                {t.continuarCompra} <i className="fas fa-arrow-right" style={{ marginLeft: '6px' }}></i>
                            </button>
                            <p style={{ fontSize: '11px', color: COL.muted, textAlign: 'center', margin: '12px 0 0' }}>{t.pagoTransferencia}</p>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    )
}