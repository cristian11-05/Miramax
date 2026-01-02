import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ChevronLeft, RefreshCw, MessageSquare } from 'lucide-react';

interface ChatbotReport {
    id: number;
    collector_id: number;
    collector_name: string;
    report_date: string;
    content: string | Record<string, unknown>;
    status: string;
    created_at: string;
}

interface Collector {
    id: number;
    full_name: string;
}

interface FilterState {
    collectorId: string;
    date: string;
}

export default function ChatbotReports() {
    const navigate = useNavigate();
    const [reports, setReports] = useState<ChatbotReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [collectors, setCollectors] = useState<Collector[]>([]);
    const [filters, setFilters] = useState<FilterState>({
        collectorId: '',
        date: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        loadReports();
    }, [filters]);

    const loadData = async () => {
        try {
            const res = await api.get('/admin/collectors');
            setCollectors(res.data.collectors || []);
        } catch (error) {
            console.error('Error loading collectors', error);
        }
    };

    const loadReports = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (filters.collectorId) queryParams.append('collectorId', filters.collectorId);
            if (filters.date) queryParams.append('date', filters.date);

            const res = await api.get(`/admin/reports/chatbot?${queryParams.toString()}`);
            setReports(res.data.reports || []);
            setLoading(false);
        } catch (error) {
            console.error('Error loading reports', error);
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-light min-vh-100">
            <div className="container-fluid" style={{ maxWidth: '1400px' }}>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="btn btn-outline mb-2 d-flex align-items-center gap-2 border-0 text-muted"
                        >
                            <ChevronLeft size={18} /> Volver al Panel
                        </button>
                        <h1 className="h2 fw-bold text-dark mb-1">Reportes del Chatbot</h1>
                        <p className="text-muted m-0">Historial de interacciones y reportes generados por IA</p>
                    </div>
                    <button onClick={loadReports} className="btn btn-white shadow-sm d-flex align-items-center gap-2">
                        <RefreshCw size={16} /> Actualizar
                    </button>
                </div>

                {/* Filters */}
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-body d-flex gap-3 align-items-end">
                        <div className="flex-grow-1">
                            <label htmlFor="collector-filter" className="form-label small text-muted">Filtrar por Cobrador</label>
                            <select
                                id="collector-filter"
                                className="form-select"
                                value={filters.collectorId}
                                onChange={(e) => setFilters(prev => ({ ...prev, collectorId: e.target.value }))}
                            >
                                <option value="">Todos los cobradores</option>
                                {collectors.map(c => (
                                    <option key={c.id} value={String(c.id)}>{c.full_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-grow-1">
                            <label htmlFor="date-filter" className="form-label small text-muted">Fecha</label>
                            <input
                                id="date-filter"
                                type="date"
                                className="form-control"
                                value={filters.date}
                                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>

                {/* Reports List */}
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status" />
                        <p className="mt-2 text-muted">Cargando reportes...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <MessageSquare size={48} className="mb-3 opacity-25" />
                        <p>No se encontraron reportes para los filtros seleccionados.</p>
                    </div>
                ) : (
                    <div className="row g-4">
                        {reports.map((report) => (
                            <div key={report.id} className="col-12 col-lg-6">
                                <div className="card border-0 shadow-sm h-100">
                                    <div className="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center py-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary">
                                                <MessageSquare size={20} />
                                            </div>
                                            <div>
                                                <h6 className="mb-0 fw-bold">{report.collector_name || 'Sin asignar'}</h6>
                                                <small className="text-muted">
                                                    {new Date(report.report_date).toLocaleDateString()}
                                                </small>
                                            </div>
                                        </div>
                                        <span className={`badge ${report.status === 'success' ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'}`}>
                                            {report.status}
                                        </span>
                                    </div>
                                    <div className="card-body">
                                        <div className="bg-light p-3 rounded overflow-auto" style={{ maxHeight: '300px' }}>
                                            <pre className="mb-0 text-wrap">
                                                {typeof report.content === 'string'
                                                    ? report.content
                                                    : JSON.stringify(report.content, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                    <div className="card-footer bg-white border-top-0 text-end">
                                        <small className="text-muted">
                                            Generado: {new Date(report.created_at).toLocaleString()}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
