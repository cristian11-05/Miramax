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

export default function DebtDetails() {
    const { dni } = useParams<{ dni: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<ClientData | null>(null);

    useEffect(() => {
        const cachedData = localStorage.getItem('client_data');
        if (cachedData) {
            setData(JSON.parse(cachedData));
        } else {
            // Si no hay datos, redirigir a la consulta
            navigate('/consulta');
        }
    }, [navigate]);

    if (!data) {
        return <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
        </div>;
    }

    const serviceStatusColors: Record<string, string> = {
        active: 'success',
        suspended: 'warning',
        disconnected: 'error',
        reconnecting: 'info',
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--gray-50)', padding: 'var(--spacing-6)' }}>
            <div className="container" style={{ maxWidth: '900px' }}>
                {/* Header */}
                <div style={{ marginBottom: 'var(--spacing-6)' }}>
                    <button
                        onClick={() => navigate('/consulta')}
                        className="btn btn-outline"
                    >
                        ← Volver a consultar
                    </button>
                </div>

                {/* Card Principal */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Información de Cliente</h2>
                    </div>

                    <div className="card-body">
                        {/* Datos del Cliente */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: 'var(--spacing-4)',
                            marginBottom: 'var(--spacing-6)'
                        }}>
                            <div>
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--spacing-1)' }}>
                                    Nombre Completo
                                </p>
                                <p style={{ fontWeight: 600 }}>{data.client.fullName}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--spacing-1)' }}>
                                    DNI
                                </p>
                                <p style={{ fontWeight: 600 }}>{dni}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--spacing-1)' }}>
                                    Dirección
                                </p>
                                <p style={{ fontWeight: 600 }}>{data.client.address || '-'}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--spacing-1)' }}>
                                    Caserío/Zona
                                </p>
                                <p style={{ fontWeight: 600 }}>{data.client.caserio || '-'}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--spacing-1)' }}>
                                    N° Contrato
                                </p>
                                <p style={{ fontWeight: 600 }}>{data.client.contractNumber || '-'}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--spacing-1)' }}>
                                    Plan
                                </p>
                                <p style={{ fontWeight: 600 }}>{data.client.plan || '-'}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--spacing-1)' }}>
                                    Estado del Servicio
                                </p>
                                <span className={`badge badge-${serviceStatusColors[data.client.serviceStatus] || 'info'}`}>
                                    {data.client.serviceStatus === 'active' && 'Activo'}
                                    {data.client.serviceStatus === 'suspended' && 'Suspendido'}
                                    {data.client.serviceStatus === 'disconnected' && 'Cortado'}
                                    {data.client.serviceStatus === 'reconnecting' && 'En Reconexión'}
                                </span>
                            </div>
                            <div>
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--spacing-1)' }}>
                                    Último Pago
                                </p>
                                <p style={{ fontWeight: 600 }}>
                                    {data.lastPayment ? new Date(data.lastPayment).toLocaleDateString('es-PE') : 'Sin pagos'}
                                </p>
                            </div>
                        </div>

                        {/* Deuda Total */}
                        <div style={{
                            background: parseFloat(data.totalDebt) > 0 ? '#FEE2E2' : '#D1FAE5',
                            border: `3px solid ${parseFloat(data.totalDebt) > 0 ? 'var(--error)' : 'var(--success)'}`,
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--spacing-6)',
                            textAlign: 'center',
                            marginBottom: 'var(--spacing-6)'
                        }}>
                            <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-2)' }}>
                                Deuda Total
                            </p>
                            <p style={{
                                fontSize: 'var(--font-size-4xl)',
                                fontWeight: 700,
                                color: parseFloat(data.totalDebt) > 0 ? 'var(--error)' : 'var(--success)'
                            }}>
                                S/ {data.totalDebt}
                            </p>
                        </div>

                        {/* Detalles de Meses Pendientes */}
                        {data.pendingDebts && data.pendingDebts.length > 0 && (
                            <div>
                                <h3 style={{ marginBottom: 'var(--spacing-4)' }}>Meses Pendientes</h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Mes</th>
                                                <th>Año</th>
                                                <th>Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.pendingDebts.map((debt) => (
                                                <tr key={debt.id}>
                                                    <td>{debt.month}</td>
                                                    <td>{debt.year}</td>
                                                    <td style={{ fontWeight: 600, color: 'var(--error)' }}>
                                                        S/ {debt.amount}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Botones de Acción */}
                        {parseFloat(data.totalDebt) > 0 && (
                            <div style={{ marginTop: 'var(--spacing-6)', display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => navigate(`/pago/yape/${dni}`)}
                                    className="btn btn-primary btn-lg"
                                    style={{ flex: 1 }}
                                >
                                    💳 Pagar con Yape
                                </button>
                            </div>
                        )}

                        {parseFloat(data.totalDebt) === 0 && (
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


