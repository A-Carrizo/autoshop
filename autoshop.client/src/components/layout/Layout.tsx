import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useSidebar } from '../../context/SidebarContext'

interface LayoutProps {
    children: ReactNode
    titulo: string
    sinFooter?: boolean
}

const SIDEBAR_FULL = 250
const SIDEBAR_MINI = 64

export default function Layout({ children, titulo, sinFooter = false }: LayoutProps) {
    const { collapsed } = useSidebar()
    const sidebarW = collapsed ? SIDEBAR_MINI : SIDEBAR_FULL

    return (
        <div id="wrapper" style={{ display: 'flex' }}>
            <Sidebar />

            <div id="content-wrapper" style={{
                marginLeft: `${sidebarW}px`,
                width: `calc(100% - ${sidebarW}px)`,
                minHeight: '100vh',
                backgroundColor: 'var(--light)',
                transition: 'margin-left 0.25s ease, width 0.25s ease',
            }}>
                <Navbar titulo={titulo} />

                <div id="content" style={{ marginTop: '60px', padding: '24px' }}>
                    {children}
                </div>

                {!sinFooter && (
                    <footer style={{
                        backgroundColor: 'white',
                        borderTop: '1px solid #e0e0e0',
                        padding: '16px',
                        textAlign: 'center',
                        fontSize: '13px',
                        color: 'var(--text-muted)'
                    }}>
                        © 2026 MagCar Auto Shop — Sistema de Gestion
                    </footer>
                )}
            </div>
        </div>
    )
}