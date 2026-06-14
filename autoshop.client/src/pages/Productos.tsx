import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import ConfirmModal from '../components/ui/ConfirmModal'
import { API } from '../config/api'

interface Categoria {
    id: string
    nombre: string
}

interface Producto {
    id: string
    codigoBarras: string
    nombre: string
    descripcion: string
    precioCompra: number
    precioVenta: number
    descuentoPct: number
    visibleWeb: boolean
    imagenUrl?: string
    activo: boolean
    categoriaId: string
    categoriaNombre: string
    stockActual: number
    stockMinimo: number
}

interface PaginatedResult {
    datos: Producto[]
    total: number
    pagina: number
    tamano: number
    totalPaginas: number
}

interface ProductoForm {
    codigoBarras: string
    nombre: string
    descripcion: string
    precioCompra: string
    precioVenta: string
    descuentoPct: string
    categoriaId: string
    visibleWeb: boolean
    stockInicial: string
    stockMinimo: string
}

const formVacio: ProductoForm = {
    codigoBarras: '',
    nombre: '',
    descripcion: '',
    precioCompra: '',
    precioVenta: '',
    descuentoPct: '0',
    categoriaId: '',
    visibleWeb: true,
    stockInicial: '0',
    stockMinimo: '0'
}

const fmt = (valor: string) => {
    const n = valor.replace(/\D/g, '')
    return n.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
const num = (valor: string) => valor.replace(/\./g, '')

function SelectBuscable({ opciones, valor, onChange, placeholder }: {
    opciones: { id: string, nombre: string }[]
    valor: string
    onChange: (id: string) => void
    placeholder: string
}) {
    const [busq, setBusq] = useState('')
    const [abierto, setAbierto] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const seleccionado = opciones.find(o => o.id === valor)
    const filtradas = opciones.filter(o => o.nombre.toLowerCase().includes(busq.toLowerCase()))

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setAbierto(false); setBusq('')
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <div className="form-control"
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
                onClick={() => { setAbierto(!abierto); setBusq('') }}>
                <span style={{ color: seleccionado ? 'var(--text-dark)' : 'var(--text-muted)' }}>
                    {seleccionado ? seleccionado.nombre : placeholder}
                </span>
                <i className={`fas fa-chevron-${abierto ? 'up' : 'down'}`} style={{ fontSize: '12px', color: 'var(--text-muted)' }}></i>
            </div>
            {abierto && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 99999, maxHeight: '240px', overflow: 'hidden' }}>
                    <div style={{ padding: '8px' }}>
                        <input type="text" className="form-control" placeholder="Buscar..." value={busq}
                            onChange={e => setBusq(e.target.value)} onClick={e => e.stopPropagation()}
                            autoFocus style={{ fontSize: '13px' }} />
                    </div>
                    <div style={{ overflowY: 'auto', maxHeight: '180px' }}>
                        {filtradas.length === 0 ? (
                            <div style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '13px' }}>Sin resultados</div>
                        ) : filtradas.map(o => (
                            <div key={o.id} onClick={() => { onChange(o.id); setAbierto(false); setBusq('') }}
                                style={{ padding: '10px 12px', cursor: 'pointer', fontSize: '14px', background: o.id === valor ? 'var(--primary-light)' : 'white', color: o.id === valor ? 'var(--primary-dark)' : 'var(--text-dark)', fontWeight: o.id === valor ? 600 : 400 }}
                                onMouseEnter={e => { if (o.id !== valor) e.currentTarget.style.background = '#f5f5f5' }}
                                onMouseLeave={e => { if (o.id !== valor) e.currentTarget.style.background = 'white' }}>
                                {o.nombre}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function Productos() {
    const [result, setResult] = useState<PaginatedResult>({ datos: [], total: 0, pagina: 1, tamano: 25, totalPaginas: 0 })
    const [loading, setLoading] = useState(true)
    const [pagina, setPagina] = useState(1)
    const [busqueda, setBusqueda] = useState('')
    const [vista, setVista] = useState<'tabla' | 'tarjetas'>('tabla')
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [categoriaFiltro, setCategoriaFiltro] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editando, setEditando] = useState<Producto | null>(null)
    const [form, setForm] = useState<ProductoForm>(formVacio)
    const [guardando, setGuardando] = useState(false)
    const [previewImagen, setPreviewImagen] = useState<string>('')
    const [confirmModal, setConfirmModal] = useState<{ show: boolean, id: string }>({ show: false, id: '' })
    const fileInputRef = useRef<HTMLInputElement>(null)
    const imagenUrlRef = useRef<string>('')
    const archivoRef = useRef<File | null>(null)
    const [tieneArchivoNuevo, setTieneArchivoNuevo] = useState(false)

    const cargarProductos = async (pag = pagina, busq = busqueda, catId = categoriaFiltro) => {
        try {
            setLoading(true)
            const params = new URLSearchParams({ pagina: pag.toString(), tamano: '25' })
            if (busq) params.append('busqueda', busq)
            if (catId) params.append('categoriaId', catId)
            const res = await fetch(`${API.productos}?${params}`)
            const data = await res.json()
            setResult(data)
        } catch { toast.error('No se pudo conectar con el servidor') }
        finally { setLoading(false) }
    }

    const cargarCategorias = async () => {
        try {
            const res = await fetch(`${API.categorias}/todas`)
            const data = await res.json()
            setCategorias(data)
        } catch { console.error('Error cargando categorías') }
    }

    useEffect(() => {
        const fetchData = async () => { await cargarCategorias(); await cargarProductos() }
        fetchData()
    }, [])

    const handleBusqueda = (valor: string) => { setBusqueda(valor); setPagina(1); cargarProductos(1, valor, categoriaFiltro) }
    const handleCategoria = (valor: string) => { setCategoriaFiltro(valor); setPagina(1); cargarProductos(1, busqueda, valor) }
    const handlePagina = (nueva: number) => { setPagina(nueva); cargarProductos(nueva, busqueda, categoriaFiltro) }

    const abrirModal = (producto?: Producto) => {
        if (producto) {
            setEditando(producto)
            setForm({
                codigoBarras: producto.codigoBarras,
                nombre: producto.nombre,
                descripcion: producto.descripcion || '',
                precioCompra: producto.precioCompra.toString(),
                precioVenta: producto.precioVenta.toString(),
                descuentoPct: producto.descuentoPct.toString(),
                categoriaId: producto.categoriaId,
                visibleWeb: producto.visibleWeb,
                stockInicial: producto.stockActual.toString(),
                stockMinimo: producto.stockMinimo.toString()
            })
            imagenUrlRef.current = producto.imagenUrl || ''
            setPreviewImagen(producto.imagenUrl ? `${API.imagenesBase}${producto.imagenUrl}` : '')
        } else {
            setEditando(null)
            setForm(formVacio)
            imagenUrlRef.current = ''
            setPreviewImagen('')
        }
        archivoRef.current = null
        setTieneArchivoNuevo(false)
        setShowModal(true)
    }

    const cerrarModal = () => {
        setShowModal(false)
        setEditando(null)
        setForm(formVacio)
        imagenUrlRef.current = ''
        archivoRef.current = null
        setTieneArchivoNuevo(false)
        setPreviewImagen('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    // Solo guarda el archivo en memoria, NO lo sube todavía
    const handleSeleccionarImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0]
        if (!archivo) return

        const extensionesPermitidas = ['.jpg', '.jpeg', '.png', '.webp']
        const extension = '.' + archivo.name.split('.').pop()?.toLowerCase()
        if (!extensionesPermitidas.includes(extension)) {
            toast.error('Solo se permiten imágenes JPG, PNG o WEBP')
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }
        if (archivo.size > 5 * 1024 * 1024) {
            toast.error('La imagen no puede superar los 5MB')
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }

        archivoRef.current = archivo
        setTieneArchivoNuevo(true)
        setPreviewImagen(URL.createObjectURL(archivo))
    }

    // Sube la imagen al servidor y retorna la URL
    const subirImagen = async (archivo: File): Promise<string | null> => {
        const formData = new FormData()
        formData.append('archivo', archivo)
        const res = await fetch(`${API.imagenes}/productos`, { method: 'POST', body: formData })
        if (!res.ok) {
            const error = await res.json()
            toast.error(error.mensaje || 'Error al subir imagen')
            return null
        }
        const data = await res.json()
        return data.url
    }

    const validar = (): boolean => {
        if (!form.codigoBarras.trim()) { toast.error('El código de barras es obligatorio'); return false }
        if (!form.nombre.trim()) { toast.error('El nombre del producto es obligatorio'); return false }
        if (!form.categoriaId) { toast.error('Debe seleccionar una categoría'); return false }
        const compra = Number(num(form.precioCompra))
        const venta = Number(num(form.precioVenta))
        if (!compra || compra <= 0) { toast.error('El precio de compra debe ser mayor a 0'); return false }
        if (!venta || venta <= 0) { toast.error('El precio de venta debe ser mayor a 0'); return false }
        if (venta <= compra) { toast.error('El precio de venta debe ser mayor al precio de compra'); return false }
        const desc = Number(form.descuentoPct)
        if (desc < 0 || desc > 100) { toast.error('El descuento debe estar entre 0 y 100'); return false }
        if (Number(form.stockMinimo) < 0) { toast.error('El stock mínimo no puede ser negativo'); return false }
        return true
    }

    const guardar = async () => {
        if (!validar()) return

        setGuardando(true)
        try {
            // Si hay un archivo nuevo, subirlo AHORA al presionar guardar
            let imagenFinal = imagenUrlRef.current
            if (archivoRef.current) {
                const url = await subirImagen(archivoRef.current)
                if (!url) { setGuardando(false); return }
                imagenFinal = url
            }

            const body = {
                codigoBarras: form.codigoBarras.trim(),
                nombre: form.nombre.trim(),
                descripcion: form.descripcion.trim(),
                precioCompra: Number(num(form.precioCompra)),
                precioVenta: Number(num(form.precioVenta)),
                descuentoPct: Number(form.descuentoPct),
                categoriaId: form.categoriaId,
                visibleWeb: form.visibleWeb,
                stockInicial: Number(form.stockInicial),
                stockMinimo: Number(form.stockMinimo),
                imagenUrl: imagenFinal || null
            }

            const url = editando ? `${API.productos}/${editando.id}` : API.productos
            const method = editando ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (!res.ok) {
                const error = await res.json()
                toast.error(error.mensaje || 'Error al guardar el producto')
                return
            }

            toast.success(editando ? 'Producto actualizado correctamente' : 'Producto creado correctamente')
            await cargarProductos()
            cerrarModal()
        } catch {
            toast.error('Error inesperado al guardar')
        } finally {
            setGuardando(false)
        }
    }

    const eliminar = async () => {
        try {
            const res = await fetch(`${API.productos}/${confirmModal.id}`, { method: 'DELETE' })
            if (!res.ok) {
                const error = await res.json()
                toast.error(error.mensaje || 'Error al eliminar')
                setConfirmModal({ show: false, id: '' })
                return
            }
            setConfirmModal({ show: false, id: '' })
            await cargarProductos()
            toast.success('Producto eliminado correctamente')
        } catch { toast.error('Error al eliminar el producto') }
    }

    const getStockColor = (stock: number, minimo: number) => {
        if (stock === 0) return 'var(--secondary)'
        if (stock <= minimo) return '#f6c23e'
        return '#2e7d32'
    }
    const getStockLabel = (stock: number, minimo: number) => {
        if (stock === 0) return 'Sin stock'
        if (stock <= minimo) return `⚠️ ${stock}`
        return stock.toString()
    }

    return (
        <Layout titulo="Productos">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 style={{ fontWeight: 700, margin: 0 }}>Productos</h5>
                    <small style={{ color: 'var(--text-muted)' }}>{result.total} productos registrados</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <div style={{ width: '200px' }}>
                        <SelectBuscable
                            opciones={[{ id: '', nombre: 'Todas las categorías' }, ...categorias]}
                            valor={categoriaFiltro}
                            onChange={handleCategoria}
                            placeholder="Todas las categorías"
                        />
                    </div>
                    <div className="input-group" style={{ width: '260px' }}>
                        <span className="input-group-text" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
                            <i className="fas fa-search"></i>
                        </span>
                        <input type="text" className="form-control" placeholder="Buscar producto..."
                            value={busqueda} onChange={e => handleBusqueda(e.target.value)} />
                    </div>
                    <div className="btn-group">
                        <button onClick={() => setVista('tabla')} className="btn btn-sm"
                            style={{ background: vista === 'tabla' ? 'var(--primary)' : 'white', color: vista === 'tabla' ? 'white' : 'var(--text-muted)', border: '1px solid var(--primary)' }}>
                            <i className="fas fa-list"></i>
                        </button>
                        <button onClick={() => setVista('tarjetas')} className="btn btn-sm"
                            style={{ background: vista === 'tarjetas' ? 'var(--primary)' : 'white', color: vista === 'tarjetas' ? 'white' : 'var(--text-muted)', border: '1px solid var(--primary)' }}>
                            <i className="fas fa-th"></i>
                        </button>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => abrirModal()} style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>
                        <i className="fas fa-plus mr-1"></i> Nuevo producto
                    </button>
                </div>
            </div>

            {/* VISTA TABLA */}
            {vista === 'tabla' && (
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <span><i className="fas fa-box mr-2" style={{ color: 'var(--primary)' }}></i>Productos</span>
                        <small style={{ color: 'var(--text-muted)' }}>Mostrando {result.datos.length} de {result.total} registros</small>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-bordered mb-0">
                                <thead>
                                    <tr>
                                        <th style={{ width: '50px' }}>Img</th>
                                        <th>Código</th>
                                        <th>Nombre</th>
                                        <th>Categoría</th>
                                        <th>P. Compra</th>
                                        <th>P. Venta</th>
                                        <th>Desc.</th>
                                        <th>Stock</th>
                                        <th>Web</th>
                                        <th style={{ width: '100px' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={10} className="text-center py-4">
                                            <i className="fas fa-spinner fa-spin mr-2" style={{ color: 'var(--primary)' }}></i>Cargando...
                                        </td></tr>
                                    ) : result.datos.length === 0 ? (
                                        <tr><td colSpan={10} className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                                            No hay productos. ¡Crea el primero!
                                        </td></tr>
                                    ) : result.datos.map(p => (
                                        <tr key={p.id}>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                                {p.imagenUrl ? (
                                                    <img src={`${API.imagenesBase}${p.imagenUrl}`} alt={p.nombre}
                                                        style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px' }} />
                                                ) : (
                                                    <div style={{ width: '36px', height: '36px', background: 'var(--primary-light)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <i className="fas fa-box" style={{ color: 'var(--primary)', fontSize: '14px' }}></i>
                                                    </div>
                                                )}
                                            </td>
                                            <td><span style={{ fontFamily: 'monospace', fontSize: '12px', background: 'var(--primary-light)', padding: '2px 6px', borderRadius: '4px' }}>{p.codigoBarras}</span></td>
                                            <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                                            <td><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.categoriaNombre}</span></td>
                                            <td>₲ {p.precioCompra.toLocaleString('es-PY')}</td>
                                            <td style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>₲ {p.precioVenta.toLocaleString('es-PY')}</td>
                                            <td>
                                                {p.descuentoPct > 0 ? (
                                                    <span style={{ background: '#fce4e4', color: 'var(--secondary)', fontWeight: 600, padding: '2px 6px', borderRadius: '10px', fontSize: '11px' }}>
                                                        {p.descuentoPct}% OFF
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td style={{ fontWeight: 600, color: getStockColor(p.stockActual, p.stockMinimo) }}>
                                                {getStockLabel(p.stockActual, p.stockMinimo)}
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '12px', color: p.visibleWeb ? '#2e7d32' : 'var(--text-muted)' }}>
                                                    <i className={`fas ${p.visibleWeb ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button className="btn btn-sm btn-primary" onClick={() => abrirModal(p)} style={{ padding: '5px 10px' }}>
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button className="btn btn-sm" onClick={() => setConfirmModal({ show: true, id: p.id })}
                                                        style={{ background: 'var(--secondary)', border: 'none', color: 'white', padding: '5px 10px' }}>
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
            )}

            {/* VISTA TARJETAS */}
            {vista === 'tarjetas' && (
                <div className="row">
                    {loading ? (
                        <div className="col-12 text-center py-5">
                            <i className="fas fa-spinner fa-spin fa-2x" style={{ color: 'var(--primary)' }}></i>
                        </div>
                    ) : result.datos.length === 0 ? (
                        <div className="col-12 text-center py-5" style={{ color: 'var(--text-muted)' }}>No hay productos. ¡Crea el primero!</div>
                    ) : result.datos.map(p => (
                        <div className="col-xl-3 col-lg-4 col-md-6 mb-4" key={p.id}>
                            <div className="card h-100" style={{ borderRadius: '12px', overflow: 'hidden', transition: 'transform 0.2s' }}
                                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                                <div style={{ height: '180px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                                    {/* Badge descuento — esquina superior DERECHA */}
                                    {p.descuentoPct > 0 && (
                                        <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1 }}>
                                            <span style={{ background: 'var(--secondary)', color: 'white', fontWeight: 800, fontSize: '13px', padding: '4px 10px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                                                -{p.descuentoPct}%
                                            </span>
                                        </div>
                                    )}
                                    {p.imagenUrl ? (
                                        <img src={`${API.imagenesBase}${p.imagenUrl}`} alt={p.nombre}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <i className="fas fa-box fa-3x" style={{ color: 'var(--primary)', opacity: 0.4 }}></i>
                                    )}
                                </div>
                                <div className="card-body d-flex flex-column" style={{ padding: '14px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Cód: {p.codigoBarras}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--primary-dark)', marginBottom: '4px' }}>{p.categoriaNombre}</span>
                                    <h6 style={{ fontWeight: 700, margin: '0 0 4px', fontSize: '14px' }}>{p.nombre}</h6>
                                    {p.descuentoPct > 0 ? (
                                        <div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                                ₲ {p.precioVenta.toLocaleString('es-PY')}
                                            </div>
                                            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--secondary)' }}>
                                                ₲ {Math.round(p.precioVenta * (1 - p.descuentoPct / 100)).toLocaleString('es-PY')}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-dark)' }}>
                                            ₲ {p.precioVenta.toLocaleString('es-PY')}
                                        </div>
                                    )}
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Compra: ₲ {p.precioCompra.toLocaleString('es-PY')}</div>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: getStockColor(p.stockActual, p.stockMinimo), marginTop: '4px' }}>
                                        Stock: {getStockLabel(p.stockActual, p.stockMinimo)}
                                    </div>
                                    <div className="d-flex gap-2 mt-3">
                                        <button className="btn btn-sm btn-primary flex-grow-1" onClick={() => abrirModal(p)}>
                                            <i className="fas fa-edit mr-1"></i> Editar
                                        </button>
                                        <button className="btn btn-sm" onClick={() => setConfirmModal({ show: true, id: p.id })}
                                            style={{ background: 'var(--secondary)', color: 'white', border: 'none' }}>
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '14px', width: '100%', maxWidth: '720px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '2px solid var(--primary-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h5 style={{ fontWeight: 700, margin: 0, color: 'var(--dark)' }}>
                                <i className="fas fa-box mr-2" style={{ color: 'var(--primary)' }}></i>
                                {editando ? 'Editar producto' : 'Nuevo producto'}
                            </h5>
                            <button onClick={cerrarModal} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div className="row">

                                {/* Imagen */}
                                <div className="col-12 mb-4">
                                    <label style={{ fontWeight: 600, fontSize: '14px', marginBottom: '10px', display: 'block' }}>Imagen del producto</label>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                                        <div style={{ width: '160px', height: '160px', background: 'var(--primary-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--border)' }}>
                                            {previewImagen ? (
                                                <img src={previewImagen} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                                    <i className="fas fa-image fa-3x" style={{ color: 'var(--primary)', opacity: 0.4, marginBottom: '8px', display: 'block' }}></i>
                                                    <small>Sin imagen</small>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ paddingTop: '4px' }}>
                                            <input type="file" ref={fileInputRef} accept=".jpg,.jpeg,.png,.webp"
                                                onChange={handleSeleccionarImagen} style={{ display: 'none' }} />
                                            <button className="btn" onClick={() => fileInputRef.current?.click()}
                                                style={{ background: 'var(--primary)', color: 'white', border: 'none', marginBottom: '8px', display: 'block', padding: '8px 16px', borderRadius: '8px', fontSize: '14px' }}>
                                                {previewImagen
                                                    ? <><i className="fas fa-sync mr-2"></i>Cambiar imagen</>
                                                    : <><i className="fas fa-image mr-2"></i>Seleccionar imagen</>
                                                }
                                            </button>
                                            <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>JPG, PNG o WEBP — máx. 5MB</small>
                                            {tieneArchivoNuevo && (
                                                <small style={{ color: 'var(--primary-dark)' }}>
                                                    <i className="fas fa-clock mr-1"></i>
                                                    Se subirá al guardar
                                                </small>
                                            )}
                                            {!tieneArchivoNuevo && previewImagen && (
                                                <small style={{ color: '#2e7d32' }}>
                                                    <i className="fas fa-check-circle mr-1"></i>
                                                    Imagen guardada
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Código y categoría */}
                                <div className="col-md-6 mb-3">
                                    <label style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                                        Código de barras <span style={{ color: 'var(--secondary)' }}>*</span>
                                    </label>
                                    <input type="text" className="form-control" placeholder="Escanear o ingresar código..."
                                        value={form.codigoBarras} onChange={e => setForm({ ...form, codigoBarras: e.target.value })} />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                                        Categoría <span style={{ color: 'var(--secondary)' }}>*</span>
                                    </label>
                                    <SelectBuscable opciones={categorias} valor={form.categoriaId}
                                        onChange={id => setForm({ ...form, categoriaId: id })} placeholder="Seleccionar categoría..." />
                                </div>

                                {/* Nombre */}
                                <div className="col-12 mb-3">
                                    <label style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                                        Nombre <span style={{ color: 'var(--secondary)' }}>*</span>
                                    </label>
                                    <input type="text" className="form-control" placeholder="Nombre del producto..."
                                        value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                                </div>

                                {/* Descripción */}
                                <div className="col-12 mb-3">
                                    <label style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                                        Descripción <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span>
                                    </label>
                                    <textarea className="form-control" rows={2} placeholder="Descripción del producto..."
                                        value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                                </div>

                                {/* Precios */}
                                <div className="col-md-4 mb-3">
                                    <label style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                                        Precio compra <span style={{ color: 'var(--secondary)' }}>*</span>
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text">₲</span>
                                        <input type="text" className="form-control" placeholder="0"
                                            value={fmt(form.precioCompra)} onChange={e => setForm({ ...form, precioCompra: num(e.target.value) })} />
                                    </div>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                                        Precio venta <span style={{ color: 'var(--secondary)' }}>*</span>
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text">₲</span>
                                        <input type="text" className="form-control" placeholder="0"
                                            value={fmt(form.precioVenta)} onChange={e => setForm({ ...form, precioVenta: num(e.target.value) })} />
                                    </div>
                                    {Number(num(form.precioVenta)) > 0 && Number(num(form.precioCompra)) > 0 && Number(num(form.precioVenta)) <= Number(num(form.precioCompra)) && (
                                        <small style={{ color: 'var(--secondary)' }}>
                                            <i className="fas fa-exclamation-circle mr-1"></i>Debe ser mayor al precio de compra
                                        </small>
                                    )}
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                                        Descuento % <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '12px' }}>(opcional)</span>
                                    </label>
                                    <div className="input-group">
                                        <input type="number" className="form-control" placeholder="0" min="0" max="100"
                                            value={form.descuentoPct} onChange={e => setForm({ ...form, descuentoPct: e.target.value })} />
                                        <span className="input-group-text">%</span>
                                    </div>
                                    {Number(form.descuentoPct) > 0 && (
                                        <small style={{ color: 'var(--primary-dark)' }}>
                                            Precio final: ₲ {Math.round(Number(num(form.precioVenta)) * (1 - Number(form.descuentoPct) / 100)).toLocaleString('es-PY')}
                                        </small>
                                    )}
                                </div>

                                {/* Stock */}
                                <div className="col-md-6 mb-3">
                                    <label style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                                        {editando ? 'Stock actual' : 'Stock inicial'}
                                    </label>
                                    <input type="number" className="form-control" placeholder="0" min="0"
                                        value={form.stockInicial} onChange={e => setForm({ ...form, stockInicial: e.target.value })}
                                        disabled={!!editando} />
                                    {editando && <small style={{ color: 'var(--text-muted)' }}>Modificá el stock desde el módulo de Inventario</small>}
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                                        Stock mínimo <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '12px' }}>(alerta)</span>
                                    </label>
                                    <input type="number" className="form-control" placeholder="0" min="0"
                                        value={form.stockMinimo}
                                        onChange={e => setForm({ ...form, stockMinimo: Math.max(0, Number(e.target.value)).toString() })} />
                                    <small style={{ color: 'var(--text-muted)' }}>Alerta cuando el stock baje de este valor</small>
                                </div>

                                {/* Visible web */}
                                <div className="col-12 mb-3">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--primary-light)', borderRadius: '8px' }}>
                                        <input type="checkbox" id="visibleWeb" checked={form.visibleWeb}
                                            onChange={e => setForm({ ...form, visibleWeb: e.target.checked })}
                                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }} />
                                        <label htmlFor="visibleWeb" style={{ cursor: 'pointer', margin: 0, fontWeight: 600, fontSize: '14px' }}>
                                            <i className="fas fa-globe mr-2" style={{ color: 'var(--primary)' }}></i>
                                            Mostrar en catálogo web público
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex gap-2 justify-content-end mt-2">
                                <button onClick={cerrarModal} className="btn btn-sm"
                                    style={{ background: 'var(--light)', border: '1px solid var(--border)', color: 'var(--text-dark)', padding: '8px 20px' }}>
                                    Cancelar
                                </button>
                                <button onClick={guardar} className="btn btn-primary" disabled={guardando} style={{ padding: '8px 24px' }}>
                                    {guardando ? <><i className="fas fa-spinner fa-spin mr-1"></i>Guardando...</> : <><i className="fas fa-save mr-1"></i>Guardar</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                show={confirmModal.show}
                titulo="¿Eliminar producto?"
                mensaje="Esta acción no se puede deshacer. ¿Estás seguro que querés eliminar este producto?"
                onConfirmar={eliminar}
                onCancelar={() => setConfirmModal({ show: false, id: '' })}
                tipo="danger"
            />
        </Layout>
    )
}