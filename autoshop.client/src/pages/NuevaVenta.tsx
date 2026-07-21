import { useState, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import ConfirmModal from '../components/ui/ConfirmModal'
import { API } from '../config/api'
import logo from '../assets/logo_autoshop.jpeg'

interface Producto {
    id: string
    codigoBarras: string
    nombre: string
    precioVenta: number
    descuentoPct: number
    imagenUrl?: string
    categoriaNombre: string
    stockActual: number
}

interface Cliente {
    id: string
    nombre: string
    ruc?: string
    telefono?: string
    direccion?: string
    email?: string
}

interface ItemVenta {
    productoId: string
    codigoBarras: string
    nombre: string
    precioUnitario: number
    cantidad: number
    descuentoPct: number
    subtotal: number
    stock: number
}

interface VentaExitosa {
    id: string
    numeroFactura: string
    total: number
    subtotal: number
    descuento: number
    fecha: string
    clienteNombre?: string
    clienteRuc?: string
    metodoPago: string
    tipoComprobante: string
    items: ItemVenta[]
}

const fmt = (n: number) => Math.round(n).toLocaleString('es-PY')
const calcSubtotal = (precio: number, cantidad: number, desc: number) => precio * cantidad * (1 - desc / 100)

export default function NuevaVenta() {
    const [items, setItems] = useState<ItemVenta[]>([])
    const [busqueda, setBusqueda] = useState('')
    const [resultados, setResultados] = useState<Producto[]>([])
    const [buscandoProducto, setBuscandoProducto] = useState(false)
    const [clienteNombre, setClienteNombre] = useState('')
    const [clienteRuc, setClienteRuc] = useState('')
    const [busquedaCliente, setBusquedaCliente] = useState('')
    const [resultadosCliente, setResultadosCliente] = useState<Cliente[]>([])
    const [buscandoCliente, setBuscandoCliente] = useState(false)
    const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO')
    const [tipoComprobante, setTipoComprobante] = useState<'TICKET' | 'FACTURA'>('TICKET')
    const [confirmModal, setConfirmModal] = useState(false)
    const [procesando, setProcesando] = useState(false)
    const [ventaExitosa, setVentaExitosa] = useState<VentaExitosa | null>(null)
    const [descargando, setDescargando] = useState(false)
    const productoInputRef = useRef<HTMLInputElement>(null)
    const busquedaTimeout = useRef<ReturnType<typeof setTimeout>>()
    const clienteTimeout = useRef<ReturnType<typeof setTimeout>>()

    const buscarProductos = useCallback(async (termino: string) => {
        if (!termino.trim()) { setResultados([]); return }
        setBuscandoProducto(true)
        try {
            const res = await fetch(`${API.productos}?busqueda=${encodeURIComponent(termino)}&tamano=6`)
            const data = await res.json()
            setResultados(data.datos || [])
        } catch { toast.error('Error al buscar productos') }
        finally { setBuscandoProducto(false) }
    }, [])

    const buscarClientes = useCallback(async (termino: string) => {
        if (!termino.trim()) { setResultadosCliente([]); return }
        setBuscandoCliente(true)
        try {
            const res = await fetch(`${API.clientes}/buscar?q=${encodeURIComponent(termino)}`)
            const data = await res.json()
            setResultadosCliente(data)
        } catch { console.error('Error buscando clientes') }
        finally { setBuscandoCliente(false) }
    }, [])

    const handleBusquedaProducto = (valor: string) => {
        setBusqueda(valor)
        clearTimeout(busquedaTimeout.current)
        busquedaTimeout.current = setTimeout(() => buscarProductos(valor), 250)
    }

    const handleBusquedaCliente = (valor: string) => {
        setBusquedaCliente(valor)
        setClienteNombre(valor)
        clearTimeout(clienteTimeout.current)
        clienteTimeout.current = setTimeout(() => buscarClientes(valor), 250)
    }

    const seleccionarCliente = (cliente: Cliente) => {
        setClienteNombre(cliente.nombre)
        setClienteRuc(cliente.ruc || '')
        setBusquedaCliente('')
        setResultadosCliente([])
    }

    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && busqueda.trim()) {
            e.preventDefault()
            clearTimeout(busquedaTimeout.current)
            try {
                const res = await fetch(`${API.productos}/barcode/${encodeURIComponent(busqueda.trim())}`)
                if (res.ok) {
                    const p = await res.json()
                    agregarProducto(p)
                    setBusqueda('')
                    setResultados([])
                } else {
                    await buscarProductos(busqueda)
                }
            } catch { toast.error('Error al buscar producto') }
        }
        if (e.key === 'Escape') { setBusqueda(''); setResultados([]) }
    }

    const agregarProducto = (p: Producto) => {
        if (p.stockActual <= 0) { toast.error(`Sin stock: "${p.nombre}"`); return }
        setItems(prev => {
            const existe = prev.find(i => i.productoId === p.id)
            if (existe) {
                if (existe.cantidad >= p.stockActual) { toast.error(`Stock máximo: ${p.stockActual}`); return prev }
                return prev.map(i => i.productoId === p.id
                    ? { ...i, cantidad: i.cantidad + 1, subtotal: calcSubtotal(i.precioUnitario, i.cantidad + 1, i.descuentoPct) }
                    : i)
            }
            return [...prev, {
                productoId: p.id, codigoBarras: p.codigoBarras, nombre: p.nombre,
                precioUnitario: p.precioVenta, cantidad: 1, descuentoPct: p.descuentoPct,
                subtotal: calcSubtotal(p.precioVenta, 1, p.descuentoPct), stock: p.stockActual
            }]
        })
        setBusqueda(''); setResultados([])
        productoInputRef.current?.focus()
    }

    const actualizarCantidad = (id: string, cantidad: number) => {
        if (cantidad <= 0) { eliminarItem(id); return }
        setItems(prev => prev.map(i => i.productoId === id
            ? { ...i, cantidad, subtotal: calcSubtotal(i.precioUnitario, cantidad, i.descuentoPct) } : i))
    }

    const actualizarDescuento = (id: string, desc: number) => {
        const d = Math.min(100, Math.max(0, desc))
        setItems(prev => prev.map(i => i.productoId === id
            ? { ...i, descuentoPct: d, subtotal: calcSubtotal(i.precioUnitario, i.cantidad, d) } : i))
    }

    const eliminarItem = (id: string) => setItems(prev => prev.filter(i => i.productoId !== id))

    const subtotalGeneral = items.reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0)
    const descuentoGeneral = items.reduce((acc, i) => acc + i.precioUnitario * i.cantidad * i.descuentoPct / 100, 0)
    const totalGeneral = subtotalGeneral - descuentoGeneral

    const confirmarVenta = () => {
        if (items.length === 0) { toast.error('Agregá al menos un producto'); return }
        if (tipoComprobante === 'FACTURA' && !clienteRuc.trim()) { toast.error('La factura requiere el RUC del cliente'); return }
        setConfirmModal(true)
    }

    const procesarVenta = async () => {
        setConfirmModal(false)
        setProcesando(true)
        try {
            const body = {
                clienteNombre: clienteNombre.trim() || null,
                clienteRuc: clienteRuc.trim() || null,
                metodoPago, tipoComprobante,
                items: items.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, descuentoPct: i.descuentoPct }))
            }
            const res = await fetch(API.ventas, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
            if (!res.ok) { const err = await res.json(); toast.error(err.mensaje || 'Error'); return }
            const data = await res.json()
            setVentaExitosa({
                id: data.id,
                numeroFactura: data.numeroFactura,
                total: data.total,
                subtotal: subtotalGeneral,
                descuento: descuentoGeneral,
                fecha: new Date().toLocaleString('es-PY'),
                clienteNombre: clienteNombre.trim() || undefined,
                clienteRuc: clienteRuc.trim() || undefined,
                metodoPago, tipoComprobante,
                items: [...items]
            })
        } catch { toast.error('Error inesperado') }
        finally { setProcesando(false) }
    }

    const nuevaVenta = () => {
        setItems([]); setClienteNombre(''); setClienteRuc('')
        setBusquedaCliente(''); setMetodoPago('EFECTIVO')
        setTipoComprobante('TICKET'); setVentaExitosa(null)
        setBusqueda(''); setResultados([])
        setTimeout(() => productoInputRef.current?.focus(), 100)
    }

    const descargarComprobante = async () => {
        if (!ventaExitosa) return
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

            const elemento = document.getElementById('comprobante')
            if (!elemento) return

            const canvas = await html2canvas(elemento, { scale: 2, backgroundColor: '#ffffff' })
            const imgData = canvas.toDataURL('image/png')

            // Tamaño tipo ticket térmico (80mm de ancho, alto proporcional a la imagen)
            const anchoMM = 80
            const altoMM = (canvas.height * anchoMM) / canvas.width

            const doc = new jsPDF({ unit: 'mm', format: [anchoMM, altoMM] })
            doc.addImage(imgData, 'PNG', 0, 0, anchoMM, altoMM)
            doc.save(`ticket_${ventaExitosa.numeroFactura}.pdf`)
        } catch (e) {
            console.error(e)
            toast.error('Error al generar el PDF')
        } finally {
            setDescargando(false)
        }
    }

    // ── Pantalla de comprobante ──────────────────────────────────────────
    if (ventaExitosa) {
        const esFactura = ventaExitosa.tipoComprobante === 'FACTURA'
        return (
            <Layout titulo="Comprobante">
                <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                    {/* Botones */}
                    <div className="d-flex gap-2 mb-3 no-print">
                        <button onClick={() => window.print()} className="btn btn-primary" style={{ flex: 1 }}>
                            <i className="fas fa-print mr-2"></i>Imprimir
                        </button>
                        <button onClick={descargarComprobante} disabled={descargando} className="btn" style={{ flex: 1, background: '#1b5e20', color: 'white', border: 'none' }}>
                            {descargando
                                ? <><i className="fas fa-spinner fa-spin mr-2"></i>Generando...</>
                                : <><i className="fas fa-download mr-2"></i>Descargar</>}
                        </button>
                        <button onClick={nuevaVenta} className="btn" style={{ flex: 1, background: 'var(--primary-light)', color: 'var(--primary-dark)', border: '1px solid var(--primary)' }}>
                            <i className="fas fa-plus mr-2"></i>Nueva venta
                        </button>
                    </div>

                    {/* Comprobante */}
                    <div id="comprobante" style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '24px', fontFamily: 'monospace', fontSize: '13px' }}>
                        {/* Encabezado negocio */}
                        <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '1px dashed #aaa', paddingBottom: '12px' }}>
                            <img src={logo} alt="MagCar Auto Shop" style={{ width: '120px', objectFit: 'contain', marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                            <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '1px' }}>MAGCARSHOP</div>
                            <div style={{ fontSize: '11px', color: '#555' }}>Accesorios y Luces Automotrices</div>
                            <div style={{ fontSize: '11px', color: '#555' }}>Tel: (021) 000-0000</div>
                            <div style={{ fontSize: '11px', color: '#555' }}>Asunción, Paraguay</div>
                        </div>

                        {/* Tipo de comprobante */}
                        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                            <div style={{ fontWeight: 700, fontSize: '14px', border: '1px solid #333', display: 'inline-block', padding: '2px 12px' }}>
                                {esFactura ? 'FACTURA' : 'TICKET DE COMPRA'}
                            </div>
                            <div style={{ fontSize: '12px', marginTop: '4px' }}>N° {ventaExitosa.numeroFactura}</div>
                        </div>

                        {/* Fecha y pago */}
                        <div style={{ marginBottom: '8px', fontSize: '12px' }}>
                            <div>FECHA: {ventaExitosa.fecha}</div>
                            <div>PAGO: {ventaExitosa.metodoPago}</div>
                        </div>

                        {/* Datos cliente */}
                        {(ventaExitosa.clienteNombre || ventaExitosa.clienteRuc) && (
                            <div style={{ marginBottom: '8px', padding: '6px 0', borderTop: '1px dashed #aaa', borderBottom: '1px dashed #aaa', fontSize: '12px' }}>
                                {ventaExitosa.clienteNombre && <div>CLIENTE: {ventaExitosa.clienteNombre}</div>}
                                {ventaExitosa.clienteRuc && <div>RUC: {ventaExitosa.clienteRuc}</div>}
                            </div>
                        )}

                        {/* Items */}
                        <div style={{ margin: '12px 0', borderTop: '1px dashed #aaa', paddingTop: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2px', fontWeight: 700, fontSize: '11px', marginBottom: '6px', color: '#555' }}>
                                <span>DESCRIPCIÓN</span><span style={{ textAlign: 'right' }}>IMPORTE</span>
                            </div>
                            {ventaExitosa.items.map((item, i) => (
                                <div key={i} style={{ marginBottom: '8px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px' }}>
                                        <span style={{ fontWeight: 600, fontSize: '12px' }}>{item.nombre}</span>
                                        <span style={{ textAlign: 'right', fontWeight: 700 }}>₲ {fmt(item.subtotal)}</span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#666' }}>
                                        {item.cantidad} x ₲ {fmt(item.precioUnitario)}
                                        {item.descuentoPct > 0 && ` (-${item.descuentoPct}%)`}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totales */}
                        <div style={{ borderTop: '1px dashed #aaa', paddingTop: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px', fontSize: '12px' }}>
                                <span>SUBTOTAL</span><span style={{ textAlign: 'right' }}>₲ {fmt(ventaExitosa.subtotal)}</span>
                            </div>
                            {ventaExitosa.descuento > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px', fontSize: '12px' }}>
                                    <span>DESCUENTOS</span><span style={{ textAlign: 'right' }}>- ₲ {fmt(ventaExitosa.descuento)}</span>
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px', fontWeight: 800, fontSize: '16px', marginTop: '8px', paddingTop: '8px', borderTop: '2px solid #333' }}>
                                <span>TOTAL</span><span style={{ textAlign: 'right' }}>₲ {fmt(ventaExitosa.total)}</span>
                            </div>
                        </div>

                        {/* Pie */}
                        <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #aaa', fontSize: '11px', color: '#666' }}>
                            <div>*** GRACIAS POR SU COMPRA ***</div>
                            <div style={{ marginTop: '4px' }}>magcarshop.com</div>
                        </div>
                    </div>
                </div>

                {/* Estilos de impresión */}
                <style>{`
                    @media print {
                        .no-print { display: none !important; }
                        body * { visibility: hidden; }
                        #comprobante, #comprobante * { visibility: visible; }
                        #comprobante { position: fixed; left: 0; top: 0; width: 80mm; border: none !important; border-radius: 0 !important; padding: 4mm !important; }
                    }
                `}</style>
            </Layout>
        )
    }

    // ── Pantalla de venta ────────────────────────────────────────────────
    return (
        <Layout titulo="Nueva Venta" sinFooter>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '16px', height: 'calc(100vh - 100px)' }}>

                {/* ── Panel izquierdo ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>

                    {/* Buscador de productos */}
                    <div className="card">
                        <div className="card-body py-3" style={{ position: 'relative' }}>
                            <div className="input-group">
                                <span className="input-group-text" style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>
                                    <i className="fas fa-barcode"></i>
                                </span>
                                <input ref={productoInputRef} type="text" className="form-control"
                                    placeholder="Escanear código o buscar producto... (Enter para agregar)"
                                    value={busqueda} onChange={e => handleBusquedaProducto(e.target.value)}
                                    onKeyDown={handleKeyDown} autoComplete="off"
                                    style={{ fontSize: '14px' }} />
                                {buscandoProducto && (
                                    <span className="input-group-text">
                                        <i className="fas fa-spinner fa-spin" style={{ color: 'var(--primary)' }}></i>
                                    </span>
                                )}
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
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.codigoBarras} · {p.categoriaNombre}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: '14px' }}>₲ {fmt(p.precioVenta)}</div>
                                                <div style={{ fontSize: '11px', color: p.stockActual <= 0 ? 'var(--secondary)' : p.stockActual <= 3 ? '#f6c23e' : '#2e7d32' }}>
                                                    Stock: {p.stockActual}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lista de items */}
                    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div className="card-header d-flex justify-content-between align-items-center" style={{ flexShrink: 0 }}>
                            <span><i className="fas fa-shopping-cart mr-2" style={{ color: 'var(--primary)' }}></i>Productos</span>
                            <small style={{ color: 'var(--text-muted)' }}>{items.length} items</small>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {items.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                                    <i className="fas fa-barcode fa-3x" style={{ opacity: 0.15, display: 'block', marginBottom: '12px' }}></i>
                                    Escaneá o buscá un producto
                                </div>
                            ) : (
                                <table className="table mb-0" style={{ tableLayout: 'fixed' }}>
                                    <colgroup>
                                        <col style={{ width: 'auto' }} />
                                        <col style={{ width: '110px' }} />
                                        <col style={{ width: '90px' }} />
                                        <col style={{ width: '110px' }} />
                                        <col style={{ width: '36px' }} />
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th style={{ background: 'var(--dark)', color: 'white', padding: '8px 12px', fontSize: '12px' }}>Producto</th>
                                            <th style={{ background: 'var(--dark)', color: 'white', padding: '8px', fontSize: '12px', textAlign: 'center' }}>Cantidad</th>
                                            <th style={{ background: 'var(--dark)', color: 'white', padding: '8px', fontSize: '12px', textAlign: 'center' }}>Desc. %</th>
                                            <th style={{ background: 'var(--dark)', color: 'white', padding: '8px 12px', fontSize: '12px', textAlign: 'right' }}>Subtotal</th>
                                            <th style={{ background: 'var(--dark)', color: 'white', padding: '8px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map(item => (
                                            <tr key={item.productoId}>
                                                <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                                                    <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>₲ {fmt(item.precioUnitario)} c/u</div>
                                                </td>
                                                <td style={{ padding: '8px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                                                        <button onClick={() => actualizarCantidad(item.productoId, item.cantidad - 1)}
                                                            style={{ width: '22px', height: '22px', border: '1px solid var(--border)', borderRadius: '4px', background: 'white', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0 }}>−</button>
                                                        <input type="number" value={item.cantidad} min="1" max={item.stock}
                                                            onChange={e => actualizarCantidad(item.productoId, Number(e.target.value))}
                                                            style={{ width: '36px', textAlign: 'center', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 0', fontSize: '13px', fontWeight: 600 }} />
                                                        <button onClick={() => actualizarCantidad(item.productoId, item.cantidad + 1)}
                                                            disabled={item.cantidad >= item.stock}
                                                            style={{ width: '22px', height: '22px', border: '1px solid var(--border)', borderRadius: '4px', background: 'white', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0, opacity: item.cantidad >= item.stock ? 0.4 : 1 }}>+</button>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '8px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <input type="number" value={item.descuentoPct} min="0" max="100"
                                                            onChange={e => actualizarDescuento(item.productoId, Number(e.target.value))}
                                                            style={{ width: '44px', textAlign: 'center', border: '1px solid var(--border)', borderRadius: '4px 0 0 4px', padding: '3px 0', fontSize: '13px' }} />
                                                        <span style={{ border: '1px solid var(--border)', borderLeft: 'none', borderRadius: '0 4px 4px 0', padding: '3px 5px', background: '#f5f5f5', fontSize: '12px', lineHeight: '1.4' }}>%</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '8px 12px', verticalAlign: 'middle', textAlign: 'right', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>
                                                    ₲ {fmt(item.subtotal)}
                                                </td>
                                                <td style={{ padding: '4px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                    <button onClick={() => eliminarItem(item.productoId)}
                                                        style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', fontSize: '15px', padding: '2px 4px' }}>
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

                {/* ── Panel derecho ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>

                    {/* Cliente */}
                    <div className="card">
                        <div className="card-header" style={{ padding: '10px 16px', fontSize: '13px' }}>
                            <i className="fas fa-user mr-2" style={{ color: 'var(--primary)' }}></i>Cliente
                        </div>
                        <div className="card-body" style={{ padding: '12px 16px' }}>
                            {/* Búsqueda de cliente registrado */}
                            <div style={{ position: 'relative', marginBottom: '8px' }}>
                                <input type="text" className="form-control form-control-sm"
                                    placeholder="Buscar cliente registrado o escribir nombre..."
                                    value={clienteNombre}
                                    onChange={e => handleBusquedaCliente(e.target.value)}
                                    style={{ fontSize: '13px' }} />
                                {buscandoCliente && (
                                    <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
                                        <i className="fas fa-spinner fa-spin" style={{ color: 'var(--primary)', fontSize: '12px' }}></i>
                                    </span>
                                )}
                                {resultadosCliente.length > 0 && (
                                    <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 9999, background: 'white', border: '1px solid var(--border)', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                        {resultadosCliente.map(c => (
                                            <div key={c.id} onClick={() => seleccionarCliente(c)}
                                                style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                                <div style={{ fontWeight: 600 }}>{c.nombre}</div>
                                                {c.ruc && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RUC: {c.ruc}</div>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <input type="text" className="form-control form-control-sm"
                                placeholder="RUC del cliente"
                                value={clienteRuc} onChange={e => setClienteRuc(e.target.value)}
                                style={{ fontSize: '13px' }} />
                            {tipoComprobante === 'FACTURA' && !clienteRuc.trim() && (
                                <small style={{ color: 'var(--secondary)', fontSize: '11px' }}>
                                    <i className="fas fa-exclamation-circle mr-1"></i>RUC requerido para factura
                                </small>
                            )}
                        </div>
                    </div>

                    {/* Pago y comprobante */}
                    <div className="card">
                        <div className="card-header" style={{ padding: '10px 16px', fontSize: '13px' }}>
                            <i className="fas fa-credit-card mr-2" style={{ color: 'var(--primary)' }}></i>Pago y comprobante
                        </div>
                        <div className="card-body" style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                                {(['EFECTIVO', 'TRANSFERENCIA'] as const).map(m => (
                                    <button key={m} onClick={() => setMetodoPago(m)}
                                        style={{ flex: 1, padding: '8px 4px', border: `2px solid ${metodoPago === m ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '8px', background: metodoPago === m ? 'var(--primary-light)' : 'white', cursor: 'pointer', fontWeight: metodoPago === m ? 700 : 400, color: metodoPago === m ? 'var(--primary-dark)' : 'var(--text-dark)', fontSize: '12px' }}>
                                        <i className={`fas ${m === 'EFECTIVO' ? 'fa-money-bill-wave' : 'fa-university'} mr-1`}></i>
                                        {m === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'}
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {(['TICKET', 'FACTURA'] as const).map(t => (
                                    <button key={t} onClick={() => setTipoComprobante(t)}
                                        style={{ flex: 1, padding: '8px 4px', border: `2px solid ${tipoComprobante === t ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '8px', background: tipoComprobante === t ? 'var(--primary-light)' : 'white', cursor: 'pointer', fontWeight: tipoComprobante === t ? 700 : 400, color: tipoComprobante === t ? 'var(--primary-dark)' : 'var(--text-dark)', fontSize: '12px' }}>
                                        <i className={`fas ${t === 'TICKET' ? 'fa-receipt' : 'fa-file-invoice'} mr-1`}></i>
                                        {t}
                                    </button>
                                ))}
                            </div>
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

                    {/* Confirmar */}
                    <button onClick={confirmarVenta} disabled={items.length === 0 || procesando}
                        className="btn btn-primary"
                        style={{ padding: '14px', fontSize: '15px', fontWeight: 700, borderRadius: '10px' }}>
                        {procesando
                            ? <><i className="fas fa-spinner fa-spin mr-2"></i>Procesando...</>
                            : <><i className="fas fa-check-circle mr-2"></i>Confirmar — ₲ {fmt(totalGeneral)}</>
                        }
                    </button>
                </div>
            </div>

            <ConfirmModal
                show={confirmModal}
                titulo="¿Confirmar venta?"
                mensaje={`Total: ₲ ${fmt(totalGeneral)} · ${metodoPago === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'} · ${tipoComprobante}`}
                onConfirmar={procesarVenta}
                onCancelar={() => setConfirmModal(false)}
                tipo="warning"
            />
        </Layout>
    )
}