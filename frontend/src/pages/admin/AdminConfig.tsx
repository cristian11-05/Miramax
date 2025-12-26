import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const styles = {
    wrapper: { minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 0' },
    backBtn: { marginBottom: '1.5rem', backgroundColor: '#fff', border: '1px solid #e5e7eb' },
    title: { fontSize: '2rem', fontWeight: 800, marginBottom: '2rem', color: '#111827' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' },
    card: { padding: '2rem', borderRadius: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
    cardHeader: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
    iconBox: (bgColor: string) => ({ fontSize: '2rem', backgroundColor: bgColor, padding: '0.75rem', borderRadius: '1rem' }),
    cardTitle: { fontSize: '1.25rem', fontWeight: 700, margin: 0 },
    label: { fontWeight: 600 },
    inputGroup: { display: 'flex', gap: '0.5rem' },
    roundedInput: { borderRadius: '0.75rem' },
    saveBtn: { borderRadius: '0.75rem', padding: '0 1.5rem' },
    hintText: { fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' },
    divider: { borderTop: '1px solid #f3f4f6', paddingTop: '1.5rem' },
    qrBox: {
        backgroundColor: '#f9fafb',
        border: '2px dashed #e5e7eb',
        borderRadius: '1.25rem',
        padding: '2rem',
        textAlign: 'center' as const,
        marginBottom: '1rem',
        position: 'relative' as const,
        overflow: 'hidden' as const
    },
    qrImage: { maxWidth: '100%', maxHeight: '250px', borderRadius: '0.75rem', border: '1px solid #eee' },
    noQr: { color: '#9ca3af' },
    fileInput: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0,
        cursor: 'pointer'
    },
    fullWidthBtn: { width: '100%', borderRadius: '0.75rem', padding: '0.75rem' },
    wsStatus: { padding: '1.5rem', backgroundColor: '#f0fdf4', borderRadius: '1rem', border: '1px solid #dcfce7', marginBottom: '1.5rem' },
    wsStatusTitle: { fontSize: '1rem', fontWeight: 700, color: '#166534', marginBottom: '0.5rem' },
    statusDot: { width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    dot: { width: '10px', height: '10px', backgroundColor: '#22c55e', borderRadius: '50%' },
    dangerCard: { padding: '2rem', borderRadius: '1.5rem', border: '2px solid #fee2e2', backgroundColor: '#fffafb', marginTop: '2rem' },
    dangerTitle: { color: '#991b1b', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }
};

const AdminConfig: React.FC = () => {
    const navigate = useNavigate();
    const [config, setConfig] = useState<any>({
        yape_number: '',
        yape_qr_url: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const res = await api.get('/admin/config');
            setConfig(res.data.config);
            setLoading(false);
        } catch (error) {
            console.error('Error loading config:', error);
            setLoading(false);
        }
    };

    const handleUpdateNumber = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/admin/config', { yapeNumber: config.yape_number });
            alert('Número de Yape actualizado correctamente.');
        } catch (error) {
            console.error('Error updating number:', error);
            alert('Error al actualizar el número.');
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleUploadQR = async () => {
        if (!file) return;
        setSaving(true);
        const formData = new FormData();
        formData.append('qr', file);

        try {
            const res = await api.post('/admin/config/yape-qr', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setConfig({ ...config, yape_qr_url: res.data.file });
            alert('QR de Yape actualizado correctamente.');
            setFile(null);
            setPreviewUrl(null);
        } catch (error) {
            console.error('Error uploading QR:', error);
            alert('Error al subir el QR.');
        } finally {
            setSaving(false);
        }
    };

    const handleResetSystem = async () => {
        const confirm1 = window.confirm('⚠️ ATENCIÓN: Estás a punto de borrar TODOS los clientes, cobradores, deudas y pagos. Esta acción no se puede deshacer. ¿Deseas continuar?');
        if (!confirm1) return;

        const passwordInput = window.prompt('Para confirmar el reinicio total, ingresa la clave de seguridad:');
        if (!passwordInput) return;

        const password = passwordInput.trim();

        if (password !== 'miramax.net') {
            alert('Contraseña incorrecta. El sistema no ha sido reiniciado.');
            return;
        }

        const confirm2Input = window.prompt('ÚLTIMA CONFIRMACIÓN: Escribe "BORRAR TODO" para proceder:');
        if (!confirm2Input) return;

        const confirm2 = confirm2Input.trim().toUpperCase();
        if (confirm2 !== 'BORRAR TODO') {
            alert('Confirmación incorrecta. El sistema no ha sido reiniciado.');
            return;
        }

        setSaving(true);
        try {
            await api.post('/admin/system/reset', { password });
            alert('¡El sistema ha sido reiniciado con éxito! Todos los datos han sido eliminados.');
            window.location.reload();
        } catch (error: any) {
            console.error('Error resetting system:', error);
            alert(error.response?.data?.error || 'Error al reiniciar el sistema. Verifica los permisos.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Cargando configuración...</div>;

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

                <h1 style={styles.title}>Configuración del Sistema</h1>

                <div style={styles.grid}>
                    {/* Yape Config */}
                    <div className="card" style={styles.card}>
                        <div style={styles.cardHeader}>
                            <div style={styles.iconBox('#74228415')}>📱</div>
                            <h2 style={styles.cardTitle}>Parámetros de Yape</h2>
                        </div>

                        <form onSubmit={handleUpdateNumber} style={{ marginBottom: '2rem' }}>
                            <label htmlFor="yape-number" className="form-label" style={styles.label}>Número de Yape</label>
                            <div style={styles.inputGroup}>
                                <input
                                    id="yape-number"
                                    type="text"
                                    className="form-control"
                                    value={config.yape_number || ''}
                                    onChange={(e) => setConfig({ ...config, yape_number: e.target.value })}
                                    placeholder="p.ej. 987654321"
                                    style={styles.roundedInput}
                                    title="Ingresar número de Yape"
                                />
                                <button type="submit" className="btn btn-primary" disabled={saving} style={styles.saveBtn}>
                                    {saving ? '...' : 'Guardar'}
                                </button>
                            </div>
                            <p style={styles.hintText}>Este número aparecerá a los clientes al elegir pago por Yape.</p>
                        </form>

                        <div style={styles.divider}>
                            <label htmlFor="qr-upload" className="form-label" style={styles.label}>Código QR de Yape</label>

                            <div style={styles.qrBox}>
                                {(previewUrl || config.yape_qr_url) ? (
                                    <img
                                        src={previewUrl || `${import.meta.env.VITE_API_URL}/uploads/${config.yape_qr_url}`}
                                        alt="QR de Yape"
                                        style={styles.qrImage}
                                    />
                                ) : (
                                    <div style={styles.noQr}>
                                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🖼️</div>
                                        No hay QR configurado
                                    </div>
                                )}
                                <input
                                    id="qr-upload"
                                    type="file"
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    style={styles.fileInput}
                                    title="Seleccionar imagen QR"
                                />
                            </div>

                            {file && (
                                <button
                                    onClick={handleUploadQR}
                                    className="btn btn-primary"
                                    disabled={saving}
                                    style={styles.fullWidthBtn}
                                >
                                    {saving ? 'Subiendo...' : 'Actualizar Imagen QR'}
                                </button>
                            )}
                            <p style={{ ...styles.hintText, textAlign: 'center' }}>Haz clic en el recuadro para seleccionar una nueva imagen.</p>
                        </div>
                    </div>

                    {/* WhatsApp & Other Config */}
                    <div className="card" style={styles.card}>
                        <div style={styles.cardHeader}>
                            <div style={styles.iconBox('#25D36615')}>💬</div>
                            <h2 style={styles.cardTitle}>Comunicaciones WhatsApp</h2>
                        </div>

                        <div style={styles.wsStatus}>
                            <h3 style={styles.wsStatusTitle}>Estado del Servicio</h3>
                            <div style={styles.statusDot}>
                                <div style={styles.dot}></div>
                                <span style={{ color: '#166534', fontWeight: 600 }}>API Conectada (v2.4)</span>
                            </div>
                        </div>

                        <div style={{ opacity: 0.6 }}>
                            <label htmlFor="welcome-msg" className="form-label" style={styles.label}>Mensaje de Bienvenida</label>
                            <textarea
                                id="welcome-msg"
                                className="form-control"
                                rows={3}
                                defaultValue="¡Hola! Bienvenido al soporte de MIRAMAX. En breve un asesor te atenderá."
                                style={{ ...styles.roundedInput, marginBottom: '1rem' }}
                                disabled
                                title="Mensaje de bienvenida automático"
                            ></textarea>

                            <label htmlFor="receipt-signature" className="form-label" style={styles.label}>Firma de Comprobantes</label>
                            <input
                                id="receipt-signature"
                                type="text"
                                className="form-control"
                                defaultValue="MIRAMAX | Conectando tu mundo"
                                style={styles.roundedInput}
                                disabled
                                title="Firma personalizada para comprobantes"
                            />
                        </div>
                        <p style={{ ...styles.hintText, marginTop: '1rem', fontStyle: 'italic' }}>Las opciones de personalización de mensajes estarán disponibles en la próxima actualización.</p>
                    </div>
                </div>

                {/* Danger Zone */}
                <div style={styles.dangerCard}>
                    <h2 style={styles.dangerTitle}>⚠️ Zona de Peligro</h2>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <p className="fw-bold m-0 text-danger">Reiniciar Base de Datos</p>
                            <p className="text-muted small m-0">Borra de forma permanente todos los clientes, deudas y pagos. No afecta a tu usuario administrador.</p>
                        </div>
                        <button
                            onClick={handleResetSystem}
                            className="btn btn-danger px-4"
                            disabled={saving}
                            style={{ borderRadius: '0.75rem' }}
                        >
                            {saving ? 'Procesando...' : 'Borrar Todo'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminConfig;
