import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Dashboard from './pages/Dashboard'
import Categorias from './pages/Categorias'
import Productos from './pages/Productos'
import './styles/magcar.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

export default function App() {
    return (
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
                        iconTheme: {
                            primary: '#2e7d32',
                            secondary: '#e8f5e9',
                        },
                    },
                    error: {
                        style: {
                            background: '#fce4e4',
                            color: '#CC0000',
                            border: '1px solid #ef9a9a',
                        },
                        iconTheme: {
                            primary: '#CC0000',
                            secondary: '#fce4e4',
                        },
                    },
                }}
            />
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/categorias" element={<Categorias />} />
                <Route path="/productos" element={<Productos />} />
            </Routes>
        </BrowserRouter>
    )
}