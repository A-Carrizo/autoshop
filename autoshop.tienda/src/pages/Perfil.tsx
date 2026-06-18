import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { API } from '../config/api'

const COL = {
    primary: '#2c5282',
    primaryDark: '#1a365d',
    accent: '#D4A017',
    muted: '#718096',
    border: '#e2e8f0',
    danger: '#CC0000',
}

export default function Perfil() {
    const navigate = useNavigate()
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
                const res = await fetch(`${API.auth}/verificar`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (!res.ok) {
                    if (!cancelado) navigate('/login')
                    return
                }
                const data = await res.json()
                if (!cancelado) {
                    setNombre(data.nombre || '')
                    setEmail(data.email || '')
                    setTelefono(data.telefono || '')
                    setDireccion(data.direccion || '')
                }
            } catch {
                if (!cancelado) toast.error('Error al cargar el perfil')
            } finally {
                if (!cancelado) setCargando(false)
            }
        }
        cargar()
        return () => { cancelado = true }
    }, [navigate])

    const handleGuardar = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!nombre.trim()) { toast.error('El nombre es requerido'); return }

        setGuardando(true)
        try {
            const token = localStorage.getItem('tienda_token')
            const res = await fetch(`${API.auth}/perfil`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    nombre: nombre.trim(),
                    telefono: telefono.trim() || null,
                    direccion: direccion.trim() || null,
                })
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.mensaje || 'No se pudo actualizar el perfil'); return }

            localStorage.setItem('tienda_nombre', nombre.trim())
            toast.success('Perfil actualizado correctamente')
        } catch {
            toast.error('Error de conexion')
        } finally {
            setGuardando(false)
        }
    }

    const handleCerrarSesion = async () => {
        try {
            const token = localStorage.getItem('tienda_token')
            if (token) {
                await fetch(`${API.auth}/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            }
        } catch { /* ignorar */ }
        finally {
            localStorage.removeItem('tienda_token')
            localStorage.removeItem('tienda_nombre')
            localStorage.removeItem('tienda_email')
            navigate('/')
            window.location.reload()
        }
    }

    if (cargando) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f3f7' }}>
                <Header />
                <div style={{ flex: 1, textAlign: 'center', padding: '80px 0', color: COL.muted }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '28px' }}></i>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f3f7' }}>
            <Header />

            <main style={{ flex: 1, maxWidth: '600px', margin: '0 auto', padding: '28px 32px', width: '100%' }}>

                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a202c', margin: '0 0 4px' }}>
                    <i className="fas fa-user-circle" style={{ marginRight: '10px', color: COL.primary }}></i>
                    Mi perfil
                </h1>
                <p style={{ fontSize: '13px', color: COL.muted, margin: '0 0 24px' }}>{email}</p>

                <Link to="/mis-pedidos" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#fff', borderRadius: '12px', border: `1px solid ${COL.border}`,
                    padding: '16px 20px', textDecoration: 'none', color: 'inherit', marginBottom: '20px',
                }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#2d3748' }}>
                        <i className="fas fa-receipt" style={{ marginRight: '10px', color: COL.primary }}></i>
                        Ver mis pedidos
                    </span>
                    <i className="fas fa-chevron-right" style={{ color: '#cbd5e0', fontSize: '13px' }}></i>
                </Link>

                <form onSubmit={handleGuardar} style={{
                    background: '#fff', borderRadius: '16px', border: `1px solid ${COL.border}`, padding: '28px',
                }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a202c', margin: '0 0 16px' }}>Datos personales</h2>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Nombre completo</label>
                        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                            style={{ width: '100%', padding: '11px 12px', border: `1.5px solid ${COL.border}`, borderRadius: '8px', fontSize: '14px', color: '#2d3748', outline: 'none' }}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Telefono</label>
                        <input type="tel" placeholder="0981 234 567" value={telefono} onChange={e => setTelefono(e.target.value)}
                            style={{ width: '100%', padding: '11px 12px', border: `1.5px solid ${COL.border}`, borderRadius: '8px', fontSize: '14px', color: '#2d3748', outline: 'none' }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Direccion habitual</label>
                        <input type="text" placeholder="Calle, numero, barrio, ciudad" value={direccion} onChange={e => setDireccion(e.target.value)}
                            style={{ width: '100%', padding: '11px 12px', border: `1.5px solid ${COL.border}`, borderRadius: '8px', fontSize: '14px', color: '#2d3748', outline: 'none' }}
                        />
                    </div>

                    <button type="submit" disabled={guardando} style={{
                        width: '100%', padding: '13px', background: guardando ? '#a0aec0' : COL.primary,
                        border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, fontSize: '15px',
                        cursor: guardando ? 'not-allowed' : 'pointer',
                    }}>
                        {guardando ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Guardando...</> : 'Guardar cambios'}
                    </button>
                </form>

                <button onClick={handleCerrarSesion} style={{
                    width: '100%', marginTop: '16px', padding: '13px', background: 'none',
                    border: `1.5px solid ${COL.danger}`, borderRadius: '8px', color: COL.danger,
                    fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                }}>
                    <i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }}></i>
                    Cerrar sesion
                </button>
            </main>

            <Footer />
        </div>
    )
}