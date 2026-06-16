import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSidebar } from '../../context/SidebarContext'
import { API } from '../../config/api'

interface NavbarProps { titulo: string }
interface TipoCambio { simbolo: string, valor: number, bandera: string }

const NAV = {
    bg: '#1e3a5f',
    border: '#D4A017',
    text: '#ffffff',
    textMuted: 'rgba(255,255,255,0.5)',
    icon: 'rgba(255,255,255,0.8)',
    accent: '#D4A017',
    tcBg: 'rgba(255,255,255,0.08)',
    tcBorder: 'rgba(255,255,255,0.12)',
    divider: 'rgba(255,255,255,0.15)',
    hoverBg: 'rgba(255,255,255,0.08)',
}

export default function Navbar({ titulo }: NavbarProps) {
    const { collapsed, toggle } = useSidebar()
    const [tipos, setTipos] = useState<TipoCambio[]>([])
    const navigate = useNavigate()
    const nombre = localStorage.getItem('auth_nombre') || 'Administrador'

    useEffect(() => {
        const cargar = async () => {
            try {
                const res = await fetch('https://api.exchangerate-api.com/v4/latest/PYG')
                if (!res.ok) throw new Error()
                const data = await res.json()
                const r = data.rates
                setTipos([
                    { simbolo: 'USD', valor: Math.round(1 / r.USD), bandera: 'us' },
                    { simbolo: 'BRL', valor: Math.round(1 / r.BRL), bandera: 'br' },
                    { simbolo: 'EUR', valor: Math.round(1 / r.EUR), bandera: 'eu' },
                ])
            } catch {
                setTipos([
                    { simbolo: 'USD', valor: 7500, bandera: 'us' },
                    { simbolo: 'BRL', valor: 1400, bandera: 'br' },
                    { simbolo: 'EUR', valor: 8200, bandera: 'eu' },
                ])
            }
        }
        cargar()
    }, [])

    const cerrarSesion = async () => {
        try {
            const token = localStorage.getItem('auth_token')
            if (token) {
                await fetch(`${API.auth}/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            }
        } catch { /* ignorar errores de red */ }
        finally {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_nombre')
            localStorage.removeItem('auth_email')
            navigate('/login', { replace: true })
            window.location.reload()
        }
    }

    const fmt = (n: number) => n.toLocaleString('es-PY')
    const sidebarW = collapsed ? 64 : 250

    return (
        <nav style={{
            position: 'fixed', top: 0, left: `${sidebarW}px`, right: 0,
            zIndex: 999, height: '64px',
            background: NAV.bg,
            borderBottom: `3px solid ${NAV.border}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center',
            padding: '0 16px', gap: '12px',
            transition: 'left 0.25s ease',
        }}>
            {/* Toggle */}
            <button onClick={toggle} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                width: '36px', height: '36px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: NAV.icon, fontSize: '16px', flexShrink: 0,
                transition: 'background 0.15s',
            }}
                onMouseEnter={e => (e.currentTarget.style.background = NAV.hoverBg)}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                title={collapsed ? 'Expandir sidebar' : 'Contraer sidebar'}>
                <i className={`fas ${collapsed ? 'fa-indent' : 'fa-outdent'}`}></i>
            </button>

            {/* Titulo */}
            <span style={{ fontWeight: 600, fontSize: '17px', color: NAV.text, flexShrink: 0 }}>
                {titulo}
            </span>

            <div style={{ flex: 1 }}></div>

            {/* Tipos de cambio */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {tipos.map((tc, i) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: NAV.tcBg,
                        border: `1px solid ${NAV.tcBorder}`,
                        borderRadius: '8px', padding: '4px 10px',
                        flexShrink: 0,
                    }}>
                        <img
                            src={`https://flagcdn.com/w20/${tc.bandera}.png`}
                            alt={tc.simbolo}
                            style={{ width: '18px', height: '13px', objectFit: 'cover', borderRadius: '2px' }}
                        />
                        <div style={{ lineHeight: 1.2 }}>
                            <div style={{ fontSize: '9px', color: NAV.textMuted, fontWeight: 600 }}>{tc.simbolo} → PYG</div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: NAV.accent }}>Gs. {fmt(tc.valor)}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '30px', background: NAV.divider, flexShrink: 0 }}></div>

            {/* Campana */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
                <button style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '6px', borderRadius: '8px',
                    color: NAV.icon, fontSize: '18px'
                }}
                    onMouseEnter={e => (e.currentTarget.style.background = NAV.hoverBg)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <i className="fas fa-bell"></i>
                </button>
                <span style={{
                    position: 'absolute', top: '2px', right: '2px',
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: '#CC0000', border: `2px solid ${NAV.bg}`
                }}></span>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '30px', background: NAV.divider, flexShrink: 0 }}></div>

            {/* Usuario */}
            <div className="dropdown" style={{ flexShrink: 0 }}>
                <button className="dropdown-toggle" data-bs-toggle="dropdown"
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '4px 8px', borderRadius: '8px',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = NAV.hoverBg)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <i className="fas fa-user-circle" style={{ fontSize: '24px', color: NAV.accent }}></i>
                    <span style={{ fontSize: '14px', color: NAV.text, fontWeight: 500 }}>{nombre}</span>
                </button>
                <div className="dropdown-menu dropdown-menu-end shadow">
                    <a className="dropdown-item" href="/cambiar-contrasena">
                        <i className="fas fa-key fa-sm mr-2" style={{ color: '#6b7c93' }}></i>Cambiar contrasena
                    </a>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item" onClick={cerrarSesion}
                        style={{ color: '#CC0000', background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: '0.25rem 1rem', cursor: 'pointer' }}>
                        <i className="fas fa-sign-out-alt fa-sm mr-2"></i>Cerrar sesion
                    </button>
                </div>
            </div>
        </nav>
    )
}