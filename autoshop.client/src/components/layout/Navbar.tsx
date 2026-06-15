import { useState, useEffect } from 'react'

interface NavbarProps {
    titulo: string
}

interface TipoCambio { simbolo: string, valor: number, bandera: string }

export default function Navbar({ titulo }: NavbarProps) {
    const [tipos, setTipos] = useState<TipoCambio[]>([])

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

    const fmt = (n: number) => n.toLocaleString('es-PY')

    return (
        <nav className="navbar navbar-expand navbar-light bg-white topbar shadow"
            style={{
                position: 'fixed', top: 0, left: '250px', right: 0,
                zIndex: 999, borderBottom: '3px solid var(--primary)', height: '60px'
            }}>

            <span style={{ fontWeight: 600, fontSize: '18px', color: 'var(--dark)', marginLeft: '8px' }}>
                {titulo}
            </span>

            <ul className="navbar-nav ml-auto align-items-center" style={{ gap: '8px' }}>

                {/* Tipos de cambio */}
                {tipos.map((tc, i) => (
                    <li key={i} className="nav-item d-none d-xl-flex align-items-center"
                        style={{ background: 'var(--primary-light)', borderRadius: '8px', padding: '4px 10px', border: '1px solid var(--border)' }}>
                        <img
                            src={tc.bandera === 'eu'
                                ? 'https://flagcdn.com/w20/eu.png'
                                : `https://flagcdn.com/w20/${tc.bandera}.png`}
                            alt={tc.simbolo}
                            style={{ width: '18px', height: '13px', objectFit: 'cover', borderRadius: '2px', marginRight: '6px' }}
                        />
                        <div style={{ lineHeight: 1.2 }}>
                            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>{tc.simbolo} → PYG</div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-dark)' }}>Gs. {fmt(tc.valor)}</div>
                        </div>
                    </li>
                ))}

                {tipos.length > 0 && <div className="topbar-divider d-none d-xl-block"></div>}

                {/* Campana */}
                <li className="nav-item">
                    <a className="nav-link" href="#" title="Alertas de stock">
                        <i className="fas fa-bell fa-fw" style={{ color: 'var(--dark)', fontSize: '18px' }}></i>
                        <span className="badge badge-danger" style={{
                            position: 'absolute', marginTop: '-8px', marginLeft: '-8px',
                            fontSize: '10px', background: 'var(--secondary)'
                        }}>!</span>
                    </a>
                </li>

                <div className="topbar-divider"></div>

                {/* Usuario */}
                <li className="nav-item dropdown no-arrow">
                    <a className="nav-link dropdown-toggle d-flex align-items-center gap-2"
                        href="#" id="userDropdown" role="button"
                        data-bs-toggle="dropdown" aria-expanded="false">
                        <i className="fas fa-user-circle fa-fw" style={{ fontSize: '24px', color: 'var(--primary)' }}></i>
                        <span className="d-none d-lg-inline" style={{ fontSize: '14px', color: 'var(--dark)' }}>
                            Administrador
                        </span>
                    </a>
                    <div className="dropdown-menu dropdown-menu-end shadow" aria-labelledby="userDropdown">
                        <a className="dropdown-item" href="#">
                            <i className="fas fa-user fa-sm fa-fw mr-2 text-gray-400"></i>Perfil
                        </a>
                        <div className="dropdown-divider"></div>
                        <a className="dropdown-item" href="#" style={{ color: 'var(--secondary)' }}>
                            <i className="fas fa-sign-out-alt fa-sm fa-fw mr-2"></i>Cerrar sesion
                        </a>
                    </div>
                </li>
            </ul>
        </nav>
    )
}