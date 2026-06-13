import { useState } from 'react'
import Layout from '../components/layout/Layout'

interface Producto {
    id: string
    codigoBarras: string
    nombre: string
    descripcion: string
    precioCompra: number
    precioVenta: number
    descuentoPct: number
    stock: number
    activo: boolean
    imagen?: string
}

const productosMock: Producto[] = [
    {
        id: '1',
        codigoBarras: '999999023896',
        nombre: 'PIXEL LED tablero',
        descripcion: 'LED de alta luminosidad para tablero',
        precioCompra: 50000,
        precioVenta: 85000,
        descuentoPct: 0,
        stock: 2,
        activo: true
    },
    {
        id: '2',
        codigoBarras: '000H4',
        nombre: 'FOCO HALOG H4',
        descripcion: 'Foco halógeno H4 de repuesto',
        precioCompra: 30000,
        precioVenta: 55000,
        descuentoPct: 10,
        stock: 7,
        activo: true
    },
    {
        id: '3',
        codigoBarras: '999999014139',
        nombre: 'LED X2S H4',
        descripcion: 'LED X2S para faro delantero H4',
        precioCompra: 45000,
        precioVenta: 80000,
        descuentoPct: 15,
        stock: 0,
        activo: true
    },
    {
        id: '4',
        codigoBarras: '000HB4',
        nombre: 'FOCO HALOG HB4',
        descripcion: 'Foco halógeno HB4',
        precioCompra: 32000,
        precioVenta: 58000,
        descuentoPct: 0,
        stock: 8,
        activo: true
    }
]

export default function Productos() {
    const [busqueda, setBusqueda] = useState('')
    const [vista, setVista] = useState<'tabla' | 'tarjetas'>('tabla')

    const productosFiltrados = productosMock.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.codigoBarras.includes(busqueda)
    )

    const getStockColor = (stock: number) => {
        if (stock === 0) return 'var(--secondary)'
        if (stock <= 2) return '#f6c23e'
        return '#2e7d32'
    }

    const getStockLabel = (stock: number) => {
        if (stock === 0) return 'Sin stock'
        if (stock <= 2) return `⚠️ ${stock} unid.`
        return `${stock} unid.`
    }

    return (
        <Layout titulo="Productos">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 style={{ fontWeight: 700, margin: 0 }}>Listado de productos</h5>
                    <small style={{ color: 'var(--text-muted)' }}>{productosMock.length} productos registrados</small>
                </div>
                <button className="btn btn-primary">
                    <i className="fas fa-plus mr-2"></i> Nuevo producto
                </button>
            </div>

            {/* Buscador + toggle vista */}
            <div className="card mb-4">
                <div className="card-body py-3 d-flex gap-3 align-items-center">
                    <div className="input-group flex-grow-1">
                        <span className="input-group-text" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
                            <i className="fas fa-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar por nombre o código de barras..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                        />
                    </div>

                    {/* Toggle vista */}
                    <div className="btn-group">
                        <button
                            className="btn btn-sm"
                            onClick={() => setVista('tabla')}
                            style={{
                                background: vista === 'tabla' ? 'var(--primary)' : 'white',
                                color: vista === 'tabla' ? 'white' : 'var(--text-muted)',
                                border: '1px solid var(--primary)'
                            }}
                            title="Vista tabla"
                        >
                            <i className="fas fa-list"></i>
                        </button>
                        <button
                            className="btn btn-sm"
                            onClick={() => setVista('tarjetas')}
                            style={{
                                background: vista === 'tarjetas' ? 'var(--primary)' : 'white',
                                color: vista === 'tarjetas' ? 'white' : 'var(--text-muted)',
                                border: '1px solid var(--primary)'
                            }}
                            title="Vista tarjetas"
                        >
                            <i className="fas fa-th"></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* VISTA TABLA */}
            {vista === 'tabla' && (
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <span><i className="fas fa-box mr-2" style={{ color: 'var(--primary)' }}></i>Productos</span>
                        <small style={{ color: 'var(--text-muted)' }}>{productosFiltrados.length} resultados</small>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-bordered mb-0">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Nombre</th>
                                        <th>Precio compra</th>
                                        <th>Precio venta</th>
                                        <th>Descuento</th>
                                        <th>Stock</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productosFiltrados.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                                                No se encontraron productos
                                            </td>
                                        </tr>
                                    ) : (
                                        productosFiltrados.map(p => (
                                            <tr key={p.id}>
                                                <td>
                                                    <span style={{ fontFamily: 'monospace', fontSize: '12px', background: 'var(--primary-light)', padding: '2px 6px', borderRadius: '4px' }}>
                                                        {p.codigoBarras}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                                                <td>₲ {p.precioCompra.toLocaleString()}</td>
                                                <td style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>
                                                    ₲ {p.precioVenta.toLocaleString()}
                                                </td>
                                                <td>
                                                    {p.descuentoPct > 0 ? (
                                                        <span style={{ background: 'var(--secondary-light)', color: 'var(--secondary)', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                                                            {p.descuentoPct}% OFF
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                                                    )}
                                                </td>
                                                <td style={{ fontWeight: 600, color: getStockColor(p.stock) }}>
                                                    {getStockLabel(p.stock)}
                                                </td>
                                                <td>
                                                    <span style={{
                                                        background: p.activo ? '#e8f5e9' : '#fce4e4',
                                                        color: p.activo ? '#2e7d32' : 'var(--secondary)',
                                                        fontWeight: 600, padding: '2px 8px', borderRadius: '12px', fontSize: '12px'
                                                    }}>
                                                        {p.activo ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className="btn btn-sm btn-primary mr-1" title="Editar">
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button className="btn btn-sm" title="Eliminar"
                                                        style={{ background: 'var(--secondary)', border: 'none', color: 'white' }}>
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* VISTA TARJETAS */}
            {vista === 'tarjetas' && (
                <div className="row">
                    {productosFiltrados.length === 0 ? (
                        <div className="col-12 text-center py-5" style={{ color: 'var(--text-muted)' }}>
                            No se encontraron productos
                        </div>
                    ) : (
                        productosFiltrados.map(p => (
                            <div className="col-xl-3 col-lg-4 col-md-6 mb-4" key={p.id}>
                                <div className="card h-100" style={{ borderRadius: '12px', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                                    onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>

                                    {/* Imagen */}
                                    <div style={{ height: '160px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                        {p.descuentoPct > 0 && (
                                            <span style={{
                                                position: 'absolute', top: '10px', left: '10px',
                                                background: 'var(--secondary)', color: 'white',
                                                fontWeight: 700, fontSize: '13px',
                                                padding: '4px 10px', borderRadius: '20px'
                                            }}>
                                                {p.descuentoPct}% OFF
                                            </span>
                                        )}
                                        <i className="fas fa-box fa-3x" style={{ color: 'var(--primary)', opacity: 0.4 }}></i>
                                    </div>

                                    {/* Info */}
                                    <div className="card-body d-flex flex-column" style={{ padding: '16px' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                            Cód: {p.codigoBarras}
                                        </span>
                                        <h6 style={{ fontWeight: 700, margin: '6px 0', fontSize: '14px', color: 'var(--text-dark)' }}>
                                            {p.nombre}
                                        </h6>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', flex: 1 }}>{p.descripcion}</p>

                                        {/* Precios */}
                                        <div style={{ marginTop: '8px' }}>
                                            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-dark)' }}>
                                                ₲ {p.precioVenta.toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                Compra: ₲ {p.precioCompra.toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: '12px', fontWeight: 600, color: getStockColor(p.stock), marginTop: '4px' }}>
                                                Stock: {getStockLabel(p.stock)}
                                            </div>
                                        </div>

                                        {/* Botones */}
                                        <div className="d-flex gap-2 mt-3">
                                            <button className="btn btn-sm btn-primary flex-grow-1">
                                                <i className="fas fa-edit mr-1"></i> Editar
                                            </button>
                                            <button className="btn btn-sm" style={{ background: 'var(--secondary)', color: 'white', border: 'none' }}>
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

        </Layout>
    )
}