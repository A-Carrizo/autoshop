import { useState, useEffect, useCallback, useRef } from 'react'
import Layout from '../components/layout/Layout'
import { API } from '../config/api'

interface DashboardData {
    cantidadVentas: number
    totalVentas: number
    totalDescuentos: number
    gananciaBruta: number
    ticketPromedio: number
    ventasHoy: number
    totalHoy: number
    ventasSemana: number
    totalSemana: number
    ventasMesCount: number
    totalMes: number
    stockBajo: number
    sinStock: number
    proyeccionMes: number
    diasRestantesMes: number
    proyeccionAnual: number
    proyeccionRestoAnio: number
    tendenciaPct: number
    promedioDiario: number
    ultimasVentas: { numeroFactura: string, fecha: string, clienteNombre?: string, total: number, metodoPago: string }[]
    topClientes: { cliente: string, compras: number, total: number }[]
    topProductos: { nombre: string, imagenUrl?: string, cantidadVendida: number, totalVendido: number }[]
    metodosPago: { metodo: string, cantidad: number, total: number }[]
    recomendacionesReposicion: { nombre: string, stockActual: number, stockMinimo: number, ventasMes: number, promedioVentaDiaria: number }[]
    productosBajoMovimiento: { nombre: string, stockActual: number, ventasMes: number }[]
}

interface VentaDia { fecha: string, cantidad: number, total: number }
const fmt = (n: number) => Math.round(n).toLocaleString('es-PY')

function MiniBar({ valor, max, color }: { valor: number, max: number, color: string }) {
    const pct = max > 0 ? (valor / max) * 100 : 0
    return (
        <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '6px', overflow: 'hidden', marginTop: '4px' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.5s' }}></div>
        </div>
    )
}

// Grafico de torta SVG — angulo calculado de forma inmutable con reduce
function GraficoTorta({ datos }: { datos: { label: string, valor: number, color: string }[] }) {
    const total = datos.reduce((acc, d) => acc + d.valor, 0)
    if (total === 0) return <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Sin datos</div>
    const cx = 80, cy = 80, r = 70
    const segmentos = datos.reduce<{ label: string, valor: number, color: string, path: string, pct: number, fin: number }[]>((acc, d) => {
        const inicio = acc.length > 0 ? acc[acc.length - 1].fin : -90
        const pct = d.valor / total
        const fin = inicio + pct * 360
        const startRad = (inicio * Math.PI) / 180
        const endRad = (fin * Math.PI) / 180
        const x1 = cx + r * Math.cos(startRad)
        const y1 = cy + r * Math.sin(startRad)
        const x2 = cx + r * Math.cos(endRad)
        const y2 = cy + r * Math.sin(endRad)
        const largeArc = pct > 0.5 ? 1 : 0
        acc.push({ ...d, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, pct, fin })
        return acc
    }, [])
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <svg width="160" height="160" viewBox="0 0 160 160">
                {segmentos.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="2" />)}
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {segmentos.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: s.color, flexShrink: 0 }}></div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{s.label === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{(s.pct * 100).toFixed(0)}% · GS {fmt(s.valor)}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}


export default function Dashboard() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [ventasDia, setVentasDia] = useState<VentaDia[]>([])
    const [loading, setLoading] = useState(true)
    const [exportando, setExportando] = useState(false)
    const [desde, setDesde] = useState(() => {
        const d = new Date(); d.setDate(1)
        return d.toISOString().split('T')[0]
    })
    const [hasta, setHasta] = useState(() => new Date().toISOString().split('T')[0])
    const cargado = useRef(false)

    const cargarDatos = useCallback(async () => {
        setLoading(true)
        try {
            const [r1, r2] = await Promise.all([
                fetch(`${API.reportes}/dashboard?desde=${desde}&hasta=${hasta}`),
                fetch(`${API.reportes}/ventas-por-dia?dias=30`)
            ])
            if (r1.ok && r2.ok) {
                const [d1, d2] = await Promise.all([r1.json(), r2.json()])
                setData(d1)
                setVentasDia(d2)
            }
        } catch (e) { console.error('Error cargando datos', e) }
        finally { setLoading(false) }
    }, [desde, hasta])

    useEffect(() => {
        if (!cargado.current) {
            cargado.current = true
            cargarDatos()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const aplicarAtajo = useCallback((dias: number) => {
        const h = new Date().toISOString().split('T')[0]
        const d = dias === -1
            ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
            : dias === 0 ? h
                : new Date(Date.now() - dias * 86400000).toISOString().split('T')[0]
        setDesde(d); setHasta(h)
    }, [])

    const exportarCSV = () => {
        if (!data) return
        setExportando(true)
        try {
            const BOM = '\uFEFF'
            let csv = BOM + `REPORTE MAGCARSHOP\nPeriodo: ${desde} al ${hasta}\n\n`
            csv += `RESUMEN\nVentas,${data.cantidadVentas}\nTotal (GS),${data.totalVentas}\nGanancia (GS),${data.gananciaBruta}\nTicket prom (GS),${data.ticketPromedio}\n\n`
            csv += `TOP PRODUCTOS\n#,Producto,Cantidad,Total (GS)\n`
            data.topProductos.forEach((p, i) => { csv += `${i + 1},"${p.nombre}",${p.cantidadVendida},${p.totalVendido}\n` })
            csv += `\nTOP CLIENTES\n#,Cliente,Compras,Total (GS)\n`
            data.topClientes.forEach((c, i) => { csv += `${i + 1},"${c.cliente}",${c.compras},${c.total}\n` })
            csv += `\nVENTAS POR DIA\nFecha,Cantidad,Total (GS)\n`
            ventasDia.forEach(d => { csv += `${d.fecha},${d.cantidad},${d.total}\n` })
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url
            a.download = `reporte_magcarshop_${desde}_${hasta}.csv`; a.click()
            URL.revokeObjectURL(url)
        } finally { setExportando(false) }
    }

    const exportarPDF = async () => {
        if (!data) return
        setExportando(true)
        try {
            if (!(window as { jspdf?: unknown }).jspdf) {
                const s1 = document.createElement('script')
                s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
                document.head.appendChild(s1); await new Promise(r => { s1.onload = r })
                const s2 = document.createElement('script')
                s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
                document.head.appendChild(s2); await new Promise(r => { s2.onload = r })
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { jsPDF } = (window as any).jspdf
            const doc = new jsPDF()
            let y = 15
            doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.text('MAGCARSHOP', 14, y); y += 7
            doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100)
            doc.text(`Periodo: ${desde} al ${hasta}`, 14, y); y += 10; doc.setTextColor(0)
            doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text('RESUMEN', 14, y); y += 6
            doc.autoTable({
                startY: y, head: [['Indicador', 'Valor']], body: [
                    ['Ventas', data.cantidadVentas.toString()],
                    ['Total vendido', `GS ${fmt(data.totalVentas)}`],
                    ['Ganancia bruta', `GS ${fmt(data.gananciaBruta)}`],
                    ['Ticket promedio', `GS ${fmt(data.ticketPromedio)}`],
                ], theme: 'striped', headStyles: { fillColor: [212, 160, 23] }, margin: { left: 14, right: 14 }
            })
            y = doc.lastAutoTable.finalY + 10
            if (data.topProductos.length > 0) {
                doc.setFont('helvetica', 'bold'); doc.text('TOP PRODUCTOS', 14, y); y += 6
                doc.autoTable({ startY: y, head: [['#', 'Producto', 'Cant.', 'Total']], body: data.topProductos.map((p, i) => [(i + 1).toString(), p.nombre, p.cantidadVendida.toString(), `GS ${fmt(p.totalVendido)}`]), theme: 'striped', headStyles: { fillColor: [212, 160, 23] }, margin: { left: 14, right: 14 } })
                y = doc.lastAutoTable.finalY + 10
            }
            if (data.topClientes.length > 0) {
                doc.setFont('helvetica', 'bold'); doc.text('TOP CLIENTES', 14, y); y += 6
                doc.autoTable({ startY: y, head: [['#', 'Cliente', 'Compras', 'Total']], body: data.topClientes.map((c, i) => [(i + 1).toString(), c.cliente || '', c.compras.toString(), `GS ${fmt(c.total)}`]), theme: 'striped', headStyles: { fillColor: [212, 160, 23] }, margin: { left: 14, right: 14 } })
            }
            const pages = doc.internal.getNumberOfPages()
            for (let i = 1; i <= pages; i++) {
                doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150)
                doc.text(`Pagina ${i} de ${pages} - ${new Date().toLocaleString('es-PY')}`, 14, doc.internal.pageSize.height - 8)
            }
            doc.save(`reporte_magcarshop_${desde}_${hasta}.pdf`)
        } catch (e) { console.error(e) }
        finally { setExportando(false) }
    }

    const maxVentaDia = Math.max(...ventasDia.map(v => v.total), 1)



    return (
        <Layout titulo="Dashboard">

            {/* Filtros + exportar */}
            <div className="card mb-4">
                <div className="card-body py-3">
                    <div className="row align-items-end">
                        <div className="col-md-2">
                            <label style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>DESDE</label>
                            <input type="date" className="form-control" value={desde} onChange={e => setDesde(e.target.value)} />
                        </div>
                        <div className="col-md-2">
                            <label style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>HASTA</label>
                            <input type="date" className="form-control" value={hasta} onChange={e => setHasta(e.target.value)} />
                        </div>
                        <div className="col-md-1">
                            <button onClick={cargarDatos} className="btn btn-primary w-100" disabled={loading}>
                                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-filter"></i>}
                            </button>
                        </div>
                        <div className="col-md-4 d-flex gap-1">
                            {[{ label: 'Hoy', dias: 0 }, { label: '7 dias', dias: 7 }, { label: '30 dias', dias: 30 }, { label: 'Este mes', dias: -1 }].map(({ label, dias }) => (
                                <button key={label} className="btn btn-sm"
                                    style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary-dark)', whiteSpace: 'nowrap', fontSize: '12px' }}
                                    onClick={() => aplicarAtajo(dias)}>{label}</button>
                            ))}
                        </div>
                        <div className="col-md-3 d-flex gap-2 justify-content-end">
                            <button onClick={exportarCSV} disabled={exportando || loading} className="btn btn-sm"
                                style={{ background: '#1b5e20', color: 'white', border: 'none', padding: '8px 14px' }}>
                                <i className="fas fa-file-csv mr-1"></i>CSV
                            </button>
                            <button onClick={exportarPDF} disabled={exportando || loading} className="btn btn-sm"
                                style={{ background: '#b71c1c', color: 'white', border: 'none', padding: '8px 14px' }}>
                                <i className="fas fa-file-pdf mr-1"></i>PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5"><i className="fas fa-spinner fa-spin fa-3x" style={{ color: 'var(--primary)' }}></i></div>
            ) : !data ? (
                <div className="text-center py-5" style={{ color: 'var(--text-muted)' }}>No se pudieron cargar los datos</div>
            ) : (
                <>
                    {/* Alertas stock */}
                    {(data.sinStock > 0 || data.stockBajo > 0) && (
                        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {data.sinStock > 0 && (
                                <div style={{ background: '#fce4e4', border: '1px solid #ef9a9a', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <i className="fas fa-exclamation-circle" style={{ color: 'var(--secondary)', fontSize: '18px' }}></i>
                                        <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{data.sinStock} producto{data.sinStock !== 1 ? 's' : ''} sin stock</span>
                                        <span style={{ color: '#c62828', fontSize: '13px' }}>— Requieren reposicion urgente</span>
                                    </div>
                                    <a href="/inventario" style={{ background: 'var(--secondary)', color: 'white', padding: '6px 14px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>Ver inventario</a>
                                </div>
                            )}
                            {data.stockBajo > 0 && (
                                <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <i className="fas fa-exclamation-triangle" style={{ color: '#f57f17', fontSize: '18px' }}></i>
                                        <span style={{ fontWeight: 700, color: '#f57f17' }}>{data.stockBajo} producto{data.stockBajo !== 1 ? 's' : ''} con stock bajo</span>
                                        <span style={{ color: '#e65100', fontSize: '13px' }}>— Por debajo del minimo</span>
                                    </div>
                                    <a href="/inventario" style={{ background: '#f57f17', color: 'white', padding: '6px 14px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>Ver stock bajo</a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tarjetas */}
                    <div className="row mb-4">
                        {[
                            { titulo: 'VENTAS HOY', valor: `GS ${fmt(data.totalHoy)}`, sub: `${data.ventasHoy} venta${data.ventasHoy !== 1 ? 's' : ''}`, icon: 'fa-shopping-cart', color: 'var(--primary)', bg: 'var(--primary-light)', border: 'var(--primary)' },
                            { titulo: 'ESTA SEMANA', valor: `GS ${fmt(data.totalSemana)}`, sub: `${data.ventasSemana} ventas`, icon: 'fa-calendar-week', color: '#1565c0', bg: '#e3f2fd', border: '#1565c0' },
                            { titulo: 'VENTAS DEL PERIODO', valor: `GS ${fmt(data.totalVentas)}`, sub: `${data.cantidadVentas} ventas`, icon: 'fa-calendar-alt', color: '#6a1b9a', bg: '#f3e5f5', border: '#6a1b9a' },
                            { titulo: 'GANANCIA BRUTA', valor: `GS ${fmt(data.gananciaBruta)}`, sub: `Ticket prom: GS ${fmt(data.ticketPromedio)}`, icon: 'fa-chart-line', color: '#2e7d32', bg: '#e8f5e9', border: '#2e7d32' },
                        ].map((t, i) => (
                            <div className="col-xl-3 col-md-6 mb-3" key={i}>
                                <div style={{ background: 'white', borderRadius: '12px', padding: '20px', borderLeft: `4px solid ${t.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '8px' }}>{t.titulo}</div>
                                            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--dark)', marginBottom: '4px' }}>{t.valor}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.sub}</div>
                                        </div>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className={`fas ${t.icon}`} style={{ color: t.color, fontSize: '18px' }}></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Proyeccion */}
                    <div className="card mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <span><i className="fas fa-chart-line mr-2" style={{ color: 'var(--primary)' }}></i>Proyeccion financiera</span>
                            <small style={{ color: 'var(--text-muted)' }}>Basada en el ritmo de ventas del mes actual</small>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                {[
                                    { titulo: 'PROYECCION ESTE MES', valor: `GS ${fmt(data.proyeccionMes)}`, sub: `Faltan ${data.diasRestantesMes} dias`, bg: 'var(--primary-light)', color: 'var(--primary-dark)' },
                                    { titulo: 'PROYECCION ANUAL', valor: `GS ${fmt(data.proyeccionAnual)}`, sub: 'Si mantenes el ritmo actual', bg: '#e8f5e9', color: '#2e7d32' },
                                    { titulo: 'PROMEDIO DIARIO', valor: `GS ${fmt(data.promedioDiario)}`, sub: 'Ventas por dia este mes', bg: '#e3f2fd', color: '#1565c0' },
                                    { titulo: 'TENDENCIA VS MES ANT.', valor: `${data.tendenciaPct >= 0 ? '+' : ''}${data.tendenciaPct.toFixed(1)}%`, sub: `${data.tendenciaPct >= 0 ? 'Crecimiento' : 'Baja'} vs mes anterior`, bg: data.tendenciaPct >= 0 ? '#e8f5e9' : '#fce4e4', color: data.tendenciaPct >= 0 ? '#2e7d32' : 'var(--secondary)' },
                                ].map((t, i) => (
                                    <div className="col-md-3" key={i}>
                                        <div style={{ textAlign: 'center', padding: '16px', background: t.bg, borderRadius: '10px' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>{t.titulo}</div>
                                            <div style={{ fontSize: '20px', fontWeight: 800, color: t.color }}>{t.valor}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{t.sub}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Graficas */}
                    <div className="row mb-4">
                        {/* Grafico de barras SVG */}
                        <div className="col-12 mb-4">
                            <div className="card">
                                <div className="card-header"><i className="fas fa-chart-bar mr-2" style={{ color: 'var(--primary)' }}></i>Ventas por dia — ultimos 30 dias</div>
                                <div className="card-body">
                                    {(() => {
                                        const W = 1200, H = 220, padL = 60, padR = 20, padT = 20, padB = 40
                                        const n = ventasDia.length
                                        if (n === 0) return <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>Sin datos</div>
                                        const barW = Math.max(4, (W - padL - padR) / n - 3)
                                        const gap = (W - padL - padR - barW * n) / Math.max(n - 1, 1)
                                        const chartH = H - padT - padB
                                        const hoy = new Date().toISOString().split('T')[0]
                                        const fmtK = (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : v.toString()
                                        return (
                                            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
                                                <defs>
                                                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#D4A017" />
                                                        <stop offset="100%" stopColor="#a07010" />
                                                    </linearGradient>
                                                </defs>
                                                {[0.25, 0.5, 0.75, 1].map((pct, gi) => {
                                                    const y = padT + chartH * (1 - pct)
                                                    return (
                                                        <g key={gi}>
                                                            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#ececec" strokeWidth="1" strokeDasharray="4,3" />
                                                            <text x={padL - 6} y={y + 4} fontSize="9" textAnchor="end" fill="#bbb">{fmtK(maxVentaDia * pct)}</text>
                                                        </g>
                                                    )
                                                })}
                                                <line x1={padL} y1={padT + chartH} x2={W - padR} y2={padT + chartH} stroke="#ddd" strokeWidth="1" />
                                                {ventasDia.map((d, i) => {
                                                    const x = padL + i * (barW + gap)
                                                    const bH = maxVentaDia > 0 ? (d.total / maxVentaDia) * chartH : 0
                                                    const y = padT + chartH - Math.max(bH, d.total > 0 ? 3 : 0)
                                                    const esHoy = d.fecha === hoy
                                                    const fecha = new Date(d.fecha + 'T00:00:00')
                                                    const label = `${fecha.getDate()}/${fecha.getMonth() + 1}`
                                                    const mostrarLabel = n <= 15 || i % Math.ceil(n / 15) === 0 || esHoy
                                                    return (
                                                        <g key={i}>
                                                            <rect x={x} y={y} width={barW} height={Math.max(bH, d.total > 0 ? 3 : 1)}
                                                                fill={esHoy ? '#c62828' : d.total > 0 ? 'url(#barGrad)' : '#ececec'}
                                                                rx="3" ry="3" opacity={d.total === 0 ? 0.3 : 1}>
                                                                <title>{d.fecha}: GS {fmt(d.total)} ({d.cantidad} ventas)</title>
                                                            </rect>
                                                            {d.total > 0 && bH > 18 && (
                                                                <text x={x + barW / 2} y={y - 4} fontSize="8" textAnchor="middle"
                                                                    fill={esHoy ? '#c62828' : '#999'} fontWeight={esHoy ? '700' : '400'}>
                                                                    {fmtK(d.total)}
                                                                </text>
                                                            )}
                                                            {mostrarLabel && (
                                                                <text x={x + barW / 2} y={padT + chartH + 14} fontSize="8" textAnchor="middle"
                                                                    fill={esHoy ? '#c62828' : '#bbb'} fontWeight={esHoy ? '700' : '400'}>
                                                                    {label}
                                                                </text>
                                                            )}
                                                        </g>
                                                    )
                                                })}
                                            </svg>
                                        )
                                    })()}
                                    <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                        <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#c62828', borderRadius: '2px', marginRight: '4px' }}></span>Hoy</span>
                                        <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#D4A017', borderRadius: '2px', marginRight: '4px' }}></span>Otros dias</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="row mb-4">
                        {/* Top 5 productos */}
                        <div className="col-lg-4 mb-4">
                            <div className="card h-100">
                                <div className="card-header"><i className="fas fa-trophy mr-2" style={{ color: '#f57f17' }}></i>Top 5 productos</div>
                                <div className="card-body p-0">
                                    {data.topProductos.length === 0 ? (
                                        <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>Sin datos en el periodo</div>
                                    ) : data.topProductos.map((p, i) => {
                                        const medallas = ['#D4A017', '#9E9E9E', '#CD7F32']
                                        return (
                                            <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: i < 3 ? medallas[i] : 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', color: i < 3 ? 'white' : 'var(--primary-dark)', flexShrink: 0 }}>{i + 1}</span>
                                                    {p.imagenUrl && <img src={`${API.imagenesBase}${p.imagenUrl}`} alt={p.nombre} style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '4px' }} />}
                                                    <span style={{ fontWeight: 600, fontSize: '13px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</span>
                                                    <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--primary-dark)', flexShrink: 0 }}>{p.cantidadVendida} und.</span>
                                                </div>
                                                <MiniBar valor={p.cantidadVendida} max={data.topProductos[0].cantidadVendida} color={i === 0 ? '#D4A017' : 'var(--primary)'} />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Top 5 clientes */}
                        <div className="col-lg-4 mb-4">
                            <div className="card h-100">
                                <div className="card-header"><i className="fas fa-users mr-2" style={{ color: '#6a1b9a' }}></i>Top 5 clientes</div>
                                <div className="card-body p-0">
                                    {data.topClientes.length === 0 ? (
                                        <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>Sin datos en el periodo</div>
                                    ) : data.topClientes.map((c, i) => (
                                        <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i === 0 ? '#fff8e1' : 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px', color: i === 0 ? '#f57f17' : 'var(--primary-dark)', flexShrink: 0 }}>{i + 1}</div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.cliente}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.compras} compra{c.compras !== 1 ? 's' : ''} · GS {fmt(c.total)}</div>
                                                </div>
                                            </div>
                                            <MiniBar valor={c.total} max={data.topClientes[0].total} color={i === 0 ? '#f57f17' : '#6a1b9a'} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Torta metodos de pago */}
                        <div className="col-lg-4 mb-4">
                            <div className="card h-100">
                                <div className="card-header"><i className="fas fa-credit-card mr-2" style={{ color: 'var(--primary)' }}></i>Metodos de pago</div>
                                <div className="card-body d-flex align-items-center justify-content-center">
                                    <GraficoTorta datos={data.metodosPago.map(m => ({
                                        label: m.metodo,
                                        valor: m.total,
                                        color: m.metodo === 'EFECTIVO' ? '#2e7d32' : '#1565c0'
                                    }))} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ultimas ventas */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <span><i className="fas fa-receipt mr-2" style={{ color: 'var(--primary)' }}></i>Ultimas ventas</span>
                                    <a href="/historial" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Ver todo</a>
                                </div>
                                <div className="card-body p-0">
                                    {data.ultimasVentas.length === 0 ? (
                                        <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>Sin ventas aun</div>
                                    ) : (
                                        <table className="table table-bordered mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Factura</th><th>Cliente</th><th>Fecha y hora</th><th>Pago</th>
                                                    <th style={{ textAlign: 'right' }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.ultimasVentas.map((v, i) => (
                                                    <tr key={i}>
                                                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v.numeroFactura}</td>
                                                        <td>{v.clienteNombre || '—'}</td>
                                                        <td style={{ fontSize: '13px' }}>{new Date(v.fecha).toLocaleString('es-PY')}</td>
                                                        <td><span style={{ fontSize: '12px', color: v.metodoPago === 'EFECTIVO' ? '#2e7d32' : '#1565c0', fontWeight: 600 }}>{v.metodoPago === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'}</span></td>
                                                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary-dark)' }}>GS {fmt(v.total)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recomendaciones */}
                    <div className="row">
                        <div className="col-lg-6 mb-4">
                            <div className="card h-100">
                                <div className="card-header" style={{ background: '#e8f5e9', borderBottom: '2px solid #a5d6a7' }}>
                                    <i className="fas fa-arrow-up mr-2" style={{ color: '#2e7d32' }}></i>
                                    <span style={{ fontWeight: 700, color: '#2e7d32' }}>Reponer con urgencia</span>
                                </div>
                                <div className="card-body p-0">
                                    {data.recomendacionesReposicion.length === 0 ? (
                                        <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>No hay productos criticos</div>
                                    ) : data.recomendacionesReposicion.map((r, i) => (
                                        <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{r.nombre}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        Vendidos este mes: <strong>{r.ventasMes}</strong> · Prom. diario: <strong>{r.promedioVentaDiaria.toFixed(1)}</strong>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '16px', color: r.stockActual === 0 ? 'var(--secondary)' : '#f57f17' }}>{r.stockActual} en stock</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Min: {r.stockMinimo}</div>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: '6px', padding: '6px 10px', background: '#e8f5e9', borderRadius: '6px', fontSize: '12px', color: '#2e7d32', fontWeight: 600 }}>
                                                <i className="fas fa-lightbulb mr-1"></i>
                                                Recomendacion: comprar al menos {Math.ceil(r.promedioVentaDiaria * 15)} unidades
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6 mb-4">
                            <div className="card h-100">
                                <div className="card-header" style={{ background: '#fff8e1', borderBottom: '2px solid #ffe082' }}>
                                    <i className="fas fa-arrow-down mr-2" style={{ color: '#f57f17' }}></i>
                                    <span style={{ fontWeight: 700, color: '#f57f17' }}>Productos con bajo movimiento</span>
                                </div>
                                <div className="card-body p-0">
                                    {data.productosBajoMovimiento.length === 0 ? (
                                        <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>Todos los productos tienen movimiento normal</div>
                                    ) : data.productosBajoMovimiento.map((p, i) => (
                                        <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.nombre}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        {p.ventasMes === 0 ? 'Sin ventas este mes' : `Solo ${p.ventasMes} unidad${p.ventasMes !== 1 ? 'es' : ''} vendida${p.ventasMes !== 1 ? 's' : ''} este mes`}
                                                    </div>
                                                </div>
                                                <div style={{ fontWeight: 800, fontSize: '16px', color: '#f57f17', flexShrink: 0, marginLeft: '12px' }}>
                                                    {p.stockActual} en stock
                                                </div>
                                            </div>
                                            <div style={{ marginTop: '6px', padding: '6px 10px', background: '#fff8e1', borderRadius: '6px', fontSize: '12px', color: '#f57f17', fontWeight: 600 }}>
                                                <i className="fas fa-info-circle mr-1"></i>
                                                Evitar comprar. Considerar promocion o liquidacion
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </Layout>
    )
}