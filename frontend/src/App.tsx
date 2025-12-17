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

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Ruta principal - redirige al portal del cliente */}
                <Route path="/" element={<Navigate to="/consulta" replace />} />

                {/* Portal del Cliente (Público) */}
                <Route path="/consulta" element={<CheckDebt />} />
                <Route path="/deuda/:dni" element={<DebtDetails />} />
                <Route path="/pago/yape/:dni" element={<YapePayment />} />

                {/* Portal del Cobrador */}
                <Route path="/cobrador/login" element={<CollectorLogin />} />
                <Route path="/cobrador/dashboard" element={<CollectorDashboard />} />

                {/* Portal Administrativo */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/clients" element={<ClientManagement />} />
                <Route path="/admin/collectors" element={<CollectorManagement />} />
                <Route path="/admin/payments/verification" element={<PaymentVerification />} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
            </Routes>
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
