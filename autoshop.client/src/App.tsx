import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { SidebarProvider } from './context/SidebarContext'
import Dashboard from './pages/Dashboard'
import Categorias from './pages/Categorias'
import Productos from './pages/Productos'
import NuevaVenta from './pages/NuevaVenta'
import Clientes from './pages/Clientes'
import Historial from './pages/Historial'
import Inventario from './pages/Inventario'
import Devoluciones from './pages/Devoluciones'
import Login from './pages/Login'
import RecuperarPassword from './pages/RecuperarPassword'
import ResetPassword from './pages/ResetPassword'
import CambiarPasswordObligatorio from './pages/CambiarPasswordObligatorio'

import './styles/magcar.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Verifica si hay sesion activa
function estaAutenticado(): boolean {
    return !!localStorage.getItem('auth_token')
}

// Ruta protegida — redirige al login si no hay sesion
function RutaPrivada({ children }: { children: React.ReactNode }) {
    const location = useLocation()
    if (!estaAutenticado()) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }
    return <>{children}</>
}

// Ruta publica — redirige al dashboard si ya hay sesion
function RutaPublica({ children }: { children: React.ReactNode }) {
    if (estaAutenticado()) {
        return <Navigate to="/" replace />
    }
    return <>{children}</>
}

export default function App() {
    return (
        <SidebarProvider>
            <BrowserRouter>
                <Toaster
                    position="top-right"
                    containerStyle={{ zIndex: 999999 }}
                    toastOptions={{
                        duration: 3000,
                        style: {
                            borderRadius: '10px',
                            fontFamily: 'Segoe UI, sans-serif',
                            fontSize: '14px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        },
                        success: {
                            style: {
                                background: '#e8f5e9',
                                color: '#2e7d32',
                                border: '1px solid #a5d6a7',
                            },
                            iconTheme: { primary: '#2e7d32', secondary: '#e8f5e9' },
                        },
                        error: {
                            style: {
                                background: '#fce4e4',
                                color: '#CC0000',
                                border: '1px solid #ef9a9a',
                            },
                            iconTheme: { primary: '#CC0000', secondary: '#fce4e4' },
                        },
                    }}
                />
                <Routes>
                    {/* Redirige la raiz al login si no esta autenticado */}
                    <Route path="/" element={
                        estaAutenticado()
                            ? <RutaPrivada><Dashboard /></RutaPrivada>
                            : <Navigate to="/login" replace />
                    } />

                    {/* Rutas publicas */}
                    <Route path="/login" element={<RutaPublica><Login /></RutaPublica>} />
                    <Route path="/recuperar-password" element={<RutaPublica><RecuperarPassword /></RutaPublica>} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/cambiar-contrasena-obligatorio" element={<CambiarPasswordObligatorio />} />

                    {/* Rutas privadas */}
                    <Route path="/categorias" element={<RutaPrivada><Categorias /></RutaPrivada>} />
                    <Route path="/productos" element={<RutaPrivada><Productos /></RutaPrivada>} />
                    <Route path="/ventas" element={<RutaPrivada><NuevaVenta /></RutaPrivada>} />
                    <Route path="/clientes" element={<RutaPrivada><Clientes /></RutaPrivada>} />
                    <Route path="/historial" element={<RutaPrivada><Historial /></RutaPrivada>} />
                    <Route path="/inventario" element={<RutaPrivada><Inventario /></RutaPrivada>} />
                    <Route path="/devoluciones" element={<RutaPrivada><Devoluciones /></RutaPrivada>} />

                    {/* Cualquier ruta desconocida va al login */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </SidebarProvider>
    )
}