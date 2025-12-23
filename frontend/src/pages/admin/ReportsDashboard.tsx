import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const styles = {
    wrapper: { minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 0' },
    backBtn: { marginBottom: '1.5rem', backgroundColor: '#fff', border: '1px solid #e5e7eb' },
    title: { fontSize: '2rem', fontWeight: 800, marginBottom: '2rem', color: '#111827' },
    summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' },
    summaryCard: { padding: '1.5rem', borderRadius: '1.25rem', border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', backgroundColor: 'white' },
    summaryLabel: { color: '#6b7280', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' },
    summaryValue: (color: string) => ({ fontSize: '2rem', fontWeight: 800, color, margin: 0 }),
    detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' },
    mainCard: { padding: '2rem', borderRadius: '1.5rem', backgroundColor: 'white' },
    cardTitle: { fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem' },
    chartContainer: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', gap: '1rem', paddingBottom: '2rem', borderBottom: '1px solid #f3f4f6' },
    chartBarWrapper: { flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '0.5rem' },
    chartBar: (height: string) => ({
        width: '100%',
        height,
        backgroundColor: '#3b82f6',
        borderRadius: '0.5rem 0.5rem 0 0',
        minHeight: '4px',
        transition: 'height 1s ease-out'
    }),
    chartLabel: { fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', writingMode: 'vertical-rl' as const, transform: 'rotate(180deg)' },
    collectorList: { display: 'flex', flexDirection: 'column' as const, gap: '1rem' },
    collectorItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '1rem' },
    collectorInfo: { fontWeight: 700, margin: 0 },
    collectorSub: { fontSize: '0.75rem', color: '#6b7280', margin: 0 },
    collectorTotal: { fontWeight: 800, color: '#10b981' }
};

const ReportsDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await api.get('/admin/reports');
            setData(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading reports:', error);
            setLoading(false);
        }
    };

    if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Generando reportes...</div>;
    if (!data) return <div className="container">Error al cargar datos.</div>;

    const maxMonthly = Math.max(...data.monthlyCollection.map((m: any) => parseFloat(m.total)), 1);

    return (
        <div style={styles.wrapper}>
            <div className="container">
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="btn"
                    style={styles.backBtn}
                    title="Volver al panel"
                >
                    ← Volver al Panel
                </button>

                <h1 style={styles.title}>Reportes y Estadísticas</h1>

                {/* Summary Cards */}
                <div style={styles.summaryGrid}>
                    <div className="card" style={styles.summaryCard}>
                        <p style={styles.summaryLabel}>RECAUDACIÓN TOTAL</p>
                        <p style={styles.summaryValue('#10b981')}>S/ {Number(data.totalCollected).toLocaleString()}</p>
                    </div>
                    <div className="card" style={styles.summaryCard}>
                        <p style={styles.summaryLabel}>DEUDAS PENDIENTES</p>
                        <p style={styles.summaryValue('#ef4444')}>
                            {data.debtSummary.find((s: any) => s.status === 'pending')?.count || 0}
                        </p>
                    </div>
                    <div className="card" style={styles.summaryCard}>
                        <p style={styles.summaryLabel}>COBRADORES</p>
                        <p style={styles.summaryValue('#3b82f6')}>{data.collectorPerformance.length}</p>
                    </div>
                </div>

                <div style={styles.detailGrid}>
                    {/* Monthly Chart (CSS Based) */}
                    <div className="card" style={styles.mainCard}>
                        <h2 style={styles.cardTitle}>Recaudación Mensual (Últimos 6 meses)</h2>
                        <div style={styles.chartContainer}>
                            {data.monthlyCollection.slice().reverse().map((m: any) => (
                                <div key={m.month_id} style={styles.chartBarWrapper}>
                                    <div style={styles.chartBar(`${(parseFloat(m.total) / maxMonthly) * 100}%`)}></div>
                                    <span style={styles.chartLabel}>{m.month_name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Collector Performance */}
                    <div className="card" style={styles.mainCard}>
                        <h2 style={{ ...styles.cardTitle, marginBottom: '1.5rem' }}>Rendimiento de Cobradores</h2>
                        <div style={styles.collectorList}>
                            {data.collectorPerformance.map((c: any) => (
                                <div key={c.full_name} style={styles.collectorItem}>
                                    <div>
                                        <p style={styles.collectorInfo}>{c.full_name}</p>
                                        <p style={styles.collectorSub}>{c.payments_count} cobros realizados</p>
                                    </div>
                                    <div style={styles.collectorTotal}>
                                        S/ {Number(c.total_collected).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsDashboard;
