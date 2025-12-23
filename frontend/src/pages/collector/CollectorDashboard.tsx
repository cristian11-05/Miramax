import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import html2canvas from 'html2canvas';

interface Client {
    id: number;
    dni: string;
    full_name: string;
    phone: string;
    address: string;
    district: string;
    caserio: string;
    zone?: string;
    plan_type?: string;
    plan: string;
    internet_speed?: string;
    cost: string;
    total_debt: string;
    service_status: string;
}

interface Debt {
    id: number;
    amount: string;
    month: string;
    year: string;
    status: string;
}

const styles = {
    wrapper: {
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        paddingBottom: '2rem',
    },
    header: {
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 0',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    },
    headerFlex: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: '1.5rem',
        fontWeight: 800,
        color: '#111827',
        margin: 0,
    },
    headerSub: {
        color: '#6b7280',
        fontSize: '0.875rem',
        marginTop: '0.25rem',
    },
    logoutBtn: {
        borderColor: '#e5e7eb',
        color: '#374151',
        fontSize: '0.875rem',
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        transition: 'all 0.2s',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
    },
    statCard: {
        backgroundColor: '#ffffff',
        borderRadius: '1rem',
        padding: '1.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #f3f4f6',
    },
    statLabel: {
        color: '#6b7280',
        fontSize: '0.875rem',
        fontWeight: 600,
        marginBottom: '0.5rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
    },
    statValuePrimary: {
        fontSize: '2rem',
        fontWeight: 800,
        color: 'var(--primary)',
        margin: 0,
    },
    statValueSuccess: {
        fontSize: '2rem',
        fontWeight: 800,
        color: '#059669', // Emerald 600
        margin: 0,
    },
    statValueInfo: {
        fontSize: '2rem',
        fontWeight: 800,
        color: '#2563eb', // Blue 600
        margin: 0,
    },
    tableWrapper: {
        backgroundColor: '#ffffff',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
    },
    clientMain: {
        fontWeight: 600,
        color: '#111827',
        fontSize: '0.95rem',
    },
    clientSub: {
        color: '#6b7280',
        fontSize: '0.85rem',
    },
    planMain: {
        fontWeight: 600,
        color: '#374151',
        fontSize: '0.9rem',
    },
    planSub: {
        color: '#6b7280',
        fontSize: '0.85rem',
    },
    debtCell: {
        fontWeight: 700,
        fontSize: '1rem',
    },
    debtValue: {
        color: '#dc2626', // Red 600
    },
    alDiaText: {
        color: '#059669', // Emerald 600
        backgroundColor: '#ecfdf5',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.8rem',
        fontWeight: 600,
    },
    emptyCell: {
        textAlign: 'center' as const,
        padding: '3rem',
        color: '#9ca3af',
        fontSize: '1rem',
    },
    overlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1rem',
    },
    modal: {
        backgroundColor: '#ffffff',
        borderRadius: '1.5rem',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'modalFadeIn 0.3s ease-out',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column' as const,
        overflow: 'hidden',
    },
    modalHeader: {
        padding: '1.5rem',
        borderBottom: '1px solid #f3f4f6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        backgroundColor: '#f9fafb',
    },
    modalTitleBox: {
        flex: 1,
    },
    modalTitle: {
        fontSize: '1.25rem',
        fontWeight: 800,
        color: '#111827',
        margin: 0,
    },
    modalSub: {
        fontSize: '0.875rem',
        color: '#6b7280',
        margin: '0.25rem 0 0',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '1.5rem',
        color: '#9ca3af',
        cursor: 'pointer',
        padding: '0.5rem',
        lineHeight: 1,
        borderRadius: '0.5rem',
    },
    modalBody: {
        padding: '1.5rem',
        overflowY: 'auto' as const,
    },
    summaryBox: {
        backgroundColor: '#f3f4f6',
        borderRadius: '1rem',
        padding: '1.25rem',
        marginBottom: '1.5rem',
    },
    summaryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
        fontSize: '0.95rem',
    },
    summaryRowLast: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '0.75rem',
        paddingTop: '0.75rem',
        borderTop: '1px dashed #d1d5db',
        fontSize: '1.1rem',
        fontWeight: 700,
    },
    summaryLabel: {
        color: '#6b7280',
    },
    summaryValue: {
        color: '#111827',
        fontWeight: 600,
    },
    summaryValuePrimary: {
        color: 'var(--primary)',
        fontWeight: 800,
        fontSize: '1.25rem',
    },
    debtList: {
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        overflow: 'hidden',
    },
    debtRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #f3f4f6',
        backgroundColor: '#ffffff',
        fontSize: '0.9rem',
    },
    methodBtn: (isActive: boolean, activeColor: string, activeBg: string) => ({
        flex: 1,
        padding: '1rem',
        borderRadius: '0.75rem',
        border: `2px solid ${isActive ? activeColor : '#e5e7eb'}`,
        backgroundColor: isActive ? activeBg : '#ffffff',
        color: isActive ? activeColor : '#6b7280',
        fontWeight: 700,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '0.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
    }),
    paymentMethods: {
        display: 'flex',
        gap: '1rem',
    },
    modalFooter: {
        padding: '1.5rem',
        borderTop: '1px solid #f3f4f6',
        backgroundColor: '#f9fafb',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
    },
    confirmBtn: {
        padding: '0.75rem 1.5rem',
        borderRadius: '0.75rem',
        fontWeight: 600,
        fontSize: '1rem',
        boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)',
    },
    successIconBox: {
        width: '64px',
        height: '64px',
        backgroundColor: '#ecfdf5',
        color: '#059669',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        fontWeight: 800,
        margin: '0 auto 1.5rem',
    },
    receiptCard: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '0px', // Receipt look
        padding: '2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        marginBottom: '1.5rem',
        fontFamily: "'Courier Prime', monospace", // Receipt font if available, else generic monospace
        color: '#1f2937',
    },
    wsBtn: {
        backgroundColor: '#25D366',
        color: '#ffffff',
        fontWeight: 700,
        width: '100%',
        padding: '0.75rem',
        borderRadius: '0.75rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem',
    },
    downloadBtn: {
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        fontWeight: 700,
        width: '100%',
        padding: '0.75rem',
        borderRadius: '0.75rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem',
    },
};

export default function CollectorDashboard() {
    const { user, logout } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [stats, setStats] = useState({ todayTotal: "0.00", monthTotal: "0.00", todayVisits: 0 });
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientDebts, setClientDebts] = useState<Debt[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'yape'>('cash');
    const [processing, setProcessing] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [clientsRes, statsRes] = await Promise.all([
                api.get('/collector/clients'),
                api.get('/collector/stats')
            ]);
            setClients(clientsRes.data.clients || []);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error cargando datos:', error);
        }
    };

    const handleLogout = () => {
        if (window.confirm('¿Cerrar sesión?')) {
            logout();
        }
    };

    const openPaymentModal = async (client: Client) => {
        setSelectedClient(client);
        setClientDebts([]);
        setReceiptData(null);
        setPaymentMethod('cash');

        try {
            const res = await api.get(`/collector/clients/${client.id}/debts`);
            setClientDebts(res.data.debts || []);
        } catch (error) {
            console.error('Error obteniendo deudas:', error);
            alert('Error al cargar la deuda del cliente.');
            setSelectedClient(null);
        }
    };

    const handleRegisterPayment = async () => {
        if (!selectedClient || clientDebts.length === 0) return;
        setProcessing(true);

        try {
            const totalAmount = clientDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0);

            const res = await api.post('/collector/payments', {
                clientId: selectedClient.id,
                amount: totalAmount,
                method: paymentMethod,
                debtIds: clientDebts.map(d => d.id)
            });

            setReceiptData({
                ...res.data.payment,
                clientName: selectedClient.full_name,
                collectorName: user?.fullName || 'Cobrador',
                debts: clientDebts
            });

            // Refresh main data behind modal
            loadData();

        } catch (error) {
            console.error('Error registrando pago:', error);
            alert('No se pudo registrar el pago. Intente nuevamente.');
        } finally {
            setProcessing(false);
        }
    };

    const handleDownloadReceipt = async () => {
        if (receiptRef.current) {
            try {
                const canvas = await html2canvas(receiptRef.current);
                const link = document.createElement('a');
                link.download = `Recibo-${receiptData?.paymentId || 'Venta'}.png`;
                link.href = canvas.toDataURL();
                link.click();
            } catch (err) {
                console.error('Error generando imagen:', err);
                alert('Error al generar la imagen del recibo.');
            }
        }
    };

    const handleWhatsAppReceipt = () => {
        if (!receiptData || !selectedClient) return;

        const message = `*RECIBO DE PAGO - MIRAMAX*\n` +
            `--------------------------------\n` +
            `📅 Fecha: ${receiptData.date}\n` +
            `🧾 Recibo #: ${receiptData.paymentId}\n` +
            `👤 Cliente: ${selectedClient.full_name}\n` +
            `💰 Monto: S/ ${parseFloat(receiptData.amount).toFixed(2)}\n` +
            `💳 Método: ${paymentMethod === 'cash' ? 'EFECTIVO' : 'YAPE'}\n` +
            `--------------------------------\n` +
            `¡Gracias por su pago!`;

        const url = `https://wa.me/51${selectedClient.phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    // Grouping Helper
    const groupedClients = clients.reduce((acc, client) => {
        const district = client.district || 'Sin Distrito';
        const caserio = client.caserio || 'Sin Caserío';

        if (!acc[district]) acc[district] = {};
        if (!acc[district][caserio]) acc[district][caserio] = [];

        acc[district][caserio].push(client);
        return acc;
    }, {} as Record<string, Record<string, Client[]>>);

    // Sort districts
    const sortedDistricts = Object.keys(groupedClients).sort();

    return (
        <div style={styles.wrapper}>
            <div style={styles.header}>
                <div className="container">
                    <div style={styles.headerFlex}>
                        <div>
                            <h2 style={styles.headerTitle}>Portal del Cobrador</h2>
                            <p style={styles.headerSub}>Bienvenido, {user?.fullName}</p>
                        </div>
                        <button onClick={handleLogout} className="btn btn-outline" style={styles.logoutBtn} title="Cerrar sesión">
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>

            <div className="container">
                <div style={styles.statsGrid}>
                    <div className="card" style={styles.statCard}>
                        <p style={styles.statLabel}>Cobrado Hoy</p>
                        <p style={styles.statValuePrimary}>S/ {stats.todayTotal}</p>
                    </div>
                    <div className="card" style={styles.statCard}>
                        <p style={styles.statLabel}>Cobrado Este Mes</p>
                        <p style={styles.statValueSuccess}>S/ {stats.monthTotal}</p>
                    </div>
                    <div className="card" style={styles.statCard}>
                        <p style={styles.statLabel}>Clientes Visitados Hoy</p>
                        <p style={styles.statValueInfo}>{stats.todayVisits}</p>
                    </div>
                </div>

                <div className="card mb-4" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1rem' }}>
                    <label htmlFor="client-search" className="visually-hidden" style={{ display: 'none' }}>Buscar cliente</label>
                    <input
                        id="client-search"
                        type="text"
                        placeholder="🔍 Buscar por nombre o DNI..."
                        className="form-input"
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                        onChange={(e) => {
                            const searchTerm = e.target.value;
                            if (searchTerm.length > 2 || searchTerm.length === 0) {
                                api.get(`/collector/clients?search=${searchTerm}`).then(res => setClients(res.data.clients));
                            }
                        }}
                    />
                </div>

                <div className="card">
                    <div className="card-header" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f3f4f6' }}>
                        <h3 className="card-title" style={{ margin: 0, fontSize: '1.25rem' }}>Mis Clientes Asignados</h3>
                    </div>
                    <div style={styles.tableWrapper}>
                        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase' }}>Cliente</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase' }}>Ubicación</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase' }}>Plan</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase' }}>Deuda</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase' }}>Estado</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={styles.emptyCell}>No se encontraron clientes</td>
                                    </tr>
                                ) : (
                                    sortedDistricts.map(district => (
                                        Object.keys(groupedClients[district]).sort().map(caserio => (
                                            <React.Fragment key={`${district}-${caserio}`}>
                                                {/* Caserio Header Row */}
                                                <tr style={{ backgroundColor: '#f1f5f9' }}>
                                                    <td colSpan={6} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span style={{ fontWeight: 700, color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                                                                📍 {district} - {caserio}
                                                            </span>
                                                            <span className="badge badge-sm" style={{ backgroundColor: '#cbd5e1', color: '#1e293b', padding: '0.1rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem' }}>
                                                                {groupedClients[district][caserio].length}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {/* Clients in this Caserio */}
                                                {groupedClients[district][caserio].map(client => (
                                                    <tr key={client.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                        <td style={{ padding: '1rem' }}>
                                                            <div style={styles.clientMain}>{client.full_name}</div>
                                                            <div style={styles.clientSub}>DNI: {client.dni}</div>
                                                            <div style={styles.clientSub}>{client.phone}</div>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <div style={styles.clientMain}>{client.caserio || client.zone || '-'}</div>
                                                            <div style={styles.planSub}>{client.address}</div>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <div style={styles.planMain}>{client.plan_type || 'SERVICIO'}</div>
                                                            <div style={styles.planSub}>{client.plan} {client.internet_speed}</div>
                                                            <div style={styles.planSub}>S/ {client.cost}</div>
                                                        </td>
                                                        <td style={{ padding: '1rem', ...styles.debtCell }}>
                                                            {parseFloat(client.total_debt) > 0 ? (
                                                                <span style={styles.debtValue}>S/ {client.total_debt}</span>
                                                            ) : (
                                                                <span style={styles.alDiaText}>Al día</span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <span className={`badge ${client.service_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600 }}>
                                                                {client.service_status}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            {parseFloat(client.total_debt) > 0 && (
                                                                <button
                                                                    className="btn btn-primary btn-sm"
                                                                    onClick={() => openPaymentModal(client)}
                                                                    title={`Cobrar a ${client.full_name}`}
                                                                    style={{
                                                                        padding: '0.5rem 1rem',
                                                                        backgroundColor: 'var(--primary)',
                                                                        color: 'white',
                                                                        borderRadius: '0.375rem',
                                                                        border: 'none',
                                                                        cursor: 'pointer',
                                                                        fontWeight: 600
                                                                    }}
                                                                >
                                                                    Cobrar
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {selectedClient && (
                <div className="modal-overlay" style={styles.overlay}>
                    <div className="modal" style={styles.modal}>
                        {!receiptData ? (
                            <>
                                <div className="modal-header" style={styles.modalHeader}>
                                    <div style={styles.modalTitleBox}>
                                        <h3 className="modal-title" style={styles.modalTitle}>Registrar Cobro</h3>
                                        <p style={styles.modalSub}>Gestión de cobranza MIRAMAX</p>
                                    </div>
                                    <button onClick={() => setSelectedClient(null)} className="btn-close" style={styles.closeBtn} title="Cerrar modal">✕</button>
                                </div>
                                <div className="modal-body" style={styles.modalBody}>
                                    <div style={styles.summaryBox}>
                                        <div style={styles.summaryRow}>
                                            <span style={styles.summaryLabel}>Cliente:</span>
                                            <span style={styles.summaryValue}>{selectedClient.full_name}</span>
                                        </div>
                                        <div style={styles.summaryRowLast}>
                                            <span style={styles.summaryLabel}>Total a Pagar:</span>
                                            <span style={styles.summaryValuePrimary}>
                                                S/ {clientDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'block' }}>
                                            Método de Pago
                                        </label>
                                        <div style={styles.paymentMethods}>
                                            <button
                                                className="btn"
                                                onClick={() => setPaymentMethod('cash')}
                                                style={styles.methodBtn(paymentMethod === 'cash', 'var(--primary)', '#eff6ff')}
                                                title="Pagar con efectivo"
                                            >
                                                <span style={{ fontSize: '1.5rem' }}>💵</span>
                                                Efectivo
                                            </button>
                                            <button
                                                className="btn"
                                                onClick={() => setPaymentMethod('yape')}
                                                style={styles.methodBtn(paymentMethod === 'yape', '#742284', '#f5e8f7')}
                                                title="Pagar con Yape"
                                            >
                                                <span style={{ fontSize: '1.5rem' }}>📱</span>
                                                Yape
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Detalle de Meses:</div>
                                    {clientDebts.length > 0 ? (
                                        <div style={styles.debtList}>
                                            {clientDebts.map(debt => (
                                                <div key={debt.id} style={styles.debtRow}>
                                                    <span style={{ color: '#374151' }}>{debt.month} {debt.year}</span>
                                                    <strong style={{ color: '#111827' }}>S/ {parseFloat(debt.amount).toFixed(2)}</strong>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center' as const, padding: '1rem', color: '#9ca3af' }}>
                                            <div className="spinner-mini" style={{ margin: '0 auto 0.5rem', width: '20px', height: '20px', border: '2px solid #e5e7eb', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                            Cargando deudas...
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer" style={styles.modalFooter}>
                                    <button onClick={() => setSelectedClient(null)} className="btn" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', color: '#6b7280', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}>Cancelar</button>
                                    <button
                                        onClick={handleRegisterPayment}
                                        className="btn btn-primary"
                                        disabled={processing || clientDebts.length === 0}
                                        style={{
                                            ...styles.confirmBtn,
                                            backgroundColor: processing || clientDebts.length === 0 ? '#9ca3af' : 'var(--primary)',
                                            color: 'white',
                                            cursor: processing || clientDebts.length === 0 ? 'not-allowed' : 'pointer',
                                            border: 'none'
                                        }}
                                    >
                                        {processing ? 'Registrando...' : 'Confirmar Pago'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="modal-body" style={{ textAlign: 'center' as const, padding: '2rem' }}>
                                <div style={styles.successIconBox}>✓</div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '1.5rem' }}>¡Cobro Exitoso!</h3>

                                <div ref={receiptRef} style={styles.receiptCard}>
                                    <div style={{ textAlign: 'center' as const, marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>MIRAMAX INTERNET</h4>
                                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#6b7280' }}>Conectando tu mundo</p>
                                    </div>
                                    <div style={{ borderBottom: '1px dashed #e5e7eb', margin: '1rem 0' }}></div>
                                    <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>FECHA:</span><span style={{ fontWeight: 700 }}>{receiptData.date}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>RECIBO #:</span><span style={{ fontWeight: 700 }}>{receiptData.paymentId}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>COBRADOR:</span><span style={{ fontWeight: 700 }}>{receiptData.collectorName}</span></div>
                                        <div style={{ borderBottom: '1px dashed #e5e7eb', margin: '0.5rem 0' }}></div>
                                        <div style={{ marginBottom: '0.5rem' }}><span>CLIENTE:</span><div style={{ fontWeight: 700 }}>{receiptData.clientName}</div></div>
                                        <div style={{ borderBottom: '1px dashed #e5e7eb', margin: '0.5rem 0' }}></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', marginTop: '0.5rem' }}><span>TOTAL PAGADO:</span><span style={{ fontWeight: 900 }}>S/ {parseFloat(receiptData.amount || '0').toFixed(2)}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}><span>MÉTODO:</span><span>{paymentMethod === 'cash' ? 'EFECTIVO' : 'YAPE'}</span></div>
                                    </div>
                                    <div style={{ borderBottom: '1px dashed #e5e7eb', margin: '1rem 0' }}></div>
                                    <div style={{ textAlign: 'center' as const, fontSize: '0.7rem', color: '#6b7280' }}>¡Gracias por su preferencia!</div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' }}>
                                    <button onClick={handleWhatsAppReceipt} className="btn" style={{ ...styles.wsBtn, border: 'none', cursor: 'pointer' }} title="Enviar por WhatsApp">
                                        📲 Enviar a WhatsApp
                                    </button>
                                    <button onClick={handleDownloadReceipt} className="btn" style={{ ...styles.downloadBtn, border: 'none', cursor: 'pointer' }} title="Descargar como imagen">
                                        🖼️ Descargar Imagen
                                    </button>
                                    <button onClick={() => setSelectedClient(null)} className="btn" style={{ width: '100%', padding: '0.75rem', color: '#6b7280', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}>
                                        Finalizar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: scale(0.95) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
