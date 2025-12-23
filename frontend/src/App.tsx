import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages - Client Portal  
import CheckDebt from './pages/client/CheckDebt';
import DebtDetails from './pages/client/DebtDetails';
import YapePayment from './pages/client/YapePayment';

// Pages - Collector Portal
import CollectorLogin from './pages/collector/CollectorLogin';
import CollectorDashboard from './pages/collector/CollectorDashboard';

// Pages - Admin Portal
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ClientManagement from './pages/admin/ClientManagement';
import CollectorManagement from './pages/admin/CollectorManagement';
import PaymentVerification from './pages/admin/PaymentVerification';
import DebtManagement from './pages/admin/DebtManagement';
import AdminConfig from './pages/admin/AdminConfig';
import ReportsDashboard from './pages/admin/ReportsDashboard';
import StaffSelection from './pages/staff/StaffSelection';


function App() {
    const APP_TYPE = import.meta.env.VITE_APP_TYPE || 'full'; // 'client', 'staff', or 'full'
    console.log("🚀 MIRAMAX Portal Mode:", APP_TYPE);

    return (
        <BrowserRouter>
            <Routes>
                {/* 1. LOGICA DE PORTAL DE CLIENTES */}
                {(APP_TYPE === 'client' || APP_TYPE === 'full') && (
                    <>
                        <Route path="/" element={<Navigate to="/consulta" replace />} />
                        <Route path="/consulta" element={<CheckDebt />} />
                        <Route path="/deuda/:dni" element={<DebtDetails />} />
                        <Route path="/pago/yape/:dni" element={<YapePayment />} />
                    </>
                )}

                {/* 2. LOGICA DE PORTAL DE PERSONAL (Staff) */}
                {(APP_TYPE === 'staff' || APP_TYPE === 'full') && (
                    <>
                        {/* Pantalla de selección para el personal (Admin o Cobrador) */}
                        {APP_TYPE === 'staff' && (
                            <Route path="/" element={<StaffSelection />} />
                        )}

                        <Route path="/cobrador/login" element={<CollectorLogin />} />
                        <Route path="/cobrador/dashboard" element={<CollectorDashboard />} />
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/clients" element={<ClientManagement />} />
                        <Route path="/admin/collectors" element={<CollectorManagement />} />
                        <Route path="/admin/payments/verification" element={<PaymentVerification />} />
                        <Route path="/admin/debts" element={<DebtManagement />} />
                        <Route path="/admin/config" element={<AdminConfig />} />
                        <Route path="/admin/reports" element={<ReportsDashboard />} />
                    </>
                )}

                {/* Catch-all para rutas no permitidas en el portal actual */}
                <Route path="*" element={<Navigate to="/" replace />} />

                {/* 404 (Opcional, ahora redirigimos al inicio del portal) */}
                {/* <Route path="*" element={<NotFound />} /> */}
            </Routes>
            <div style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '10px', color: 'rgba(0,0,0,0.2)', pointerEvents: 'none' }}>v1.1.2</div>
        </BrowserRouter>
    );
}

// Componente 404
function NotFound() {
    return (
        <div className="container" style={{ textAlign: 'center', paddingTop: '5rem' }}>
            <h1 style={{ fontSize: '6rem', color: 'var(--primary)' }}>404</h1>
            <h2>Página no encontrada</h2>
            <p style={{ marginTop: '1rem' }}>
                <a href="/consulta" className="btn btn-primary">Volver al inicio</a>
            </p>
        </div>
    );
}

export default App;
