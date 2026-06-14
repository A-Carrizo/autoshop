import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import ConfirmModal from '../components/ui/ConfirmModal'
import { API } from '../config/api'

interface Categoria {
    id: string
    nombre: string
    descripcion: string
    activo: boolean
}

interface PaginatedResult {
    datos: Categoria[]
    total: number
    pagina: number
    tamano: number
    totalPaginas: number
}

export default function Categorias() {
    const [result, setResult] = useState<PaginatedResult>({ datos: [], total: 0, pagina: 1, tamano: 25, totalPaginas: 0 })
    const [loading, setLoading] = useState(true)
    const [pagina, setPagina] = useState(1)
    const [busqueda, setBusqueda] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editando, setEditando] = useState<Categoria | null>(null)
    const [form, setForm] = useState({ nombre: '', descripcion: '' })
    const [guardando, setGuardando] = useState(false)
    const [confirmModal, setConfirmModal] = useState<{ show: boolean, id: string }>({ show: false, id: '' })

    const cargarCategorias = async (pag = pagina, busq = busqueda) => {
        try {
            setLoading(true)
            const params = new URLSearchParams({ pagina: pag.toString(), tamano: '25' })
            if (busq) params.append('busqueda', busq)
            const res = await fetch(`${API.categorias}?${params}`)
            const data = await res.json()
            setResult(data)
        } catch {
            toast.error('No se pudo conectar con el servidor')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const fetchData = async () => await cargarCategorias()
        fetchData()
    }, [])

    const handleBusqueda = (valor: string) => {
        setBusqueda(valor)
        setPagina(1)
        cargarCategorias(1, valor)
    }

    const handlePagina = (nueva: number) => {
        setPagina(nueva)
        cargarCategorias(nueva, busqueda)
    }

    const abrirModal = (categoria?: Categoria) => {
        if (categoria) {
            setEditando(categoria)
            setForm({ nombre: categoria.nombre, descripcion: categoria.descripcion || '' })
        } else {
            setEditando(null)
            setForm({ nombre: '', descripcion: '' })
        }
        setShowModal(true)
    }

    const cerrarModal = () => {
        setShowModal(false)
        setEditando(null)
        setForm({ nombre: '', descripcion: '' })
    }

    const guardar = async () => {
        if (!form.nombre.trim()) {
            toast.error('El nombre de la categoría es obligatorio')
            return
        }
        setGuardando(true)
        try {
            if (editando) {
                await fetch(`${API.categorias}/${editando.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...editando, ...form })
                })
                toast.success('Categoría actualizada correctamente')
            } else {
                await fetch(API.categorias, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                })
                toast.success('Categoría creada correctamente')
            }
            await cargarCategorias()
            cerrarModal()
        } catch {
            toast.error('Error al guardar la categoría')
        } finally {
            setGuardando(false)
        }
    }

    const eliminar = async () => {
        try {
            const res = await fetch(`${API.categorias}/${confirmModal.id}`, { method: 'DELETE' })
            if (!res.ok) {
                const error = await res.json()
                toast.error(error.mensaje || 'Error al eliminar')
                setConfirmModal({ show: false, id: '' })
                return
            }
            setConfirmModal({ show: false, id: '' })
            await cargarCategorias()
            toast.success('Categoría eliminada correctamente')
        } catch {
            toast.error('Error al eliminar la categoría')
        }
    }

    return (
        <Layout titulo="Categorías">
            {/* Header con buscador y botón */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 style={{ fontWeight: 700, margin: 0 }}>Categorías de productos</h5>
                    <small style={{ color: 'var(--text-muted)' }}>{result.total} categorías registradas</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <div className="input-group" style={{ width: '280px' }}>
                        <span className="input-group-text" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
                            <i className="fas fa-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar categoría..."
                            value={busqueda}
                            onChange={e => handleBusqueda(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => abrirModal()}
                        style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>
                        <i className="fas fa-plus mr-1"></i> Nueva categoría
                    </button>
                </div>
            </div>

            {/* Tabla */}
            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <span><i className="fas fa-tags mr-2" style={{ color: 'var(--primary)' }}></i>Categorías</span>
                    <small style={{ color: 'var(--text-muted)' }}>
                        Mostrando {result.datos.length} de {result.total} registros
                    </small>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-bordered mb-0">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Descripción</th>
                                    <th>Estado</th>
                                    <th style={{ width: '200px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-4">
                                            <i className="fas fa-spinner fa-spin mr-2" style={{ color: 'var(--primary)' }}></i>
                                            Cargando...
                                        </td>
                                    </tr>
                                ) : result.datos.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                                            No hay categorías registradas. ¡Crea la primera!
                                        </td>
                                    </tr>
                                ) : (
                                    result.datos.map(c => (
                                        <tr key={c.id}>
                                            <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                                            <td style={{ color: 'var(--text-muted)' }}>{c.descripcion || '—'}</td>
                                            <td>
                                                <span style={{
                                                    background: c.activo ? '#e8f5e9' : '#fce4e4',
                                                    color: c.activo ? '#2e7d32' : 'var(--secondary)',
                                                    fontWeight: 600, padding: '2px 8px',
                                                    borderRadius: '12px', fontSize: '12px'
                                                }}>
                                                    {c.activo ? 'Activa' : 'Inactiva'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => abrirModal(c)}
                                                        style={{ padding: '6px 14px' }}>
                                                        <i className="fas fa-edit mr-1"></i> Editar
                                                    </button>
                                                    <button
                                                        className="btn btn-sm"
                                                        onClick={() => setConfirmModal({ show: true, id: c.id })}
                                                        style={{ background: 'var(--secondary)', border: 'none', color: 'white', padding: '6px 14px' }}>
                                                        <i className="fas fa-trash mr-1"></i> Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {result.totalPaginas > 1 && (
                        <div className="d-flex justify-content-between align-items-center px-3 py-3"
                            style={{ borderTop: '1px solid var(--border)' }}>
                            <small style={{ color: 'var(--text-muted)' }}>
                                Página {result.pagina} de {result.totalPaginas}
                            </small>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    className="btn btn-sm"
                                    onClick={() => handlePagina(1)}
                                    disabled={pagina === 1}
                                    style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary-dark)', padding: '4px 10px' }}>
                                    «
                                </button>
                                <button
                                    className="btn btn-sm"
                                    onClick={() => handlePagina(pagina - 1)}
                                    disabled={pagina === 1}
                                    style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary-dark)', padding: '4px 10px' }}>
                                    ‹
                                </button>

                                {Array.from({ length: result.totalPaginas }, (_, i) => i + 1)
                                    .filter(p => p >= pagina - 2 && p <= pagina + 2)
                                    .map(p => (
                                        <button
                                            key={p}
                                            className="btn btn-sm"
                                            onClick={() => handlePagina(p)}
                                            style={{
                                                background: p === pagina ? 'var(--primary)' : 'white',
                                                border: '1px solid var(--primary)',
                                                color: p === pagina ? 'white' : 'var(--primary-dark)',
                                                fontWeight: p === pagina ? 700 : 400,
                                                padding: '4px 10px'
                                            }}>
                                            {p}
                                        </button>
                                    ))}

                                <button
                                    className="btn btn-sm"
                                    onClick={() => handlePagina(pagina + 1)}
                                    disabled={pagina === result.totalPaginas}
                                    style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary-dark)', padding: '4px 10px' }}>
                                    ›
                                </button>
                                <button
                                    className="btn btn-sm"
                                    onClick={() => handlePagina(result.totalPaginas)}
                                    disabled={pagina === result.totalPaginas}
                                    style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary-dark)', padding: '4px 10px' }}>
                                    »
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal crear/editar */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '460px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                        <h5 style={{ fontWeight: 700, marginBottom: '20px', color: 'var(--dark)' }}>
                            <i className="fas fa-tags mr-2" style={{ color: 'var(--primary)' }}></i>
                            {editando ? 'Editar categoría' : 'Nueva categoría'}
                        </h5>

                        <div className="mb-3">
                            <label style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                                Nombre <span style={{ color: 'var(--secondary)' }}>*</span>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Ej: LEDs, Xenon, Alarmas..."
                                value={form.nombre}
                                onChange={e => setForm({ ...form, nombre: e.target.value })}
                                autoFocus
                            />
                        </div>

                        <div className="mb-4">
                            <label style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                                Descripción <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span>
                            </label>
                            <textarea
                                className="form-control"
                                placeholder="Descripción de la categoría..."
                                value={form.descripcion}
                                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                                rows={3}
                            />
                        </div>

                        <div className="d-flex gap-2 justify-content-end">
                            <button onClick={cerrarModal} className="btn btn-sm"
                                style={{ background: 'var(--light)', border: '1px solid var(--border)', color: 'var(--text-dark)', padding: '8px 20px' }}>
                                Cancelar
                            </button>
                            <button onClick={guardar} className="btn btn-primary" disabled={guardando}
                                style={{ padding: '8px 24px' }}>
                                {guardando
                                    ? <><i className="fas fa-spinner fa-spin mr-1"></i>Guardando...</>
                                    : <><i className="fas fa-save mr-1"></i>Guardar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal confirmar eliminar */}
            <ConfirmModal
                show={confirmModal.show}
                titulo="¿Eliminar categoría?"
                mensaje="Esta acción no se puede deshacer. ¿Estás seguro que querés eliminar esta categoría?"
                onConfirmar={eliminar}
                onCancelar={() => setConfirmModal({ show: false, id: '' })}
                tipo="danger"
            />

        </Layout>
    )
}