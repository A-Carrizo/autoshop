import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API } from '../config/api'
import toast from 'react-hot-toast'

const PRIMARY = '#2c5282'
const ACCENT = '#4299e1'
const BORDER = '#e2e8f0'
const MUTED = '#718096'

export default function CambiarPasswordObligatorio() {
    const [nueva, setNueva] = useState('')
    const [confirmar, setConfirmar] = useState('')
    const [verNueva, setVerNueva] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const token = localStorage.getItem('auth_token') || ''

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (nueva.length < 6) { toast.error('Minimo 6 caracteres'); return }
        if (nueva !== confirmar) { toast.error('Las contrasenas no coinciden'); return }
        setLoading(true)
        try {
            const res = await fetch(`${API.auth}/cambiar-password-obligatorio`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ nuevaPassword: nueva })
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.mensaje || 'Error'); return }
            toast.success('Contrasena actualizada correctamente')
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_nombre')
            localStorage.removeItem('auth_email')
            setTimeout(() => navigate('/login'), 1500)
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

                <div style={{ background: '#ffffff', borderRadius: '16px', padding: '36px', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{
                            width: '52px', height: '52px', borderRadius: '50%',
                            background: '#fff8e1', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto 14px'
                        }}>
                            <i className="fas fa-shield-alt" style={{ color: '#D4A017', fontSize: '20px' }}></i>
                        </div>
                        <h5 style={{ fontWeight: 700, color: '#1a202c', marginBottom: '6px' }}>Cambio de contrasena requerido</h5>
                        <p style={{ color: MUTED, fontSize: '13px', lineHeight: 1.5 }}>
                            Por seguridad, debes establecer una nueva contrasena antes de continuar
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Nueva contrasena</label>
                            <div style={{ position: 'relative' }}>
                                <i className="fas fa-lock" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', fontSize: '14px' }}></i>
                                <input type={verNueva ? 'text' : 'password'} placeholder="Minimo 6 caracteres"
                                    value={nueva} onChange={e => setNueva(e.target.value)} autoFocus
                                    style={{
                                        width: '100%', padding: '11px 40px 11px 38px',
                                        border: `1.5px solid ${BORDER}`, borderRadius: '8px',
                                        fontSize: '14px', color: '#2d3748', outline: 'none',
                                    }}
                                    onFocus={e => e.target.style.borderColor = ACCENT}
                                    onBlur={e => e.target.style.borderColor = BORDER}
                                />
                                <button type="button" onClick={() => setVerNueva(!verNueva)}
                                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}>
                                    <i className={`fas ${verNueva ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Confirmar contrasena</label>
                            <div style={{ position: 'relative' }}>
                                <i className="fas fa-lock" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', fontSize: '14px' }}></i>
                                <input type={verNueva ? 'text' : 'password'} placeholder="Repite la contrasena"
                                    value={confirmar} onChange={e => setConfirmar(e.target.value)}
                                    style={{
                                        width: '100%', padding: '11px 12px 11px 38px',
                                        border: `1.5px solid ${confirmar && nueva !== confirmar ? '#FC8181' : BORDER}`,
                                        borderRadius: '8px', fontSize: '14px', color: '#2d3748', outline: 'none',
                                    }}
                                    onFocus={e => e.target.style.borderColor = ACCENT}
                                    onBlur={e => e.target.style.borderColor = confirmar && nueva !== confirmar ? '#FC8181' : BORDER}
                                />
                            </div>
                            {confirmar && nueva !== confirmar && (
                                <small style={{ color: '#e53e3e', fontSize: '12px' }}>Las contrasenas no coinciden</small>
                            )}
                        </div>

                        <button type="submit" disabled={loading || nueva !== confirmar}
                            style={{
                                width: '100%', padding: '13px',
                                background: loading || nueva !== confirmar ? '#a0aec0' : PRIMARY,
                                border: 'none', borderRadius: '8px',
                                color: '#ffffff', fontWeight: 700, fontSize: '14px',
                                cursor: loading || nueva !== confirmar ? 'not-allowed' : 'pointer',
                            }}>
                            {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Guardando...</> : 'Establecer nueva contrasena'}
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginTop: '24px' }}>
                    © 2026 MagCar Auto Shop
                </p>
            </div>
        </div>
    )
}