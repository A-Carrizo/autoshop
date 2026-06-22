import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { API } from '../config/api'

const BG = '#1a365d'
const CARD = '#ffffff'
const PRIMARY = '#2c5282'
const ACCENT = '#4299e1'
const MUTED = '#718096'
const BORDER = '#e2e8f0'

export default function CambiarContrasena() {
    const navigate = useNavigate()
    const [passwordActual, setPasswordActual] = useState('')
    const [nuevaPassword, setNuevaPassword] = useState('')
    const [confirmarPassword, setConfirmarPassword] = useState('')
    const [verActual, setVerActual] = useState(false)
    const [verNueva, setVerNueva] = useState(false)
    const [guardando, setGuardando] = useState(false)

    const handleGuardar = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!passwordActual.trim() || !nuevaPassword.trim()) {
            toast.error('Completa todos los campos')
            return
        }
        if (nuevaPassword.length < 6) {
            toast.error('La nueva contraseña debe tener al menos 6 caracteres')
            return
        }
        if (nuevaPassword !== confirmarPassword) {
            toast.error('Las contraseñas no coinciden')
            return
        }

        setGuardando(true)
        try {
            const token = localStorage.getItem('auth_token')
            const res = await fetch(`${API.auth}/cambiar-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ passwordActual, nuevaPassword })
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.mensaje || 'No se pudo cambiar la contraseña')
                return
            }

            toast.success('Contraseña actualizada. Inicia sesión nuevamente.')
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_nombre')
            localStorage.removeItem('auth_email')
            navigate('/login', { replace: true })
        } catch {
            toast.error('Error de conexión')
        } finally {
            setGuardando(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: `linear-gradient(135deg, #1a365d 0%, #2c5282 50%, #2b6cb0 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', fontFamily: "'Segoe UI', sans-serif"
        }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '14px',
                        background: '#D4A017', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 16px',
                        boxShadow: '0 8px 24px rgba(212,160,23,0.4)'
                    }}>
                        <i className="fas fa-key" style={{ color: '#1a365d', fontSize: '22px' }}></i>
                    </div>
                    <h2 style={{ color: '#ffffff', fontWeight: 800, fontSize: '22px', marginBottom: '4px' }}>Cambiar contraseña</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Actualiza tus credenciales de acceso</p>
                </div>

                {/* Card */}
                <div style={{
                    background: CARD, borderRadius: '16px', padding: '36px',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.25)'
                }}>
                    <form onSubmit={handleGuardar}>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Contraseña actual</label>
                            <div style={{ position: 'relative' }}>
                                <i className="fas fa-lock" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', fontSize: '14px' }}></i>
                                <input type={verActual ? 'text' : 'password'} placeholder="••••••••"
                                    value={passwordActual} onChange={e => setPasswordActual(e.target.value)} autoFocus
                                    style={{
                                        width: '100%', padding: '11px 40px 11px 38px',
                                        border: `1.5px solid ${BORDER}`, borderRadius: '8px',
                                        fontSize: '14px', color: '#2d3748', outline: 'none',
                                    }}
                                    onFocus={e => e.target.style.borderColor = ACCENT}
                                    onBlur={e => e.target.style.borderColor = BORDER}
                                />
                                <button type="button" onClick={() => setVerActual(!verActual)}
                                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', fontSize: '14px' }}>
                                    <i className={`fas ${verActual ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Nueva contraseña</label>
                            <div style={{ position: 'relative' }}>
                                <i className="fas fa-lock" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', fontSize: '14px' }}></i>
                                <input type={verNueva ? 'text' : 'password'} placeholder="Mínimo 6 caracteres"
                                    value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)}
                                    style={{
                                        width: '100%', padding: '11px 40px 11px 38px',
                                        border: `1.5px solid ${BORDER}`, borderRadius: '8px',
                                        fontSize: '14px', color: '#2d3748', outline: 'none',
                                    }}
                                    onFocus={e => e.target.style.borderColor = ACCENT}
                                    onBlur={e => e.target.style.borderColor = BORDER}
                                />
                                <button type="button" onClick={() => setVerNueva(!verNueva)}
                                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', fontSize: '14px' }}>
                                    <i className={`fas ${verNueva ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Confirmar nueva contraseña</label>
                            <div style={{ position: 'relative' }}>
                                <i className="fas fa-lock" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', fontSize: '14px' }}></i>
                                <input type={verNueva ? 'text' : 'password'} placeholder="Repetí la nueva contraseña"
                                    value={confirmarPassword} onChange={e => setConfirmarPassword(e.target.value)}
                                    style={{
                                        width: '100%', padding: '11px 12px 11px 38px',
                                        border: `1.5px solid ${BORDER}`, borderRadius: '8px',
                                        fontSize: '14px', color: '#2d3748', outline: 'none',
                                    }}
                                    onFocus={e => e.target.style.borderColor = ACCENT}
                                    onBlur={e => e.target.style.borderColor = BORDER}
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={guardando}
                            style={{
                                width: '100%', padding: '13px',
                                background: guardando ? '#a0aec0' : PRIMARY,
                                border: 'none', borderRadius: '8px',
                                color: '#ffffff', fontWeight: 700, fontSize: '15px',
                                cursor: guardando ? 'not-allowed' : 'pointer',
                                marginBottom: '16px',
                            }}>
                            {guardando ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Guardando...</> : 'Guardar nueva contraseña'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center' }}>
                        <button onClick={() => navigate(-1)} style={{
                            background: 'none', border: 'none', color: PRIMARY,
                            fontSize: '13px', textDecoration: 'none', fontWeight: 600, cursor: 'pointer',
                        }}>
                            <i className="fas fa-arrow-left" style={{ marginRight: '5px' }}></i>Volver
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}