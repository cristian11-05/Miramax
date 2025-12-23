import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { ubigeoData, getDistricts, getCaserios } from '../../data/ubigeo';

interface ZoneAssignmentModalProps {
    collector: { id: number; full_name: string; zone?: string };
    onClose: () => void;
    onSuccess: () => void;
}

interface Selection {
    district: string;
    caserios: string[];
}

export default function ZoneAssignmentModal({ collector, onClose, onSuccess }: ZoneAssignmentModalProps) {
    const [selectedRegion] = useState('La Libertad');
    const [selectedProvince, setSelectedProvince] = useState('Otuzco');
    const [activeDistrict, setActiveDistrict] = useState('');

    const [allClients, setAllClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // assignments: Record<district, Set<caserio>>
    const [selections, setSelections] = useState<Record<string, string[]>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/clients');
            setAllClients(data.clients || []);

            // Initial active district
            const districts = getDistricts(selectedRegion, selectedProvince);
            if (districts.length > 0) setActiveDistrict(districts[0]);

            // Try to infer current selections from clients already assigned to this collector
            const currentAssignments: Record<string, string[]> = {};
            data.clients.forEach((c: any) => {
                if (c.collector_id === collector.id && c.district && c.caserio) {
                    if (!currentAssignments[c.district]) currentAssignments[c.district] = [];
                    if (!currentAssignments[c.district].includes(c.caserio)) {
                        currentAssignments[c.district].push(c.caserio);
                    }
                }
            });
            setSelections(currentAssignments);

        } catch (error) {
            console.error(error);
            alert("Error cargando datos");
        } finally {
            setLoading(false);
        }
    };

    // Calculate stats per district
    const districtStats = useMemo(() => {
        const districts = getDistricts(selectedRegion, selectedProvince);
        return districts.map(d => {
            const clientsInDistrict = allClients.filter(c => c.district === d);
            const selectedCount = selections[d]?.length || 0;
            const totalCaserios = getCaserios(selectedRegion, selectedProvince, d).length;

            return {
                name: d,
                totalClients: clientsInDistrict.length,
                selectedCount,
                totalCaserios,
                isFull: selectedCount > 0 && selectedCount === totalCaserios
            };
        });
    }, [allClients, selections, selectedProvince, selectedRegion]);

    // Calculate details for active district
    const caserioStats = useMemo(() => {
        if (!activeDistrict) return [];
        const allPossible = getCaserios(selectedRegion, selectedProvince, activeDistrict);
        const selectedList = selections[activeDistrict] || [];

        return allPossible.map(name => {
            const clients = allClients.filter(c => c.district === activeDistrict && c.caserio === name);
            const isAssignedToOther = clients.some(c => c.collector_id && c.collector_id !== collector.id);
            const isAssignedToMe = clients.every(c => c.collector_id === collector.id) && clients.length > 0;

            return {
                name,
                totalClients: clients.length,
                isSelected: selectedList.includes(name),
                isAssignedToOther,
                isAssignedToMe,
                sample: clients.slice(0, 2).map(c => c.full_name).join(', ')
            };
        });
    }, [activeDistrict, allClients, selections, collector.id, selectedProvince, selectedRegion]);

    const toggleCaserio = (caserio: string) => {
        setSelections(prev => {
            const district = activeDistrict;
            const current = prev[district] || [];
            if (current.includes(caserio)) {
                return { ...prev, [district]: current.filter(c => c !== caserio) };
            } else {
                return { ...prev, [district]: [...current, caserio] };
            }
        });
    };

    const toggleAllInDistrict = () => {
        const allNames = caserioStats.map(s => s.name);
        const isAllSelected = caserioStats.every(s => s.isSelected);

        setSelections(prev => ({
            ...prev,
            [activeDistrict]: isAllSelected ? [] : allNames
        }));
    };

    const removeDistrict = (district: string) => {
        setSelections(prev => {
            const next = { ...prev };
            delete next[district];
            return next;
        });
    };

    const handleSave = async () => {
        const locations = Object.entries(selections)
            .filter(([_, caserios]) => caserios.length > 0)
            .map(([district, caserios]) => ({ district, caserios }));

        if (locations.length === 0) {
            alert("Seleccione al menos un caserío");
            return;
        }

        const summary = locations.map(l => `${l.district} (${l.caserios.length})`).join(', ');

        try {
            await api.post(`/admin/collectors/${collector.id}/assign-locations`, {
                locations,
                summary
            });
            alert('Ruta actualizada exitosamente');
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('Error al guardar la ruta');
        }
    };

    if (loading) return (
        <div className="modal-overlay">
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="spinner"></div>
                <p>Cargando información geográfica...</p>
            </div>
        </div>
    );

    const totalSelectedCaserios = Object.values(selections).reduce((sum, list) => sum + list.length, 0);

    return (
        <div className="modal-overlay" style={modalStyles.overlay}>
            <div className="card" style={modalStyles.container}>
                {/* Header */}
                <div style={modalStyles.header}>
                    <div>
                        <h2 style={modalStyles.title}>📍 Asignar Ruta Multizona</h2>
                        <p style={modalStyles.subtitle}>Configurando cobertura para <strong>{collector.full_name}</strong></p>
                    </div>
                    <button onClick={onClose} style={modalStyles.closeBtn}>✕</button>
                </div>

                {/* Main Content Split */}
                <div style={modalStyles.content}>
                    {/* Left: Districts Explorer */}
                    <div style={modalStyles.sidebar}>
                        <div style={modalStyles.sectionTitle}>Distritos</div>
                        <div style={modalStyles.scrollArea}>
                            {districtStats.map(d => (
                                <div
                                    key={d.name}
                                    onClick={() => setActiveDistrict(d.name)}
                                    style={modalStyles.districtItem(d.name === activeDistrict, d.selectedCount > 0)}
                                >
                                    <div style={{ fontWeight: 600 }}>{d.name}</div>
                                    <div style={{ display: 'flex', gap: '5px', marginTop: '2px' }}>
                                        <span style={modalStyles.miniBadge('#3B82F6')}>{d.totalClients} 👥</span>
                                        {d.selectedCount > 0 && (
                                            <span style={modalStyles.miniBadge('#10B981')}>{d.selectedCount} ✓</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Center: Caserios Checklist */}
                    <div style={modalStyles.main}>
                        <div style={modalStyles.mainHeader}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Caseríos en {activeDistrict}</h3>
                            <button onClick={toggleAllInDistrict} style={modalStyles.textBtn}>
                                {caserioStats.every(s => s.isSelected) ? 'Desmarcar Todos' : 'Seleccionar Todos'}
                            </button>
                        </div>
                        <div style={modalStyles.scrollArea}>
                            {caserioStats.map(s => (
                                <label key={s.name} style={modalStyles.caserioItem(s.isSelected)}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                        <input
                                            type="checkbox"
                                            checked={s.isSelected}
                                            onChange={() => toggleCaserio(s.name)}
                                            style={modalStyles.checkbox}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: '#1F2937' }}>{s.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                                {s.sample ? `Clientes: ${s.sample}...` : 'Sin clientes en esta zona'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, color: s.totalClients > 0 ? '#3B82F6' : '#9CA3AF' }}>
                                            {s.totalClients}
                                        </div>
                                        {s.isAssignedToOther && (
                                            <span style={{ fontSize: '0.65rem', color: '#EF4444', fontWeight: 600 }}>Ocupado ⚠️</span>
                                        )}
                                        {s.isAssignedToMe && (
                                            <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 600 }}>Actual ✓</span>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Right: Summary Cart */}
                    <div style={modalStyles.cart}>
                        <div style={modalStyles.sectionTitle}>Resumen de Ruta</div>
                        <div style={modalStyles.scrollArea}>
                            {Object.entries(selections).map(([dist, list]) => list.length > 0 && (
                                <div key={dist} style={modalStyles.cartItem}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ color: 'var(--primary)' }}>{dist}</strong>
                                        <button onClick={() => removeDistrict(dist)} style={modalStyles.removeBtn}>🗑️</button>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                                        {list.length} caseríos: {list.join(', ')}
                                    </div>
                                </div>
                            ))}
                            {totalSelectedCaserios === 0 && (
                                <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem 1rem' }}>
                                    No hay zonas seleccionadas
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={modalStyles.footer}>
                    <div style={{ marginRight: 'auto' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>{totalSelectedCaserios}</span>
                        <span style={{ color: '#6B7280', marginLeft: '5px' }}>Zonas seleccionadas</span>
                    </div>
                    <button onClick={onClose} className="btn btn-outline" style={{ borderRadius: '10px' }}>Cancelar</button>
                    <button
                        onClick={handleSave}
                        className="btn btn-primary"
                        disabled={totalSelectedCaserios === 0}
                        style={{ borderRadius: '10px', padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #FF6600 0%, #E65C00 100%)' }}
                    >
                        Guardar Ruta Completa
                    </button>
                </div>
            </div>
        </div>
    );
}

const modalStyles = {
    overlay: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000
    },
    container: {
        width: '95%',
        maxWidth: '1100px',
        height: '85vh',
        display: 'flex',
        flexDirection: 'column' as const,
        overflow: 'hidden',
        borderRadius: '20px',
        border: 'none',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    },
    header: {
        padding: '1.5rem 2rem',
        borderBottom: '1px solid #F3F4F6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff'
    },
    title: { margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#111827' },
    subtitle: { margin: '0.25rem 0 0', color: '#6B7280', fontSize: '0.9rem' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#9CA3AF' },
    content: {
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        backgroundColor: '#F9FAFB'
    },
    sidebar: {
        width: '240px',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column' as const,
        background: '#fff'
    },
    main: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        borderRight: '1px solid #E5E7EB',
        padding: '1rem'
    },
    cart: {
        width: '280px',
        display: 'flex',
        flexDirection: 'column' as const,
        background: '#fff',
        padding: '1rem'
    },
    sectionTitle: {
        padding: '1rem',
        fontSize: '0.8rem',
        fontWeight: 800,
        textTransform: 'uppercase' as const,
        color: '#9CA3AF',
        letterSpacing: '0.1em'
    },
    scrollArea: {
        flex: 1,
        overflowY: 'auto' as const,
        padding: '0 0.5rem'
    },
    districtItem: (active: boolean, hasSelection: boolean) => ({
        padding: '0.85rem 1rem',
        margin: '2px 0.5rem',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: active ? '#FFF5EB' : 'transparent',
        color: active ? '#E65C00' : '#4B5563',
        border: active ? '1px solid #FFEDD5' : '1px solid transparent',
        boxShadow: active ? '0 4px 6px -1px rgba(255, 102, 0, 0.1)' : 'none'
    }),
    caserioItem: (selected: boolean) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        marginBottom: '0.75rem',
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: selected ? '2px solid #FF6600' : '1px solid #E5E7EB',
        backgroundColor: selected ? '#FFF7ED' : '#fff',
        boxShadow: selected ? '0 10px 15px -3px rgba(255, 102, 0, 0.1)' : '0 1px 2px 0 rgba(0,0,0,0.05)'
    }),
    cartItem: {
        padding: '1rem',
        backgroundColor: '#F9FAFB',
        borderRadius: '12px',
        marginBottom: '1rem',
        border: '1px solid #E5E7EB'
    },
    removeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '5px' },
    miniBadge: (color: string) => ({
        fontSize: '0.7rem',
        padding: '2px 6px',
        borderRadius: '6px',
        backgroundColor: `${color}15`,
        color: color,
        fontWeight: 700,
        border: `1px solid ${color}30`
    }),
    mainHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 0.5rem 1rem'
    },
    textBtn: {
        background: 'none',
        border: 'none',
        color: '#3B82F6',
        fontSize: '0.85rem',
        fontWeight: 600,
        cursor: 'pointer'
    },
    checkbox: {
        width: '20px',
        height: '20px',
        accentColor: '#FF6600'
    },
    footer: {
        padding: '1.5rem 2rem',
        background: '#fff',
        borderTop: '1px solid #F3F4F6',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '1rem'
    }
}
