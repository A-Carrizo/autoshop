import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Home from './pages/Home'
import DetalleProducto from './pages/DetalleProducto'
import Carrito from './pages/Carrito'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Registro from './pages/Registro'
import MisPedidos from './pages/MisPedidos'
import DetallePedido from './pages/DetallePedido'
import Perfil from './pages/Perfil'
import RecuperarPassword from './pages/RecuperarPassword'
import ResetPassword from './pages/ResetPassword'

// Verifica si hay sesion activa del cliente de la tienda
function estaAutenticado(): boolean {
    return !!localStorage.getItem('tienda_token')
}

function RutaPrivada({ children }: { children: React.ReactNode }) {
    if (!estaAutenticado()) {
        return <Navigate to="/login" replace />
    }
    return <>{children}</>
}

export default function App() {
    return (
        <BrowserRouter>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: { borderRadius: '10px', fontFamily: 'Segoe UI, sans-serif', fontSize: '14px' },
                }}
            />
            <Routes>
                {/* Publicas */}
                <Route path="/" element={<Home />} />
                <Route path="/producto/:id" element={<DetalleProducto />} />
                <Route path="/carrito" element={<Carrito />} />
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Registro />} />
                <Route path="/recuperar-password" element={<RecuperarPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Privadas (requieren cuenta de cliente) */}
                <Route path="/checkout" element={<RutaPrivada><Checkout /></RutaPrivada>} />
                <Route path="/mis-pedidos" element={<RutaPrivada><MisPedidos /></RutaPrivada>} />
                <Route path="/mis-pedidos/:id" element={<RutaPrivada><DetallePedido /></RutaPrivada>} />
                <Route path="/perfil" element={<RutaPrivada><Perfil /></RutaPrivada>} />

                {/* Cualquier ruta desconocida va al home */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}