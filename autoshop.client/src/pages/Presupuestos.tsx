import { useState, useRef, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import ConfirmModal from '../components/ui/ConfirmModal'
import { API } from '../config/api'
import logo from '../assets/logo_autoshop.jpeg'

interface Producto {
    id: string; codigoBarras: string; nombre: string
    precioVenta: number; descuentoPct: number; categoriaNombre: string; stockActual: number
}

interface Cliente {
    id: string; nombre: string; ruc?: string; telefono?: string; email?: string
}

interface ItemPresupuesto {
    tipo: 'PRODUCTO' | 'SERVICIO'
    productoId?: string
    descripcion: string
    precioUnitario: number
    cantidad: number
    descuentoPct: number
    subtotal: number
}

interface PresupuestoListado {
    id: string; numeroPresupuesto: string; fecha: string; estado: string
    clienteNombre?: string; total: number; ventaId?: string
}

const fmt = (n: number) => Math.round(n).toLocaleString('es-PY')
const calcSub = (precio: number, cant: number, desc: number) => precio * cant * (1 - desc / 100)

const ESTADO_STYLE: Record<string, { bg: string, color: string, label: string }> = {
    PENDIENTE: { bg: '#fffbeb', color: '#b7791f', label: 'Pendiente' },
    APROBADO: { bg: '#f0fff4', color: '#2f855a', label: 'Aprobado' },
    RECHAZADO: { bg: '#fff5f5', color: '#c53030', label: 'Rechazado' },
    CONVERTIDO: { bg: '#ebf8ff', color: '#2b6cb0', label: 'Convertido' },
}

export default function Presupuestos() {
    // Vista: 'lista' | 'nuevo' | 'detalle'
    const [vista, setVista] = useState<'lista' | 'nuevo' | 'detalle'>('lista')
    const [presupuestos, setPresupuestos] = useState<PresupuestoListado[]>([])
    const [cargando, setCargando] = useState(true)
    const [filtroEstado, setFiltroEstado] = useState('')
    const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState<any>(null)

    // Nuevo presupuesto
    const [items, setItems] = useState<ItemPresupuesto[]>([])
    const [clienteNombre, setClienteNombre] = useState('')
    const [clienteRuc, setClienteRuc] = useState('')
    const [clienteTelefono, setClienteTelefono] = useState('')
    const [notas, setNotas] = useState('')
    const [busqueda, setBusqueda] = useState('')
    const [resultados, setResultados] = useState<Producto[]>([])
    const [buscando, setBuscando] = useState(false)
    const [guardando, setGuardando] = useState(false)

    // Buscador de clientes
    const [busquedaCliente, setBusquedaCliente] = useState('')
    const [resultadosCliente, setResultadosCliente] = useState<Cliente[]>([])
    const [buscandoCliente, setBuscandoCliente] = useState(false)
    const clienteTimeout = useRef<ReturnType<typeof setTimeout>>()
    const clienteDropdownRef = useRef<HTMLDivElement>(null)

    // Servicio
    const [servicioDesc, setServicioDesc] = useState('')
    const [servicioPrecio, setServicioPrecio] = useState('')
    const [servicioCant, setServicioCant] = useState('1')
    const [servicioDesc2, setServicioDescuento] = useState('0')

    // Modal convertir
    const [modalConvertir, setModalConvertir] = useState(false)
    const [metodoPagoConvertir, setMetodoPagoConvertir] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO')
    const [tipoComprobanteConvertir, setTipoComprobanteConvertir] = useState<'TICKET' | 'FACTURA'>('TICKET')
    const [convirtiendo, setConvirtiendo] = useState(false)

    // Modal eliminar
    const [modalEliminar, setModalEliminar] = useState(false)
    const [eliminando, setEliminando] = useState(false)

    // Descargar PDF
    const [descargando, setDescargando] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)
    const busquedaTimeout = useRef<ReturnType<typeof setTimeout>>()

    const cargarPresupuestos = useCallback(async () => {
        setCargando(true)
        try {
            const params = new URLSearchParams({ pagina: '1', tamano: '50' })
            if (filtroEstado) params.set('estado', filtroEstado)
            const res = await fetch(`${API.presupuestos}?${params}`)
            const data = await res.json()
            setPresupuestos(data.datos || [])
        } catch { toast.error('Error al cargar presupuestos') }
        finally { setCargando(false) }
    }, [filtroEstado])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        cargarPresupuestos()
    }, [cargarPresupuestos])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(e.target as Node))
                setResultadosCliente([])
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const buscarClientes = async (termino: string) => {
        if (!termino.trim()) { setResultadosCliente([]); return }
        setBuscandoCliente(true)
        try {
            const res = await fetch(`${API.clientes}/buscar?q=${encodeURIComponent(termino)}`)
            const data = await res.json()
            setResultadosCliente(data || [])
        } catch { } finally { setBuscandoCliente(false) }
    }

    const handleClienteInput = (val: string) => {
        setClienteNombre(val)
        clearTimeout(clienteTimeout.current)
        if (val.trim()) clienteTimeout.current = setTimeout(() => buscarClientes(val), 250)
        else setResultadosCliente([])
    }

    const seleccionarCliente = (c: Cliente) => {
        setClienteNombre(c.nombre)
        setClienteRuc(c.ruc || '')
        setClienteTelefono(c.telefono || '')
        setResultadosCliente([])
    }

    const buscarProductos = async (termino: string) => {
        if (!termino.trim()) { setResultados([]); return }
        setBuscando(true)
        try {
            const res = await fetch(`${API.productos}?busqueda=${encodeURIComponent(termino)}&tamano=6`)
            const data = await res.json()
            setResultados(data.datos || [])
        } catch { } finally { setBuscando(false) }
    }

    const handleBusqueda = (val: string) => {
        setBusqueda(val)
        clearTimeout(busquedaTimeout.current)
        busquedaTimeout.current = setTimeout(() => buscarProductos(val), 250)
    }

    const agregarProducto = (p: Producto) => {
        setItems(prev => {
            const existe = prev.find(i => i.productoId === p.id)
            if (existe) {
                return prev.map(i => i.productoId === p.id
                    ? { ...i, cantidad: i.cantidad + 1, subtotal: calcSub(i.precioUnitario, i.cantidad + 1, i.descuentoPct) }
                    : i)
            }
            return [...prev, {
                tipo: 'PRODUCTO', productoId: p.id, descripcion: p.nombre,
                precioUnitario: p.precioVenta, cantidad: 1, descuentoPct: p.descuentoPct,
                subtotal: calcSub(p.precioVenta, 1, p.descuentoPct)
            }]
        })
        setBusqueda(''); setResultados([])
        inputRef.current?.focus()
    }

    const agregarServicio = () => {
        if (!servicioDesc.trim()) { toast.error('Ingresá una descripción del servicio'); return }
        const precio = parseFloat(servicioPrecio.replace(/\./g, '').replace(',', '.'))
        if (!precio || precio <= 0) { toast.error('Ingresá un precio válido'); return }
        const cant = parseInt(servicioCant) || 1
        const desc = parseFloat(servicioDesc2) || 0
        setItems(prev => [...prev, {
            tipo: 'SERVICIO', descripcion: servicioDesc.trim(),
            precioUnitario: precio, cantidad: cant, descuentoPct: desc,
            subtotal: calcSub(precio, cant, desc)
        }])
        setServicioDesc(''); setServicioPrecio(''); setServicioCant('1'); setServicioDescuento('0')
    }

    const actualizarCantidad = (idx: number, cant: number) => {
        if (cant <= 0) { setItems(prev => prev.filter((_, i) => i !== idx)); return }
        setItems(prev => prev.map((item, i) => i !== idx ? item : { ...item, cantidad: cant, subtotal: calcSub(item.precioUnitario, cant, item.descuentoPct) }))
    }

    const actualizarDescuento = (idx: number, desc: number) => {
        const d = Math.min(100, Math.max(0, desc))
        setItems(prev => prev.map((item, i) => i !== idx ? item : { ...item, descuentoPct: d, subtotal: calcSub(item.precioUnitario, item.cantidad, d) }))
    }

    const subtotalGeneral = items.reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0)
    const descuentoGeneral = items.reduce((acc, i) => acc + i.precioUnitario * i.cantidad * i.descuentoPct / 100, 0)
    const totalGeneral = subtotalGeneral - descuentoGeneral

    const guardarPresupuesto = async () => {
        if (items.length === 0) { toast.error('Agregá al menos un item'); return }
        setGuardando(true)
        try {
            const res = await fetch(API.presupuestos, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clienteNombre: clienteNombre.trim() || null,
                    clienteRuc: clienteRuc.trim() || null,
                    clienteTelefono: clienteTelefono.trim() || null,
                    notas: notas.trim() || null,
                    items: items.map(i => ({
                        tipo: i.tipo,
                        productoId: i.productoId || null,
                        descripcion: i.descripcion,
                        precioUnitario: i.precioUnitario,
                        cantidad: i.cantidad,
                        descuentoPct: i.descuentoPct,
                    }))
                })
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.mensaje || 'Error al guardar'); return }
            toast.success(`Presupuesto ${data.numeroPresupuesto} creado`)
            setVista('lista')
            setItems([]); setClienteNombre(''); setClienteRuc(''); setClienteTelefono(''); setNotas('')
            cargarPresupuestos()
        } catch { toast.error('Error de conexión') }
        finally { setGuardando(false) }
    }

    const verDetalle = async (id: string) => {
        try {
            const res = await fetch(`${API.presupuestos}/${id}`)
            const data = await res.json()
            setPresupuestoSeleccionado(data)
            setVista('detalle')
        } catch { toast.error('Error al cargar detalle') }
    }

    const cambiarEstado = async (id: string, estado: string) => {
        try {
            const res = await fetch(`${API.presupuestos}/${id}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado })
            })
            if (!res.ok) { toast.error('Error al cambiar estado'); return }
            toast.success('Estado actualizado')
            setPresupuestoSeleccionado((prev: any) => ({ ...prev, estado }))
            cargarPresupuestos()
        } catch { toast.error('Error de conexión') }
    }

    const convertirEnVenta = async () => {
        setConvirtiendo(true)
        try {
            const res = await fetch(`${API.presupuestos}/${presupuestoSeleccionado.id}/convertir`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metodoPago: metodoPagoConvertir, tipoComprobante: tipoComprobanteConvertir })
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.mensaje || 'Error al convertir'); return }
            toast.success(`Venta ${data.numeroFactura} creada correctamente`)
            setModalConvertir(false)
            setPresupuestoSeleccionado((prev: any) => ({ ...prev, estado: 'CONVERTIDO', ventaId: data.ventaId }))
            cargarPresupuestos()
        } catch { toast.error('Error de conexión') }
        finally { setConvirtiendo(false) }
    }

    const eliminarPresupuesto = async (id: string) => {
        setEliminando(true)
        try {
            const res = await fetch(`${API.presupuestos}/${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (!res.ok) { toast.error(data.mensaje || 'Error'); return }
            toast.success('Presupuesto eliminado')
            setModalEliminar(false)
            setVista('lista'); cargarPresupuestos()
        } catch { toast.error('Error de conexión') }
        finally { setEliminando(false) }
    }

    const descargarPresupuesto = async () => {
        if (!presupuestoSeleccionado) return
        setDescargando(true)
        try {
            if (!(window as { jspdf?: unknown }).jspdf) {
                const s1 = document.createElement('script')
                s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
                document.head.appendChild(s1); await new Promise(r => { s1.onload = r })
            }
            if (!(window as { html2canvas?: unknown }).html2canvas) {
                const s2 = document.createElement('script')
                s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
                document.head.appendChild(s2); await new Promise(r => { s2.onload = r })
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const html2canvas = (window as any).html2canvas
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { jsPDF } = (window as any).jspdf

            const elemento = document.getElementById('presupuesto-print')
            if (!elemento) return

            const canvas = await html2canvas(elemento, { scale: 2, backgroundColor: '#ffffff' })
            const imgData = canvas.toDataURL('image/png')

            // Ancho tipo hoja A4 (210mm), alto proporcional al contenido real
            // (evita cortar el documento a mitad de página si tiene muchos items)
            const anchoMM = 210
            const altoMM = (canvas.height * anchoMM) / canvas.width

            const doc = new jsPDF({ unit: 'mm', format: [anchoMM, altoMM] })
            doc.addImage(imgData, 'PNG', 0, 0, anchoMM, altoMM)
            doc.save(`${presupuestoSeleccionado.numeroPresupuesto}.pdf`)
        } catch (e) {
            console.error(e)
            toast.error('Error al generar el PDF')
        } finally {
            setDescargando(false)
        }
    }

    const fmtFecha = (f: string) => new Date(f).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })

    // ── VISTA DETALLE ────────────────────────────────────────────────────
    if (vista === 'detalle' && presupuestoSeleccionado) {
        const p = presupuestoSeleccionado
        const est = ESTADO_STYLE[p.estado] || ESTADO_STYLE.PENDIENTE
        return (
            <Layout titulo={`Presupuesto ${p.numeroPresupuesto}`}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div className="d-flex align-items-center gap-3 mb-4 no-print">
                        <button onClick={() => setVista('lista')} className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', border: '1px solid var(--primary)' }}>
                            <i className="fas fa-arrow-left mr-2"></i>Volver
                        </button>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{p.numeroPresupuesto}</h2>
                        <span style={{ background: est.bg, color: est.color, fontWeight: 700, fontSize: '12px', padding: '4px 12px', borderRadius: '20px' }}>{est.label}</span>
                        <div className="d-flex gap-2 ms-auto">
                            <button onClick={() => window.print()} className="btn btn-sm" style={{ background: '#1a1a1a', color: 'white', border: 'none' }}>
                                <i className="fas fa-print mr-2"></i>Imprimir / PDF
                            </button>
                            <button onClick={descargarPresupuesto} disabled={descargando} className="btn btn-sm" style={{ background: '#2b6cb0', color: 'white', border: 'none' }}>
                                {descargando
                                    ? <><i className="fas fa-spinner fa-spin mr-2"></i>Generando...</>
                                    : <><i className="fas fa-download mr-2"></i>Descargar</>}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        {/* Info cliente */}
                        <div className="card">
                            <div className="card-header" style={{ fontSize: '13px' }}><i className="fas fa-user mr-2" style={{ color: 'var(--primary)' }}></i>Cliente</div>
                            <div className="card-body" style={{ fontSize: '13px' }}>
                                <div><strong>Nombre:</strong> {p.clienteNombre || '-'}</div>
                                <div><strong>RUC:</strong> {p.clienteRuc || '-'}</div>
                                <div><strong>Tel:</strong> {p.clienteTelefono || '-'}</div>
                                <div><strong>Fecha:</strong> {fmtFecha(p.fecha)}</div>
                                {p.notas && <div className="mt-2" style={{ color: 'var(--text-muted)' }}><i className="fas fa-sticky-note mr-1"></i>{p.notas}</div>}
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="card">
                            <div className="card-header" style={{ fontSize: '13px' }}><i className="fas fa-cogs mr-2" style={{ color: 'var(--primary)' }}></i>Acciones</div>
                            <div className="card-body d-flex flex-column gap-2">
                                {p.estado === 'PENDIENTE' && <>
                                    <button onClick={() => cambiarEstado(p.id, 'APROBADO')} className="btn btn-sm" style={{ background: '#f0fff4', color: '#2f855a', border: '1px solid #c6f6d5', fontWeight: 600 }}>
                                        <i className="fas fa-check mr-2"></i>Marcar como Aprobado
                                    </button>
                                    <button onClick={() => cambiarEstado(p.id, 'RECHAZADO')} className="btn btn-sm" style={{ background: '#fff5f5', color: '#c53030', border: '1px solid #fed7d7', fontWeight: 600 }}>
                                        <i className="fas fa-times mr-2"></i>Marcar como Rechazado
                                    </button>
                                </>}
                                {p.estado === 'APROBADO' && !p.ventaId && (
                                    <button onClick={() => setModalConvertir(true)} className="btn btn-primary btn-sm" style={{ fontWeight: 600 }}>
                                        <i className="fas fa-exchange-alt mr-2"></i>Convertir en Venta
                                    </button>
                                )}
                                {p.ventaId && (
                                    <div style={{ padding: '8px 12px', background: '#ebf8ff', borderRadius: '8px', fontSize: '12px', color: '#2b6cb0', fontWeight: 600 }}>
                                        <i className="fas fa-check-circle mr-2"></i>Convertido en venta
                                    </div>
                                )}
                                {!p.ventaId && (
                                    <button onClick={() => setModalEliminar(true)}
                                        className="btn btn-sm mt-2" style={{ background: '#fff5f5', color: '#c53030', border: '1px solid #fed7d7', fontWeight: 600 }}>
                                        <i className="fas fa-trash mr-2"></i>Eliminar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* DOCUMENTO IMPRIMIBLE A4 */}
                    <div id="presupuesto-print" style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '40px', fontFamily: 'Arial, sans-serif' }}>
                        {/* Encabezado */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', borderBottom: '2px solid #1a1a1a', paddingBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <img src={logo} alt="MagCar" style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px' }} />
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '1px', color: '#1a1a1a' }}>MAGCAR AUTO SHOP</div>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>Accesorios y Luces Automotrices</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>Asunción, Paraguay</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '26px', fontWeight: 800, color: '#1a1a1a' }}>PRESUPUESTO</div>
                                <div style={{ fontSize: '16px', fontWeight: 700, color: '#CC0000', marginTop: '4px' }}>{p.numeroPresupuesto}</div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Fecha: {new Date(p.fecha).toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                                <div style={{ display: 'inline-block', marginTop: '8px', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: est.bg, color: est.color }}>{est.label.toUpperCase()}</div>
                            </div>
                        </div>

                        {/* Datos cliente */}
                        {(p.clienteNombre || p.clienteRuc || p.clienteTelefono) && (
                            <div style={{ marginBottom: '28px', padding: '16px', background: '#f9f9f9', borderRadius: '6px', borderLeft: '4px solid #1a1a1a' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#666', marginBottom: '8px' }}>Datos del cliente</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                    {p.clienteNombre && <div><span style={{ fontSize: '11px', color: '#888' }}>Nombre: </span><span style={{ fontSize: '13px', fontWeight: 600 }}>{p.clienteNombre}</span></div>}
                                    {p.clienteRuc && <div><span style={{ fontSize: '11px', color: '#888' }}>RUC: </span><span style={{ fontSize: '13px', fontWeight: 600 }}>{p.clienteRuc}</span></div>}
                                    {p.clienteTelefono && <div><span style={{ fontSize: '11px', color: '#888' }}>Tel: </span><span style={{ fontSize: '13px', fontWeight: 600 }}>{p.clienteTelefono}</span></div>}
                                </div>
                            </div>
                        )}

                        {/* Tabla */}
                        <table style={{ width: '100%', borderCollapse: 'collapse' as const, marginBottom: '24px' }}>
                            <thead>
                                <tr style={{ background: '#1a1a1a', color: 'white' }}>
                                    <th style={{ padding: '10px 12px', fontSize: '11px', textAlign: 'left', textTransform: 'uppercase' as const }}>Tipo</th>
                                    <th style={{ padding: '10px 12px', fontSize: '11px', textAlign: 'left', textTransform: 'uppercase' as const }}>Descripción</th>
                                    <th style={{ padding: '10px 8px', fontSize: '11px', textAlign: 'center', textTransform: 'uppercase' as const }}>Cant.</th>
                                    <th style={{ padding: '10px 8px', fontSize: '11px', textAlign: 'right', textTransform: 'uppercase' as const }}>Precio Unit.</th>
                                    <th style={{ padding: '10px 8px', fontSize: '11px', textAlign: 'center', textTransform: 'uppercase' as const }}>Desc.</th>
                                    <th style={{ padding: '10px 12px', fontSize: '11px', textAlign: 'right', textTransform: 'uppercase' as const }}>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {p.detalles.map((d: any, i: number) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                        <td style={{ padding: '10px 12px', fontSize: '11px' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 700, background: d.tipo === 'PRODUCTO' ? '#e8f4fd' : '#fef3c7', color: d.tipo === 'PRODUCTO' ? '#1a5276' : '#92400e' }}>
                                                {d.tipo === 'PRODUCTO' ? 'PRODUCTO' : 'SERVICIO'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 500 }}>{d.descripcion}</td>
                                        <td style={{ padding: '10px 8px', fontSize: '13px', textAlign: 'center' }}>{d.cantidad}</td>
                                        <td style={{ padding: '10px 8px', fontSize: '13px', textAlign: 'right' }}>₲ {fmt(d.precioUnitario)}</td>
                                        <td style={{ padding: '10px 8px', fontSize: '13px', textAlign: 'center', color: d.descuentoPct > 0 ? '#c0392b' : '#999' }}>{d.descuentoPct > 0 ? `${d.descuentoPct}%` : '-'}</td>
                                        <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right', fontWeight: 700 }}>₲ {fmt(d.subtotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totales */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
                            <div style={{ minWidth: '260px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#555' }}>
                                    <span>Subtotal</span><span>₲ {fmt(p.subtotal)}</span>
                                </div>
                                {p.descuento > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#c0392b' }}>
                                        <span>Descuentos</span><span>- ₲ {fmt(p.descuento)}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', marginTop: '8px', background: '#1a1a1a', borderRadius: '6px', color: 'white' }}>
                                    <span style={{ fontWeight: 700, fontSize: '15px' }}>TOTAL</span>
                                    <span style={{ fontWeight: 800, fontSize: '20px' }}>₲ {fmt(p.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notas */}
                        {p.notas && (
                            <div style={{ marginBottom: '24px', padding: '12px 16px', background: '#fffbeb', borderRadius: '6px', border: '1px solid #f6e05e', fontSize: '12px', color: '#744210' }}>
                                <strong>Notas:</strong> {p.notas}
                            </div>
                        )}

                        {/* Pie */}
                        <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '16px' }}>
                            <div style={{ fontWeight: 700, color: '#c53030', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
                                ⚠ Los precios pueden estar sujetos a variaciones.
                            </div>
                            <div style={{ marginTop: '4px', fontSize: '11px', color: '#999' }}>MagCar Auto Shop — Accesorios y Luces Automotrices</div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        .no-print { display: none !important; }
                        body * { visibility: hidden; }
                        #presupuesto-print, #presupuesto-print * { visibility: visible; }
                        #presupuesto-print {
                            position: fixed; left: 0; top: 0;
                            width: 100%; border: none !important;
                            border-radius: 0 !important;
                            padding: 15mm !important;
                        }
                    }
                `}</style>

                <ConfirmModal
                    show={modalConvertir}
                    titulo="Convertir en Venta"
                    mensaje=""
                    onConfirmar={convertirEnVenta}
                    onCancelar={() => setModalConvertir(false)}
                    tipo="warning"
                    textoConfirmar={convirtiendo ? 'Procesando...' : 'Confirmar venta'}
                >
                    <div style={{ padding: '8px 0' }}>
                        <p style={{ fontSize: '13px', marginBottom: '12px', color: 'var(--text-muted)' }}>
                            Se creará una venta con todos los items. Los productos descontarán stock, los servicios se registran como items adicionales.
                        </p>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Método de pago</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {(['EFECTIVO', 'TRANSFERENCIA'] as const).map(m => (
                                    <button key={m} onClick={() => setMetodoPagoConvertir(m)}
                                        style={{ flex: 1, padding: '7px', border: `2px solid ${metodoPagoConvertir === m ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '6px', background: metodoPagoConvertir === m ? 'var(--primary-light)' : 'white', cursor: 'pointer', fontSize: '12px', fontWeight: metodoPagoConvertir === m ? 700 : 400 }}>
                                        {m === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Tipo de comprobante</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {(['TICKET', 'FACTURA'] as const).map(t => (
                                    <button key={t} onClick={() => setTipoComprobanteConvertir(t)}
                                        style={{ flex: 1, padding: '7px', border: `2px solid ${tipoComprobanteConvertir === t ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '6px', background: tipoComprobanteConvertir === t ? 'var(--primary-light)' : 'white', cursor: 'pointer', fontSize: '12px', fontWeight: tipoComprobanteConvertir === t ? 700 : 400 }}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </ConfirmModal>

                <ConfirmModal
                    show={modalEliminar}
                    titulo="Eliminar presupuesto"
                    mensaje={`¿Estás seguro de eliminar el presupuesto ${p.numeroPresupuesto}? Esta acción no se puede deshacer.`}
                    onConfirmar={() => eliminarPresupuesto(p.id)}
                    onCancelar={() => setModalEliminar(false)}
                    tipo="danger"
                    textoConfirmar={eliminando ? 'Eliminando...' : 'Sí, eliminar'}
                />
            </Layout>
        )
    }

    // ── VISTA NUEVO PRESUPUESTO ──────────────────────────────────────────
    if (vista === 'nuevo') {
        return (
            <Layout titulo="Nuevo Presupuesto" sinFooter>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', height: 'calc(100vh - 100px)' }}>

                    {/* Panel izquierdo */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>

                        {/* Buscar producto */}
                        <div className="card">
                            <div className="card-header" style={{ fontSize: '13px' }}><i className="fas fa-box mr-2" style={{ color: 'var(--primary)' }}></i>Agregar producto</div>
                            <div className="card-body py-3" style={{ position: 'relative' }}>
                                <div className="input-group">
                                    <span className="input-group-text" style={{ background: 'var(--primary)', color: 'white', border: 'none' }}><i className="fas fa-search"></i></span>
                                    <input ref={inputRef} type="text" className="form-control" placeholder="Buscar producto por nombre o código..."
                                        value={busqueda} onChange={e => handleBusqueda(e.target.value)} autoComplete="off" style={{ fontSize: '14px' }} />
                                    {buscando && <span className="input-group-text"><i className="fas fa-spinner fa-spin" style={{ color: 'var(--primary)' }}></i></span>}
                                </div>
                                {resultados.length > 0 && (
                                    <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 9999, background: 'white', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden', margin: '0 16px' }}>
                                        {resultados.map(p => (
                                            <div key={p.id} onClick={() => agregarProducto(p)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.nombre}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.categoriaNombre}</div>
                                                </div>
                                                <div style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>₲ {fmt(p.precioVenta)}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Agregar servicio */}
                        <div className="card">
                            <div className="card-header" style={{ fontSize: '13px' }}><i className="fas fa-tools mr-2" style={{ color: 'var(--primary)' }}></i>Agregar servicio / mano de obra</div>
                            <div className="card-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 80px auto', gap: '8px', alignItems: 'end' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Descripción</label>
                                        <input type="text" className="form-control form-control-sm" placeholder="Ej: Instalación de luces LED"
                                            value={servicioDesc} onChange={e => setServicioDesc(e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Precio (₲)</label>
                                        <input type="text" className="form-control form-control-sm" placeholder="0"
                                            value={servicioPrecio}
                                            onChange={e => {
                                                const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '')
                                                const num = parseInt(raw || '0')
                                                setServicioPrecio(isNaN(num) ? '' : num.toLocaleString('es-PY'))
                                            }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Cant.</label>
                                        <input type="number" className="form-control form-control-sm" min="1"
                                            value={servicioCant} onChange={e => setServicioCant(e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Desc. %</label>
                                        <input type="number" className="form-control form-control-sm" min="0" max="100"
                                            value={servicioDesc2} onChange={e => setServicioDescuento(e.target.value)} />
                                    </div>
                                    <button onClick={agregarServicio} className="btn btn-sm btn-primary" style={{ padding: '6px 12px' }}>
                                        <i className="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Lista de items */}
                        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div className="card-header d-flex justify-content-between align-items-center" style={{ flexShrink: 0, fontSize: '13px' }}>
                                <span><i className="fas fa-list mr-2" style={{ color: 'var(--primary)' }}></i>Items</span>
                                <small style={{ color: 'var(--text-muted)' }}>{items.length} items</small>
                            </div>
                            <div style={{ overflowY: 'auto', flex: 1 }}>
                                {items.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                                        <i className="fas fa-file-invoice fa-3x" style={{ opacity: 0.15, display: 'block', marginBottom: '12px' }}></i>
                                        Agregá productos o servicios al presupuesto
                                    </div>
                                ) : (
                                    <table className="table mb-0">
                                        <colgroup>
                                            <col style={{ width: '70px' }} />
                                            <col />
                                            <col style={{ width: '100px' }} />
                                            <col style={{ width: '80px' }} />
                                            <col style={{ width: '100px' }} />
                                            <col style={{ width: '30px' }} />
                                        </colgroup>
                                        <thead>
                                            <tr>
                                                <th style={{ background: 'var(--dark)', color: 'white', padding: '8px', fontSize: '11px' }}>Tipo</th>
                                                <th style={{ background: 'var(--dark)', color: 'white', padding: '8px', fontSize: '11px' }}>Descripción</th>
                                                <th style={{ background: 'var(--dark)', color: 'white', padding: '8px', fontSize: '11px', textAlign: 'center' }}>Cantidad</th>
                                                <th style={{ background: 'var(--dark)', color: 'white', padding: '8px', fontSize: '11px', textAlign: 'center' }}>Desc. %</th>
                                                <th style={{ background: 'var(--dark)', color: 'white', padding: '8px', fontSize: '11px', textAlign: 'right' }}>Subtotal</th>
                                                <th style={{ background: 'var(--dark)', color: 'white', padding: '8px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                                                        <span style={{ background: item.tipo === 'PRODUCTO' ? 'var(--primary-light)' : '#fef3c7', color: item.tipo === 'PRODUCTO' ? 'var(--primary-dark)' : '#92400e', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                                                            {item.tipo === 'PRODUCTO' ? 'Prod.' : 'Serv.'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '8px', verticalAlign: 'middle', fontSize: '13px', fontWeight: 500 }}>{item.descripcion}</td>
                                                    <td style={{ padding: '8px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                                                            <button onClick={() => actualizarCantidad(idx, item.cantidad - 1)} style={{ width: '22px', height: '22px', border: '1px solid var(--border)', borderRadius: '4px', background: 'white', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0 }}>−</button>
                                                            <input type="number" value={item.cantidad} min="1" onChange={e => actualizarCantidad(idx, Number(e.target.value))}
                                                                style={{ width: '36px', textAlign: 'center', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 0', fontSize: '13px', fontWeight: 600 }} />
                                                            <button onClick={() => actualizarCantidad(idx, item.cantidad + 1)} style={{ width: '22px', height: '22px', border: '1px solid var(--border)', borderRadius: '4px', background: 'white', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0 }}>+</button>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '8px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <input type="number" value={item.descuentoPct} min="0" max="100" onChange={e => actualizarDescuento(idx, Number(e.target.value))}
                                                                style={{ width: '44px', textAlign: 'center', border: '1px solid var(--border)', borderRadius: '4px 0 0 4px', padding: '3px 0', fontSize: '13px' }} />
                                                            <span style={{ border: '1px solid var(--border)', borderLeft: 'none', borderRadius: '0 4px 4px 0', padding: '3px 5px', background: '#f5f5f5', fontSize: '12px', lineHeight: '1.4' }}>%</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '8px 12px', verticalAlign: 'middle', textAlign: 'right', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>₲ {fmt(item.subtotal)}</td>
                                                    <td style={{ padding: '4px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                        <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', fontSize: '15px', padding: '2px 4px' }}>
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Panel derecho */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>

                        {/* Cliente con buscador */}
                        <div className="card">
                            <div className="card-header" style={{ fontSize: '13px' }}><i className="fas fa-user mr-2" style={{ color: 'var(--primary)' }}></i>Cliente</div>
                            <div className="card-body d-flex flex-column gap-2">
                                <div ref={clienteDropdownRef} style={{ position: 'relative' }}>
                                    <div style={{ position: 'relative' }}>
                                        <input type="text" className="form-control form-control-sm"
                                            placeholder="Buscar cliente registrado o escribir nombre..."
                                            value={clienteNombre}
                                            onChange={e => handleClienteInput(e.target.value)}
                                            style={{ fontSize: '13px', paddingRight: '28px' }} />
                                        {buscandoCliente && (
                                            <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
                                                <i className="fas fa-spinner fa-spin" style={{ color: 'var(--primary)', fontSize: '11px' }}></i>
                                            </span>
                                        )}
                                    </div>
                                    {resultadosCliente.length > 0 && (
                                        <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 9999, background: 'white', border: '1px solid var(--border)', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                            {resultadosCliente.map(c => (
                                                <div key={c.id} onClick={() => seleccionarCliente(c)}
                                                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                                    <div style={{ fontWeight: 600 }}>{c.nombre}</div>
                                                    {c.ruc && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RUC: {c.ruc}</div>}
                                                    {c.telefono && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tel: {c.telefono}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <input type="text" className="form-control form-control-sm" placeholder="RUC (opcional)"
                                    value={clienteRuc} onChange={e => setClienteRuc(e.target.value)} style={{ fontSize: '13px' }} />
                                <input type="text" className="form-control form-control-sm" placeholder="Teléfono (opcional)"
                                    value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)} style={{ fontSize: '13px' }} />
                                <textarea className="form-control form-control-sm" placeholder="Notas adicionales..." rows={2}
                                    value={notas} onChange={e => setNotas(e.target.value)} style={{ fontSize: '13px', resize: 'none' }} />
                            </div>
                        </div>

                        {/* Totales */}
                        <div className="card">
                            <div className="card-body" style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                                    <span>₲ {fmt(subtotalGeneral)}</span>
                                </div>
                                {descuentoGeneral > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                                        <span style={{ color: 'var(--secondary)' }}>Descuentos</span>
                                        <span style={{ color: 'var(--secondary)' }}>- ₲ {fmt(descuentoGeneral)}</span>
                                    </div>
                                )}
                                <hr style={{ borderColor: 'var(--border)', margin: '10px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700, fontSize: '15px' }}>TOTAL</span>
                                    <span style={{ fontWeight: 800, fontSize: '22px', color: 'var(--primary-dark)' }}>₲ {fmt(totalGeneral)}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setVista('lista')} className="btn btn-sm" style={{ flex: 1, background: 'var(--primary-light)', color: 'var(--primary-dark)', border: '1px solid var(--primary)' }}>
                                Cancelar
                            </button>
                            <button onClick={guardarPresupuesto} disabled={items.length === 0 || guardando} className="btn btn-primary" style={{ flex: 2, fontWeight: 700 }}>
                                {guardando ? <><i className="fas fa-spinner fa-spin mr-2"></i>Guardando...</> : <><i className="fas fa-save mr-2"></i>Guardar presupuesto</>}
                            </button>
                        </div>
                    </div>
                </div>
            </Layout>
        )
    }

    // ── VISTA LISTA ──────────────────────────────────────────────────────
    return (
        <Layout titulo="Presupuestos">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['', 'PENDIENTE', 'APROBADO', 'RECHAZADO', 'CONVERTIDO'].map(e => (
                        <button key={e} onClick={() => setFiltroEstado(e)}
                            style={{ padding: '6px 14px', borderRadius: '20px', border: `1.5px solid ${filtroEstado === e ? 'var(--primary)' : 'var(--border)'}`, background: filtroEstado === e ? 'var(--primary-light)' : 'white', color: filtroEstado === e ? 'var(--primary-dark)' : 'var(--text-muted)', fontWeight: filtroEstado === e ? 700 : 400, fontSize: '12px', cursor: 'pointer' }}>
                            {e === '' ? 'Todos' : ESTADO_STYLE[e]?.label}
                        </button>
                    ))}
                </div>
                <button onClick={() => setVista('nuevo')} className="btn btn-primary">
                    <i className="fas fa-plus mr-2"></i>Nuevo presupuesto
                </button>
            </div>

            <div className="card">
                {cargando ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                        <i className="fas fa-spinner fa-spin fa-2x"></i>
                    </div>
                ) : presupuestos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <i className="fas fa-file-invoice fa-3x" style={{ opacity: 0.15, display: 'block', marginBottom: '12px' }}></i>
                        <p>No hay presupuestos{filtroEstado ? ` con estado "${ESTADO_STYLE[filtroEstado]?.label}"` : ''}.</p>
                    </div>
                ) : (
                    <table className="table mb-0">
                        <thead>
                            <tr>
                                <th style={{ background: 'var(--dark)', color: 'white', padding: '10px 16px', fontSize: '12px' }}>N° Presupuesto</th>
                                <th style={{ background: 'var(--dark)', color: 'white', padding: '10px', fontSize: '12px' }}>Fecha</th>
                                <th style={{ background: 'var(--dark)', color: 'white', padding: '10px', fontSize: '12px' }}>Cliente</th>
                                <th style={{ background: 'var(--dark)', color: 'white', padding: '10px', fontSize: '12px', textAlign: 'center' }}>Estado</th>
                                <th style={{ background: 'var(--dark)', color: 'white', padding: '10px 16px', fontSize: '12px', textAlign: 'right' }}>Total</th>
                                <th style={{ background: 'var(--dark)', color: 'white', padding: '10px', fontSize: '12px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {presupuestos.map(p => {
                                const est = ESTADO_STYLE[p.estado] || ESTADO_STYLE.PENDIENTE
                                return (
                                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => verDetalle(p.id)}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                        <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: '14px' }}>{p.numeroPresupuesto}</td>
                                        <td style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-muted)' }}>{fmtFecha(p.fecha)}</td>
                                        <td style={{ padding: '12px 10px', fontSize: '13px' }}>{p.clienteNombre || <span style={{ color: 'var(--text-muted)' }}>Sin cliente</span>}</td>
                                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                            <span style={{ background: est.bg, color: est.color, fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>{est.label}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '14px' }}>₲ {fmt(p.total)}</td>
                                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                            <i className="fas fa-chevron-right" style={{ color: 'var(--text-muted)', fontSize: '12px' }}></i>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </Layout>
    )
}