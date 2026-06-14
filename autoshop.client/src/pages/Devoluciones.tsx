import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import { API } from '../config/api'

interface DevolucionLista {
    id: string
    fecha: string
    motivo: string
    montoDevuelto: number
    numeroFactura: string
    clienteNombre?: string
    cantidadItems: number
}

interface DetalleVenta {
    id: string
    productoId: string
    nombreProducto: string
    cantidad: number
    cantidadDevuelta: number
    cantidadDisponible: number
    precioUnitario: number
    descuentoPct: number
    subtotal: number
}

interface VentaParaDevolucion {
    id: string
    numeroFactura: string
    fecha: string
    clienteNombre?: string
    total: number
    metodoPago: string
    detalles: DetalleVenta[]
}

const fmt = (n: number) => Math.round(n).toLocaleString('es-PY')

export default function Devoluciones() {
    const [devoluciones, setDevoluciones] = useState<DevolucionLista[]>([])
    const [loading, setLoading] = useState(true)
    const [numeroFactura, setNumeroFactura] = useState('')
    const [buscando, setBuscando] = useState(false)
    const [ventaEncontrada, setVentaEncontrada] = useState<VentaParaDevolucion | null>(null)
    const [cantidades, setCantidades] = useState<Record<string, number>>({})
    const [motivo, setMotivo] = useState('')
    const [procesando, setProcesando] = useState(false)
    const [exitosa, setExitosa] = useState<{ monto: number, factura: string } | null>(null)

    const cargarDevoluciones = async () => {
        try {
            setLoading(true)
            const res = await fetch(`${API.devoluciones}?tamano=10`)
            const data = await res.json()
            setDevoluciones(data.datos || [])
        } catch { toast.error('Error al cargar devoluciones') }
        finally { setLoading(false) }
    }

    useEffect(() => { cargarDevoluciones() }, [])

    const buscarVenta = async () => {
        if (!numeroFactura.trim()) { toast.error('Ingresá el número de factura'); return }
        setBuscando(true)
        try {
            // Primero buscar la venta por número de factura
            const res = await fetch(`${API.ventas}?busqueda=${encodeURIComponent(numeroFactura.trim())}&tamano=1`)
            const data = await res.json()
            if (!data.datos || data.datos.length === 0) {
                toast.error('No se encontró ninguna venta con ese número')
                return
            }
            const ventaId = data.datos[0].id
            // Luego cargar los detalles para devolución
            const res2 = await fetch(`${API.devoluciones}/venta/${ventaId}`)
            if (!res2.ok) {
                const err = await res2.json()
                toast.error(err.mensaje || 'Error al cargar la venta')
                return
            }
            const venta = await res2.json()
            setVentaEncontrada(venta)
            // Inicializar cantidades en 0
            const inicial: Record<string, number> = {}
            venta.detalles.forEach((d: DetalleVenta) => { inicial[d.productoId] = 0 })
            setCantidades(inicial)
            setExitosa(null)
        } catch { toast.error('Error al buscar la venta') }
        finally { setBuscando(false) }
    }

    const totalDevolucion = ventaEncontrada
        ? ventaEncontrada.detalles.reduce((acc, d) => {
            const cant = cantidades[d.productoId] || 0
            const precioFinal = d.precioUnitario * (1 - d.descuentoPct / 100)
            return acc + precioFinal * cant
        }, 0)
        : 0

    const itemsSeleccionados = Object.values(cantidades).filter(c => c > 0).length

    const procesarDevolucion = async () => {
        if (!ventaEncontrada) return
        if (!motivo.trim()) { toast.error('El motivo es obligatorio'); return }
        if (itemsSeleccionados === 0) { toast.error('Seleccioná al menos un producto para devolver'); return }

        const items = ventaEncontrada.detalles
            .filter(d => (cantidades[d.productoId] || 0) > 0)
            .map(d => ({ productoId: d.productoId, cantidad: cantidades[d.productoId] }))

        setProcesando(true)
        try {
            const res = await fetch(API.devoluciones, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ventaId: ventaEncontrada.id, motivo: motivo.trim(), items })
            })
            if (!res.ok) { const err = await res.json(); toast.error(err.mensaje || 'Error'); return }
            const data = await res.json()
            setExitosa({ monto: data.montoDevuelto, factura: ventaEncontrada.numeroFactura })
            setVentaEncontrada(null)
            setNumeroFactura('')
            setMotivo('')
            setCantidades({})
            await cargarDevoluciones()
            toast.success('Devolución registrada correctamente')
        } catch { toast.error('Error inesperado') }
        finally { setProcesando(false) }
    }

    const nueva = () => {
        setExitosa(null)
        setVentaEncontrada(null)
        setNumeroFactura('')
        setMotivo('')
        setCantidades({})
    }

    return (
        <Layout titulo="Devoluciones">
            <div className="row">

                {/* Panel izquierdo — Nueva devolución */}
                <div className="col-lg-7">

                    {/* Éxito */}
                    {exitosa && (
                        <div className="card mb-4" style={{ border: '2px solid #2e7d32' }}>
                            <div className="card-body text-center py-4">
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <i className="fas fa-check fa-2x" style={{ color: '#2e7d32' }}></i>
                                </div>
                                <h5 style={{ fontWeight: 700, marginBottom: '4px' }}>¡Devolución registrada!</h5>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Factura {exitosa.factura}</p>
                                <h3 style={{ fontWeight: 800, color: '#2e7d32', marginBottom: '20px' }}>₲ {fmt(exitosa.monto)} devueltos</h3>
                                <button onClick={nueva} className="btn btn-primary">
                                    <i className="fas fa-undo mr-2"></i>Nueva devolución
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Buscador de factura */}
                    {!exitosa && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <i className="fas fa-search mr-2" style={{ color: 'var(--primary)' }}></i>Buscar venta
                            </div>
                            <div className="card-body">
                                <div className="input-group">
                                    <input type="text" className="form-control"
                                        placeholder="Número de factura (Ej: F-000001)..."
                                        value={numeroFactura}
                                        onChange={e => setNumeroFactura(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && buscarVenta()} />
                                    <button onClick={buscarVenta} disabled={buscando} className="btn btn-primary">
                                        {buscando ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-search mr-1"></i>Buscar</>}
                                    </button>
                                </div>
                                <small style={{ color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                                    Ingresá el número de factura de la venta que querés devolver
                                </small>
                            </div>
                        </div>
                    )}

                    {/* Detalle de la venta encontrada */}
                    {ventaEncontrada && !exitosa && (
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <span>
                                    <i className="fas fa-receipt mr-2" style={{ color: 'var(--primary)' }}></i>
                                    Venta <strong>{ventaEncontrada.numeroFactura}</strong>
                                </span>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                    {new Date(ventaEncontrada.fecha).toLocaleDateString('es-PY')}
                                    {ventaEncontrada.clienteNombre && ` · ${ventaEncontrada.clienteNombre}`}
                                </div>
                            </div>
                            <div className="card-body">

                                {/* Productos */}
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                        SELECCIONÁ LOS PRODUCTOS A DEVOLVER
                                    </div>
                                    {ventaEncontrada.detalles.map(d => {
                                        const cant = cantidades[d.productoId] || 0
                                        const montoItem = d.precioUnitario * (1 - d.descuentoPct / 100) * cant
                                        return (
                                            <div key={d.productoId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', marginBottom: '8px', border: `2px solid ${cant > 0 ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '10px', background: cant > 0 ? 'var(--primary-light)' : 'white', transition: 'all 0.2s' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{d.nombreProducto}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        ₲ {fmt(d.precioUnitario * (1 - d.descuentoPct / 100))} c/u
                                                        {d.descuentoPct > 0 && <span style={{ color: 'var(--secondary)', marginLeft: '4px' }}>(-{d.descuentoPct}%)</span>}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        Comprado: {d.cantidad} · Disponible para devolver: <strong style={{ color: 'var(--primary-dark)' }}>{d.cantidadDisponible}</strong>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                                    <button onClick={() => setCantidades(prev => ({ ...prev, [d.productoId]: Math.max(0, (prev[d.productoId] || 0) - 1) }))}
                                                        disabled={cant <= 0}
                                                        style={{ width: '28px', height: '28px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '16px', opacity: cant <= 0 ? 0.4 : 1 }}>−</button>
                                                    <span style={{ width: '32px', textAlign: 'center', fontWeight: 700, fontSize: '16px' }}>{cant}</span>
                                                    <button onClick={() => setCantidades(prev => ({ ...prev, [d.productoId]: Math.min(d.cantidadDisponible, (prev[d.productoId] || 0) + 1) }))}
                                                        disabled={cant >= d.cantidadDisponible}
                                                        style={{ width: '28px', height: '28px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '16px', opacity: cant >= d.cantidadDisponible ? 0.4 : 1 }}>+</button>
                                                </div>
                                                {cant > 0 && (
                                                    <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '100px' }}>
                                                        <div style={{ fontWeight: 700, color: '#2e7d32' }}>₲ {fmt(montoItem)}</div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Motivo */}
                                <div className="mb-3">
                                    <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                                        Motivo de devolución <span style={{ color: 'var(--secondary)' }}>*</span>
                                    </label>
                                    <input type="text" className="form-control"
                                        placeholder="Ej: Producto defectuoso, error de pedido, cambio de talle..."
                                        value={motivo} onChange={e => setMotivo(e.target.value)} />
                                </div>

                                {/* Total y confirmar */}
                                {itemsSeleccionados > 0 && (
                                    <div style={{ background: '#e8f5e9', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '13px', color: '#2e7d32' }}>{itemsSeleccionados} producto{itemsSeleccionados > 1 ? 's' : ''} seleccionado{itemsSeleccionados > 1 ? 's' : ''}</div>
                                            <div style={{ fontWeight: 800, fontSize: '20px', color: '#2e7d32' }}>₲ {fmt(totalDevolucion)}</div>
                                        </div>
                                        <button onClick={procesarDevolucion} disabled={procesando} className="btn"
                                            style={{ background: '#2e7d32', color: 'white', border: 'none', padding: '12px 24px', fontWeight: 700, borderRadius: '8px', fontSize: '15px' }}>
                                            {procesando
                                                ? <><i className="fas fa-spinner fa-spin mr-2"></i>Procesando...</>
                                                : <><i className="fas fa-check-circle mr-2"></i>Confirmar devolución</>
                                            }
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Panel derecho — Historial */}
                <div className="col-lg-5">
                    <div className="card">
                        <div className="card-header">
                            <i className="fas fa-history mr-2" style={{ color: 'var(--primary)' }}></i>Últimas devoluciones
                        </div>
                        <div className="card-body p-0">
                            {loading ? (
                                <div className="text-center py-4">
                                    <i className="fas fa-spinner fa-spin" style={{ color: 'var(--primary)' }}></i>
                                </div>
                            ) : devoluciones.length === 0 ? (
                                <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                                    No hay devoluciones registradas
                                </div>
                            ) : devoluciones.map(d => (
                                <div key={d.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '14px', fontFamily: 'monospace' }}>{d.numeroFactura}</div>
                                            {d.clienteNombre && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d.clienteNombre}</div>}
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d.cantidadItems} producto{d.cantidadItems > 1 ? 's' : ''}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>"{d.motivo}"</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 700, color: '#2e7d32', fontSize: '15px' }}>₲ {fmt(d.montoDevuelto)}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(d.fecha).toLocaleDateString('es-PY')}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}