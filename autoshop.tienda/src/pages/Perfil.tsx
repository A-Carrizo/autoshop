import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useIdioma } from '../context/IdiomaContext'
import { API } from '../config/api'

export default function Perfil() {
    const navigate = useNavigate()
    const { t } = useIdioma()
    const [nombre, setNombre] = useState('')
    const [email, setEmail] = useState('')
    const [telefono, setTelefono] = useState('')
    const [direccion, setDireccion] = useState('')
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        let cancelado = false
        const cargar = async () => {
            try {
                const token = localStorage.getItem('tienda_token')
                const res = await fetch(`${API.auth}/verificar`, { headers: { 'Authorization': `Bearer ${token}` } })
                if (!res.ok) { if (!cancelado) navigate('/login'); return }
                const data = await res.json()
                if (!cancelado) { setNombre(data.nombre || ''); setEmail(data.email || ''); setTelefono(data.telefono || ''); setDireccion(data.direccion || '') }
            } catch { if (!cancelado) toast.error('Error al cargar el perfil') }
            finally { if (!cancelado) setCargando(false) }
        }
        cargar()
        return () => { cancelado = true }
    }, [navigate])

    const handleGuardar = async (e: React.SyntheticEvent) => {
        e.preventDefault()
        if (!nombre.trim()) { toast.error('El nombre es requerido'); return }
        setGuardando(true)
        try {
            const token = localStorage.getItem('tienda_token')
            const res = await fetch(`${API.auth}/perfil`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ nombre: nombre.trim(), telefono: telefono.trim() || null, direccion: direccion.trim() || null }) })
            const data = await res.json()
            if (!res.ok) { toast.error(data.mensaje || 'No se pudo actualizar el perfil'); return }
            localStorage.setItem('tienda_nombre', nombre.trim())
            toast.success('Perfil actualizado correctamente')
        } catch { toast.error('Error de conexion') }
        finally { setGuardando(false) }
    }

    const handleCerrarSesion = async () => {
        try {
            const token = localStorage.getItem('tienda_token')
            if (token) await fetch(`${API.auth}/logout`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } })
        } catch { /* ignorar */ }
        finally {
            localStorage.removeItem('tienda_token'); localStorage.removeItem('tienda_nombre'); localStorage.removeItem('tienda_email')
            navigate('/'); window.location.reload()
        }
    }

    if (cargando) return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--mc-fondo)' }}>
            <Header />
            <main className="mc-container mc-pagina mc-pagina--angosta" style={{ flex: 1 }}>
                <div className="mc-panel" aria-hidden="true">
                    <div className="mc-skeleton" style={{ height: '22px', width: '40%', marginBottom: '20px' }}></div>
                    <div className="mc-skeleton" style={{ height: '160px' }}></div>
                </div>
            </main>
            <Footer />
        </div>
    )

    const campos = [
        { id: 'perfil-nombre', label: t.nombreCompleto, type: 'text', val: nombre, set: setNombre, ph: '' },
        { id: 'perfil-telefono', label: t.telefono, type: 'tel', val: telefono, set: setTelefono, ph: t.telefonoPH },
        { id: 'perfil-direccion', label: t.direccionHabitual, type: 'text', val: direccion, set: setDireccion, ph: t.direccionPlaceholder },
    ]

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--mc-fondo)' }}>
            <Header />
            <main className="mc-container mc-pagina mc-pagina--angosta" style={{ flex: 1 }}>
                <div className="mc-titulo-pagina">
                    <h1>{t.miPerfil}</h1>
                    <p>{email}</p>
                </div>

                <div className="mc-panel mc-filas" style={{ marginBottom: '16px' }}>
                    <Link to="/mis-pedidos" className="mc-fila">
                        <i className="fas fa-receipt" style={{ color: 'var(--mc-rojo)' }}></i>
                        <div className="mc-fila__principal"><strong>{t.verMisPedidos}</strong></div>
                        <i className="fas fa-chevron-right"></i>
                    </Link>
                </div>

                <form onSubmit={handleGuardar} className="mc-panel">
                    <h2 className="mc-panel__titulo">{t.datosPersonales}</h2>
                    {campos.map(f => (
                        <div key={f.id} className="mc-campo">
                            <label className="mc-label" htmlFor={f.id}>{f.label}</label>
                            <input id={f.id} type={f.type} className="mc-input" placeholder={f.ph}
                                value={f.val} onChange={e => f.set(e.target.value)} />
                        </div>
                    ))}
                    <button type="submit" disabled={guardando} className="mc-btn mc-btn--primario mc-btn--bloque mc-btn--grande" style={{ marginTop: '4px' }}>
                        {guardando ? <><i className="fas fa-spinner fa-spin"></i>{t.guardando}</> : t.guardarCambios}
                    </button>
                </form>

                <button type="button" onClick={handleCerrarSesion} className="mc-btn mc-btn--peligro mc-btn--bloque" style={{ marginTop: '16px' }}>
                    <i className="fas fa-sign-out-alt"></i>{t.cerrarSesion}
                </button>
            </main>
            <Footer />
        </div>
    )
}
