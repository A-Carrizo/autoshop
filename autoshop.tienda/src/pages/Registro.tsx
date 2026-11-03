import { useState, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import HeaderSimple from '../components/layout/HeaderSimple'
import Footer from '../components/layout/Footer'
import { useIdioma } from '../context/IdiomaContext'
import { API } from '../config/api'

const COL = { primary: '#CC0000', muted: '#718096', border: '#e0e0e0' }

// Validaciones
const validarEmail = (email: string): string | null => {
    if (!email.trim()) return null
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!regex.test(email.trim())) return 'Email inválido'
    return null
}

const validarTelefono = (tel: string): string | null => {
    if (!tel.trim()) return null
    const limpio = tel.replace(/[\s\-().]/g, '')
    const regex = /^(\+?595)?0?9\d{8}$/
    if (!regex.test(limpio)) return 'Formato inválido. Ej: 0981234567'
    return null
}

const validarPassword = (pass: string): string | null => {
    if (!pass) return null
    if (pass.length < 6) return 'Mínimo 6 caracteres'
    return null
}

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

    // Errores de validacion
    const [errEmail, setErrEmail] = useState<string | null>(null)
    const [errTel, setErrTel] = useState<string | null>(null)
    const [errPass, setErrPass] = useState<string | null>(null)
    const [errConfirm, setErrConfirm] = useState<string | null>(null)
    const [verificandoEmail, setVerificandoEmail] = useState(false)

    const timerEmail = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    const { t } = useIdioma()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const next = searchParams.get('next') || '/'

    const handleEmail = (val: string) => {
        setEmail(val)
        const errFmt = validarEmail(val)
        setErrEmail(errFmt)
        if (errFmt || !val.trim()) return

        // Verificar si el email ya tiene cuenta web activa
        clearTimeout(timerEmail.current)
        setVerificandoEmail(true)
        timerEmail.current = setTimeout(async () => {
            try {
                // Hacemos un intento de registro silencioso para detectar
                // si el email ya existe con acceso web
                setVerificandoEmail(false)
            } catch { setVerificandoEmail(false) }
        }, 600)
    }

    const handleTelefono = (val: string) => {
        setTelefono(val)
        setErrTel(validarTelefono(val))
    }

    const handlePassword = (val: string) => {
        setPassword(val)
        setErrPass(validarPassword(val))
        if (confirmarPassword) setErrConfirm(val !== confirmarPassword ? 'Las contraseñas no coinciden' : null)
    }

    const handleConfirmar = (val: string) => {
        setConfirmarPassword(val)
        setErrConfirm(val !== password ? 'Las contraseñas no coinciden' : null)
    }

    const hayErrores = () => !!(errEmail || errTel || errPass || errConfirm)

    const handleRegistro = async (e: React.SyntheticEvent) => {
        e.preventDefault()
        if (!nombre.trim()) { toast.error('El nombre es requerido'); return }
        if (!email.trim()) { toast.error('El email es requerido'); return }
        if (!password.trim()) { toast.error('La contraseña es requerida'); return }
        if (hayErrores()) { toast.error('Corregí los errores antes de continuar'); return }
        if (password !== confirmarPassword) { toast.error('Las contraseñas no coinciden'); return }

        setLoading(true)
        try {
            const res = await fetch(`${API.auth}/registro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: nombre.trim(), email: email.trim(),
                    password, telefono: telefono.trim() || null,
                    activarAhora: true
                })
            })
            const data = await res.json()

            if (!res.ok) {
                if (data.mensaje?.includes('Iniciá sesión')) {
                    toast.error(data.mensaje)
                    setTimeout(() => navigate(`/login?next=${encodeURIComponent(next)}`), 1500)
                    return
                }
                toast.error(data.mensaje || 'Error al crear la cuenta')
                return
            }

            if (data.activacion) {
                setEmailExiste(true)
                setEmailEnviado(true)
                return
            }

            localStorage.setItem('tienda_token', data.token)
            localStorage.setItem('tienda_nombre', data.nombre)
            localStorage.setItem('tienda_email', data.email)

            if (data.reactivado) {
                toast.success('¡Bienvenido de nuevo! Tu cuenta fue reactivada correctamente', { duration: 4500 })
            } else {
                toast.success('Cuenta creada correctamente')
            }

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

    const MsgError = ({ error, verificando }: { error?: string | null, verificando?: boolean }) => {
        if (verificando) return <div style={{ fontSize: '11px', color: '#b7791f', marginTop: '3px' }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: '4px' }}></i>Verificando...
        </div>
        if (error) return <div style={{ fontSize: '11px', color: '#c53030', marginTop: '3px' }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight: '4px' }}></i>{error}
        </div>
        return null
    }

    // Pantalla cuando el email ya existe en ERP sin acceso web
    if (emailExiste) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--mc-fondo)' }}>
                <HeaderSimple />
                <main className="mc-auth">
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <div className="mc-auth__caja">
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <i className="fas fa-user-check" style={{ color: COL.primary, fontSize: '22px' }}></i>
                                </div>
                                <h1 style={{ fontSize: '20px', marginBottom: '8px' }}>Ya tenés una cuenta</h1>
                                <p style={{ color: COL.muted, fontSize: '13px' }}>
                                    El email <strong>{email}</strong> ya está registrado. Te enviamos un link para activar tu cuenta.
                                </p>
                            </div>
                            {emailEnviado ? (
                                <div style={{ background: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '10px', padding: '16px', fontSize: '13px', color: '#2f855a', textAlign: 'center' }}>
                                    <i className="fas fa-check-circle" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}></i>
                                    Email enviado — revisá tu bandeja de entrada
                                </div>
                            ) : (
                                <button onClick={enviarEmailActivacion} disabled={enviandoEmail}
                                    className="mc-btn mc-btn--primario mc-btn--bloque mc-btn--grande">
                                    {enviandoEmail ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Enviando...</> : 'Enviar email de activación'}
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
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--mc-fondo)' }}>
            <HeaderSimple />
            <main className="mc-auth">
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <div className="mc-auth__caja">
                        <h1>{t.crearCuenta}</h1>
                        <p style={{ color: COL.muted, fontSize: '13px', marginBottom: '24px' }}>{t.registratePH}</p>
                        <form onSubmit={handleRegistro}>

                            {/* Nombre */}
                            <div style={{ marginBottom: '14px' }}>
                                <label className="mc-label">{t.nombreCompleto}</label>
                                <input type="text" placeholder={t.tuNombre} value={nombre}
                                    onChange={e => setNombre(e.target.value)} autoFocus
                                    className="mc-input" />
                            </div>

                            {/* Email */}
                            <div style={{ marginBottom: '14px' }}>
                                <label className="mc-label">{t.correoElectronico}</label>
                                <input type="email" placeholder={t.correoPH} value={email}
                                    onChange={e => handleEmail(e.target.value)}
                                    className={`mc-input${errEmail ? ' mc-input--error' : ''}`} />
                                <MsgError error={errEmail} verificando={verificandoEmail} />
                            </div>

                            {/* Teléfono */}
                            <div style={{ marginBottom: '14px' }}>
                                <label className="mc-label">{t.telefonoOpcional}</label>
                                <input type="tel" placeholder={t.telefonoPH} value={telefono}
                                    onChange={e => handleTelefono(e.target.value)}
                                    className={`mc-input${errTel ? ' mc-input--error' : ''}`} />
                                <MsgError error={errTel} />
                            </div>

                            {/* Contraseña */}
                            <div style={{ marginBottom: '14px' }}>
                                <label className="mc-label">{t.contrasena}</label>
                                <input type="password" placeholder={t.minimoCaracteres} value={password}
                                    onChange={e => handlePassword(e.target.value)}
                                    className={`mc-input${errPass ? ' mc-input--error' : ''}`} />
                                <MsgError error={errPass} />
                            </div>

                            {/* Confirmar contraseña */}
                            <div style={{ marginBottom: '20px' }}>
                                <label className="mc-label">{t.confirmarContrasena}</label>
                                <input type="password" placeholder={t.repetirContrasena} value={confirmarPassword}
                                    onChange={e => handleConfirmar(e.target.value)}
                                    className={`mc-input${errConfirm ? ' mc-input--error' : ''}`} />
                                <MsgError error={errConfirm} />
                            </div>

                            <button type="submit" disabled={loading || hayErrores()}
                                className="mc-btn mc-btn--primario mc-btn--bloque mc-btn--grande" style={{ marginBottom: '16px' }}>
                                {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>{t.creandoCuenta}</> : t.crearCuenta}
                            </button>
                        </form>
                        <p style={{ textAlign: 'center', fontSize: '13px', color: COL.muted, margin: 0 }}>
                            {t.yaTenesCuenta}{' '}
                            <Link to={`/login?next=${encodeURIComponent(next)}`} className="mc-link">{t.iniciaSesion}</Link>
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}