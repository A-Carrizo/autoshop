import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import HeaderSimple from '../components/layout/HeaderSimple'
import Footer from '../components/layout/Footer'
import { useIdioma } from '../context/IdiomaContext'
import { API } from '../config/api'

const COL = { primary: '#CC0000', muted: '#718096', border: '#e0e0e0' }

export default function Registro() {
    const [nombre, setNombre] = useState('')
    const [email, setEmail] = useState('')
    const [telefono, setTelefono] = useState('')
    const [password, setPassword] = useState('')
    const [confirmarPassword, setConfirmarPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [emailExiste, setEmailExiste] = useState(false)
    const [emailEnviado, setEmailEnviado] = useState(false)
    const [enviandoEmail, setEnviandoEmail] = useState(false)
    const { t } = useIdioma()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const next = searchParams.get('next') || '/'

    const handleRegistro = async (e: React.SyntheticEvent) => {
        e.preventDefault()
        if (!nombre.trim() || !email.trim() || !password.trim()) { toast.error('Completa los campos requeridos'); return }
        if (password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return }
        if (password !== confirmarPassword) { toast.error('Las contraseñas no coinciden'); return }
        setLoading(true)
        try {
            // Primer intento: registro normal
            const res = await fetch(`${API.auth}/registro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nombre.trim(), email: email.trim(), password, telefono: telefono.trim() || null, activarAhora: false })
            })
            const data = await res.json()

            if (!res.ok) {
                // Email ya existe con acceso web
                if (data.mensaje?.includes('Iniciá sesión')) {
                    toast.error(data.mensaje)
                    setTimeout(() => navigate(`/login?next=${encodeURIComponent(next)}`), 1500)
                    return
                }
                toast.error(data.mensaje || 'Error al crear la cuenta')
                return
            }

            // Email existe en ERP sin acceso web — activar directamente con la contraseña ya ingresada
            if (data.activacion) {
                const resActivar = await fetch(`${API.auth}/registro`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre: nombre.trim(), email: email.trim(), password, telefono: telefono.trim() || null, activarAhora: false })
                })
                const dataActivar = await resActivar.json()
                if (!resActivar.ok) {
                    // Si falla la activacion directa, mostrar opciones
                    setEmailExiste(true)
                    return
                }
                localStorage.setItem('tienda_token', dataActivar.token)
                localStorage.setItem('tienda_nombre', dataActivar.nombre)
                localStorage.setItem('tienda_email', dataActivar.email)
                toast.success('¡Cuenta activada correctamente!')
                navigate(next, { replace: true })
                return
            }

            // Registro exitoso normal
            localStorage.setItem('tienda_token', data.token)
            localStorage.setItem('tienda_nombre', data.nombre)
            localStorage.setItem('tienda_email', data.email)
            toast.success('Cuenta creada correctamente')
            navigate(next, { replace: true })
        } catch { toast.error('Error de conexión') }
        finally { setLoading(false) }
    }

    const enviarEmailActivacion = async () => {
        setEnviandoEmail(true)
        try {
            const res = await fetch(`${API.auth}/registro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nombre.trim(), email: email.trim(), password: '', activarAhora: false })
            })
            const data = await res.json()
            if (data.activacion || res.ok) {
                setEmailEnviado(true)
                toast.success('Email enviado — revisá tu bandeja de entrada')
            }
        } catch { toast.error('Error al enviar el email') }
        finally { setEnviandoEmail(false) }
    }

    // Pantalla intermedia si la activacion directa falla
    if (emailExiste) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
                <HeaderSimple />
                <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                    <div style={{ width: '100%', maxWidth: '420px' }}>
                        <div style={{ background: '#fff', borderRadius: '16px', padding: '36px', border: `1px solid ${COL.border}` }}>
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <i className="fas fa-user-check" style={{ color: COL.primary, fontSize: '22px' }}></i>
                                </div>
                                <h1 style={{ fontWeight: 700, color: '#1a202c', fontSize: '18px', marginBottom: '8px' }}>Ya tenés una cuenta</h1>
                                <p style={{ color: COL.muted, fontSize: '13px' }}>
                                    El email <strong>{email}</strong> ya está registrado. Podemos enviarte un link para activar tu cuenta.
                                </p>
                            </div>
                            {emailEnviado ? (
                                <div style={{ background: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '10px', padding: '16px', fontSize: '13px', color: '#2f855a', textAlign: 'center' }}>
                                    <i className="fas fa-check-circle" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}></i>
                                    Email enviado — revisá tu bandeja de entrada
                                </div>
                            ) : (
                                <button onClick={enviarEmailActivacion} disabled={enviandoEmail}
                                    style={{ width: '100%', padding: '13px', background: COL.primary, border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: enviandoEmail ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: '12px' }}>
                                    {enviandoEmail ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Enviando...</> : <><i className="fas fa-envelope" style={{ marginRight: '8px' }}></i>Enviar email de activación</>}
                                </button>
                            )}
                            <div style={{ textAlign: 'center', marginTop: '12px' }}>
                                <button onClick={() => setEmailExiste(false)} style={{ background: 'none', border: 'none', color: COL.muted, fontSize: '12px', cursor: 'pointer' }}>
                                    <i className="fas fa-arrow-left" style={{ marginRight: '4px' }}></i>Volver
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
            <HeaderSimple />
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                <div style={{ width: '100%', maxWidth: '420px' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '36px', border: `1px solid ${COL.border}` }}>
                        <h1 style={{ fontWeight: 700, color: '#1a202c', marginBottom: '4px', fontSize: '20px' }}>{t.crearCuenta}</h1>
                        <p style={{ color: COL.muted, fontSize: '13px', marginBottom: '24px' }}>{t.registratePH}</p>
                        <form onSubmit={handleRegistro}>
                            {[
                                { label: t.nombreCompleto, type: 'text', placeholder: t.tuNombre, value: nombre, set: setNombre },
                                { label: t.correoElectronico, type: 'email', placeholder: t.correoPH, value: email, set: setEmail },
                                { label: t.telefonoOpcional, type: 'tel', placeholder: t.telefonoPH, value: telefono, set: setTelefono },
                                { label: t.contrasena, type: 'password', placeholder: t.minimoCaracteres, value: password, set: setPassword },
                                { label: t.confirmarContrasena, type: 'password', placeholder: t.repetirContrasena, value: confirmarPassword, set: setConfirmarPassword },
                            ].map((f, i) => (
                                <div key={i} style={{ marginBottom: i === 4 ? '20px' : '14px' }}>
                                    <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>{f.label}</label>
                                    <input type={f.type} placeholder={f.placeholder} value={f.value}
                                        onChange={e => f.set(e.target.value)} autoFocus={i === 0}
                                        style={{ width: '100%', padding: '11px 12px', border: `1.5px solid ${COL.border}`, borderRadius: '8px', fontSize: '14px', color: '#2d3748', outline: 'none' }} />
                                </div>
                            ))}
                            <button type="submit" disabled={loading}
                                style={{ width: '100%', padding: '13px', background: loading ? '#a0aec0' : COL.primary, border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '16px', fontFamily: 'inherit' }}>
                                {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>{t.creandoCuenta}</> : t.crearCuenta}
                            </button>
                        </form>
                        <p style={{ textAlign: 'center', fontSize: '13px', color: COL.muted, margin: 0 }}>
                            {t.yaTenesCuenta}{' '}
                            <Link to={`/login?next=${encodeURIComponent(next)}`} style={{ color: COL.primary, fontWeight: 600, textDecoration: 'none' }}>{t.iniciaSesion}</Link>
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}