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
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--mc-fondo)' }}>
            <HeaderSimple />
            <main className="mc-auth">
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <div className="mc-auth__caja">
                        {enviado ? (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f0fff4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <i className="fas fa-envelope-open-text" style={{ color: '#38a169', fontSize: '22px' }}></i>
                                </div>
                                <h2 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Revisá tu email</h2>
                                <p style={{ color: COL.muted, fontSize: '13px', marginBottom: '24px' }}>
                                    Si <strong>{email}</strong> está registrado, vas a recibir un link para restablecer tu contraseña en los próximos minutos.
                                </p>
                                <Link to="/login" className="mc-link" style={{ fontSize: '13px' }}>
                                    <i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i>Volver al login
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div style={{ marginBottom: '24px' }}>
                                    <h1>¿Olvidaste tu contraseña?</h1>
                                    <p style={{ color: COL.muted, fontSize: '13px' }}>Ingresá tu email y te enviamos un link para restablecerla.</p>
                                </div>
                                <form onSubmit={handleEnviar}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label className="mc-label">Email</label>
                                        <input type="email" placeholder="tu@email.com" value={email}
                                            onChange={e => setEmail(e.target.value)} autoFocus
                                            className="mc-input" />
                                    </div>
                                    <button type="submit" disabled={loading}
                                        className="mc-btn mc-btn--primario mc-btn--bloque mc-btn--grande" style={{ marginBottom: '16px' }}>
                                        {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Enviando...</> : 'Enviar link de recuperación'}
                                    </button>
                                </form>
                                <p style={{ textAlign: 'center', fontSize: '13px', color: COL.muted, margin: 0 }}>
                                    <Link to="/login" className="mc-link">
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