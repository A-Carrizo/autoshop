import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import { API } from '../config/api'

interface ProductoInventario {
    id: string
    codigoBarras: string
    nombre: string
    categoriaNombre: string
    imagenUrl?: string
    stockActual: number
    stockMinimo: number
    ultimaActualizacion?: string
}

interface Movimiento {
    id: string
    tipo: string
    cantidad: number
    referencia?: string
    fecha: string
    notas?: string
}

interface PaginatedResult {
    datos: ProductoInventario[]
    total: number
    pagina: number
    tamano: number
    totalPaginas: number
}

interface MovimientosResult {
    movimientos: Movimiento[]
    total: number
    pagina: number
    totalPaginas: number
}

const fmt = (n: number) => n.toLocaleString('es-PY')

export default function Inventario() {
    const [result, setResult] = useState<PaginatedResult>({ datos: [], total: 0, pagina: 1, tamano: 25, totalPaginas: 0 })
    const [loading, setLoading] = useState(true)
    const [pagina, setPagina] = useState(1)
    const [busqueda, setBusqueda] = useState('')
    const [soloStockBajo, setSoloStockBajo] = useState(false)
    const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoInventario | null>(null)
    const [movimientos, setMovimientos] = useState<MovimientosResult | null>(null)
    const [loadingMovimientos, setLoadingMovimientos] = useState(false)
    const [showAjuste, setShowAjuste] = useState(false)
    const [tipoAjuste, setTipoAjuste] = useState<'ENTRADA' | 'SALIDA' | 'CORRECCION'>('ENTRADA')
    const [cantidad, setCantidad] = useState('')
    const [notas, setNotas] = useState('')
    const [guardando, setGuardando] = useState(false)

    const cargarInventario = async (pag = pagina, busq = busqueda, bajo = soloStockBajo) => {
        try {
            setLoading(true)
            const params = new URLSearchParams({ pagina: pag.toString(), tamano: '25' })
            if (busq) params.append('busqueda', busq)
            if (bajo) params.append('soloStockBajo', 'true')
            const res = await fetch(`${API.inventario}?${params}`)
            const data = await res.json()
            setResult(data)
        } catch { toast.error('No se pudo conectar con el servidor') }
        finally { setLoading(false) }
    }

    useEffect(() => { cargarInventario() }, [])

    const handleBusqueda = (valor: string) => { setBusqueda(valor); setPagina(1); cargarInventario(1, valor, soloStockBajo) }
    const handleStockBajo = (valor: boolean) => { setSoloStockBajo(valor); setPagina(1); cargarInventario(1, busqueda, valor) }
    const handlePagina = (nueva: number) => { setPagina(nueva); cargarInventario(nueva, busqueda, soloStockBajo) }

    const seleccionarProducto = async (producto: ProductoInventario) => {
        setProductoSeleccionado(producto)
        setShowAjuste(false)
        setCantidad('')
        setNotas('')
        setLoadingMovimientos(true)
        try {
            const res = await fetch(`${API.inventario}/${producto.id}/movimientos`)
            const data = await res.json()
            setMovimientos(data)
        } catch { toast.error('Error al cargar movimientos') }
        finally { setLoadingMovimientos(false) }
    }

    const aplicarAjuste = async () => {
        if (!productoSeleccionado) return
        const cant = Number(cantidad)
        if (!cantidad || isNaN(cant) || cant < 0) { toast.error('Ingresá una cantidad válida'); return }
        if (tipoAjuste !== 'CORRECCION' && cant <= 0) { toast.error('La cantidad debe ser mayor a 0'); return }

        setGuardando(true)
        try {
            const res = await fetch(`${API.inventario}/${productoSeleccionado.id}/ajuste`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipoAjuste, cantidad: cant, notas: notas.trim() || null })
            })
            if (!res.ok) { const err = await res.json(); toast.error(err.mensaje || 'Error al ajustar'); return }
            const data = await res.json()
            toast.success(`Stock actualizado: ${fmt(data.stockAnterior)} → ${fmt(data.stockNuevo)}`)
            setShowAjuste(false)
            setCantidad('')
            setNotas('')
            await cargarInventario()
            // Actualizar producto seleccionado con nuevo stock
            setProductoSeleccionado(prev => prev ? { ...prev, stockActual: data.stockNuevo } : null)
            // Recargar movimientos
            const res2 = await fetch(`${API.inventario}/${productoSeleccionado.id}/movimientos`)
            setMovimientos(await res2.json())
        } catch { toast.error('Error inesperado') }
        finally { setGuardando(false) }
    }

    const getTipoMovimiento = (tipo: string) => {
        switch (tipo) {
            case 'ENTRADA': return { icon: 'fa-arrow-up', color: '#2e7d32', bg: '#e8f5e9', texto: 'Entrada' }
            case 'SALIDA': return { icon: 'fa-arrow-down', color: '#c62828', bg: '#fce4e4', texto: 'Salida' }
            case 'VENTA': return { icon: 'fa-shopping-cart', color: '#1565c0', bg: '#e3f2fd', texto: 'Venta' }
            case 'DEVOLUCION': return { icon: 'fa-undo', color: '#6a1b9a', bg: '#f3e5f5', texto: 'Devolución' }
            case 'CORRECCION': return { icon: 'fa-wrench', color: '#e65100', bg: '#fff3e0', texto: 'Corrección' }
            case 'COMPRA': return { icon: 'fa-box', color: '#2e7d32', bg: '#e8f5e9', texto: 'Compra' }
            default: return { icon: 'fa-circle', color: '#666', bg: '#f5f5f5', texto: tipo }
        }
    }

    const getStockColor = (stock: number, minimo: number) => {
        if (stock === 0) return 'var(--secondary)'
        if (stock <= minimo) return '#f6c23e'
        return '#2e7d32'
    }

    const stockBajoCount = result.datos.filter(p => p.stockActual <= p.stockMinimo).length

    return (
        <Layout titulo="Inventario">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 style={{ fontWeight: 700, margin: 0 }}>Inventario</h5>
                    <small style={{ color: 'var(--text-muted)' }}>{result.total} productos · {stockBajoCount > 0 && <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>{stockBajoCount} con stock bajo</span>}</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <button onClick={() => handleStockBajo(!soloStockBajo)}
                        className="btn btn-sm"
                        style={{ background: soloStockBajo ? '#fce4e4' : 'white', border: `1px solid ${soloStockBajo ? 'var(--secondary)' : 'var(--border)'}`, color: soloStockBajo ? 'var(--secondary)' : 'var(--text-dark)', padding: '6px 14px' }}>
                        <i className="fas fa-exclamation-triangle mr-1"></i>
                        {soloStockBajo ? 'Ver todos' : 'Solo stock bajo'}
                    </button>
                    <div className="input-group" style={{ width: '280px' }}>
                        <span className="input-group-text" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
                            <i className="fas fa-search"></i>
                        </span>
                        <input type="text" className="form-control" placeholder="Buscar producto..."
                            value={busqueda} onChange={e => handleBusqueda(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="row">
                {/* Tabla de inventario */}
                <div className={productoSeleccionado ? 'col-lg-6' : 'col-12'}>
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <span><i className="fas fa-warehouse mr-2" style={{ color: 'var(--primary)' }}></i>Stock de productos</span>
                            <small style={{ color: 'var(--text-muted)' }}>Mostrando {result.datos.length} de {result.total}</small>
                        </div>
                        <div className="card-body p-0">
                            <table className="table table-bordered mb-0">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}></th>
                                        <th>Producto</th>
                                        <th style={{ textAlign: 'center', width: '100px' }}>Stock</th>
                                        <th style={{ textAlign: 'center', width: '90px' }}>Mínimo</th>
                                        <th style={{ width: '90px' }}>Ajustar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={5} className="text-center py-4">
                                            <i className="fas fa-spinner fa-spin mr-2" style={{ color: 'var(--primary)' }}></i>Cargando...
                                        </td></tr>
                                    ) : result.datos.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                                            No hay productos
                                        </td></tr>
                                    ) : result.datos.map(p => {
                                        const esSeleccionado = productoSeleccionado?.id === p.id
                                        const stockBajo = p.stockActual <= p.stockMinimo
                                        return (
                                            <tr key={p.id}
                                                style={{ background: esSeleccionado ? 'var(--primary-light)' : stockBajo && p.stockActual > 0 ? '#fffde7' : p.stockActual === 0 ? '#fce4e4' : 'white', cursor: 'pointer' }}
                                                onClick={() => seleccionarProducto(p)}>
                                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                                    {p.imagenUrl ? (
                                                        <img src={`${API.imagenesBase}${p.imagenUrl}`} alt={p.nombre}
                                                            style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '6px' }} />
                                                    ) : (
                                                        <div style={{ width: '32px', height: '32px', background: 'var(--primary-light)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <i className="fas fa-box" style={{ color: 'var(--primary)', fontSize: '12px' }}></i>
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '10px 12px' }}>
                                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.nombre}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.categoriaNombre} · {p.codigoBarras}</div>
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '18px', color: getStockColor(p.stockActual, p.stockMinimo) }}>
                                                    {p.stockActual === 0 ? <span style={{ fontSize: '12px', fontWeight: 600 }}>SIN STOCK</span> : fmt(p.stockActual)}
                                                </td>
                                                <td style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                                                    {fmt(p.stockMinimo)}
                                                </td>
                                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                                    <button className="btn btn-sm btn-primary"
                                                        style={{ padding: '4px 10px', fontSize: '12px' }}
                                                        onClick={e => { e.stopPropagation(); seleccionarProducto(p); setShowAjuste(true) }}>
                                                        <i className="fas fa-edit mr-1"></i>Ajustar
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>

                            {/* Paginación */}
                            {result.totalPaginas > 1 && (
                                <div className="d-flex justify-content-between align-items-center px-3 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                                    <small style={{ color: 'var(--text-muted)' }}>Página {result.pagina} de {result.totalPaginas}</small>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button className="btn btn-sm" onClick={() => handlePagina(1)} disabled={pagina === 1} style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary-dark)', padding: '4px 10px' }}>«</button>
                                        <button className="btn btn-sm" onClick={() => handlePagina(pagina - 1)} disabled={pagina === 1} style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary-dark)', padding: '4px 10px' }}>‹</button>
                                        {Array.from({ length: result.totalPaginas }, (_, i) => i + 1).filter(p => p >= pagina - 2 && p <= pagina + 2).map(p => (
                                            <button key={p} className="btn btn-sm" onClick={() => handlePagina(p)}
                                                style={{ background: p === pagina ? 'var(--primary)' : 'white', border: '1px solid var(--primary)', color: p === pagina ? 'white' : 'var(--primary-dark)', fontWeight: p === pagina ? 700 : 400, padding: '4px 10px' }}>{p}</button>
                                        ))}
                                        <button className="btn btn-sm" onClick={() => handlePagina(pagina + 1)} disabled={pagina === result.totalPaginas} style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary-dark)', padding: '4px 10px' }}>›</button>
                                        <button className="btn btn-sm" onClick={() => handlePagina(result.totalPaginas)} disabled={pagina === result.totalPaginas} style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary-dark)', padding: '4px 10px' }}>»</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Panel derecho — Detalle del producto */}
                {productoSeleccionado && (
                    <div className="col-lg-6">
                        <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                            {/* Info del producto */}
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <span>
                                        <i className="fas fa-box mr-2" style={{ color: 'var(--primary)' }}></i>
                                        <strong>{productoSeleccionado.nombre}</strong>
                                    </span>
                                    <button onClick={() => { setProductoSeleccionado(null); setShowAjuste(false) }}
                                        style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                                </div>
                                <div className="card-body">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                        <div style={{ textAlign: 'center', background: 'var(--light)', borderRadius: '10px', padding: '16px' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>STOCK ACTUAL</div>
                                            <div style={{ fontSize: '28px', fontWeight: 800, color: getStockColor(productoSeleccionado.stockActual, productoSeleccionado.stockMinimo) }}>
                                                {fmt(productoSeleccionado.stockActual)}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'center', background: 'var(--light)', borderRadius: '10px', padding: '16px' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>STOCK MÍNIMO</div>
                                            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-dark)' }}>
                                                {fmt(productoSeleccionado.stockMinimo)}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'center', background: productoSeleccionado.stockActual <= productoSeleccionado.stockMinimo ? '#fce4e4' : '#e8f5e9', borderRadius: '10px', padding: '16px' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>ESTADO</div>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: productoSeleccionado.stockActual === 0 ? 'var(--secondary)' : productoSeleccionado.stockActual <= productoSeleccionado.stockMinimo ? '#f57f17' : '#2e7d32' }}>
                                                {productoSeleccionado.stockActual === 0 ? '⛔ Sin stock' : productoSeleccionado.stockActual <= productoSeleccionado.stockMinimo ? '⚠️ Stock bajo' : '✅ Normal'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botón ajustar */}
                                    {!showAjuste ? (
                                        <button onClick={() => setShowAjuste(true)} className="btn btn-primary w-100">
                                            <i className="fas fa-sliders-h mr-2"></i>Ajustar stock
                                        </button>
                                    ) : (
                                        <div style={{ border: '2px solid var(--primary)', borderRadius: '10px', padding: '16px' }}>
                                            <div style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--primary-dark)' }}>
                                                <i className="fas fa-sliders-h mr-2"></i>Ajuste de stock
                                            </div>

                                            {/* Tipo de ajuste */}
                                            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                                                {(['ENTRADA', 'SALIDA', 'CORRECCION'] as const).map(tipo => {
                                                    const colores = {
                                                        ENTRADA: { active: '#e8f5e9', border: '#2e7d32', text: '#2e7d32', icon: 'fa-plus' },
                                                        SALIDA: { active: '#fce4e4', border: '#c62828', text: '#c62828', icon: 'fa-minus' },
                                                        CORRECCION: { active: '#fff3e0', border: '#e65100', text: '#e65100', icon: 'fa-wrench' }
                                                    }
                                                    const c = colores[tipo]
                                                    return (
                                                        <button key={tipo} onClick={() => setTipoAjuste(tipo)}
                                                            style={{ flex: 1, padding: '8px 4px', border: `2px solid ${tipoAjuste === tipo ? c.border : 'var(--border)'}`, borderRadius: '8px', background: tipoAjuste === tipo ? c.active : 'white', color: tipoAjuste === tipo ? c.text : 'var(--text-muted)', fontWeight: tipoAjuste === tipo ? 700 : 400, fontSize: '12px', cursor: 'pointer' }}>
                                                            <i className={`fas ${c.icon} mr-1`}></i>
                                                            {tipo === 'CORRECCION' ? 'Corregir' : tipo === 'ENTRADA' ? 'Entrada' : 'Salida'}
                                                        </button>
                                                    )
                                                })}
                                            </div>

                                            {/* Descripción del tipo */}
                                            <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '10px' }}>
                                                {tipoAjuste === 'ENTRADA' && '➕ Suma cantidad al stock actual (reposición, compra)'}
                                                {tipoAjuste === 'SALIDA' && '➖ Resta cantidad del stock actual (merma, pérdida)'}
                                                {tipoAjuste === 'CORRECCION' && '🔧 Establece el stock exacto que tenés físicamente'}
                                            </small>

                                            <div className="mb-3">
                                                <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', display: 'block' }}>
                                                    {tipoAjuste === 'CORRECCION' ? 'Stock real (cantidad exacta)' : 'Cantidad'}
                                                </label>
                                                <input type="number" className="form-control" min="0"
                                                    placeholder={tipoAjuste === 'CORRECCION' ? `Stock actual: ${productoSeleccionado.stockActual}` : '0'}
                                                    value={cantidad} onChange={e => setCantidad(e.target.value)} />
                                                {tipoAjuste === 'CORRECCION' && cantidad && (
                                                    <small style={{ color: Number(cantidad) > productoSeleccionado.stockActual ? '#2e7d32' : 'var(--secondary)' }}>
                                                        {Number(cantidad) > productoSeleccionado.stockActual
                                                            ? `↑ Aumenta ${fmt(Number(cantidad) - productoSeleccionado.stockActual)} unidades`
                                                            : Number(cantidad) < productoSeleccionado.stockActual
                                                                ? `↓ Disminuye ${fmt(productoSeleccionado.stockActual - Number(cantidad))} unidades`
                                                                : '= Sin cambios'
                                                        }
                                                    </small>
                                                )}
                                            </div>

                                            <div className="mb-3">
                                                <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', display: 'block' }}>
                                                    Notas <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opcional)</span>
                                                </label>
                                                <input type="text" className="form-control" placeholder="Ej: Compra proveedor, merma, conteo físico..."
                                                    value={notas} onChange={e => setNotas(e.target.value)} />
                                            </div>

                                            <div className="d-flex gap-2">
                                                <button onClick={() => { setShowAjuste(false); setCantidad(''); setNotas('') }} className="btn"
                                                    style={{ background: 'var(--light)', border: '1px solid var(--border)', flex: 1 }}>
                                                    Cancelar
                                                </button>
                                                <button onClick={aplicarAjuste} disabled={guardando} className="btn btn-primary" style={{ flex: 1 }}>
                                                    {guardando ? <><i className="fas fa-spinner fa-spin mr-1"></i>Aplicando...</> : <><i className="fas fa-check mr-1"></i>Aplicar</>}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Historial de movimientos */}
                            <div className="card">
                                <div className="card-header">
                                    <i className="fas fa-history mr-2" style={{ color: 'var(--primary)' }}></i>Historial de movimientos
                                </div>
                                <div className="card-body p-0" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                    {loadingMovimientos ? (
                                        <div className="text-center py-4">
                                            <i className="fas fa-spinner fa-spin" style={{ color: 'var(--primary)' }}></i>
                                        </div>
                                    ) : !movimientos || movimientos.movimientos.length === 0 ? (
                                        <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>Sin movimientos registrados</div>
                                    ) : movimientos.movimientos.map(m => {
                                        const tipo = getTipoMovimiento(m.tipo)
                                        const esEntrada = ['ENTRADA', 'DEVOLUCION', 'COMPRA'].includes(m.tipo)
                                        return (
                                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: tipo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <i className={`fas ${tipo.icon}`} style={{ color: tipo.color, fontSize: '13px' }}></i>
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{tipo.texto}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {m.notas || m.referencia || '—'}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                        {new Date(m.fecha).toLocaleString('es-PY')}
                                                    </div>
                                                </div>
                                                <div style={{ fontWeight: 800, fontSize: '16px', color: esEntrada ? '#2e7d32' : 'var(--secondary)', flexShrink: 0 }}>
                                                    {esEntrada ? '+' : '-'}{fmt(m.cantidad)}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}