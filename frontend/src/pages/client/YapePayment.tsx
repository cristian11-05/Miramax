import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function YapePayment() {
    const { dni } = useParams<{ dni: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [qrCode, setQrCode] = useState('');
    const [amount, setAmount] = useState('0');
    const [debtIds, setDebtIds] = useState<number[]>([]);
    const [yapeNumber, setYapeNumber] = useState('');
    const [paymentId, setPaymentId] = useState<number | null>(null);
    const [voucherFile, setVoucherFile] = useState<File | null>(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadYapeInfo();
    }, []);

    const loadYapeInfo = async () => {
        try {
            let totalDebt = 0;
            let debtIds: number[] = [];

            // 1. Intentar cargar de localStorage
            const cachedData = localStorage.getItem('client_data');

            if (cachedData) {
                const clientData = JSON.parse(cachedData);
                // Verificar que correspondan al DNI actual
                if (clientData.client.dni === dni) {
                    totalDebt = parseFloat(clientData.totalDebt);
                    debtIds = clientData.pendingDebts.map((d: any) => d.id);
                }
            }

            // 2. Si no hay datos (o son de otro DNI), consultar API
            if (totalDebt === 0) {
                console.log('Fetching fresh debt data for:', dni);
                const debtResponse = await api.get(`/client/check-debt/${dni}`);
                totalDebt = parseFloat(debtResponse.data.totalDebt);
                debtIds = debtResponse.data.pendingDebts.map((d: any) => d.id);
            }

            if (totalDebt === 0) {
                setError('No tienes deuda pendiente.');
                setLoading(false);
                return;
            }

            // Registrar INTENCIÓN de pago (o actualizar existente si ya hay uno pendiente?)
            // Por ahora creamos uno nuevo para simplificar
            const paymentResponse = await api.post('/client/payment', {
                dni,
                amount: totalDebt,
                debtIds: debtIds,
                paymentMethod: 'yape'
            });

            setPaymentId(paymentResponse.data.paymentId);
            setAmount(totalDebt.toFixed(2));
            setDebtIds(debtIds); // Add this line
            setDebtIds(debtIds);

            // Obtener QR de Yape y Número
            const yapeResponse = await api.get(`/client/yape-info`);
            setQrCode(yapeResponse.data.qrUrl); // Asumiendo que retorna URL si existe
            setYapeNumber(yapeResponse.data.yapeNumber);

            setLoading(false);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Error al cargar información de pago');
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setVoucherFile(e.target.files[0]);
        }
    };

    const handleUploadVoucher = async () => {
        if (!voucherFile || !paymentId) return;

        setUploadLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('voucher', voucherFile);
            formData.append('paymentId', paymentId.toString());

            await api.post('/client/upload-voucher', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al subir comprobante');
        } finally {
            setUploadLoading(false);
        }
    };

    const handleWhatsApp = async () => {
        try {
            setLoading(true);
            if (!paymentId) return; // Should be set on load

            // 1. Reportar al backend que se va a enviar comprobante
            // Obtener IDs de deuda desde el estado local o recalcular (simplificación: usar totalDebt logic de load)
            // Para simplificar, asumimos que todas las pendientes de este cliente pasan a revisión
            // O mejor, usamos los IDs que guardamos en loadYapeInfo (necesitamos guardarlos en state)

            // Recargar para tener IDs frescos si es necesario, o usar los cargados.
            // Asumiremos que tenemos `debtIds` en el state. (Necesito agregarlo al state arriba)

            await api.post('/client/report-payment', {
                dni,
                debtIds: debtIds // This state variable needs to be added
            });

            // 2. Obtener URL y redirigir
            const response = await api.get(`/client/whatsapp-url?dni=${dni}`);
            window.open(response.data.whatsappURL, '_blank');

            setSuccess(true); // Cambiar vista a "En revisión"
            setLoading(false);
        } catch (err: any) {
            console.error('Error al procesar solicitud WhatsApp:', err);
            setLoading(false);
            const errorMessage = err.response?.data?.error || 'Error al conectar. Intenta de nuevo.';
            alert(errorMessage);
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
                <p style={{ marginTop: 'var(--spacing-4)' }}>Generando QR de pago...</p>
            </div>
        );
    }

    if (success) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: 'var(--gray-50)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--spacing-4)'
            }}>
                <div className="card" style={{ maxWidth: '500px', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-4)' }}>✅</div>
                    <h2 style={{ marginBottom: 'var(--spacing-4)' }}>¡Comprobante Enviado!</h2>
                    <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--spacing-6)' }}>
                        Tu comprobante está siendo verificado. Te notificaremos cuando sea aprobado.
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexDirection: 'column' }}>
                        <button onClick={handleWhatsApp} className="btn btn-primary">
                            📱 Enviar por WhatsApp
                        </button>
                        <button onClick={() => navigate('/consulta')} className="btn btn-outline">
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--gray-50)', padding: 'var(--spacing-6)' }}>
            <div className="container" style={{ maxWidth: '600px' }}>
                <button onClick={() => navigate(`/deuda/${dni}`)} className="btn btn-outline mb-4">
                    ← Volver
                </button>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Pagar con Yape</h2>
                        <p style={{ color: 'var(--gray-600)', marginTop: 'var(--spacing-2)' }}>
                            Escanea el código QR desde la app de Yape
                        </p>
                    </div>

                    <div className="card-body">
                        {/* Monto a Pagar */}
                        <div style={{
                            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--spacing-6)',
                            textAlign: 'center',
                            marginBottom: 'var(--spacing-6)',
                            color: 'white'
                        }}>
                            <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-2)', opacity: 0.9 }}>
                                Total a Pagar
                            </p>
                            <p style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 700 }}>
                                S/ {amount}
                            </p>
                        </div>

                        {/* QR y Número */}
                        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
                            <div style={{
                                backgroundColor: '#742284',
                                color: 'white',
                                padding: 'var(--spacing-3)',
                                borderRadius: 'var(--radius)',
                                marginBottom: 'var(--spacing-4)'
                            }}>
                                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Yapear a nombre de MIRAMAX</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>918 762 620</div>
                            </div>

                            {qrCode ? (
                                <img
                                    src={qrCode}
                                    alt="QR Yape"
                                    style={{ maxWidth: '200px', borderRadius: 'var(--radius)' }}
                                />
                            ) : (
                                <div style={{
                                    width: '200px',
                                    height: '200px',
                                    backgroundColor: '#eee',
                                    margin: '0 auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#888',
                                    borderRadius: 'var(--radius)'
                                }}>
                                    QR No Disponible
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="alert alert-error mb-4">
                                {error}
                            </div>
                        )}

                        {/* Instrucciones */}
                        <div style={{
                            backgroundColor: 'var(--gray-100)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--spacing-4)',
                            marginBottom: 'var(--spacing-6)'
                        }}>
                            <h4 style={{ marginBottom: 'var(--spacing-3)' }}>📱 Pasos para pagar:</h4>
                            <ol style={{ paddingLeft: 'var(--spacing-5)', color: 'var(--gray-700)' }}>
                                <li>Abre la app de Yape</li>
                                <li>Escanea el código QR o usa el número <strong>918 762 620</strong></li>
                                <li>Verifica que el monto sea <strong>S/ {amount}</strong></li>
                                <li>Confirma el pago</li>
                                <li>Toma captura del voucher</li>
                                <li>Envíanos la captura por WhatsApp usando el botón de abajo</li>
                            </ol>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <button onClick={handleWhatsApp} className="btn btn-primary" style={{ width: '100%', fontSize: '1.2rem', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                <span>📤</span> Enviar Comprobante por WhatsApp
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
