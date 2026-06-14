import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import ConfirmModal from '../components/ui/ConfirmModal'
import { API } from '../config/api'

interface Cliente {
    id: string
    nombre: string
    ruc?: string
    telefono?: string
    direccion?: string
    email?: string
    activo: boolean
    fechaCreacion: string
}

interface PaginatedResult {
    datos: Cliente[]
    total: number
    pagina: number
    tamano: number
    totalPaginas: number
}

interface ClienteForm {
    nombre: string
    ruc: string
    telefono: string
    direccion: string
    email: string
}

const formVacio: ClienteForm = { nombre: '', ruc: '', telefono: '', direccion: '', email: '' }

export default function Clientes() {
    const [result, setResult] = useState<PaginatedResult>({ datos: [], total: 0, pagina: 1, tamano: 25, totalPaginas: 0 })
    const [loading, setLoading] = useState(true)
    const [pagina, setPagina] = useState(1)
    const [busqueda, setBusqueda] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editando, setEditando] = useState<Cliente | null>(null)
    const [form, setForm] = useState<ClienteForm>(formVacio)
    const [guardando, setGuardando] = useState(false)
    const [confirmModal, setConfirmModal] = useState<{ show: boolean, id: string, nombre: string }>({ show: false, id: '', nombre: '' })

    const cargarClientes = async (pag = pagina, busq = busqueda) => {
        try {
            setLoading(true)
            const params = new URLSearchParams({ pagina: pag.toString(), tamano: '25' })
            if (busq) params.append('busqueda', busq)
            const res = await fetch(`${API.clientes}?${params}`)
            const data = await res.json()
            setResult(data)
        } catch { toast.error('No se pudo conectar con el servidor') }
        finally { setLoading(false) }
    }

    useEffect(() => { cargarClientes() }, [])

    const handleBusqueda = (valor: string) => {
        setBusqueda(valor); setPagina(1); cargarClientes(1, valor)
    }

    const handlePagina = (nueva: number) => {
        setPagina(nueva); cargarClientes(nueva, busqueda)
    }

    const abrirModal = (cliente?: Cliente) => {
        if (cliente) {
            setEditando(cliente)
            setForm({
                nombre: cliente.nombre,
                ruc: cliente.ruc || '',
                telefono: cliente.telefono || '',
                direccion: cliente.direccion || '',
                email: cliente.email || ''
            })
        } else {
            setEditando(null)
            setForm(formVacio)
        }
        setShowModal(true)
    }

    const cerrarModal = () => {
        setShowModal(false); setEditando(null); setForm(formVacio)
    }

    const validar = (): boolean => {
        if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return false }
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            toast.error('El email no tiene un formato válido'); return false
        }
        return true
    }

    const guardar = async () => {
        if (!validar()) return
        setGuardando(true)
        try {
            const body = {
                nombre: form.nombre.trim(),
                ruc: form.ruc.trim() || null,
                telefono: form.telefono.trim() || null,
                direccion: form.direccion.trim() || null,
                email: form.email.trim() || null
            }
            const url = editando ? `${API.clientes}/${editando.id}` : API.clientes
            const method = editando ? 'PUT' : 'POST'
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
            if (!res.ok) { const err = await res.json(); toast.error(err.mensaje || 'Error al guardar'); return }
            toast.success(editando ? 'Cliente actualizado' : 'Cliente registrado correctamente')
            await cargarClientes()
            cerrarModal()
        } catch { toast.error('Error inesperado') }
        finally { setGuardando(false) }
    }

    const eliminar = async () => {
        try {
            const res = await fetch(`${API.clientes}/${confirmModal.id}`, { method: 'DELETE' })
            if (!res.ok) { toast.error('Error al eliminar'); return }
            setConfirmModal({ show: false, id: '', nombre: '' })
            await cargarClientes()
            toast.success('Cliente eliminado')
        } catch { toast.error('Error al eliminar') }
    }

    return (
        <Layout titulo="Clientes">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 style={{ fontWeight: 700, margin: 0 }}>Clientes</h5>
                    <small style={{ color: 'var(--text-muted)' }}>{result.total} clientes registrados</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <div className="input-group" style={{ width: '280px' }}>
                        <span className="input-group-text" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
                            <i className="fas fa-search"></i>
                        </span>
                        <input type="text" className="form-control" placeholder="Buscar por nombre, RUC o teléfono..."
                            value={busqueda} onChange={e => handleBusqueda(e.target.value)} />
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => abrirModal()} style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>
                        <i className="fas fa-plus mr-1"></i> Nuevo cliente
                    </button>
                </div>
            </div>

            {/* Tabla */}
            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <span><i className="fas fa-users mr-2" style={{ color: 'var(--primary)' }}></i>Clientes</span>
                    <small style={{ color: 'var(--text-muted)' }}>Mostrando {result.datos.length} de {result.total}</small>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-bordered mb-0">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>RUC</th>
                                    <th>Teléfono</th>
                                    <th>Email</th>
                                    <th>Dirección</th>
                                    <th style={{ width: '100px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-4">
                                        <i className="fas fa-spinner fa-spin mr-2" style={{ color: 'var(--primary)' }}></i>Cargando...
                                    </td></tr>
                                ) : result.datos.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                                        No hay clientes. ¡Registrá el primero!
                                    </td></tr>
                                ) : result.datos.map(c => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                                        <td><span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{c.ruc || '—'}</span></td>
                                        <td>{c.telefono || '—'}</td>
                                        <td style={{ fontSize: '13px' }}>{c.email || '—'}</td>
                                        <td style={{ fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.direccion || '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button className="btn btn-sm btn-primary" onClick={() => abrirModal(c)} style={{ padding: '5px 10px' }}>
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button className="btn btn-sm" onClick={() => setConfirmModal({ show: true, id: c.id, nombre: c.nombre })}
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

                    {/* Paginación */}
                    {result.totalPaginas > 1 && (
                        <div className="d-flex justify-content-between align-items-center px-3 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                            <small style={{ color: 'var(--text-muted)' }}>Página {result.pagina} de {result.totalPaginas}</small>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button className="btn btn-sm" onClick={() => handlePagina(1)} disabled={pagina === 1}
                                    style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary-dark)', padding: '4px 10px' }}>«</button>
                                <button className="btn btn-sm" onClick={() => handlePagina(pagina - 1)} disabled={pagina === 1}
                                    style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary-dark)', padding: '4px 10px' }}>‹</button>
                                {Array.from({ length: result.totalPaginas }, (_, i) => i + 1)
                                    .filter(p => p >= pagina - 2 && p <= pagina + 2)
                                    .map(p => (
                                        <button key={p} className="btn btn-sm" onClick={() => handlePagina(p)}
                                            style={{ background: p === pagina ? 'var(--primary)' : 'white', border: '1px solid var(--primary)', color: p === pagina ? 'white' : 'var(--primary-dark)', fontWeight: p === pagina ? 700 : 400, padding: '4px 10px' }}>
                                            {p}
                                        </button>
                                    ))}
                                <button className="btn btn-sm" onClick={() => handlePagina(pagina + 1)} disabled={pagina === result.totalPaginas}
                                    style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary-dark)', padding: '4px 10px' }}>›</button>
                                <button className="btn btn-sm" onClick={() => handlePagina(result.totalPaginas)} disabled={pagina === result.totalPaginas}
                                    style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary-dark)', padding: '4px 10px' }}>»</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '14px', width: '100%', maxWidth: '520px', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '2px solid var(--primary-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h5 style={{ fontWeight: 700, margin: 0 }}>
                                <i className="fas fa-user mr-2" style={{ color: 'var(--primary)' }}></i>
                                {editando ? 'Editar cliente' : 'Nuevo cliente'}
                            </h5>
                            <button onClick={cerrarModal} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div className="row">
                                <div className="col-12 mb-3">
                                    <label style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                                        Nombre <span style={{ color: 'var(--secondary)' }}>*</span>
                                    </label>
                                    <input type="text" className="form-control" placeholder="Nombre completo o razón social..."
                                        value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} autoFocus />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', display: 'block' }}>RUC</label>
                                    <input type="text" className="form-control" placeholder="RUC del cliente..."
                                        value={form.ruc} onChange={e => setForm({ ...form, ruc: e.target.value })} />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', display: 'block' }}>Teléfono</label>
                                    <input type="text" className="form-control" placeholder="Ej: 0981 000 000"
                                        value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
                                </div>
                                <div className="col-12 mb-3">
                                    <label style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', display: 'block' }}>Email</label>
                                    <input type="email" className="form-control" placeholder="correo@ejemplo.com"
                                        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                                </div>
                                <div className="col-12 mb-3">
                                    <label style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', display: 'block' }}>Dirección</label>
                                    <input type="text" className="form-control" placeholder="Dirección del cliente..."
                                        value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
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
                titulo="¿Eliminar cliente?"
                mensaje={`¿Estás seguro que querés eliminar a "${confirmModal.nombre}"?`}
                onConfirmar={eliminar}
                onCancelar={() => setConfirmModal({ show: false, id: '', nombre: '' })}
                tipo="danger"
            />
        </Layout>
    )
}