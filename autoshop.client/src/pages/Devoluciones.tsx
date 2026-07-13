import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import { API } from '../config/api'

// ── Interfaces ───────────────────────────────────────────────────────────────
interface DevolucionDetalle {
    productoId: string
    nombreProducto: string
    cantidad: number
    monto: number
}

interface Devolucion {
    id: string
    fecha: string
    motivo: string
    montoDevuelto: number
    numeroFactura: string
    clienteNombre: string | null
    cantidadItems: number
    detalles: DevolucionDetalle[]
}

interface VentaParaDevolucion {
    id: string
    numeroFactura: string
    fecha: string
    clienteNombre: string | null
    total: number
    metodoPago: string
    detalles: {
        id: string
        productoId: string
        nombreProducto: string
        cantidad: number
        cantidadDevuelta: number
        cantidadDisponible: number
        precioUnitario: number
        descuentoPct: number
        subtotal: number
    }[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => Math.round(n).toLocaleString('es-PY')
const fmtFecha = (f: string) =>
    new Date(f).toLocaleDateString('es-PY', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    } as Intl.DateTimeFormatOptions)

const thStyle: React.CSSProperties = {
    background: 'var(--dark)', color: 'white',
    padding: '10px 16px', fontWeight: 600,
    fontSize: '13px', textAlign: 'left',
}

// ── Componente ───────────────────────────────────────────────────────────────
export default function Devoluciones() {
    // Historial
    const [devoluciones, setDevoluciones] = useState<Devolucion[]>([])
    const [cargandoHistorial, setCargandoHistorial] = useState(true)
    const [expandido, setExpandido] = useState<string | null>(null)

    // Formulario
    const [facturaInput, setFacturaInput] = useState('')
    const [buscandoVenta, setBuscandoVenta] = useState(false)
    const [ventaActual, setVentaActual] = useState<VentaParaDevolucion | null>(null)
    const [cantidades, setCantidades] = useState<Record<string, number>>({})
    const [motivo, setMotivo] = useState('')
    const [procesando, setProcesando] = useState(false)

    // Cargar historial
    useEffect(() => {
        const cargar = async () => {
            try {
                const res = await fetch(`${API.devoluciones}?pagina=1&tamano=50`)
                const data = await res.json()
                setDevoluciones(data.datos || [])
            } catch { toast.error('Error al cargar historial') }
            finally { setCargandoHistorial(false) }
        }
        cargar()
    }, [])

    const buscarVenta = async () => {
        if (!facturaInput.trim()) { toast.error('Ingresá un número de factura'); return }
        setBuscandoVenta(true)
        setVentaActual(null)
        try {
            // Buscar la venta por numero de factura
            const resVentas = await fetch(`${API.ventas}?busqueda=${encodeURIComponent(facturaInput.trim())}`)
            const dataVentas = await resVentas.json()
            const venta = dataVentas.datos?.[0]
            if (!venta) { toast.error('No se encontró la venta'); return }

            const res = await fetch(`${API.devoluciones}/venta/${venta.id}`)
            if (!res.ok) {
                const err = await res.json()
                toast.error(err.mensaje || 'No se puede procesar esta venta')
                return
            }
            const data: VentaParaDevolucion = await res.json()
            setVentaActual(data)
            const initCants: Record<string, number> = {}
            data.detalles.forEach(d => { initCants[d.productoId] = 0 })
            setCantidades(initCants)
        } catch { toast.error('Error al buscar la venta') }
        finally { setBuscandoVenta(false) }
    }

    const registrarDevolucion = async () => {
        if (!ventaActual) return
        if (!motivo.trim()) { toast.error('Ingresá el motivo de la devolución'); return }
        const items = ventaActual.detalles
            .filter(d => (cantidades[d.productoId] || 0) > 0)
            .map(d => ({ productoId: d.productoId, cantidad: cantidades[d.productoId] }))
        if (items.length === 0) { toast.error('Seleccioná al menos un producto para devolver'); return }

        setProcesando(true)
        try {
            const res = await fetch(API.devoluciones, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ventaId: ventaActual.id, motivo: motivo.trim(), items })
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.mensaje || 'Error al registrar'); return }

            toast.success(`Devolución registrada. Monto: ₲ ${fmt(data.montoDevuelto)}`)
            setVentaActual(null); setFacturaInput(''); setMotivo('')

            // Recargar historial
            const resH = await fetch(`${API.devoluciones}?pagina=1&tamano=50`)
            const dataH = await resH.json()
            setDevoluciones(dataH.datos || [])
        } catch { toast.error('Error de conexión') }
        finally { setProcesando(false) }
    }

    const montoSeleccionado = ventaActual?.detalles.reduce((acc, d) => {
        const cant = cantidades[d.productoId] || 0
        return acc + d.precioUnitario * cant * (1 - d.descuentoPct / 100)
    }, 0) || 0

    return (
        <Layout titulo="Devoluciones">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

                {/* ── Panel izquierdo: formulario ── */}
                <div>
                    <div className="card mb-3">
                        <div className="card-header">
                            <i className="fas fa-search mr-2" style={{ color: 'var(--primary)' }}></i>
                            Buscar venta por N° de factura
                        </div>
                        <div className="card-body">
                            <div className="input-group">
                                <input type="text" className="form-control"
                                    placeholder="Ej: F-000001 o 00000001"
                                    value={facturaInput}
                                    onChange={e => setFacturaInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && buscarVenta()}
                                />
                                <button className="btn btn-primary" onClick={buscarVenta} disabled={buscandoVenta}>
                                    {buscandoVenta
                                        ? <i className="fas fa-spinner fa-spin"></i>
                                        : <i className="fas fa-search"></i>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {ventaActual && (
                        <>
                            <div className="card mb-3">
                                <div className="card-header">
                                    <i className="fas fa-receipt mr-2" style={{ color: 'var(--primary)' }}></i>
                                    Venta {ventaActual.numeroFactura}
                                    {ventaActual.clienteNombre && (
                                        <span className="ml-2" style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '13px' }}>
                                            — {ventaActual.clienteNombre}
                                        </span>
                                    )}
                                </div>
                                <div className="card-body p-0">
                                    <table className="table mb-0">
                                        <thead>
                                            <tr>
                                                <th style={{ ...thStyle, fontSize: '12px' }}>Producto</th>
                                                <th style={{ ...thStyle, fontSize: '12px', textAlign: 'center' }}>Disponible</th>
                                                <th style={{ ...thStyle, fontSize: '12px', textAlign: 'center' }}>Devolver</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ventaActual.detalles.map(d => (
                                                <tr key={d.productoId}>
                                                    <td style={{ padding: '10px 16px' }}>
                                                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{d.nombreProducto}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                            ₲ {fmt(d.precioUnitario)} c/u
                                                            {d.cantidadDevuelta > 0 && ` · ${d.cantidadDevuelta} ya devuelto/s`}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                                        <span style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '3px 10px', borderRadius: '20px', fontWeight: 700, fontSize: '13px' }}>
                                                            {d.cantidadDisponible}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                            <button onClick={() => setCantidades(p => ({ ...p, [d.productoId]: Math.max(0, (p[d.productoId] || 0) - 1) }))}
                                                                style={{ width: '26px', height: '26px', border: '1px solid var(--border)', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>−</button>
                                                            <span style={{ width: '28px', textAlign: 'center', fontWeight: 700 }}>{cantidades[d.productoId] || 0}</span>
                                                            <button onClick={() => setCantidades(p => ({ ...p, [d.productoId]: Math.min(d.cantidadDisponible, (p[d.productoId] || 0) + 1) }))}
                                                                style={{ width: '26px', height: '26px', border: '1px solid var(--border)', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>+</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-body">
                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', display: 'block' }}>Motivo de devolución</label>
                                        <textarea className="form-control" rows={3}
                                            placeholder="Describa el motivo de la devolución..."
                                            value={motivo} onChange={e => setMotivo(e.target.value)} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monto a devolver</div>
                                            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--secondary)' }}>₲ {fmt(montoSeleccionado)}</div>
                                        </div>
                                        <button className="btn btn-primary" onClick={registrarDevolucion} disabled={procesando || montoSeleccionado === 0}>
                                            {procesando
                                                ? <><i className="fas fa-spinner fa-spin mr-2"></i>Procesando...</>
                                                : <><i className="fas fa-undo mr-2"></i>Registrar devolución</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ── Panel derecho: historial ── */}
                <div className="card">
                    <div className="card-header">
                        <i className="fas fa-history mr-2" style={{ color: 'var(--primary)' }}></i>
                        Historial de devoluciones
                    </div>
                    {cargandoHistorial ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            <i className="fas fa-spinner fa-spin fa-2x"></i>
                        </div>
                    ) : devoluciones.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            <i className="fas fa-undo fa-2x" style={{ opacity: 0.2, display: 'block', marginBottom: '8px' }}></i>
                            Sin devoluciones registradas
                        </div>
                    ) : (
                        <table className="table mb-0">
                            <thead>
                                <tr>
                                    <th style={{ ...thStyle, fontSize: '12px' }}>Fecha</th>
                                    <th style={{ ...thStyle, fontSize: '12px' }}>Factura</th>
                                    <th style={{ ...thStyle, fontSize: '12px' }}>Productos devueltos</th>
                                    <th style={{ ...thStyle, fontSize: '12px', textAlign: 'right' }}>Monto</th>
                                    <th style={{ ...thStyle, fontSize: '12px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {devoluciones.map(d => (
                                    <>
                                        <tr key={d.id} style={{ cursor: 'pointer' }}
                                            onClick={() => setExpandido(expandido === d.id ? null : d.id)}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                            <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtFecha(d.fecha)}</td>
                                            <td style={{ padding: '10px 16px', fontWeight: 700, fontSize: '13px' }}>{d.numeroFactura}</td>
                                            <td style={{ padding: '10px 16px' }}>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                                    {d.detalles?.map((det, i) => (
                                                        <span key={i} style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                                                            {det.cantidad}x {det.nombreProducto}
                                                        </span>
                                                    )) || <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{d.cantidadItems} item{d.cantidadItems !== 1 ? 's' : ''}</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--secondary)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                - ₲ {fmt(d.montoDevuelto)}
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                <i className={`fas fa-chevron-${expandido === d.id ? 'up' : 'down'}`} style={{ color: 'var(--text-muted)', fontSize: '11px' }}></i>
                                            </td>
                                        </tr>
                                        {expandido === d.id && (
                                            <tr key={`${d.id}-exp`}>
                                                <td colSpan={5} style={{ padding: '0 12px 12px', background: '#fafafa' }}>
                                                    <div style={{ background: 'white', borderRadius: '6px', border: '1px solid var(--border)', padding: '12px' }}>
                                                        {d.motivo && (
                                                            <div style={{ marginBottom: '10px', padding: '8px 12px', background: '#fffbeb', borderRadius: '6px', fontSize: '12px', color: '#744210' }}>
                                                                <strong>Motivo:</strong> {d.motivo}
                                                            </div>
                                                        )}
                                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                            <thead>
                                                                <tr style={{ background: 'var(--dark)' }}>
                                                                    <th style={{ padding: '7px 10px', fontSize: '11px', color: 'white', textAlign: 'left' }}>Producto</th>
                                                                    <th style={{ padding: '7px 10px', fontSize: '11px', color: 'white', textAlign: 'center' }}>Cant.</th>
                                                                    <th style={{ padding: '7px 10px', fontSize: '11px', color: 'white', textAlign: 'right' }}>Monto</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {d.detalles?.map((det, i) => (
                                                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                                                        <td style={{ padding: '8px 10px', fontSize: '13px' }}>{det.nombreProducto}</td>
                                                                        <td style={{ padding: '8px 10px', fontSize: '13px', textAlign: 'center' }}>{det.cantidad}</td>
                                                                        <td style={{ padding: '8px 10px', fontSize: '13px', textAlign: 'right', fontWeight: 700, color: 'var(--secondary)' }}>- ₲ {fmt(det.monto)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </Layout>
    )
}