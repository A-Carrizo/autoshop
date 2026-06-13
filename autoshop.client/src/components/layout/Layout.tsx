import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

interface LayoutProps {
    children: ReactNode
    titulo: string
}

export default function Layout({ children, titulo }: LayoutProps) {
    return (
        <div id="wrapper" style={{ display: 'flex' }}>

            {/* Sidebar */}
            <Sidebar />

            {/* Content Wrapper */}
            <div id="content-wrapper" style={{
                marginLeft: '250px',
                width: '100%',
                minHeight: '100vh',
                backgroundColor: 'var(--light)'
            }}>

                {/* Navbar */}
                <Navbar titulo={titulo} />

                {/* Main Content */}
                <div id="content" style={{
                    marginTop: '60px',
                    padding: '24px'
                }}>
                    {children}
                </div>

                {/* Footer */}
                <footer style={{
                    backgroundColor: 'white',
                    borderTop: '1px solid #e0e0e0',
                    padding: '16px',
                    textAlign: 'center',
                    fontSize: '13px',
                    color: 'var(--text-muted)'
                }}>
                    © 2026 MagCar Auto Shop — Sistema de Gestión
                </footer>

            </div>
        </div>
    )
}