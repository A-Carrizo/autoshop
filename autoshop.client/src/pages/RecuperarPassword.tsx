import { useState } from 'react'
import { API } from '../config/api'
import toast from 'react-hot-toast'

const PRIMARY = '#2c5282'
const ACCENT = '#4299e1'
const BORDER = '#e2e8f0'
const MUTED = '#718096'

export default function RecuperarPassword() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [enviado, setEnviado] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) { toast.error('Ingresa tu email'); return }
        setLoading(true)
        try {
            const res = await fetch(`${API.auth}/recuperar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() })
            })
            if (res.ok) setEnviado(true)
            else toast.error('Error al procesar la solicitud')
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

                <div style={{ background: '#ffffff', borderRadius: '16px', padding: '36px', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
                    {!enviado ? (
                        <>
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <div style={{
                                    width: '52px', height: '52px', borderRadius: '50%',
                                    background: '#ebf4ff', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', margin: '0 auto 14px'
                                }}>
                                    <i className="fas fa-lock" style={{ color: PRIMARY, fontSize: '20px' }}></i>
                                </div>
                                <h5 style={{ fontWeight: 700, color: '#1a202c', marginBottom: '6px' }}>Recuperar contrasena</h5>
                                <p style={{ color: MUTED, fontSize: '13px', lineHeight: 1.5 }}>
                                    Ingresa tu email registrado y te enviaremos un enlace para restablecer tu contrasena
                                </p>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Correo electronico</label>
                                    <div style={{ position: 'relative' }}>
                                        <i className="fas fa-envelope" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', fontSize: '14px' }}></i>
                                        <input type="email" placeholder="tu@email.com"
                                            value={email} onChange={e => setEmail(e.target.value)} autoFocus
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
                                <button type="submit" disabled={loading}
                                    style={{
                                        width: '100%', padding: '13px',
                                        background: loading ? '#a0aec0' : PRIMARY,
                                        border: 'none', borderRadius: '8px',
                                        color: '#ffffff', fontWeight: 700, fontSize: '14px',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        marginBottom: '16px',
                                    }}>
                                    {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Enviando...</> : 'Enviar enlace de recuperacion'}
                                </button>
                            </form>

                            <div style={{ textAlign: 'center' }}>
                                <a href="/login" style={{ color: MUTED, fontSize: '13px', textDecoration: 'none' }}>
                                    <i className="fas fa-arrow-left" style={{ marginRight: '5px' }}></i>Volver al login
                                </a>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: '#f0fff4', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', margin: '0 auto 20px'
                            }}>
                                <i className="fas fa-paper-plane" style={{ color: '#38a169', fontSize: '26px' }}></i>
                            </div>
                            <h5 style={{ fontWeight: 700, color: '#1a202c', marginBottom: '10px' }}>Correo enviado</h5>
                            <p style={{ color: MUTED, fontSize: '13px', marginBottom: '8px', lineHeight: 1.6 }}>
                                Si el email <strong style={{ color: '#2d3748' }}>{email}</strong> existe en el sistema, recibiras un enlace para restablecer tu contrasena.
                            </p>
                            <p style={{ color: '#a0aec0', fontSize: '12px', marginBottom: '24px' }}>Revisa tu bandeja de entrada y carpeta de spam.</p>
                            <a href="/login"
                                style={{
                                    display: 'block', width: '100%', padding: '12px',
                                    background: PRIMARY, borderRadius: '8px',
                                    color: '#ffffff', fontWeight: 700, fontSize: '14px',
                                    textDecoration: 'none', textAlign: 'center'
                                }}>
                                Volver al login
                            </a>
                        </div>
                    )}
                </div>

                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginTop: '24px' }}>
                    © 2026 MagCar Auto Shop
                </p>
            </div>
        </div>
    )
}