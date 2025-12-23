interface Client {
    id: number;
    dni: string;
    full_name: string;
    phone: string;
    address: string;
    district: string; // Added district
    caserio: string;
    zone?: string;
    plan_type?: string;
    plan: string;
    internet_speed?: string;
    cost: string;
    total_debt: string;
    service_status: string;
}

// ... styles remain same ...

export default function CollectorDashboard() {
    // ... state remains same ...

    // ... loadData, handlers remain same ...

    // Grouping Helper
    const groupedClients = clients.reduce((acc, client) => {
        const district = client.district || 'Sin Distrito';
        const caserio = client.caserio || 'Sin Caserío';

        if (!acc[district]) acc[district] = {};
        if (!acc[district][caserio]) acc[district][caserio] = [];

        acc[district][caserio].push(client);
        return acc;
    }, {} as Record<string, Record<string, Client[]>>);

    // Sort districts and caserios alphabetically, but put "Sin ..." at the end if needed (optional simple sort)
    const sortedDistricts = Object.keys(groupedClients).sort();

    return (
        <div style={styles.wrapper}>
            {/* ... header and stats ... */}
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

                <div className="card mb-4">
                    <label htmlFor="client-search" className="visually-hidden" style={{ display: 'none' }}>Buscar cliente</label>
                    <input
                        id="client-search"
                        type="text"
                        placeholder="Buscar cliente por nombre o DNI..."
                        className="form-input"
                        title="Ingrese nombre o DNI para filtrar"
                        onChange={(e) => {
                            const searchTerm = e.target.value;
                            if (searchTerm.length > 2 || searchTerm.length === 0) {
                                api.get(`/collector/clients?search=${searchTerm}`).then(res => setClients(res.data.clients));
                            }
                        }}
                    />
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Mis Clientes Asignados</h3>
                    </div>
                    <div style={styles.tableWrapper}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Ubicación</th>
                                    <th>Plan / Servicio</th>
                                    <th>Deuda Total</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
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
                                            <>
                                                {/* Caserio Header Row */}
                                                <tr key={`${district}-${caserio}`} style={{ backgroundColor: '#f9fafb' }}>
                                                    <td colSpan={6} style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e5e7eb' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                                                                📍 {district} - {caserio}
                                                            </span>
                                                            <span className="badge badge-sm" style={{ backgroundColor: '#e5e7eb', color: '#374151' }}>
                                                                {groupedClients[district][caserio].length}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {/* Clients in this Caserio */}
                                                {groupedClients[district][caserio].map(client => (
                                                    <tr key={client.id}>
                                                        <td>
                                                            <div style={styles.clientMain}>{client.full_name}</div>
                                                            <div style={styles.clientSub}>DNI: {client.dni}</div>
                                                            <div style={styles.clientSub}>{client.phone}</div>
                                                        </td>
                                                        <td>
                                                            <div style={styles.clientMain}>{client.caserio || client.zone || '-'}</div>
                                                            <div style={styles.planSub}>{client.address}</div>
                                                        </td>
                                                        <td>
                                                            <div style={styles.planMain}>{client.plan_type || 'SERVICIO'}</div>
                                                            <div style={styles.planSub}>{client.plan} {client.internet_speed}</div>
                                                            <div style={styles.planSub}>S/ {client.cost}</div>
                                                        </td>
                                                        <td style={styles.debtCell}>
                                                            {parseFloat(client.total_debt) > 0 ? (
                                                                <span style={styles.debtValue}>S/ {client.total_debt}</span>
                                                            ) : (
                                                                <span style={styles.alDiaText}>Al día</span>
                                                            )}
                                                        </td>
                                                        <td style={styles.debtCell}>
                                                            <span className={`badge badge-${client.service_status === 'active' ? 'success' : 'error'}`}>
                                                                {client.service_status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {parseFloat(client.total_debt) > 0 && (
                                                                <button
                                                                    className="btn btn-primary btn-sm"
                                                                    onClick={() => openPaymentModal(client)}
                                                                    title={`Cobrar a ${client.full_name}`}
                                                                >
                                                                    Cobrar
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </>
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
                                                style={styles.methodBtn(paymentMethod === 'cash', 'var(--primary)', '#fff5f0')}
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
                                            <div className="spinner-mini" style={{ margin: '0 auto 0.5rem' }}></div>
                                            Cargando deudas...
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer" style={styles.modalFooter}>
                                    <button onClick={() => setSelectedClient(null)} className="btn" style={{ color: '#6b7280', fontWeight: 600 }}>Cancelar</button>
                                    <button
                                        onClick={handleRegisterPayment}
                                        className="btn btn-primary"
                                        disabled={processing || clientDebts.length === 0}
                                        style={styles.confirmBtn}
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
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', marginTop: '0.5rem' }}><span>TOTAL PAGADO:</span><span style={{ fontWeight: 900 }}>S/ {receiptData.amount.toFixed(2)}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}><span>MÉTODO:</span><span>{paymentMethod === 'cash' ? 'EFECTIVO' : 'YAPE'}</span></div>
                                    </div>
                                    <div style={{ borderBottom: '1px dashed #e5e7eb', margin: '1rem 0' }}></div>
                                    <div style={{ textAlign: 'center' as const, fontSize: '0.7rem', color: '#6b7280' }}>¡Gracias por su preferencia!</div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' }}>
                                    <button onClick={handleWhatsAppReceipt} className="btn" style={styles.wsBtn} title="Enviar por WhatsApp">
                                        📲 Enviar a WhatsApp
                                    </button>
                                    <button onClick={handleDownloadReceipt} className="btn" style={styles.downloadBtn} title="Descargar como imagen">
                                        🖼️ Descargar Imagen
                                    </button>
                                    <button onClick={() => setSelectedClient(null)} className="btn" style={{ width: '100%', padding: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
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
                .spinner-mini {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
