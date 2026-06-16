import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo_autoshop.jpeg'
import { API } from '../config/api'
import toast from 'react-hot-toast'

export default function ResetPassword() {
    const [token, setToken] = useState('')
    const [nueva, setNueva] = useState('')
    const [confirmar, setConfirmar] = useState('')
    const [loading, setLoading] = useState(false)
    const [verNueva, setVerNueva] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const t = params.get('token')
        if (!t) { toast.error('Enlace invalido'); navigate('/login') }
        else setToken(t)
    }, [navigate])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (nueva.length < 6) { toast.error('La contrasena debe tener al menos 6 caracteres'); return }
        if (nueva !== confirmar) { toast.error('Las contrasenas no coinciden'); return }
        setLoading(true)
        try {
            const res = await fetch(`${API.auth}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, nuevaPassword: nueva })
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.mensaje || 'Error'); return }
            toast.success(data.mensaje)
            setTimeout(() => navigate('/login'), 2000)
        } catch { toast.error('Error de conexion') }
        finally { setLoading(false) }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <img src={logo} alt="MagCar" style={{ width: '160px', objectFit: 'contain' }} />
                </div>
                <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                            <i className="fas fa-lock-open fa-lg" style={{ color: 'var(--primary-dark)' }}></i>
                        </div>
                        <h5 style={{ fontWeight: 700, marginBottom: '4px' }}>Nueva contrasena</h5>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Ingresa tu nueva contrasena</p>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block' }}>Nueva contrasena</label>
                            <div style={{ position: 'relative' }}>
                                <i className="fas fa-lock" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px' }}></i>
                                <input type={verNueva ? 'text' : 'password'} className="form-control"
                                    placeholder="Minimo 6 caracteres" value={nueva} onChange={e => setNueva(e.target.value)}
                                    style={{ paddingLeft: '36px', paddingRight: '40px' }} autoFocus />
                                <button type="button" onClick={() => setVerNueva(!verNueva)}
                                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    <i className={`fas ${verNueva ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block' }}>Confirmar contrasena</label>
                            <div style={{ position: 'relative' }}>
                                <i className="fas fa-lock" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px' }}></i>
                                <input type={verNueva ? 'text' : 'password'} className="form-control"
                                    placeholder="Repite la contrasena" value={confirmar} onChange={e => setConfirmar(e.target.value)}
                                    style={{ paddingLeft: '36px' }} />
                            </div>
                            {confirmar && nueva !== confirmar && (
                                <small style={{ color: 'var(--secondary)' }}>Las contrasenas no coinciden</small>
                            )}
                        </div>
                        <button type="submit" disabled={loading || nueva !== confirmar} className="btn btn-primary w-100"
                            style={{ fontWeight: 700, padding: '12px', marginBottom: '16px' }}>
                            {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Guardando...</> : 'Guardar nueva contrasena'}
                        </button>
                    </form>
                    <div style={{ textAlign: 'center' }}>
                        <a href="/login" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none' }}>
                            <i className="fas fa-arrow-left mr-1"></i>Volver al login
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}