import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import HeaderSimple from '../components/layout/HeaderSimple'
import Footer from '../components/layout/Footer'
import { API } from '../config/api'

const COL = { primary: '#CC0000', muted: '#718096', border: '#e0e0e0' }

export default function ResetPassword() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const token = searchParams.get('token') || ''

    const [password, setPassword] = useState('')
    const [confirmar, setConfirmar] = useState('')
    const [errPass, setErrPass] = useState<string | null>(null)
    const [errConfirm, setErrConfirm] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [exito, setExito] = useState(false)

    useEffect(() => {
        if (!token) navigate('/login', { replace: true })
    }, [token, navigate])

    const handlePassword = (val: string) => {
        setPassword(val)
        setErrPass(val.length > 0 && val.length < 6 ? 'Mínimo 6 caracteres' : null)
        if (confirmar) setErrConfirm(val !== confirmar ? 'Las contraseñas no coinciden' : null)
    }

    const handleConfirmar = (val: string) => {
        setConfirmar(val)
        setErrConfirm(val !== password ? 'Las contraseñas no coinciden' : null)
    }

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault()
        if (!password || password.length < 6) { toast.error('Mínimo 6 caracteres'); return }
        if (password !== confirmar) { toast.error('Las contraseñas no coinciden'); return }

        setLoading(true)
        try {
            const res = await fetch(`${API.auth}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, nuevaPassword: password })
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.mensaje || 'Link inválido o expirado'); return }
            setExito(true)
        } catch { toast.error('Error de conexión') }
        finally { setLoading(false) }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
            <HeaderSimple />
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                <div style={{ width: '100%', maxWidth: '400px' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '36px', border: `1px solid ${COL.border}` }}>
                        {exito ? (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f0fff4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <i className="fas fa-check-circle" style={{ color: '#38a169', fontSize: '22px' }}></i>
                                </div>
                                <h2 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>¡Contraseña restablecida!</h2>
                                <p style={{ color: COL.muted, fontSize: '13px', marginBottom: '24px' }}>
                                    Ya podés iniciar sesión con tu nueva contraseña.
                                </p>
                                <button onClick={() => navigate('/login', { replace: true })}
                                    style={{ width: '100%', padding: '13px', background: COL.primary, border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                    Ir al login
                                </button>
                            </div>
                        ) : (
                            <>
                                <div style={{ marginBottom: '24px' }}>
                                    <h1 style={{ fontWeight: 700, color: '#1a202c', fontSize: '20px', marginBottom: '4px' }}>Nueva contraseña</h1>
                                    <p style={{ color: COL.muted, fontSize: '13px' }}>Elegí una contraseña segura para tu cuenta.</p>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div style={{ marginBottom: '14px' }}>
                                        <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Nueva contraseña</label>
                                        <input type="password" placeholder="Mínimo 6 caracteres" value={password}
                                            onChange={e => handlePassword(e.target.value)} autoFocus
                                            style={{ width: '100%', padding: '11px 12px', border: `1.5px solid ${errPass ? '#c53030' : COL.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
                                        {errPass && <div style={{ fontSize: '11px', color: '#c53030', marginTop: '3px' }}>
                                            <i className="fas fa-exclamation-circle" style={{ marginRight: '4px' }}></i>{errPass}
                                        </div>}
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Confirmar contraseña</label>
                                        <input type="password" placeholder="Repetí la contraseña" value={confirmar}
                                            onChange={e => handleConfirmar(e.target.value)}
                                            style={{ width: '100%', padding: '11px 12px', border: `1.5px solid ${errConfirm ? '#c53030' : COL.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
                                        {errConfirm && <div style={{ fontSize: '11px', color: '#c53030', marginTop: '3px' }}>
                                            <i className="fas fa-exclamation-circle" style={{ marginRight: '4px' }}></i>{errConfirm}
                                        </div>}
                                    </div>
                                    <button type="submit" disabled={loading || !!errPass || !!errConfirm}
                                        style={{ width: '100%', padding: '13px', background: loading ? '#a0aec0' : COL.primary, border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                                        {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Guardando...</> : 'Guardar nueva contraseña'}
                                    </button>
                                </form>
                                <p style={{ textAlign: 'center', fontSize: '13px', color: COL.muted, margin: '16px 0 0' }}>
                                    <Link to="/login" style={{ color: COL.primary, fontWeight: 600, textDecoration: 'none' }}>
                                        <i className="fas fa-arrow-left" style={{ marginRight: '4px' }}></i>Volver al login
                                    </Link>
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}