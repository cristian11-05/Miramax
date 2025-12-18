import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function CollectorLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/collector/login', { username, password });

            // Guardar token y datos del cobrador
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.collector));
            localStorage.setItem('userType', 'collector');

            navigate('/cobrador/dashboard');
        } catch (err: any) {
            const errorData = err.response?.data;
            const detailedMsg = errorData?.message ? `${errorData.error}: ${errorData.message}` : (errorData?.error || 'Error al iniciar sesión');
            setError(detailedMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #1A1A1A 0%, #333333 100%)',
            padding: '2rem'
        }}>
            <div className="card" style={{ maxWidth: '450px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                        borderRadius: 'var(--radius-full)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--spacing-4)',
                        fontSize: '2rem'
                    }}>
                        👤
                    </div>
                    <h1 style={{ color: 'var(--secondary)', marginBottom: 'var(--spacing-2)' }}>
                        Portal del Cobrador
                    </h1>
                    <p style={{ color: 'var(--gray-600)' }}>
                        Ingresa tus credenciales de acceso
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username" className="form-label">
                            Usuario
                        </label>
                        <input
                            id="username"
                            type="text"
                            className="form-input"
                            placeholder="Tu usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                        style={{ width: '100%' }}
                    >
                        {loading ? (
                            <>
                                <div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                                Iniciando sesión...
                            </>
                        ) : (
                            'Iniciar Sesión'
                        )}
                    </button>
                </form>

                <div style={{
                    marginTop: 'var(--spacing-6)',
                    paddingTop: 'var(--spacing-4)',
                    borderTop: '1px solid var(--gray-200)',
                    textAlign: 'center'
                }}>
                    <a
                        href="/consulta"
                        style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--gray-600)',
                            textDecoration: 'none'
                        }}
                    >
                        ← Volver a consulta de deuda
                    </a>
                </div>
            </div>
        </div>
    );
}
