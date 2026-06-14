import { NavLink } from 'react-router-dom'
import logo from '../../assets/logo_autoshop.jpeg'

export default function Sidebar() {
    return (
        <ul className="navbar-nav sidebar sidebar-dark accordion" id="accordionSidebar"
            style={{ background: 'var(--dark)', minHeight: '100vh', width: '250px', position: 'fixed' }}>

            {/* Logo */}
            <a className="sidebar-brand d-flex align-items-center justify-content-center py-3" href="/">
                <img src={logo} alt="MagCar Auto Shop" style={{ width: '140px', objectFit: 'contain' }} />
            </a>

            <hr className="sidebar-divider my-0" />

            {/* Dashboard */}
            <li className="nav-item">
                <NavLink className="nav-link" to="/">
                    <i className="fas fa-fw fa-tachometer-alt" style={{ color: 'var(--primary)' }}></i>
                    <span>Dashboard</span>
                </NavLink>
            </li>

            <hr className="sidebar-divider" />
            <div className="sidebar-heading" style={{ color: 'var(--text-muted)' }}>Inventario</div>

            {/* Productos */}
            <li className="nav-item">
                <NavLink className="nav-link" to="/productos">
                    <i className="fas fa-fw fa-box" style={{ color: 'var(--primary)' }}></i>
                    <span>Productos</span>
                </NavLink>
            </li>

            {/* Categorias */}
            <li className="nav-item">
                <NavLink className="nav-link" to="/categorias">
                    <i className="fas fa-fw fa-tags" style={{ color: 'var(--primary)' }}></i>
                    <span>Categorías</span>
                </NavLink>
            </li>

            {/* Inventario */}
            <li className="nav-item">
                <NavLink className="nav-link" to="/inventario">
                    <i className="fas fa-fw fa-warehouse" style={{ color: 'var(--primary)' }}></i>
                    <span>Inventario</span>
                </NavLink>
            </li>

            <hr className="sidebar-divider" />
            <div className="sidebar-heading" style={{ color: 'var(--text-muted)' }}>Ventas</div>

            {/* Ventas */}
            <li className="nav-item">
                <NavLink className="nav-link" to="/ventas">
                    <i className="fas fa-fw fa-cash-register" style={{ color: 'var(--primary)' }}></i>
                    <span>Nueva Venta</span>
                </NavLink>
            </li>

            {/* Clientes */}
            <li className="nav-item">
                <NavLink className="nav-link" to="/clientes">
                    <i className="fas fa-fw fa-users" style={{ color: 'var(--primary)' }}></i>
                    <span>Clientes</span>
                </NavLink>
            </li>

            {/* Historial */}
            <li className="nav-item">
                <NavLink className="nav-link" to="/historial">
                    <i className="fas fa-fw fa-history" style={{ color: 'var(--primary)' }}></i>
                    <span>Historial</span>
                </NavLink>
            </li>

            {/* Devoluciones */}
            <li className="nav-item">
                <NavLink className="nav-link" to="/devoluciones">
                    <i className="fas fa-fw fa-undo" style={{ color: 'var(--primary)' }}></i>
                    <span>Devoluciones</span>
                </NavLink>
            </li>

            <hr className="sidebar-divider" />
            <div className="sidebar-heading" style={{ color: 'var(--text-muted)' }}>Finanzas</div>



            <hr className="sidebar-divider d-none d-md-block" />

        </ul>
    )
}