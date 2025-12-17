import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import html2canvas from 'html2canvas';

interface VerificationItem {
    debt_id: number;
    amount: string;
    month: string;
    year: string;
    client_name: string;
    dni: string;
    phone: string;
}

// Internal Component for the Receipt Visualization
const ReceiptPreview = ({ data, id }: { data: any, id: string }) => {
    return (
        <div id={id} style={{
            width: '400px', // Fixed width for consistent image
            padding: '2rem',
            backgroundColor: 'white',
            color: 'black',
            fontFamily: 'Helvetica, Arial, sans-serif',
            position: 'absolute', // Hide from view but keep in DOM for capture
            left: '-9999px',
            top: 0
        }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>MIRAMAX</h2>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Telecomunicaciones</p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem' }}>RUC: 10407658864</p>
            </div>

            <h3 style={{ textAlign: 'center', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                CONSTANCIA DE PAGO
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                <strong>Cliente:</strong> <span>{data.clientName}</span>
                <strong>DNI:</strong> <span>{data.clientDni}</span>
                <strong>Periodo:</strong> <span>{data.month} {data.year}</span>
                <strong>Fecha:</strong> <span>{new Date().toLocaleDateString('es-PE')}</span>
                <strong>Monto:</strong> <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>S/ {parseFloat(data.amount).toFixed(2)}</span>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center', color: '#10B981', fontWeight: 'bold', fontSize: '1.2rem', border: '2px solid #10B981', padding: '0.5rem' }}>
                PAGADO
            </div>

            <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.7rem', color: '#666' }}>
                Gracias por su preferencia.
            </div>
        </div>
    );
};

export default function PaymentVerification() {
    const navigate = useNavigate();
    const [verifications, setVerifications] = useState<VerificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successModal, setSuccessModal] = useState<{
        whatsappLink: string,
        debtId: number,
        clientName?: string,
        clientDni?: string,
        amount?: string,
        month?: string,
        year?: string
    } | null>(null);
    const [rejectionModal, setRejectionModal] = useState<{
        whatsappLink: string,
        debtId: number,
        clientName?: string,
        clientDni?: string,
        amount?: string,
        month?: string,
        year?: string,
        reason?: string
    } | null>(null);

    useEffect(() => {
        loadVerifications();
    }, []);

    const loadVerifications = async () => {
        try {
            const response = await api.get('/admin/payments/verification');
            setVerifications(response.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Error al cargar verificaciones');
            setLoading(false);
        }
    };

    const handleApprove = async (item: VerificationItem) => {
        try {
            setLoading(true);
            console.log('Aprobando pago:', item.debt_id);
            const response = await api.put(`/admin/payments/${item.debt_id}/verify`);
            console.log('Respuesta del servidor:', response.data);

            // Show modal instead of alerts
            setSuccessModal({
                whatsappLink: response.data.whatsappLink || '',
                debtId: item.debt_id,
                clientName: response.data.clientName || item.client_name,
                clientDni: response.data.clientDni || item.dni,
                amount: response.data.amount || item.amount,
                month: response.data.month || item.month,
                year: response.data.year || item.year
            });
            console.log('Modal configurado');
            setLoading(false);
        } catch (err: any) {
            console.error('Error al aprobar:', err);
            setLoading(false);
            alert(err.response?.data?.error || 'Error al aprobar');
        }
    };

    const handleReject = async (item: VerificationItem) => {
        const reason = prompt('Motivo del rechazo:', 'Comprobante no válido');
        if (!reason || reason.trim() === '') {
            alert('Debes ingresar un motivo para rechazar el pago');
            return;
        }

        try {
            setLoading(true);
            const response = await api.put(`/admin/payments/${item.debt_id}/reject`, { reason });
            // Show rejection modal
            setRejectionModal({
                whatsappLink: response.data.whatsappLink || '',
                debtId: item.debt_id,
                clientName: response.data.clientName || item.client_name,
                clientDni: response.data.clientDni || item.dni,
                amount: response.data.amount || item.amount,
                month: response.data.month || item.month,
                year: response.data.year || item.year,
                reason: response.data.reason || reason
            });
            setLoading(false);
        } catch (err: any) {
            setLoading(false);
            alert(err.response?.data?.error || 'Error al rechazar');
        }
    };

    const downloadImage = async () => {
        const element = document.getElementById('receipt-hidden');
        if (element) {
            try {
                // Ensure fonts are loaded etc
                element.style.left = '0'; // Temporarily bring to view if needed, or html2canvas works off-screen slightly
                // Actually html2canvas works best if element is visible. Let's try rendering it in a hidden container but "visible" processing.
                // Better approach: Render it in the modal visually as a "Preview" then capture that.

                const canvas = await html2canvas(element, { scale: 2 });
                const link = document.createElement('a');
                link.download = `Boleta_${successModal?.debtId}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();

                element.style.left = '-9999px';
            } catch (e) {
                console.error("Error generating image", e);
                alert("Error al generar imagen");
            }
        }
    };

    return (
        <div style={{ padding: '2rem', backgroundColor: 'var(--gray-50)', minHeight: '100vh' }}>
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2>Verificación de Pagos</h2>
                    <button onClick={() => navigate('/admin/dashboard')} className="btn btn-outline">
                        Volver al Dashboard
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {loading ? (
                    <p>Cargando...</p>
                ) : verifications.length === 0 ? (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-600)' }}>
                        <h3>No hay pagos pendientes de verificación</h3>
                    </div>
                ) : (
                    <div className="card" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--gray-200)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem' }}>Cliente</th>
                                    <th style={{ padding: '1rem' }}>Mes</th>
                                    <th style={{ padding: '1rem' }}>Monto</th>
                                    <th style={{ padding: '1rem' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {verifications.map((item) => (
                                    <tr key={item.debt_id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 'bold' }}>{item.client_name}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>{item.dni}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {item.month} {item.year}
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                            S/ {parseFloat(item.amount).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleApprove(item)}
                                                    className="btn"
                                                    style={{ backgroundColor: '#10B981', color: 'white', padding: '0.5rem 1rem' }}
                                                >
                                                    ✅ Aprobar
                                                </button>
                                                <button
                                                    onClick={() => handleReject(item)}
                                                    className="btn"
                                                    style={{ backgroundColor: '#EF4444', color: 'white', padding: '0.5rem 1rem' }}
                                                >
                                                    ❌ Rechazar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Success Modal */}
            {successModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ maxWidth: '500px', width: '90%', textAlign: 'center', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <h3 style={{ marginBottom: '1rem' }}>Pago Aprobado Exitosamente</h3>

                        {/* Hidden Receipt for Capture */}
                        <ReceiptPreview id="receipt-hidden" data={successModal} />

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <button
                                onClick={downloadImage}
                                className="btn btn-outline"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                🖼️ Descargar como Imagen
                            </button>

                            <a
                                href={`http://localhost:4000/api/admin/payments/${successModal.debtId}/receipt`}
                                className="btn btn-outline"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                📄 Descargar como PDF
                            </a>

                            <a
                                href={successModal.whatsappLink}
                                className="btn"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ backgroundColor: '#25D366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                💬 Abrir WhatsApp
                            </a>
                        </div>

                        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
                            * Recuerda adjuntar la imagen/PDf descargado en el chat.
                        </p>

                        <button
                            onClick={() => { setSuccessModal(null); loadVerifications(); }}
                            className="btn btn-secondary"
                            style={{ marginTop: '2rem', width: '100%' }}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {rejectionModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ maxWidth: '500px', width: '90%', textAlign: 'center', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
                        <h3 style={{ marginBottom: '1rem', color: '#EF4444' }}>Pago Rechazado</h3>

                        <div style={{ backgroundColor: '#FEE2E2', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'left' }}>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                                <strong>Cliente:</strong> {rejectionModal.clientName}
                            </p>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                                <strong>DNI:</strong> {rejectionModal.clientDni}
                            </p>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                                <strong>Periodo:</strong> {rejectionModal.month} {rejectionModal.year}
                            </p>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                                <strong>Monto:</strong> S/ {parseFloat(rejectionModal.amount || '0').toFixed(2)}
                            </p>
                            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #FCA5A5' }}>
                                <strong style={{ color: '#DC2626' }}>Motivo del rechazo:</strong>
                                <p style={{ margin: '0.5rem 0 0 0', color: '#991B1B' }}>{rejectionModal.reason}</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {rejectionModal.whatsappLink && (
                                <a
                                    href={rejectionModal.whatsappLink}
                                    className="btn"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ backgroundColor: '#25D366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    💬 Notificar al Cliente por WhatsApp
                                </a>
                            )}
                        </div>

                        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
                            El cliente será notificado del motivo del rechazo.
                        </p>

                        <button
                            onClick={() => { setRejectionModal(null); loadVerifications(); }}
                            className="btn btn-secondary"
                            style={{ marginTop: '2rem', width: '100%' }}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
