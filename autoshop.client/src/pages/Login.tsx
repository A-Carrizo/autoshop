import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API } from '../config/api'
import toast from 'react-hot-toast'

const BG = '#1a365d'
const CARD = '#ffffff'
const PRIMARY = '#2c5282'
const ACCENT = '#4299e1'
const MUTED = '#718096'
const BORDER = '#e2e8f0'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [verPassword, setVerPassword] = useState(false)
    const navigate = useNavigate()

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
            localStorage.setItem('auth_token', data.token)
            localStorage.setItem('auth_nombre', data.nombre)
            localStorage.setItem('auth_email', data.email)
            if (data.primerLogin) {
                window.location.href = '/cambiar-contrasena-obligatorio'
            } else {
                window.location.href = '/'
            }
        } catch { toast.error('Error de conexion') }
        finally { setLoading(false) }
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: `linear-gradient(135deg, #1a365d 0%, #2c5282 50%, #2b6cb0 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', fontFamily: "'Segoe UI', sans-serif"
        }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '14px',
                        background: '#D4A017', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 16px',
                        boxShadow: '0 8px 24px rgba(212,160,23,0.4)'
                    }}>
                        <i className="fas fa-car" style={{ color: '#1a365d', fontSize: '24px' }}></i>
                    </div>
                    <h2 style={{ color: '#ffffff', fontWeight: 800, fontSize: '24px', marginBottom: '4px' }}>MagCar</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>Auto Shop · Sistema de Gestion</p>
                </div>

                {/* Card */}
                <div style={{
                    background: CARD, borderRadius: '16px', padding: '36px',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.25)'
                }}>
                    <h5 style={{ fontWeight: 700, color: '#1a202c', marginBottom: '4px', fontSize: '18px' }}>Bienvenido</h5>
                    <p style={{ color: MUTED, fontSize: '13px', marginBottom: '28px' }}>Ingresa tus credenciales para acceder al sistema</p>

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Correo electronico</label>
                            <div style={{ position: 'relative' }}>
                                <i className="fas fa-envelope" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', fontSize: '14px' }}></i>
                                <input type="email" placeholder="usuario@magcar.com"
                                    value={email} onChange={e => setEmail(e.target.value)} autoFocus
                                    style={{
                                        width: '100%', padding: '11px 12px 11px 38px',
                                        border: `1.5px solid ${BORDER}`, borderRadius: '8px',
                                        fontSize: '14px', color: '#2d3748', outline: 'none',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={e => e.target.style.borderColor = ACCENT}
                                    onBlur={e => e.target.style.borderColor = BORDER}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Contrasena</label>
                            <div style={{ position: 'relative' }}>
                                <i className="fas fa-lock" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', fontSize: '14px' }}></i>
                                <input type={verPassword ? 'text' : 'password'} placeholder="••••••••"
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    style={{
                                        width: '100%', padding: '11px 40px 11px 38px',
                                        border: `1.5px solid ${BORDER}`, borderRadius: '8px',
                                        fontSize: '14px', color: '#2d3748', outline: 'none',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={e => e.target.style.borderColor = ACCENT}
                                    onBlur={e => e.target.style.borderColor = BORDER}
                                />
                                <button type="button" onClick={() => setVerPassword(!verPassword)}
                                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', fontSize: '14px' }}>
                                    <i className={`fas ${verPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            style={{
                                width: '100%', padding: '13px',
                                background: loading ? '#a0aec0' : PRIMARY,
                                border: 'none', borderRadius: '8px',
                                color: '#ffffff', fontWeight: 700, fontSize: '15px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                marginBottom: '20px', transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#1a365d' }}
                            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = PRIMARY }}>
                            {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Iniciando sesion...</> : 'Iniciar sesion'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center' }}>
                        <a href="/recuperar-password" style={{ color: PRIMARY, fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
                            <i className="fas fa-key" style={{ marginRight: '5px' }}></i>Olvide mi contrasena
                        </a>
                    </div>
                </div>

                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginTop: '24px' }}>
                    © 2026 MagCar Auto Shop
                </p>
            </div>
        </div>
    )
}