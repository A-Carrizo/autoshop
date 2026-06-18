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

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [verPassword, setVerPassword] = useState(false)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const next = searchParams.get('next') || '/'

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim() || !password.trim()) { toast.error('Completa todos los campos'); return }
        setLoading(true)
        try {
            const res = await fetch(`${API.auth}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password })
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.mensaje || 'Error al iniciar sesion'); return }
            localStorage.setItem('tienda_token', data.token)
            localStorage.setItem('tienda_nombre', data.nombre)
            localStorage.setItem('tienda_email', data.email)
            toast.success('Sesion iniciada')
            navigate(next, { replace: true })
        } catch { toast.error('Error de conexion') }
        finally { setLoading(false) }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f3f7' }}>
            <HeaderSimple />

            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                <div style={{ width: '100%', maxWidth: '400px' }}>

                    <div style={{
                        background: '#fff', borderRadius: '16px', padding: '36px',
                        border: `1px solid ${COL.border}`,
                    }}>
                        <h1 style={{ fontWeight: 700, color: '#1a202c', marginBottom: '4px', fontSize: '20px' }}>Iniciar sesion</h1>
                        <p style={{ color: COL.muted, fontSize: '13px', marginBottom: '28px' }}>Ingresa a tu cuenta para continuar tu compra</p>

                        <form onSubmit={handleLogin}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Correo electronico</label>
                                <input type="email" placeholder="tu@email.com"
                                    value={email} onChange={e => setEmail(e.target.value)} autoFocus
                                    style={{
                                        width: '100%', padding: '11px 12px', border: `1.5px solid ${COL.border}`,
                                        borderRadius: '8px', fontSize: '14px', color: '#2d3748', outline: 'none',
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Contrasena</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={verPassword ? 'text' : 'password'} placeholder="••••••••"
                                        value={password} onChange={e => setPassword(e.target.value)}
                                        style={{
                                            width: '100%', padding: '11px 40px 11px 12px', border: `1.5px solid ${COL.border}`,
                                            borderRadius: '8px', fontSize: '14px', color: '#2d3748', outline: 'none',
                                        }}
                                    />
                                    <button type="button" onClick={() => setVerPassword(!verPassword)}
                                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', fontSize: '14px' }}>
                                        <i className={`fas ${verPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                            </div>

                            <button type="submit" disabled={loading}
                                style={{
                                    width: '100%', padding: '13px', background: loading ? '#a0aec0' : COL.primary,
                                    border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, fontSize: '15px',
                                    cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '16px',
                                }}>
                                {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Ingresando...</> : 'Iniciar sesion'}
                            </button>
                        </form>

                        <p style={{ textAlign: 'center', fontSize: '13px', color: COL.muted, margin: 0 }}>
                            ¿No tenes cuenta?{' '}
                            <Link to={`/registro?next=${encodeURIComponent(next)}`} style={{ color: COL.primary, fontWeight: 600, textDecoration: 'none' }}>
                                Registrate
                            </Link>
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}