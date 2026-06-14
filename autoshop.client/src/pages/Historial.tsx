import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import ConfirmModal from '../components/ui/ConfirmModal'
import { API } from '../config/api'

interface Venta {
    id: string
    numeroFactura: string
    fecha: string
    clienteNombre?: string
    clienteRuc?: string
    metodoPago: string
    tipoComprobante: string
    subtotal: number
    descuento: number
    total: number
    estado: string
    cantidadItems: number
}

interface VentaDetalle {
    id: string
    productoId: string
    nombre: string
    codigoBarras: string
    cantidad: number
    precioUnitario: number
    descuentoPct: number
    subtotal: number
}

interface VentaCompleta extends Venta {
    detalles: VentaDetalle[]
}

interface PaginatedResult {
    datos: Venta[]
    total: number
    pagina: number
    tamano: number
    totalPaginas: number
}

const fmt = (n: number) => Math.round(n).toLocaleString('es-PY')

export default function Historial() {
    const [result, setResult] = useState<PaginatedResult>({ datos: [], total: 0, pagina: 1, tamano: 25, totalPaginas: 0 })
    const [loading, setLoading] = useState(true)
    const [pagina, setPagina] = useState(1)
    const [busqueda, setBusqueda] = useState('')
    const [desde, setDesde] = useState('')
    const [hasta, setHasta] = useState('')
    const [ventaDetalle, setVentaDetalle] = useState<VentaCompleta | null>(null)
    const [loadingDetalle, setLoadingDetalle] = useState(false)
    const [confirmAnular, setConfirmAnular] = useState<{ show: boolean, id: string, numero: string }>({ show: false, id: '', numero: '' })
    const [anulando, setAnulando] = useState(false)

    const cargarVentas = async (pag = pagina, busq = busqueda, d = desde, h = hasta) => {
        try {
            setLoading(true)
            const params = new URLSearchParams({ pagina: pag.toString(), tamano: '25' })
            if (busq) params.append('busqueda', busq)
            if (d) params.append('desde', d)
            if (h) params.append('hasta', h)
            const res = await fetch(`${API.ventas}?${params}`)
            const data = await res.json()
            setResult(data)
        } catch { toast.error('No se pudo conectar con el servidor') }
        finally { setLoading(false) }
    }

    useEffect(() => { cargarVentas() }, [])

    const handleBusqueda = (valor: string) => { setBusqueda(valor); setPagina(1); cargarVentas(1, valor, desde, hasta) }
    const handlePagina = (nueva: number) => { setPagina(nueva); cargarVentas(nueva, busqueda, desde, hasta) }
    const handleFiltrarFecha = () => { setPagina(1); cargarVentas(1, busqueda, desde, hasta) }
    const handleLimpiarFiltros = () => {
        setBusqueda(''); setDesde(''); setHasta(''); setPagina(1)
        cargarVentas(1, '', '', '')
    }

    const verDetalle = async (id: string) => {
        setLoadingDetalle(true)
        try {
            const res = await fetch(`${API.ventas}/${id}`)
            const data = await res.json()
            setVentaDetalle(data)
        } catch { toast.error('Error al cargar el detalle') }
        finally { setLoadingDetalle(false) }
    }

    const anularVenta = async () => {
        setAnulando(true)
        try {
            const res = await fetch(`${API.ventas}/${confirmAnular.id}`, { method: 'DELETE' })
            if (!res.ok) { const err = await res.json(); toast.error(err.mensaje || 'Error al anular'); return }
            toast.success(`Venta ${confirmAnular.numero} anulada correctamente`)
            setConfirmAnular({ show: false, id: '', numero: '' })
            setVentaDetalle(null)
            await cargarVentas()
        } catch { toast.error('Error al anular la venta') }
        finally { setAnulando(false) }
    }

    const getBadgeEstado = (estado: string) => {
        if (estado === 'COMPLETADA') return { bg: '#e8f5e9', color: '#2e7d32', texto: 'Completada' }
        if (estado === 'ANULADA') return { bg: '#fce4e4', color: '#c62828', texto: 'Anulada' }
        return { bg: '#f5f5f5', color: '#666', texto: estado }
    }

    const getBadgePago = (metodo: string) => metodo === 'EFECTIVO'
        ? { icon: 'fa-money-bill-wave', color: '#2e7d32', texto: 'Efectivo' }
        : { icon: 'fa-university', color: '#1565c0', texto: 'Transferencia' }

    return (
        <Layout titulo="Historial de Ventas">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 style={{ fontWeight: 700, margin: 0 }}>Historial de Ventas</h5>
                    <small style={{ color: 'var(--text-muted)' }}>{result.total} ventas registradas</small>
                </div>
            </div>

            {/* Filtros */}
            <div className="card mb-4">
                <div className="card-body py-3">
                    <div className="row align-items-end" style={{ gap: '0' }}>
                        <div className="col-md-4">
                            <label style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Buscar</label>
                            <div className="input-group">
                                <span className="input-group-text" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
                                    <i className="fas fa-search"></i>
                                </span>
                                <input type="text" className="form-control" placeholder="Nº factura o nombre cliente..."
                                    value={busqueda} onChange={e => handleBusqueda(e.target.value)} />
                            </div>
                        </div>
                        <div className="col-md-2">
                            <label style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Desde</label>
                            <input type="date" className="form-control" value={desde} onChange={e => setDesde(e.target.value)} />
                        </div>
                        <div className="col-md-2">
                            <label style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Hasta</label>
                            <input type="date" className="form-control" value={hasta} onChange={e => setHasta(e.target.value)} />
                        </div>
                        <div className="col-md-2">
                            <button onClick={handleFiltrarFecha} className="btn btn-primary w-100">
                                <i className="fas fa-filter mr-1"></i> Filtrar
                            </button>
                        </div>
                        <div className="col-md-2">
                            <button onClick={handleLimpiarFiltros} className="btn w-100"
                                style={{ background: 'var(--light)', border: '1px solid var(--border)', color: 'var(--text-dark)' }}>
                                <i className="fas fa-times mr-1"></i> Limpiar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                {/* Tabla de ventas */}
                <div className={ventaDetalle ? 'col-lg-6' : 'col-12'}>
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <span><i className="fas fa-history mr-2" style={{ color: 'var(--primary)' }}></i>Ventas</span>
                            <small style={{ color: 'var(--text-muted)' }}>Mostrando {result.datos.length} de {result.total}</small>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-bordered mb-0">
                                    <thead>
                                        <tr>
                                            <th>N° Factura</th>
                                            <th>Fecha</th>
                                            <th>Cliente</th>
                                            <th>Pago</th>
                                            <th style={{ textAlign: 'right' }}>Total</th>
                                            <th>Estado</th>
                                            <th style={{ width: '80px' }}>Ver</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan={7} className="text-center py-4">
                                                <i className="fas fa-spinner fa-spin mr-2" style={{ color: 'var(--primary)' }}></i>Cargando...
                                            </td></tr>
                                        ) : result.datos.length === 0 ? (
                                            <tr><td colSpan={7} className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                                                No hay ventas registradas
                                            </td></tr>
                                        ) : result.datos.map(v => {
                                            const estado = getBadgeEstado(v.estado)
                                            const pago = getBadgePago(v.metodoPago)
                                            const esSeleccionada = ventaDetalle?.id === v.id
                                            return (
                                                <tr key={v.id} style={{ background: esSeleccionada ? 'var(--primary-light)' : 'white', cursor: 'pointer' }}
                                                    onClick={() => verDetalle(v.id)}>
                                                    <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '13px' }}>{v.numeroFactura}</td>
                                                    <td style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                                                        {new Date(v.fecha).toLocaleDateString('es-PY')}<br />
                                                        <small style={{ color: 'var(--text-muted)' }}>{new Date(v.fecha).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}</small>
                                                    </td>
                                                    <td style={{ fontSize: '13px' }}>
                                                        {v.clienteNombre || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                                        {v.tipoComprobante === 'FACTURA' && (
                                                            <span style={{ marginLeft: '4px', fontSize: '10px', background: '#e3f2fd', color: '#1565c0', padding: '1px 5px', borderRadius: '4px' }}>FAC</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span style={{ fontSize: '12px', color: pago.color }}>
                                                            <i className={`fas ${pago.icon} mr-1`}></i>{pago.texto}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary-dark)', whiteSpace: 'nowrap' }}>
                                                        ₲ {fmt(v.total)}
                                                    </td>
                                                    <td>
                                                        <span style={{ fontSize: '11px', fontWeight: 600, background: estado.bg, color: estado.color, padding: '2px 8px', borderRadius: '10px' }}>
                                                            {estado.texto}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button className="btn btn-sm btn-primary" style={{ padding: '4px 10px' }}
                                                            onClick={e => { e.stopPropagation(); verDetalle(v.id) }}>
                                                            <i className="fas fa-eye"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginación */}
                            {result.totalPaginas > 1 && (
                                <div className="d-flex justify-content-between align-items-center px-3 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                                    <small style={{ color: 'var(--text-muted)' }}>Página {result.pagina} de {result.totalPaginas}</small>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button className="btn btn-sm" onClick={() => handlePagina(1)} disabled={pagina === 1} style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary-dark)', padding: '4px 10px' }}>«</button>
                                        <button className="btn btn-sm" onClick={() => handlePagina(pagina - 1)} disabled={pagina === 1} style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary-dark)', padding: '4px 10px' }}>‹</button>
                                        {Array.from({ length: result.totalPaginas }, (_, i) => i + 1).filter(p => p >= pagina - 2 && p <= pagina + 2).map(p => (
                                            <button key={p} className="btn btn-sm" onClick={() => handlePagina(p)}
                                                style={{ background: p === pagina ? 'var(--primary)' : 'white', border: '1px solid var(--primary)', color: p === pagina ? 'white' : 'var(--primary-dark)', fontWeight: p === pagina ? 700 : 400, padding: '4px 10px' }}>
                                                {p}
                                            </button>
                                        ))}
                                        <button className="btn btn-sm" onClick={() => handlePagina(pagina + 1)} disabled={pagina === result.totalPaginas} style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary-dark)', padding: '4px 10px' }}>›</button>
                                        <button className="btn btn-sm" onClick={() => handlePagina(result.totalPaginas)} disabled={pagina === result.totalPaginas} style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary-dark)', padding: '4px 10px' }}>»</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Panel de detalle */}
                {ventaDetalle && (
                    <div className="col-lg-6">
                        <div className="card" style={{ position: 'sticky', top: '80px' }}>
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <span>
                                    <i className="fas fa-receipt mr-2" style={{ color: 'var(--primary)' }}></i>
                                    Detalle — <strong>{ventaDetalle.numeroFactura}</strong>
                                </span>
                                <button onClick={() => setVentaDetalle(null)}
                                    style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                            </div>
                            {loadingDetalle ? (
                                <div className="card-body text-center py-4">
                                    <i className="fas fa-spinner fa-spin fa-2x" style={{ color: 'var(--primary)' }}></i>
                                </div>
                            ) : (
                                <div className="card-body" style={{ padding: '20px' }}>

                                    {/* Info general */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                        <div style={{ background: 'var(--light)', borderRadius: '8px', padding: '12px' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>FECHA</div>
                                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{new Date(ventaDetalle.fecha).toLocaleString('es-PY')}</div>
                                        </div>
                                        <div style={{ background: 'var(--light)', borderRadius: '8px', padding: '12px' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>MÉTODO DE PAGO</div>
                                            <div style={{ fontWeight: 600, fontSize: '13px' }}>
                                                {ventaDetalle.metodoPago === 'EFECTIVO' ? '💵 Efectivo' : '🏦 Transferencia'}
                                            </div>
                                        </div>
                                        {ventaDetalle.clienteNombre && (
                                            <div style={{ background: 'var(--light)', borderRadius: '8px', padding: '12px' }}>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>CLIENTE</div>
                                                <div style={{ fontWeight: 600, fontSize: '13px' }}>{ventaDetalle.clienteNombre}</div>
                                            </div>
                                        )}
                                        {ventaDetalle.clienteRuc && (
                                            <div style={{ background: 'var(--light)', borderRadius: '8px', padding: '12px' }}>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>RUC</div>
                                                <div style={{ fontWeight: 600, fontSize: '13px', fontFamily: 'monospace' }}>{ventaDetalle.clienteRuc}</div>
                                            </div>
                                        )}
                                        <div style={{ background: 'var(--light)', borderRadius: '8px', padding: '12px' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>COMPROBANTE</div>
                                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{ventaDetalle.tipoComprobante}</div>
                                        </div>
                                        <div style={{ background: getBadgeEstado(ventaDetalle.estado).bg, borderRadius: '8px', padding: '12px' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>ESTADO</div>
                                            <div style={{ fontWeight: 700, fontSize: '13px', color: getBadgeEstado(ventaDetalle.estado).color }}>
                                                {getBadgeEstado(ventaDetalle.estado).texto}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Productos */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: 'var(--text-muted)' }}>PRODUCTOS</div>
                                        <table className="table table-sm mb-0" style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ fontSize: '12px', background: 'var(--dark)', color: 'white', padding: '8px 10px' }}>Producto</th>
                                                    <th style={{ fontSize: '12px', background: 'var(--dark)', color: 'white', padding: '8px', textAlign: 'center' }}>Cant.</th>
                                                    <th style={{ fontSize: '12px', background: 'var(--dark)', color: 'white', padding: '8px', textAlign: 'center' }}>Desc.</th>
                                                    <th style={{ fontSize: '12px', background: 'var(--dark)', color: 'white', padding: '8px 10px', textAlign: 'right' }}>Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ventaDetalle.detalles.map(d => (
                                                    <tr key={d.id}>
                                                        <td style={{ fontSize: '13px', padding: '8px 10px' }}>
                                                            <div style={{ fontWeight: 600 }}>{d.nombre}</div>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>₲ {fmt(d.precioUnitario)} c/u</div>
                                                        </td>
                                                        <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '13px' }}>{d.cantidad}</td>
                                                        <td style={{ textAlign: 'center', fontSize: '13px' }}>
                                                            {d.descuentoPct > 0
                                                                ? <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>{d.descuentoPct}%</span>
                                                                : '—'}
                                                        </td>
                                                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>₲ {fmt(d.subtotal)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Totales */}
                                    <div style={{ background: 'var(--light)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                                            <span>₲ {fmt(ventaDetalle.subtotal)}</span>
                                        </div>
                                        {ventaDetalle.descuento > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                                                <span style={{ color: 'var(--secondary)' }}>Descuentos</span>
                                                <span style={{ color: 'var(--secondary)' }}>- ₲ {fmt(ventaDetalle.descuento)}</span>
                                            </div>
                                        )}
                                        <hr style={{ borderColor: 'var(--border)', margin: '8px 0' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '16px' }}>
                                            <span>TOTAL</span>
                                            <span style={{ color: 'var(--primary-dark)' }}>₲ {fmt(ventaDetalle.total)}</span>
                                        </div>
                                    </div>

                                    {/* Botones */}
                                    <div className="d-flex gap-2">
                                        {ventaDetalle.estado === 'COMPLETADA' && (
                                            <button onClick={() => setConfirmAnular({ show: true, id: ventaDetalle.id, numero: ventaDetalle.numeroFactura })}
                                                className="btn flex-grow-1"
                                                style={{ background: 'var(--secondary)', color: 'white', border: 'none', padding: '10px' }}>
                                                <i className="fas fa-ban mr-2"></i>Anular venta
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal
                show={confirmAnular.show}
                titulo="¿Anular venta?"
                mensaje={`Se anulará la venta ${confirmAnular.numero} y se devolverá el stock de todos los productos. Esta acción no se puede deshacer.`}
                onConfirmar={anularVenta}
                onCancelar={() => setConfirmAnular({ show: false, id: '', numero: '' })}
                tipo="danger"
            />
        </Layout>
    )
}