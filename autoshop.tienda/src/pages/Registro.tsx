import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import HeaderSimple from '../components/layout/HeaderSimple'
import Footer from '../components/layout/Footer'
import { API } from '../config/api'

const COL = {
    primary: '#2c5282',
    primaryDark: '#1a365d',
    accent: '#D4A017',
    muted: '#718096',
    border: '#e2e8f0',
}

export default function Registro() {
    const [nombre, setNombre] = useState('')
    const [email, setEmail] = useState('')
    const [telefono, setTelefono] = useState('')
    const [password, setPassword] = useState('')
    const [confirmarPassword, setConfirmarPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const next = searchParams.get('next') || '/'

    const handleRegistro = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!nombre.trim() || !email.trim() || !password.trim()) { toast.error('Completa los campos requeridos'); return }
        if (password.length < 6) { toast.error('La contrasena debe tener al menos 6 caracteres'); return }
        if (password !== confirmarPassword) { toast.error('Las contrasenas no coinciden'); return }

        setLoading(true)
        try {
            const res = await fetch(`${API.auth}/registro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: nombre.trim(),
                    email: email.trim(),
                    password,
                    telefono: telefono.trim() || null,
                })
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.mensaje || 'Error al crear la cuenta'); return }
            localStorage.setItem('tienda_token', data.token)
            localStorage.setItem('tienda_nombre', data.nombre)
            localStorage.setItem('tienda_email', data.email)
            toast.success('Cuenta creada correctamente')
            navigate(next, { replace: true })
        } catch { toast.error('Error de conexion') }
        finally { setLoading(false) }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f3f7' }}>
            <HeaderSimple />

            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                <div style={{ width: '100%', maxWidth: '420px' }}>

                    <div style={{ background: '#fff', borderRadius: '16px', padding: '36px', border: `1px solid ${COL.border}` }}>
                        <h1 style={{ fontWeight: 700, color: '#1a202c', marginBottom: '4px', fontSize: '20px' }}>Crear cuenta</h1>
                        <p style={{ color: COL.muted, fontSize: '13px', marginBottom: '24px' }}>Registrate para hacer pedidos y ver tu historial</p>

                        <form onSubmit={handleRegistro}>
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Nombre completo</label>
                                <input type="text" placeholder="Tu nombre"
                                    value={nombre} onChange={e => setNombre(e.target.value)} autoFocus
                                    style={{ width: '100%', padding: '11px 12px', border: `1.5px solid ${COL.border}`, borderRadius: '8px', fontSize: '14px', color: '#2d3748', outline: 'none' }}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Correo electronico</label>
                                <input type="email" placeholder="tu@email.com"
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    style={{ width: '100%', padding: '11px 12px', border: `1.5px solid ${COL.border}`, borderRadius: '8px', fontSize: '14px', color: '#2d3748', outline: 'none' }}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Telefono (opcional)</label>
                                <input type="tel" placeholder="0981 234 567"
                                    value={telefono} onChange={e => setTelefono(e.target.value)}
                                    style={{ width: '100%', padding: '11px 12px', border: `1.5px solid ${COL.border}`, borderRadius: '8px', fontSize: '14px', color: '#2d3748', outline: 'none' }}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Contrasena</label>
                                <input type="password" placeholder="Minimo 6 caracteres"
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    style={{ width: '100%', padding: '11px 12px', border: `1.5px solid ${COL.border}`, borderRadius: '8px', fontSize: '14px', color: '#2d3748', outline: 'none' }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Confirmar contrasena</label>
                                <input type="password" placeholder="Repeti tu contrasena"
                                    value={confirmarPassword} onChange={e => setConfirmarPassword(e.target.value)}
                                    style={{ width: '100%', padding: '11px 12px', border: `1.5px solid ${COL.border}`, borderRadius: '8px', fontSize: '14px', color: '#2d3748', outline: 'none' }}
                                />
                            </div>

                            <button type="submit" disabled={loading}
                                style={{
                                    width: '100%', padding: '13px', background: loading ? '#a0aec0' : COL.primary,
                                    border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, fontSize: '15px',
                                    cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '16px',
                                }}>
                                {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Creando cuenta...</> : 'Crear cuenta'}
                            </button>
                        </form>

                        <p style={{ textAlign: 'center', fontSize: '13px', color: COL.muted, margin: 0 }}>
                            ¿Ya tenes cuenta?{' '}
                            <Link to={`/login?next=${encodeURIComponent(next)}`} style={{ color: COL.primary, fontWeight: 600, textDecoration: 'none' }}>
                                Inicia sesion
                            </Link>
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}