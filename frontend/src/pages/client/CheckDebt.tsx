import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function CheckDebt() {
    const [dni, setDni] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (dni.length !== 8) {
            setError('El DNI debe tener 8 dígitos');
            return;
        }

        setLoading(true);

        try {
            const response = await api.get(`/client/check-debt/${dni}`);

            if (response.data) {
                // Guardar datos del cliente en localStorage temporalmente
                localStorage.setItem('client_data', JSON.stringify(response.data));
                navigate(`/deuda/${dni}`);
            }
        } catch (err: any) {
            console.error('CheckDebt error:', err);
            const msg = err.response?.data?.error || err.message || 'Error desconocido';
            const status = err.response?.status ? ` (${err.response.status})` : '';
            setError(`${msg}${status}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #FF6600 0%, #E55A00 100%)',
            padding: '2rem'
        }}>
            <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
                    <img
                        src="/miramax-logo.png"
                        alt="MIRAMAX"
                        style={{ height: '60px', marginBottom: 'var(--spacing-4)' }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                    <h1 style={{
                        color: 'var(--secondary)',
                        marginBottom: 'var(--spacing-2)'
                    }}>
                        Consulta tu Deuda
                    </h1>
                    <p style={{ color: 'var(--gray-600)' }}>
                        Ingresa tu DNI para ver el estado de tu cuenta
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="dni" className="form-label">
                            Número de DNI
                        </label>
                        <input
                            id="dni"
                            type="text"
                            className="form-input"
                            placeholder="Ej: 12345678"
                            value={dni}
                            onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                            maxLength={8}
                            required
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading || dni.length !== 8}
                        style={{ width: '100%' }}
                    >
                        {loading ? (
                            <>
                                <div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                                Consultando...
                            </>
                        ) : (
                            'Consultar Deuda'
                        )}
                    </button>
                </form>

                {/* Staff links ONLY in full or staff mode */}
                {import.meta.env.VITE_APP_TYPE !== 'client' && (
                    <>
                        <div style={{
                            marginTop: 'var(--spacing-6)',
                            paddingTop: 'var(--spacing-4)',
                            borderTop: '1px solid var(--gray-200)',
                            textAlign: 'center'
                        }}>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                                ¿Eres cobrador de MIRAMAX?
                            </p>
                            <a href="/cobrador/login" className="btn btn-outline" style={{ marginTop: 'var(--spacing-2)' }}>
                                Iniciar Sesión como Cobrador
                            </a>
                        </div>

                        <div style={{
                            marginTop: 'var(--spacing-4)',
                            textAlign: 'center'
                        }}>
                            <a
                                href="/admin/login"
                                style={{
                                    fontSize: 'var(--font-size-sm)',
                                    color: 'var(--gray-500)',
                                    textDecoration: 'none'
                                }}
                            >
                                Acceso Administrativo
                            </a>
                        </div>
                    </>
                )}

                {/* Always show WhatsApp button for Clients/Public */}
                <div style={{
                    marginTop: 'var(--spacing-6)',
                    textAlign: 'center'
                }}>
                    <a
                        href="https://wa.me/51918762620?text=Hola,%20vengo%20de%20la%20web%20y%20necesito%20ayuda%20con%20mi%20deuda"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn"
                        style={{
                            backgroundColor: '#25D366',
                            color: 'white',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                    >
                        <span>💬</span> Ayuda por WhatsApp
                    </a>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                position: 'fixed',
                bottom: '1rem',
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center'
            }}>
                <p style={{
                    color: 'white',
                    fontSize: 'var(--font-size-sm)',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                    © 2024 MIRAMAX Internet - Servicio al Cliente
                </p>
            </div>
        </div>
    );
}
