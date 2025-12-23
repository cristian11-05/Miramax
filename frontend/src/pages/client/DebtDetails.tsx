import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SupportChatbot from '../../components/SupportChatbot';

interface ClientData {
    client: {
        fullName: string;
        address: string;
        caserio: string;
        contractNumber: string;
        plan: string;
        serviceStatus: string;
    };
    totalDebt: string;
    pendingDebts: Array<{
        id: number;
        month: string;
        year: number;
        amount: string;
    }>;
    lastPayment: string | null;
}

const styles = {
    wrapper: { minHeight: '100vh', backgroundColor: 'var(--gray-50)', padding: 'var(--spacing-6)' },
    container: { maxWidth: '900px' },
    header: { marginBottom: 'var(--spacing-6)' },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'var(--spacing-4)',
        marginBottom: 'var(--spacing-6)'
    },
    label: { fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--spacing-1)' },
    value: { fontWeight: 600 },
    debtCard: (isDebt: boolean) => ({
        background: isDebt ? '#FEE2E2' : '#D1FAE5',
        border: `3px solid ${isDebt ? 'var(--error)' : 'var(--success)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-6)',
        textAlign: 'center' as const,
        marginBottom: 'var(--spacing-6)'
    }),
    debtLabel: { fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-2)' },
    debtValue: (isDebt: boolean) => ({
        fontSize: 'var(--font-size-4xl)',
        fontWeight: 700,
        color: isDebt ? 'var(--error)' : 'var(--success)'
    }),
    tableTitle: { marginBottom: 'var(--spacing-4)' },
    tableWrapper: { overflowX: 'auto' as const },
    debtAmount: { fontWeight: 600, color: 'var(--error)' },
    actions: { marginTop: 'var(--spacing-6)', display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap' as const },
    actionBtn: { flex: 1 }
};

export default function DebtDetails() {
    const { dni } = useParams<{ dni: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<ClientData | null>(null);

    useEffect(() => {
        const cachedData = localStorage.getItem('client_data');
        if (cachedData) {
            setData(JSON.parse(cachedData));
        } else {
            navigate('/consulta');
        }
    }, [navigate]);

    if (!data) {
        return (
            <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
        );
    }

    const serviceStatusColors: Record<string, string> = {
        active: 'success',
        suspended: 'warning',
        disconnected: 'error',
        reconnecting: 'info',
    };

    const isDebt = parseFloat(data.totalDebt) > 0;

    return (
        <div style={styles.wrapper}>
            <div className="container" style={styles.container}>
                <div style={styles.header}>
                    <button
                        onClick={() => navigate('/consulta')}
                        className="btn btn-outline"
                    >
                        ← Volver a consultar
                    </button>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Información de Cliente</h2>
                    </div>

                    <div className="card-body">
                        <div style={styles.infoGrid}>
                            <div>
                                <p style={styles.label}>Nombre Completo</p>
                                <p style={styles.value}>{data.client.fullName}</p>
                            </div>
                            <div>
                                <p style={styles.label}>DNI</p>
                                <p style={styles.value}>{dni}</p>
                            </div>
                            <div>
                                <p style={styles.label}>Dirección</p>
                                <p style={styles.value}>{data.client.address || '-'}</p>
                            </div>
                            <div>
                                <p style={styles.label}>Caserío/Zona</p>
                                <p style={styles.value}>{data.client.caserio || '-'}</p>
                            </div>
                            <div>
                                <p style={styles.label}>N° Contrato</p>
                                <p style={styles.value}>{data.client.contractNumber || '-'}</p>
                            </div>
                            <div>
                                <p style={styles.label}>Plan</p>
                                <p style={styles.value}>{data.client.plan || '-'}</p>
                            </div>
                            <div>
                                <p style={styles.label}>Estado del Servicio</p>
                                <span className={`badge badge-${serviceStatusColors[data.client.serviceStatus] || 'info'}`}>
                                    {data.client.serviceStatus === 'active' && 'Activo'}
                                    {data.client.serviceStatus === 'suspended' && 'Suspendido'}
                                    {data.client.serviceStatus === 'disconnected' && 'Cortado'}
                                    {data.client.serviceStatus === 'reconnecting' && 'En Reconexión'}
                                </span>
                            </div>
                            <div>
                                <p style={styles.label}>Último Pago</p>
                                <p style={styles.value}>
                                    {data.lastPayment ? new Date(data.lastPayment).toLocaleDateString('es-PE') : 'Sin pagos'}
                                </p>
                            </div>
                        </div>

                        <div style={styles.debtCard(isDebt)}>
                            <p style={styles.debtLabel}>Deuda Total</p>
                            <p style={styles.debtValue(isDebt)}>
                                S/ {data.totalDebt}
                            </p>
                        </div>

                        {data.pendingDebts && data.pendingDebts.length > 0 && (
                            <div>
                                <h3 style={styles.tableTitle}>Meses Pendientes</h3>
                                <div style={styles.tableWrapper}>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Mes de Servicio</th>
                                                <th>Fecha de Pago</th>
                                                <th>Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.pendingDebts.map((debt) => (
                                                <tr key={debt.id}>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{debt.month} {debt.year}</div>
                                                        <div style={{ fontSize: '10px', color: 'var(--gray-500)' }}>Servicio prestado</div>
                                                    </td>
                                                    <td>
                                                        <div style={{
                                                            color: new Date(debt.dueDate) < new Date() ? 'var(--error)' : 'var(--gray-700)',
                                                            fontWeight: 600
                                                        }}>
                                                            {new Date(debt.dueDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'long' })}
                                                        </div>
                                                        <div style={{ fontSize: '10px', color: 'var(--gray-500)' }}>Vence el día 7</div>
                                                    </td>
                                                    <td style={styles.debtAmount}>
                                                        S/ {debt.amount}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {isDebt && (
                            <div style={styles.actions}>
                                <button
                                    onClick={() => navigate(`/pago/yape/${dni}`)}
                                    className="btn btn-primary btn-lg"
                                    style={styles.actionBtn}
                                >
                                    💳 Pagar con Yape
                                </button>
                            </div>
                        )}

                        {!isDebt && (
                            <div className="alert alert-success">
                                ✅ ¡Felicidades! No tienes deudas pendientes.
                            </div>
                        )}
                    </div>
                </div>
                <SupportChatbot
                    clientName={data.client.fullName}
                    serviceData={{ plan: data.client.plan, status: data.client.serviceStatus }}
                />
            </div>
        </div>
    );
}
