interface NavbarProps {
    titulo: string
}

export default function Navbar({ titulo }: NavbarProps) {
    return (
        <nav className="navbar navbar-expand navbar-light bg-white topbar shadow"
            style={{
                position: 'fixed',
                top: 0,
                left: '250px',
                right: 0,
                zIndex: 999,
                borderBottom: '3px solid var(--primary)',
                height: '60px'
            }}>

            {/* Título de la página actual */}
            <span style={{ fontWeight: 600, fontSize: '18px', color: 'var(--dark)', marginLeft: '8px' }}>
                {titulo}
            </span>

            {/* Lado derecho */}
            <ul className="navbar-nav ml-auto align-items-center" style={{ gap: '16px' }}>

                {/* Alertas stock bajo */}
                <li className="nav-item">
                    <a className="nav-link" href="#" title="Alertas de stock">
                        <i className="fas fa-bell fa-fw" style={{ color: 'var(--dark)', fontSize: '18px' }}></i>
                        <span className="badge badge-danger" style={{
                            position: 'absolute',
                            marginTop: '-8px',
                            marginLeft: '-8px',
                            fontSize: '10px',
                            background: 'var(--secondary)'
                        }}>!</span>
                    </a>
                </li>

                <div className="topbar-divider"></div>

                {/* Usuario */}
                <li className="nav-item dropdown no-arrow">
                    <a className="nav-link dropdown-toggle d-flex align-items-center gap-2"
                        href="#" id="userDropdown" role="button"
                        data-bs-toggle="dropdown" aria-expanded="false">
                        <span style={{ fontSize: '14px', color: 'var(--dark)' }}>
                            <i className="fas fa-user-circle fa-fw"
                                style={{ fontSize: '24px', color: 'var(--primary)' }}></i>
                        </span>
                        <span className="d-none d-lg-inline" style={{ fontSize: '14px', color: 'var(--dark)' }}>
                            Administrador
                        </span>
                    </a>

                    {/* Dropdown usuario */}
                    <div className="dropdown-menu dropdown-menu-end shadow"
                        aria-labelledby="userDropdown">
                        <a className="dropdown-item" href="#">
                            <i className="fas fa-user fa-sm fa-fw mr-2 text-gray-400"></i>
                            Perfil
                        </a>
                        <div className="dropdown-divider"></div>
                        <a className="dropdown-item" href="#"
                            style={{ color: 'var(--secondary)' }}>
                            <i className="fas fa-sign-out-alt fa-sm fa-fw mr-2"></i>
                            Cerrar sesión
                        </a>
                    </div>
                </li>

            </ul>
        </nav>
    )
}