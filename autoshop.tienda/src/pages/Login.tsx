import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import HeaderSimple from '../components/layout/HeaderSimple'
import Footer from '../components/layout/Footer'
import { useIdioma } from '../context/IdiomaContext'
import { API } from '../config/api'

const COL = { primary: '#CC0000', muted: '#718096', border: '#e0e0e0' }

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [verPassword, setVerPassword] = useState(false)
    const { t } = useIdioma()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const next = searchParams.get('next') || '/'

    const handleLogin = async (e: React.SyntheticEvent) => {
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
            if (!res.ok) { toast.error(data.mensaje || 'Error al iniciar sesión'); return }
            localStorage.setItem('tienda_token', data.token)
            localStorage.setItem('tienda_nombre', data.nombre)
            localStorage.setItem('tienda_email', data.email)
            toast.success('Sesión iniciada')
            navigate(next, { replace: true })
        } catch { toast.error('Error de conexión') }
        finally { setLoading(false) }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--mc-fondo)' }}>
            <HeaderSimple />
            <main className="mc-auth">
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <div className="mc-auth__caja">
                        <h1>{t.iniciarSesion}</h1>
                        <p style={{ color: COL.muted, fontSize: '13px', marginBottom: '28px' }}>{t.ingresaATuCuenta}</p>
                        <form onSubmit={handleLogin}>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="mc-label">{t.correoElectronico}</label>
                                <input type="email" placeholder={t.correoPH}
                                    value={email} onChange={e => setEmail(e.target.value)} autoFocus
                                    className="mc-input" />
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                                <label className="mc-label">{t.contrasena}</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={verPassword ? 'text' : 'password'} placeholder="••••••••"
                                        value={password} onChange={e => setPassword(e.target.value)}
                                        className="mc-input mc-input--con-boton" />
                                    <button type="button" onClick={() => setVerPassword(!verPassword)}
                                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', fontSize: '14px' }}>
                                        <i className={`fas ${verPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                            </div>

                            {/* Link de recuperar contraseña */}
                            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                                <Link to="/recuperar-password" className="mc-link" style={{ fontSize: '12px' }}>
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            <button type="submit" disabled={loading}
                                className="mc-btn mc-btn--primario mc-btn--bloque mc-btn--grande" style={{ marginBottom: '16px' }}>
                                {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>{t.ingresando}</> : t.iniciarSesion}
                            </button>
                        </form>

                        {/* Separador */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ flex: 1, height: '1px', background: COL.border }}></div>
                            <span style={{ fontSize: '12px', color: COL.muted }}>o</span>
                            <div style={{ flex: 1, height: '1px', background: COL.border }}></div>
                        </div>

                        {/* Activar cuenta */}
                        <div style={{ background: '#fff8f0', border: '1px solid #fbd38d', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', fontSize: '13px', color: '#744210' }}>
                            <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
                            ¿Primera vez en la tienda pero ya compraste con nosotros?{' '}
                            <Link to={`/registro?next=${encodeURIComponent(next)}`} className="mc-link">
                                Activá tu cuenta aquí
                            </Link>
                        </div>

                        <p style={{ textAlign: 'center', fontSize: '13px', color: COL.muted, margin: 0 }}>
                            {t.noTenesCuenta}{' '}
                            <Link to={`/registro?next=${encodeURIComponent(next)}`} className="mc-link">{t.registrate}</Link>
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}