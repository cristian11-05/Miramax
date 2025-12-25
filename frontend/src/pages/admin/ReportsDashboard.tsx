import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
    TrendingUp, Users, DollarSign, Calendar, Filter,
    Download, RefreshCw, ChevronLeft, LayoutDashboard, UserCheck
} from 'lucide-react';
import api from '../../services/api';

const COLORS = ['#FF6600', '#1A1A1A', '#4ade80', '#3b82f6', '#8b5cf6', '#f59e0b'];

const ReportsDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [collectors, setCollectors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<'daily' | 'monthly' | 'annual'>('monthly');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [selectedCollector, setSelectedCollector] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    // Logic for auto-refresh
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (autoRefresh) {
            interval = setInterval(() => {
                loadData(false); // Silent refresh
            }, 30000); // 30 seconds
        }
        return () => clearInterval(interval);
    }, [autoRefresh]);

    const loadData = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const [earningsRes, collectorsRes] = await Promise.all([
                api.get('/admin/reports/earnings'),
                api.get('/admin/reports/collectors')
            ]);
            setStats(earningsRes.data);
            setCollectors(collectorsRes.data.collectors);
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-vh-100 flex-column gap-3">
                <div className="spinner" />
                <p className="text-muted animate-pulse">Analizando finanzas...</p>
            </div>
        );
    }

    const currentData = stats?.[timeframe] || [];
    const totalCollected = currentData.reduce((acc: number, curr: any) => acc + parseFloat(curr.total || 0), 0);

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
            <div className="container-fluid" style={{ maxWidth: '1400px' }}>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <div>
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="btn btn-outline mb-3 d-flex align-items-center gap-2"
                            style={{ border: 'none', color: '#64748b' }}
                        >
                            <ChevronLeft size={18} /> Volver al Panel
                        </button>
                        <h1 className="h2 fw-bold text-dark mb-1">Análisis de Ganancias</h1>
                        <p className="text-muted m-0">Control total de recaudación y rendimiento del sistema</p>
                        {autoRefresh && (
                            <span className="badge bg-success-soft text-success p-0" style={{ fontSize: '10px' }}>
                                <RefreshCw size={10} className="animate-spin" /> Actualizando en tiempo real
                            </span>
                        )}
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`btn d-flex align-items-center gap-2 ${autoRefresh ? 'btn-primary' : 'btn-white shadow-sm'}`}
                            style={{ backgroundColor: autoRefresh ? '#FF6600' : 'white', color: autoRefresh ? 'white' : '#64748b' }}
                        >
                            {autoRefresh ? 'Auto-refresco ON' : 'Auto-refresco OFF'}
                        </button>
                        <button onClick={() => loadData()} className="btn btn-white shadow-sm d-flex align-items-center gap-2" style={{ backgroundColor: 'white' }}>
                            <RefreshCw size={16} /> Actualizar
                        </button>
                        <button className="btn btn-primary d-flex align-items-center gap-2">
                            <Download size={16} /> Exportar PDF
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="row g-4 mb-5">
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm p-4 rounded-4" style={{ borderLeft: '5px solid #FF6600', backgroundColor: 'white' }}>
                            <div className="d-flex justify-content-between mb-3">
                                <div className="p-3 rounded-circle" style={{ backgroundColor: 'rgba(255,102,0,0.1)', color: '#FF6600' }}>
                                    <DollarSign size={24} />
                                </div>
                                <span className="badge bg-success-soft text-success">+12% vs mes ant.</span>
                            </div>
                            <h6 className="text-muted fw-bold mb-1">RECAUDACIÓN TOTAL</h6>
                            <h3 className="fw-bold m-0">S/ {totalCollected.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm p-4 rounded-4" style={{ borderLeft: '5px solid #1A1A1A', backgroundColor: 'white' }}>
                            <div className="d-flex justify-content-between mb-3">
                                <div className="p-3 rounded-circle" style={{ backgroundColor: 'rgba(26,26,26,0.1)', color: '#1A1A1A' }}>
                                    <UserCheck size={24} />
                                </div>
                            </div>
                            <h6 className="text-muted fw-bold mb-1">COBRADORES ACTIVOS</h6>
                            <h3 className="fw-bold m-0">{collectors.length}</h3>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm p-4 rounded-4" style={{ borderLeft: '5px solid #3b82f6', backgroundColor: 'white' }}>
                            <div className="d-flex justify-content-between mb-3">
                                <div className="p-3 rounded-circle" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                    <Calendar size={24} />
                                </div>
                            </div>
                            <h6 className="text-muted fw-bold mb-1">PROMEDIO MENSUAL</h6>
                            <h3 className="fw-bold m-0">S/ {(totalCollected / (timeframe === 'annual' ? Math.max(currentData.length, 1) : 1)).toLocaleString()}</h3>
                        </div>
                    </div>
                </div>

                {/* Main Chart Section */}
                <div className="card border-0 shadow-sm rounded-4 p-4 mb-5" style={{ backgroundColor: 'white' }}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h5 className="fw-bold m-0">Evolución de Ingresos</h5>
                            <p className="text-muted small m-0">Comparativa temporal de pagos verificados</p>
                        </div>
                        <div className="btn-group bg-light p-1 rounded-3">
                            <button
                                onClick={() => setTimeframe('daily')}
                                className={`btn btn-sm px-3 rounded-2 ${timeframe === 'daily' ? 'btn-white shadow-sm fw-bold' : 'btn-link text-muted'}`}
                                style={{ backgroundColor: timeframe === 'daily' ? 'white' : 'transparent', textDecoration: 'none' }}
                            >
                                Diario
                            </button>
                            <button
                                onClick={() => setTimeframe('monthly')}
                                className={`btn btn-sm px-3 rounded-2 ${timeframe === 'monthly' ? 'btn-white shadow-sm fw-bold' : 'btn-link text-muted'}`}
                                style={{ backgroundColor: timeframe === 'monthly' ? 'white' : 'transparent', textDecoration: 'none' }}
                            >
                                Mensual
                            </button>
                            <button
                                onClick={() => setTimeframe('annual')}
                                className={`btn btn-sm px-3 rounded-2 ${timeframe === 'annual' ? 'btn-white shadow-sm fw-bold' : 'btn-link text-muted'}`}
                                style={{ backgroundColor: timeframe === 'annual' ? 'white' : 'transparent', textDecoration: 'none' }}
                            >
                                Anual
                            </button>
                        </div>
                    </div>

                    <div style={{ height: '400px', width: '100%' }}>
                        <ResponsiveContainer>
                            {timeframe === 'daily' ? (
                                <AreaChart data={currentData}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FF6600" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#FF6600" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} tickFormatter={(val) => `S/${val}`} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="#FF6600" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" name="Recaudación" />
                                </AreaChart>
                            ) : (
                                <BarChart data={currentData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey={timeframe === 'annual' ? 'year' : 'month'} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} tickFormatter={(val) => `S/${val}`} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,102,0,0.05)' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="total" fill="#FF6600" radius={[6, 6, 0, 0]} barSize={40} name="Recaudación" />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="row g-5">
                    {/* Collector Performance */}
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ backgroundColor: 'white' }}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h5 className="fw-bold m-0">Rendimiento por Cobrador</h5>
                                    <p className="text-muted small">Haz clic en un cobrador para ver su detalle mensual</p>
                                </div>
                                <Filter size={18} className="text-muted" />
                            </div>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="border-0 rounded-start text-muted small px-4 py-3">COBRADOR</th>
                                            <th className="border-0 text-muted small py-3">ZONA</th>
                                            <th className="border-0 text-muted small py-3">COBROS</th>
                                            <th className="border-0 text-muted small py-3 px-4 text-end">TOTAL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {collectors.map((c: any, idx: number) => (
                                            <tr
                                                key={idx}
                                                onClick={() => setSelectedCollector(c)}
                                                style={{ cursor: 'pointer', backgroundColor: selectedCollector?.id === c.id ? 'rgba(255,102,0,0.05)' : 'transparent' }}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 40, height: 40, backgroundColor: COLORS[idx % COLORS.length] }}>
                                                            {c.name.charAt(0)}
                                                        </div>
                                                        <span className="fw-bold">{c.name}</span>
                                                    </div>
                                                </td>
                                                <td className="text-muted">{c.zone || 'Gral'}</td>
                                                <td>
                                                    <span className="badge rounded-pill bg-light text-dark px-3">{c.total_payments}</span>
                                                </td>
                                                <td className="px-4 text-end fw-bold text-success font-monospace">S/ {parseFloat(c.total_collected).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Collector Detail Detail or Global Distribution */}
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm rounded-4 p-4 h-100 text-center" style={{ backgroundColor: 'white' }}>
                            {selectedCollector ? (
                                <>
                                    <div className="d-flex justify-content-between align-items-center mb-4 text-start">
                                        <h5 className="fw-bold m-0">{selectedCollector.name}</h5>
                                        <button onClick={() => setSelectedCollector(null)} className="btn btn-sm btn-light">Cerrar</button>
                                    </div>
                                    <p className="text-muted small text-start mb-4">Historial de recaudación mensual</p>
                                    <div style={{ height: '250px', width: '100%' }}>
                                        <ResponsiveContainer>
                                            <BarChart data={selectedCollector.monthly_history}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                                <Bar dataKey="total" fill="#FF6600" radius={[4, 4, 0, 0]} name="Recaudado" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 text-start">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted">Total General:</span>
                                            <span className="fw-bold">S/ {parseFloat(selectedCollector.total_collected).toLocaleString()}</span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">Clientes asignados:</span>
                                            <span className="fw-bold">{selectedCollector.assigned_clients}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h5 className="fw-bold mb-4 text-start">Distribución de Cobros</h5>
                                    <div style={{ height: '300px', width: '100%' }}>
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie
                                                    data={collectors}
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    dataKey="total_collected"
                                                    nameKey="name"
                                                >
                                                    {collectors.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
                                        {collectors.slice(0, 4).map((c, idx) => (
                                            <div key={idx} className="d-flex align-items-center gap-2 small">
                                                <span className="rounded-circle" style={{ width: 10, height: 10, backgroundColor: COLORS[idx % COLORS.length] }} />
                                                <span>{c.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsDashboard;
