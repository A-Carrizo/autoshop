import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import HeaderSimple from '../components/layout/HeaderSimple'
import Footer from '../components/layout/Footer'
import { API } from '../config/api'

const COL = { primary: '#CC0000', muted: '#718096', border: '#e0e0e0' }

export default function RecuperarPassword() {
    const [email, setEmail] = useState('')
    const [enviado, setEnviado] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleEnviar = async (e: React.SyntheticEvent) => {
        e.preventDefault()
        if (!email.trim()) { toast.error('Ingresá tu email'); return }
        setLoading(true)
        try {
            await fetch(`${API.auth}/recuperar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() })
            })
            // Siempre mostramos exito para no revelar si el email existe
            setEnviado(true)
        } catch { toast.error('Error de conexión') }
        finally { setLoading(false) }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
            <HeaderSimple />
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                <div style={{ width: '100%', maxWidth: '400px' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '36px', border: `1px solid ${COL.border}` }}>
                        {enviado ? (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f0fff4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <i className="fas fa-envelope-open-text" style={{ color: '#38a169', fontSize: '22px' }}></i>
                                </div>
                                <h2 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Revisá tu email</h2>
                                <p style={{ color: COL.muted, fontSize: '13px', marginBottom: '24px' }}>
                                    Si <strong>{email}</strong> está registrado, vas a recibir un link para restablecer tu contraseña en los próximos minutos.
                                </p>
                                <Link to="/login" style={{ color: COL.primary, fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
                                    <i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i>Volver al login
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div style={{ marginBottom: '24px' }}>
                                    <h1 style={{ fontWeight: 700, color: '#1a202c', fontSize: '20px', marginBottom: '4px' }}>¿Olvidaste tu contraseña?</h1>
                                    <p style={{ color: COL.muted, fontSize: '13px' }}>Ingresá tu email y te enviamos un link para restablecerla.</p>
                                </div>
                                <form onSubmit={handleEnviar}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px', display: 'block' }}>Email</label>
                                        <input type="email" placeholder="tu@email.com" value={email}
                                            onChange={e => setEmail(e.target.value)} autoFocus
                                            style={{ width: '100%', padding: '11px 12px', border: `1.5px solid ${COL.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
                                    </div>
                                    <button type="submit" disabled={loading}
                                        style={{ width: '100%', padding: '13px', background: loading ? '#a0aec0' : COL.primary, border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '16px', fontFamily: 'inherit' }}>
                                        {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Enviando...</> : 'Enviar link de recuperación'}
                                    </button>
                                </form>
                                <p style={{ textAlign: 'center', fontSize: '13px', color: COL.muted, margin: 0 }}>
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