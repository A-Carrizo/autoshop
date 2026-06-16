import { NavLink } from 'react-router-dom'
import { useSidebar } from '../../context/SidebarContext'

const SIDEBAR_FULL = 250
const SIDEBAR_MINI = 64

interface NavItem { to: string, icon: string, label: string }
interface Section { heading: string, items: NavItem[] }

const sections: Section[] = [
    {
        heading: 'INVENTARIO',
        items: [
            { to: '/productos', icon: 'fa-box', label: 'Productos' },
            { to: '/categorias', icon: 'fa-tags', label: 'Categorias' },
            { to: '/inventario', icon: 'fa-warehouse', label: 'Inventario' },
        ]
    },
    {
        heading: 'VENTAS',
        items: [
            { to: '/ventas', icon: 'fa-cash-register', label: 'Nueva Venta' },
            { to: '/clientes', icon: 'fa-users', label: 'Clientes' },
            { to: '/historial', icon: 'fa-history', label: 'Historial' },
            { to: '/devoluciones', icon: 'fa-undo', label: 'Devoluciones' },
        ]
    },
]

const SB = {
    bg: '#1e3a5f',
    bgHeader: '#122440',
    border: 'rgba(255,255,255,0.08)',
    text: 'rgba(255,255,255,0.75)',
    textActive: '#ffffff',
    textMuted: 'rgba(255,255,255,0.35)',
    icon: 'rgba(255,255,255,0.45)',
    iconActive: '#D4A017',
    activeBg: 'rgba(212,160,23,0.15)',
    hoverBg: 'rgba(255,255,255,0.07)',
    accent: '#D4A017',
}

export default function Sidebar() {
    const { collapsed } = useSidebar()
    const w = collapsed ? SIDEBAR_MINI : SIDEBAR_FULL

    return (
        <div style={{
            width: `${w}px`, minHeight: '100vh',
            position: 'fixed', top: 0, left: 0,
            background: SB.bg, zIndex: 1000,
            transition: 'width 0.25s ease',
            overflowX: 'hidden', overflowY: 'auto',
            display: 'flex', flexDirection: 'column',
            boxShadow: '3px 0 16px rgba(0,0,0,0.2)',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                padding: collapsed ? '14px 0' : '14px 20px',
                borderBottom: `1px solid ${SB.border}`,
                minHeight: '64px', flexShrink: 0,
                background: SB.bgHeader,
            }}>
                {collapsed ? (
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: SB.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-car" style={{ color: '#111', fontSize: '15px' }}></i>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: SB.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <i className="fas fa-car" style={{ color: '#111', fontSize: '14px' }}></i>
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '16px', color: '#ffffff', letterSpacing: '0.5px', lineHeight: 1.1 }}>MagCar</div>
                            <div style={{ fontSize: '9px', color: SB.accent, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>Auto Shop</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Dashboard */}
            <div style={{ paddingTop: '8px', flexShrink: 0 }}>
                <NavLink to="/" end style={{ textDecoration: 'none', display: 'block' }}>
                    {({ isActive }) => (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: collapsed ? '11px 0' : '11px 20px',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            background: isActive ? SB.activeBg : 'transparent',
                            borderLeft: `3px solid ${isActive ? SB.accent : 'transparent'}`,
                            cursor: 'pointer', transition: 'all 0.15s',
                        }}
                            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = SB.hoverBg }}
                            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                            title={collapsed ? 'Dashboard' : undefined}>
                            <i className="fas fa-tachometer-alt" style={{ color: isActive ? SB.iconActive : SB.icon, fontSize: '15px', minWidth: '16px', textAlign: 'center' }}></i>
                            {!collapsed && <span style={{ color: isActive ? SB.textActive : SB.text, fontSize: '14px', fontWeight: isActive ? 600 : 400 }}>Dashboard</span>}
                        </div>
                    )}
                </NavLink>
            </div>

            {/* Secciones */}
            {sections.map((sec, si) => (
                <div key={si} style={{ flexShrink: 0 }}>
                    <div style={{ borderTop: `1px solid ${SB.border}`, margin: '6px 0' }}></div>
                    {!collapsed && (
                        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', color: SB.textMuted, padding: '6px 20px 4px', textTransform: 'uppercase' }}>
                            {sec.heading}
                        </div>
                    )}
                    {collapsed && <div style={{ height: '4px' }}></div>}
                    {sec.items.map((item, ii) => (
                        <NavLink key={ii} to={item.to} style={{ textDecoration: 'none', display: 'block' }}>
                            {({ isActive }) => (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: collapsed ? '11px 0' : '10px 20px',
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    background: isActive ? SB.activeBg : 'transparent',
                                    borderLeft: `3px solid ${isActive ? SB.accent : 'transparent'}`,
                                    cursor: 'pointer', transition: 'all 0.15s',
                                }}
                                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = SB.hoverBg }}
                                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                                    title={collapsed ? item.label : undefined}>
                                    <i className={`fas ${item.icon}`} style={{ color: isActive ? SB.iconActive : SB.icon, fontSize: '14px', minWidth: '16px', textAlign: 'center' }}></i>
                                    {!collapsed && (
                                        <span style={{ color: isActive ? SB.textActive : SB.text, fontSize: '14px', fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap' }}>
                                            {item.label}
                                        </span>
                                    )}
                                </div>
                            )}
                        </NavLink>
                    ))}
                </div>
            ))}

            <div style={{ flex: 1 }}></div>

            {!collapsed && (
                <div style={{ padding: '12px 20px', borderTop: `1px solid ${SB.border}` }}>
                    <div style={{ fontSize: '10px', color: SB.textMuted, textAlign: 'center', letterSpacing: '1px' }}>MagCar v1.0</div>
                </div>
            )}
        </div>
    )
}