import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

interface ChatNode {
    id: string;
    text: string;
    options: {
        label: string;
        nextNode?: string;
        action?: () => void;
        type?: 'primary' | 'secondary' | 'success' | 'danger';
    }[];
}

interface SupportChatbotProps {
    clientName?: string;
    serviceData?: any;
}

const SupportChatbot: React.FC<SupportChatbotProps> = ({
    clientName: initialClientName,
    serviceData: initialServiceData
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentNodeId, setCurrentNodeId] = useState('welcome');
    const [history, setHistory] = useState<string[]>([]);
    const [diagnosticLog, setDiagnosticLog] = useState<{ step: string; result: string }[]>([]);
    const [dniInput, setDniInput] = useState('');
    const [isIdentifying, setIsIdentifying] = useState(false);
    const [error, setError] = useState('');

    // Internal state for identified client
    const [clientData, setClientData] = useState<{ name?: string; service?: any }>({
        name: initialClientName,
        service: initialServiceData
    });

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [currentNodeId, isOpen, isIdentifying, error]);

    // Update internal state if props change and navigate to service select
    useEffect(() => {
        if (initialClientName) {
            setClientData({ name: initialClientName, service: initialServiceData });
            setCurrentNodeId('service_select');
        }
    }, [initialClientName, initialServiceData]);

    const handleDniSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (dniInput.length !== 8) {
            setError('El DNI debe tener 8 dígitos');
            return;
        }

        setIsIdentifying(true);
        setError('');

        try {
            const response = await api.get(`/client/check-debt/${dniInput}`);
            if (response.data) {
                const data = response.data;
                setClientData({
                    name: data.client.fullName,
                    service: {
                        plan: data.client.plan,
                        status: data.client.serviceStatus
                    }
                });
                setCurrentNodeId('service_select');
            }
        } catch (err: any) {
            console.error('Chatbot DNI error:', err);
            setError('No encontramos tus datos con ese DNI. ¿Deseas intentar de nuevo?');
        } finally {
            setIsIdentifying(false);
        }
    };

    const handleEscalate = (problemType: string) => {
        const summary = diagnosticLog.map(log => `- ${log.step}: ${log.result}`).join('\n');
        const message = `Hola, necesito soporte técnico.\n\n` +
            `*Cliente:* ${clientData.name || 'No identificado'}\n` +
            `*Problema:* ${problemType}\n` +
            `*Pruebas realizadas:*\n${summary}\n\n` +
            `*Estado:* No solucionado.`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/51918762620?text=${encodedMessage}`, '_blank');
    };

    const nodes: Record<string, ChatNode> = {
        welcome: {
            id: 'welcome',
            text: '¡Hola! 😊 Soy el asistente virtual de MIRAMAX. Para ayudarte mejor, ¿podrías brindarme tu DNI?',
            options: [] // Managed by custom input UI
        },
        service_select: {
            id: 'service_select',
            text: `¡Bienvenido ${clientData.name}! 👋 He verificado tu cuenta. ¿Con qué servicio tienes problemas hoy?`,
            options: [
                { label: '🌐 Problemas de Internet', nextNode: 'internet_start' },
                { label: '📺 Problemas de TV', nextNode: 'tv_start' },
                { label: '🔌 Problemas de Energía', nextNode: 'power_start' },
                { label: '🔗 Cableado', nextNode: 'cables_start' },
            ]
        },
        // --- INTERNET FLOW ---
        internet_start: {
            id: 'internet_start',
            text: 'Entiendo. Vamos a revisar tu conexión. Primero, ¿tienes señal de WiFi en tu dispositivo pero no navega, o no aparece la red WiFi?',
            options: [
                { label: 'Tengo WiFi pero no navega', nextNode: 'internet_restart' },
                { label: 'No encuentro la red WiFi', nextNode: 'power_check' },
                { label: 'Internet está muy lento', nextNode: 'internet_slow' },
            ]
        },
        internet_restart: {
            id: 'internet_restart',
            text: 'A veces el router necesita un respiro. Por favor, desconecta el router de la corriente, espera 30 segundos y vuélvelo a conectar. ¿Ya lo hiciste?',
            options: [
                {
                    label: 'Sí, ya funciona 👍',
                    action: () => setCurrentNodeId('resolved')
                },
                {
                    label: 'Sigue sin internet ❌',
                    nextNode: 'cables_check',
                    action: () => setDiagnosticLog([...diagnosticLog, { step: 'Reinicio de router', result: 'No funcionó' }])
                }
            ]
        },
        internet_slow: {
            id: 'internet_slow',
            text: '¿La lentitud es en todos tus dispositivos o solo en uno?',
            options: [
                { label: 'En todos los dispositivos', nextNode: 'internet_restart' },
                { label: 'Solo en uno', nextNode: 'device_check' },
            ]
        },
        device_check: {
            id: 'device_check',
            text: 'Si es solo en uno, intenta reiniciar ese dispositivo o desactivar y activar el WiFi. ¿Se solucionó?',
            options: [
                { label: 'Sí, gracias!', action: () => setCurrentNodeId('resolved') },
                { label: 'No, sigue igual', nextNode: 'internet_restart' },
            ]
        },
        // --- POWER FLOW ---
        power_start: {
            id: 'power_start',
            text: 'Vamos a revisar la energía. ¿El router tiene alguna luz encendida?',
            options: [
                { label: 'Sí, tiene luces', nextNode: 'internet_start' },
                { label: 'No, está todo apagado', nextNode: 'power_check' },
            ]
        },
        power_check: {
            id: 'power_check',
            text: 'Revisa que el adaptador de corriente esté bien enchufado. ¿Hay energía eléctrica en el resto de tu casa?',
            options: [
                { label: 'Sí hay luz, pero el router no prende', nextNode: 'escalate_internet' },
                { label: 'No hay luz en la casa 💡', nextNode: 'power_area_issue' },
                { label: 'Ya prendió! 👍', action: () => setCurrentNodeId('resolved') },
            ]
        },
        power_area_issue: {
            id: 'power_area_issue',
            text: 'Si no hay energía en tu casa, el servicio no funcionará hasta que vuelva la luz. Una vez que regrese, el router conectará solo.',
            options: [
                { label: 'Entendido, esperaré', action: () => setIsOpen(false) },
                { label: 'Tengo otra duda', nextNode: 'service_select' }
            ]
        },
        // --- TV FLOW ---
        tv_start: {
            id: 'tv_start',
            text: '¿Qué sucede con tu TV? ¿No hay señal o los canales se ven entrecortados?',
            options: [
                { label: 'Dice "Sin Señal"', nextNode: 'tv_no_signal' },
                { label: 'Se ve mal/pixelado', nextNode: 'tv_bad_quality' },
                { label: 'El control no funciona', nextNode: 'tv_remote' },
            ]
        },
        tv_no_signal: {
            id: 'tv_no_signal',
            text: 'Asegúrate de que el televisor esté en la entrada (Source/Input) correcta (HDMI 1, HDMI 2, etc.). ¿Ya revisaste eso?',
            options: [
                { label: 'Ya funciona! 👍', action: () => setCurrentNodeId('resolved') },
                { label: 'Sigue sin señal', nextNode: 'cables_check' },
            ]
        },
        tv_bad_quality: {
            id: 'tv_bad_quality',
            text: 'Revisa que el cable que llega al decodificador esté bien ajustado. ¿Lograste ajustarlo?',
            options: [
                { label: 'Sí, ya se ve bien', action: () => setCurrentNodeId('resolved') },
                { label: 'Sigue igual', nextNode: 'escalate_tv' }
            ]
        },
        tv_remote: {
            id: 'tv_remote',
            text: '¿Las pilas del control están cargadas? Prueba presionando botones y mira si prende una lucecita.',
            options: [
                { label: 'Eran las pilas! 😅', action: () => setCurrentNodeId('resolved') },
                { label: 'No es el control', nextNode: 'tv_start' }
            ]
        },
        // --- CABLES FLOW ---
        cables_start: {
            id: 'cables_start',
            text: 'Revisemos el cableado. ¿Ves algún cable suelto, doblado o dañado?',
            options: [
                { label: 'Sí, hay uno dañado', nextNode: 'escalate_cables' },
                { label: 'Todo se ve bien conectado', nextNode: 'internet_restart' },
            ]
        },
        cables_check: {
            id: 'cables_check',
            text: 'Verifica que el cable de fibra esté bien conectado al router sin estar muy doblado. ¿Lo revisaste?',
            options: [
                { label: 'Ya conectó! 👍', action: () => setCurrentNodeId('resolved') },
                { label: 'Sigue sin funcionar', nextNode: 'escalate_generic' }
            ]
        },
        // --- FINAL STATES ---
        resolved: {
            id: 'resolved',
            text: '¡Excelente! Me alegra haber podido ayudarte. ¿Necesitas algo más?',
            options: [
                { label: 'No, eso es todo. ¡Gracias! ✨', action: () => setIsOpen(false) },
                { label: 'Sí, tengo otro problema', nextNode: 'service_select' },
            ]
        },
        escalate_internet: {
            id: 'escalate_internet',
            text: 'No pudimos resolverlo automáticamente. Te comunicaré con un asesor por WhatsApp ahora mismo.',
            options: [
                { label: 'Hablar con un asesor 💬', type: 'success', action: () => handleEscalate('Problemas de Internet') },
                { label: 'Intentar otra cosa', nextNode: 'service_select' },
            ]
        },
        escalate_tv: {
            id: 'escalate_tv',
            text: 'Parece que el problema de TV requiere atención de un técnico especializado. Te derivaré al soporte.',
            options: [
                { label: 'Hablar con un asesor 💬', type: 'success', action: () => handleEscalate('Problemas de TV') },
                { label: 'Atrás', nextNode: 'service_select' },
            ]
        },
        escalate_cables: {
            id: 'escalate_cables',
            text: 'Si hay cables dañados, necesitamos enviar soporte técnico. ¿Quieres que te contacte con uno?',
            options: [
                { label: 'Sí, hablar con soporte 💬', type: 'success', action: () => handleEscalate('Cableado dañado') },
                { label: 'No, gracias', action: () => setIsOpen(false) },
            ]
        },
        escalate_generic: {
            id: 'escalate_generic',
            text: 'Lo siento, no logramos solucionarlo. Un asesor técnico te ayudará paso a paso por WhatsApp.',
            options: [
                { label: 'Ir a WhatsApp 💬', type: 'success', action: () => handleEscalate('Soporte General') },
                { label: 'Reiniciar chat', nextNode: 'service_select' },
            ]
        }
    };

    const currentNode = nodes[currentNodeId] || nodes.welcome;

    const navigateTo = (nodeId: string) => {
        setHistory([...history, currentNodeId]);
        setCurrentNodeId(nodeId);
    };

    const handleOptionClick = (option: any) => {
        if (option.action) {
            option.action();
        }
        if (option.nextNode) {
            navigateTo(option.nextNode);
        }
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="chatbot-trigger"
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        width: '65px',
                        height: '65px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FF6600 0%, #E55A00 100%)',
                        color: 'white',
                        border: 'none',
                        boxShadow: '0 8px 20px rgba(255,102,0,0.3)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        zIndex: 1000,
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1) translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(255,102,0,0.4)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1) translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(255,102,0,0.3)';
                    }}
                >
                    <span className="pulse-icon">💬</span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="chatbot-window" style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    width: '380px',
                    maxWidth: '95vw',
                    height: '600px',
                    maxHeight: '80vh',
                    backgroundColor: '#ffffff',
                    borderRadius: '1.5rem',
                    boxShadow: '0 15px 50px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 1001,
                    overflow: 'hidden',
                    animation: 'chatSlideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '1.25rem',
                        background: 'linear-gradient(90deg, #FF6600 0%, #FF8533 100%)',
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '12px',
                                height: '12px',
                                backgroundColor: '#4ade80',
                                borderRadius: '50%',
                                boxShadow: '0 0 8px #4ade80'
                            }} />
                            <div>
                                <span style={{ fontWeight: 700, display: 'block', fontSize: '1rem' }}>Asistente MIRAMAX</span>
                                <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>Siempre en línea</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                color: 'white',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Chat Body */}
                    <div className="chatbot-body" style={{
                        flex: 1,
                        padding: '1.5rem',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem',
                        backgroundColor: '#f9fafb',
                        backgroundImage: 'radial-gradient(#e5e7eb 0.5px, transparent 0.5px)',
                        backgroundSize: '20px 20px'
                    }}>
                        {/* Bot Message Card */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '1.25rem',
                            borderRadius: '1rem 1rem 1rem 0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                            borderLeft: '4px solid #FF6600',
                            maxWidth: '90%',
                            animation: 'fadeIn 0.3s ease-in'
                        }}>
                            <p style={{
                                margin: 0,
                                fontSize: '1rem',
                                lineHeight: '1.5',
                                color: '#374151'
                            }}>
                                {currentNode.text}
                            </p>
                        </div>

                        {/* Identification Form */}
                        {currentNodeId === 'welcome' && !clientData.name && (
                            <form onSubmit={handleDniSubmit} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                animation: 'fadeInUp 0.4s ease-out'
                            }}>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        placeholder="Introduce tu DNI"
                                        value={dniInput}
                                        onChange={(e) => setDniInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                        style={{
                                            width: '100%',
                                            padding: '1rem 1.25rem',
                                            borderRadius: '0.75rem',
                                            border: error ? '2px solid #ef4444' : '2px solid #e5e7eb',
                                            fontSize: '1rem',
                                            transition: 'all 0.2s',
                                            outline: 'none',
                                            color: '#1f2937'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#FF6600'}
                                        onBlur={(e) => e.target.style.borderColor = error ? '#ef4444' : '#e5e7eb'}
                                    />
                                    {isIdentifying && (
                                        <div className="mini-spinner" style={{
                                            position: 'absolute',
                                            right: '1rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: '20px',
                                            height: '20px',
                                            border: '2px solid transparent',
                                            borderTopColor: '#FF6600',
                                            borderRadius: '50%',
                                            animation: 'spin 0.6s linear infinite'
                                        }} />
                                    )}
                                </div>
                                {error && (
                                    <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>{error}</p>
                                )}
                                <button
                                    type="submit"
                                    disabled={isIdentifying || dniInput.length !== 8}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '0.75rem',
                                        backgroundColor: (isIdentifying || dniInput.length !== 8) ? '#d1d5db' : '#FF6600',
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'background 0.2s transform 0.1s'
                                    }}
                                >
                                    {isIdentifying ? 'Verificando...' : 'Identificarme'}
                                </button>
                            </form>
                        )}

                        {/* Options Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {currentNode.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionClick(option)}
                                    style={{
                                        padding: '1rem 1.25rem',
                                        borderRadius: '0.75rem',
                                        backgroundColor: option.type === 'success' ? '#10b981' : (option.type === 'danger' ? '#ef4444' : '#ffffff'),
                                        color: option.type ? 'white' : '#FF6600',
                                        border: option.type ? 'none' : '2px solid #FF6600',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                    onMouseOver={(e) => {
                                        if (!option.type) {
                                            e.currentTarget.style.backgroundColor = '#fff5f0';
                                            e.currentTarget.style.transform = 'translateX(5px)';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (!option.type) {
                                            e.currentTarget.style.backgroundColor = '#ffffff';
                                            e.currentTarget.style.transform = 'translateX(0)';
                                        }
                                    }}
                                >
                                    {option.label}
                                </button>
                            ))}

                            {currentNodeId !== 'welcome' && currentNodeId !== 'service_select' && (
                                <button
                                    onClick={() => {
                                        const prev = history[history.length - 1];
                                        if (prev) {
                                            setCurrentNodeId(prev);
                                            setHistory(history.slice(0, -1));
                                        } else {
                                            setCurrentNodeId('service_select');
                                        }
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#6b7280',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        marginTop: '0.5rem',
                                        textAlign: 'center',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    Regresar al paso anterior
                                </button>
                            )}
                        </div>
                        <div ref={chatEndRef} />
                    </div>

                    {/* Footer Branding */}
                    <div style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        color: '#9ca3af',
                        borderTop: '1px solid #f3f4f6',
                        backgroundColor: '#ffffff'
                    }}>
                        Tecnología MIRAMAX AI
                    </div>
                </div>
            )}

            <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .chatbot-body::-webkit-scrollbar {
          width: 5px;
        }
        .chatbot-body::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .chatbot-body::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .chatbot-body::-webkit-scrollbar-thumb:hover {
          background: #FF6600;
        }
      `}</style>
        </>
    );
};

export default SupportChatbot;
