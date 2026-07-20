import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import ConfirmModal from '../components/ui/ConfirmModal'
import { API } from '../config/api'

interface Cliente {
    id: string
    nombre: string
    ruc: string | null
    telefono: string | null
    direccion: string | null
    email: string | null
    activo: boolean
    fechaCreacion: string
    tieneAccesoWeb: boolean
    fechaReactivacionAuto: string | null
}

interface Errores {
    nombre?: string
    ruc?: string
    telefono?: string
    email?: string
}

interface DatosReactivar {
    mensaje: string
    clienteInactivoId: string
    body: {
        nombre: string
        ruc: string | null
        telefono: string | null
        direccion: string | null
        email: string | null
    }
}

// ── Validaciones de formato ───────────────────────────────────────────────────
const validarRuc = (ruc: string): string | null => {
    if (!ruc.trim()) return null
    const rucRegex = /^\d{6,8}-\d{1}$/
    const ciRegex = /^\d{6,8}$/
    if (!rucRegex.test(ruc.trim()) && !ciRegex.test(ruc.trim()))
        return 'Formato inválido. Ej: 1234567-8 (RUC) o 1234567 (CI)'
    return null
}

const validarTelefono = (tel: string): string | null => {
    if (!tel.trim()) return null
    const limpio = tel.replace(/[\s\-().]/g, '')
    const telRegex = /^(\+?595)?0?9\d{8}$/
    if (!telRegex.test(limpio)) return 'Formato inválido. Ej: 0981234567'
    return null
}

const validarEmail = (email: string): string | null => {
    if (!email.trim()) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) return 'Email inválido'
    return null
}

const fmtFechaHora = (f: string) => new Date(f).toLocaleString('es-PY', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
})

export default function Clientes() {
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [cargando, setCargando] = useState(true)
    const [busqueda, setBusqueda] = useState('')
    const [mostrarModal, setMostrarModal] = useState(false)
    const [editando, setEditando] = useState<Cliente | null>(null)
    const [confirmEliminar, setConfirmEliminar] = useState<Cliente | null>(null)
    const [guardando, setGuardando] = useState(false)
    const [pagina, setPagina] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(1)

    // Campos
    const [nombre, setNombre] = useState('')
    const [ruc, setRuc] = useState('')
    const [telefono, setTelefono] = useState('')
    const [direccion, setDireccion] = useState('')
    const [email, setEmail] = useState('')

    // Validaciones
    const [errores, setErrores] = useState<Errores>({})
    const [verificando, setVerificando] = useState<Record<string, boolean>>({})

    // Reactivar cliente inactivo
    const [modalReactivar, setModalReactivar] = useState<DatosReactivar | null>(null)
    const [reactivando, setReactivando] = useState(false)

    const timerNombre = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const timerRuc = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const timerTel = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const timerEmail = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    const cargar = useCallback(async () => {
        setCargando(true)
        try {
            const params = new URLSearchParams({ pagina: String(pagina), tamano: '25' })
            if (busqueda) params.set('busqueda', busqueda)
            const res = await fetch(`${API.clientes}?${params}`)
            const data = await res.json()
            setClientes(data.datos || [])
            setTotalPaginas(data.totalPaginas || 1)
        } catch { toast.error('Error al cargar clientes') }
        finally { setCargando(false) }
    }, [busqueda, pagina])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        cargar()
    }, [cargar])

    const abrirNuevo = () => {
        setEditando(null)
        setNombre(''); setRuc(''); setTelefono(''); setDireccion(''); setEmail('')
        setErrores({}); setVerificando({})
        setMostrarModal(true)
    }

    const abrirEditar = (c: Cliente) => {
        setEditando(c)
        setNombre(c.nombre); setRuc(c.ruc || ''); setTelefono(c.telefono || '')
        setDireccion(c.direccion || ''); setEmail(c.email || '')
        setErrores({}); setVerificando({})
        setMostrarModal(true)
    }

    // Verificar duplicado en servidor
    const verificarDup = useCallback(async (campo: string, valor: string, comparar: (c: Cliente) => boolean) => {
        if (!valor.trim()) return
        setVerificando(v => ({ ...v, [campo]: true }))
        try {
            const res = await fetch(`${API.clientes}?busqueda=${encodeURIComponent(valor)}&tamano=50`)
            const data = await res.json()
            const dup = (data.datos || []).find((c: Cliente) =>
                (editando ? c.id !== editando.id : true) && comparar(c)
            )
            if (dup) setErrores(e => ({ ...e, [campo]: `Ya registrado para: ${dup.nombre}` }))
            else setErrores(e => ({ ...e, [campo]: undefined }))
        } catch {
            // Si falla la verificación de duplicados, no bloqueamos al usuario;
            // la validación definitiva la hace el backend al guardar.
        }
        finally { setVerificando(v => ({ ...v, [campo]: false })) }
    }, [editando])

    const handleNombre = (val: string) => {
        setNombre(val)
        setErrores(e => ({ ...e, nombre: undefined }))
        clearTimeout(timerNombre.current)
        if (val.trim().length > 2)
            timerNombre.current = setTimeout(() =>
                verificarDup('nombre', val, c => c.nombre.toLowerCase() === val.toLowerCase())
                , 600)
    }

    const handleRuc = (val: string) => {
        setRuc(val)
        const err = validarRuc(val)
        setErrores(e => ({ ...e, ruc: err || undefined }))
        if (!err && val.trim()) {
            clearTimeout(timerRuc.current)
            timerRuc.current = setTimeout(() =>
                verificarDup('ruc', val, c => c.ruc?.toLowerCase() === val.toLowerCase())
                , 600)
        }
    }

    const handleTelefono = (val: string) => {
        setTelefono(val)
        const err = validarTelefono(val)
        setErrores(e => ({ ...e, telefono: err || undefined }))
        if (!err && val.trim()) {
            clearTimeout(timerTel.current)
            timerTel.current = setTimeout(() =>
                verificarDup('telefono', val, c => c.telefono?.replace(/[\s\-().]/g, '') === val.replace(/[\s\-().]/g, ''))
                , 600)
        }
    }

    const handleEmail = (val: string) => {
        setEmail(val)
        const err = validarEmail(val)
        setErrores(e => ({ ...e, email: err || undefined }))
        if (!err && val.trim()) {
            clearTimeout(timerEmail.current)
            timerEmail.current = setTimeout(() =>
                verificarDup('email', val, c => c.email?.toLowerCase() === val.toLowerCase())
                , 600)
        }
    }

    const hayErrores = () => Object.values(errores).some(Boolean)

    const guardar = async () => {
        if (!nombre.trim()) { toast.error('El nombre es requerido'); return }
        if (hayErrores()) { toast.error('Corregí los errores antes de guardar'); return }
        setGuardando(true)
        try {
            const body = {
                nombre: nombre.trim(), ruc: ruc.trim() || null,
                telefono: telefono.trim() || null, direccion: direccion.trim() || null,
                email: email.trim() || null
            }
            const url = editando ? `${API.clientes}/${editando.id}` : API.clientes
            const method = editando ? 'PUT' : 'POST'
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
            const data = await res.json()

            if (res.status === 409 && data.tipo === 'CLIENTE_INACTIVO') {
                setModalReactivar({ mensaje: data.mensaje, clienteInactivoId: data.clienteInactivoId, body })
                return
            }

            if (!res.ok) { toast.error(data.mensaje || 'Error al guardar'); return }
            toast.success(editando ? 'Cliente actualizado' : 'Cliente creado')
            setMostrarModal(false); cargar()
        } catch { toast.error('Error de conexión') }
        finally { setGuardando(false) }
    }

    const confirmarReactivar = async () => {
        if (!modalReactivar) return
        setReactivando(true)
        try {
            const resReac = await fetch(`${API.clientes}/${modalReactivar.clienteInactivoId}/reactivar`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(modalReactivar.body)
            })
            if (!resReac.ok) { toast.error('Error al reactivar'); return }
            toast.success('Cliente reactivado correctamente')
            setModalReactivar(null)
            setMostrarModal(false); cargar()
        } catch { toast.error('Error de conexión') }
        finally { setReactivando(false) }
    }

    const eliminar = async () => {
        if (!confirmEliminar) return
        try {
            await fetch(`${API.clientes}/${confirmEliminar.id}`, { method: 'DELETE' })
            toast.success('Cliente eliminado')
            setConfirmEliminar(null); cargar()
        } catch { toast.error('Error al eliminar') }
    }

    // Componente de mensaje de validacion
    const MsgCampo = ({ error, cargando: c }: { error?: string, cargando?: boolean }) => {
        if (c) return <div style={{ fontSize: '11px', color: '#b7791f', marginTop: '3px' }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: '4px' }}></i>Verificando...
        </div>
        if (error) return <div style={{ fontSize: '11px', color: '#c53030', marginTop: '3px' }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight: '4px' }}></i>{error}
        </div>
        return null
    }

    const inputStyle = (campo: string): React.CSSProperties => ({
        borderColor: errores[campo as keyof Errores] ? '#c53030' : verificando[campo] ? '#d69e2e' : undefined
    })

    const thStyle: React.CSSProperties = {
        background: 'var(--dark)', color: 'white',
        padding: '10px 16px', fontWeight: 600, fontSize: '13px', textAlign: 'left'
    }

    return (
        <Layout titulo="Clientes">
            {/* Barra superior */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="input-group" style={{ maxWidth: '320px' }}>
                    <span className="input-group-text" style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>
                        <i className="fas fa-search"></i>
                    </span>
                    <input type="text" className="form-control" placeholder="Buscar por nombre, RUC o teléfono..."
                        value={busqueda} onChange={e => { setBusqueda(e.target.value); setPagina(1) }} />
                </div>
                <button className="btn btn-primary" onClick={abrirNuevo}>
                    <i className="fas fa-plus mr-2"></i>Nuevo cliente
                </button>
            </div>

            {/* Tabla */}
            <div className="card">
                {cargando ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                        <i className="fas fa-spinner fa-spin fa-2x"></i>
                    </div>
                ) : clientes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <i className="fas fa-users fa-3x" style={{ opacity: 0.15, display: 'block', marginBottom: '12px' }}></i>
                        <p>No hay clientes registrados.</p>
                    </div>
                ) : (
                    <table className="table mb-0">
                        <thead>
                            <tr>
                                <th style={thStyle}>Nombre</th>
                                <th style={thStyle}>RUC / CI</th>
                                <th style={thStyle}>Teléfono</th>
                                <th style={thStyle}>Email</th>
                                <th style={thStyle}>Acceso web</th>
                                <th style={thStyle}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.map(c => (
                                <tr key={c.id}>
                                    <td style={{ padding: '10px 16px', fontWeight: 500 }}>
                                        {c.nombre}
                                        {c.fechaReactivacionAuto && (
                                            <span
                                                title={`Este cliente estaba inactivo y se reactivó automáticamente al registrarse en la tienda online el ${fmtFechaHora(c.fechaReactivacionAuto)}.`}
                                                style={{
                                                    marginLeft: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    background: '#fffbeb', color: '#b7791f', border: '1px solid #fbd38d',
                                                    borderRadius: '20px', padding: '2px 8px', fontSize: '10px', fontWeight: 700,
                                                    verticalAlign: 'middle', cursor: 'help'
                                                }}>
                                                <i className="fas fa-redo-alt" style={{ fontSize: '9px' }}></i>
                                                Reactivado auto
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{c.ruc || '—'}</td>
                                    <td style={{ padding: '10px 16px', fontSize: '13px' }}>{c.telefono || '—'}</td>
                                    <td style={{ padding: '10px 16px', fontSize: '13px' }}>{c.email || '—'}</td>
                                    <td style={{ padding: '10px 16px' }}>
                                        {c.tieneAccesoWeb
                                            ? <span style={{ background: '#f0fff4', color: '#2f855a', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>Sí</span>
                                            : <span style={{ background: '#f5f5f5', color: '#718096', padding: '2px 8px', borderRadius: '20px', fontSize: '11px' }}>No</span>}
                                    </td>
                                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                                        <button onClick={() => abrirEditar(c)} className="btn btn-sm mr-2"
                                            style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', border: '1px solid var(--primary)' }}>
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button onClick={() => setConfirmEliminar(c)} className="btn btn-sm"
                                            style={{ background: '#fff5f5', color: '#c53030', border: '1px solid #fed7d7' }}>
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Paginacion */}
            {totalPaginas > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                    <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                        className="btn btn-sm" style={{ border: '1.5px solid var(--border)' }}>
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: 'var(--text-muted)', padding: '0 8px' }}>
                        {pagina} / {totalPaginas}
                    </span>
                    <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                        className="btn btn-sm" style={{ border: '1.5px solid var(--border)' }}>
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            )}

            {/* Modal nuevo/editar */}
            {mostrarModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h5 style={{ margin: 0, fontWeight: 700 }}>{editando ? 'Editar cliente' : 'Nuevo cliente'}</h5>
                            <button onClick={() => setMostrarModal(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px' }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                            <div>
                                <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', display: 'block' }}>
                                    Nombre <span style={{ color: '#c53030' }}>*</span>
                                </label>
                                <input type="text" className="form-control"
                                    placeholder="Nombre completo o razón social"
                                    value={nombre} onChange={e => handleNombre(e.target.value)}
                                    style={inputStyle('nombre')} />
                                <MsgCampo error={errores.nombre} cargando={verificando.nombre} />
                            </div>

                            <div>
                                <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', display: 'block' }}>RUC / CI</label>
                                <input type="text" className="form-control"
                                    placeholder="Ej: 1234567-8 (RUC) o 1234567 (CI)"
                                    value={ruc} onChange={e => handleRuc(e.target.value)}
                                    style={inputStyle('ruc')} />
                                <MsgCampo error={errores.ruc} cargando={verificando.ruc} />
                            </div>

                            <div>
                                <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', display: 'block' }}>Teléfono</label>
                                <input type="tel" className="form-control"
                                    placeholder="Ej: 0981234567"
                                    value={telefono} onChange={e => handleTelefono(e.target.value)}
                                    style={inputStyle('telefono')} />
                                <MsgCampo error={errores.telefono} cargando={verificando.telefono} />
                            </div>

                            <div>
                                <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', display: 'block' }}>Email</label>
                                <input type="email" className="form-control"
                                    placeholder="cliente@email.com"
                                    value={email} onChange={e => handleEmail(e.target.value)}
                                    style={inputStyle('email')} />
                                <MsgCampo error={errores.email} cargando={verificando.email} />
                            </div>

                            <div>
                                <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', display: 'block' }}>Dirección</label>
                                <input type="text" className="form-control"
                                    placeholder="Dirección del cliente"
                                    value={direccion} onChange={e => setDireccion(e.target.value)} />
                            </div>
                        </div>

                        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setMostrarModal(false)} className="btn"
                                style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', border: '1px solid var(--primary)' }}>
                                Cancelar
                            </button>
                            <button onClick={guardar} disabled={guardando || hayErrores()} className="btn btn-primary"
                                style={{ fontWeight: 700, opacity: hayErrores() ? 0.6 : 1 }}>
                                {guardando
                                    ? <><i className="fas fa-spinner fa-spin mr-2"></i>Guardando...</>
                                    : <><i className="fas fa-save mr-2"></i>{editando ? 'Actualizar' : 'Guardar'}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal confirmar eliminar */}
            {confirmEliminar && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '400px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                        <h5 style={{ fontWeight: 700, marginBottom: '12px' }}>Eliminar cliente</h5>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                            ¿Eliminar a <strong>{confirmEliminar.nombre}</strong>? Esta acción lo desactivará del sistema.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setConfirmEliminar(null)} className="btn"
                                style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', border: '1px solid var(--primary)' }}>
                                Cancelar
                            </button>
                            <button onClick={eliminar} className="btn"
                                style={{ background: '#c53030', color: 'white', border: 'none', fontWeight: 700 }}>
                                <i className="fas fa-trash mr-2"></i>Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal reactivar cliente inactivo */}
            <ConfirmModal
                show={!!modalReactivar}
                titulo="Cliente inactivo encontrado"
                mensaje={`${modalReactivar?.mensaje || ''}\n\n¿Querés reactivarlo con los datos actuales?`}
                onConfirmar={confirmarReactivar}
                onCancelar={() => setModalReactivar(null)}
                tipo="warning"
                textoConfirmar={reactivando ? 'Reactivando...' : 'Sí, reactivar'}
            />
        </Layout>
    )
}