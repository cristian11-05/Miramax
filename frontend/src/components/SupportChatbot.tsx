import React, { useState, useEffect, useRef } from 'react';

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

const SupportChatbot: React.FC<SupportChatbotProps> = ({ clientName, serviceData }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentNodeId, setCurrentNodeId] = useState('welcome');
    const [history, setHistory] = useState<string[]>([]);
    const [diagnosticLog, setDiagnosticLog] = useState<{ step: string; result: string }[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [currentNodeId, isOpen]);

    const welcomeText = clientName
        ? `¡Hola ${clientName}! 😊 Soy tu asistente técnico de MIRAMAX. ¿En qué puedo ayudarte hoy?`
        : '¡Hola! 😊 Soy el asistente técnico de MIRAMAX. Estoy aquí para ayudarte a resolver problemas con tu servicio.';

    const handleEscalate = (problemType: string) => {
        const summary = diagnosticLog.map(log => `- ${log.step}: ${log.result}`).join('\n');
        const message = `Hola, necesito soporte técnico.\n\n` +
            `*Cliente:* ${clientName || 'No identificado'}\n` +
            `*Problema:* ${problemType}\n` +
            `*Pruebas realizadas:*\n${summary}\n\n` +
            `*Estado:* No solucionado.`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/51918762620?text=${encodedMessage}`, '_blank');
    };

    const nodes: Record<string, ChatNode> = {
        welcome: {
            id: 'welcome',
            text: welcomeText,
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
                    label: 'Sí, ya reinició y funciona 👍',
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
            text: 'Revisa que el adaptador de corriente esté bien enchufado a la pared y al router. ¿Hay energía eléctrica en el resto de tu casa?',
            options: [
                { label: 'Sí hay luz, pero el router no prende', nextNode: 'escalate_internet' },
                { label: 'No hay luz en la casa 💡', nextNode: 'power_area_issue' },
                { label: 'Ya prendió! 👍', action: () => setCurrentNodeId('resolved') },
            ]
        },
        power_area_issue: {
            id: 'power_area_issue',
            text: 'Si no hay energía en tu casa, el servicio de internet no funcionará hasta que se restablezca la luz. Una vez que vuelva la luz, tu router debería conectar de nuevo.',
            options: [
                { label: 'Entendido, esperaré', action: () => setIsOpen(false) },
                { label: 'Tengo otra duda', nextNode: 'welcome' }
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
            text: 'Revisa que el cable que llega al decodificador esté bien ajustado (enroscado). ¿Lograste ajustarlo?',
            options: [
                { label: 'Sí, ya se ve bien', action: () => setCurrentNodeId('resolved') },
                { label: 'Sigue igual', nextNode: 'escalate_tv' }
            ]
        },
        tv_remote: {
            id: 'tv_remote',
            text: '¿Las pilas del control están cargadas? Prueba presionando cualquier botón y mira si prende una lucecita en el control.',
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
                { label: 'Sí, hay uno suelto/roto', nextNode: 'escalate_cables' },
                { label: 'Todo se ve bien conectado', nextNode: 'internet_restart' },
            ]
        },
        cables_check: {
            id: 'cables_check',
            text: 'Verifica que el cable de fibra (blanco o amarillo) esté bien conectado al router sin estar muy doblado. ¿Lo revisaste?',
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
                { label: 'No, eso es todo. Gracias!', action: () => setIsOpen(false) },
                { label: 'Sí, tengo otro problema', nextNode: 'welcome' },
            ]
        },
        escalate_internet: {
            id: 'escalate_internet',
            text: 'No pudimos resolver el problema de internet automáticamente. Te comunicaré con un asesor técnico por WhatsApp para una revisión más profunda.',
            options: [
                { label: 'Hablar con un asesor 💬', type: 'success', action: () => handleEscalate('Problemas de Internet') },
                { label: 'Intentar otra cosa', nextNode: 'welcome' },
            ]
        },
        escalate_tv: {
            id: 'escalate_tv',
            text: 'Parece que el problema de TV requiere atención de un técnico. Te derivaré al soporte por WhatsApp.',
            options: [
                { label: 'Hablar con un asesor 💬', type: 'success', action: () => handleEscalate('Problemas de TV') },
                { label: 'Atrás', nextNode: 'welcome' },
            ]
        },
        escalate_cables: {
            id: 'escalate_cables',
            text: 'Si hay cables dañados, necesitamos enviar a un técnico o guiarte mejor por WhatsApp. ¿Quieres que te contacte con uno?',
            options: [
                { label: 'Sí, hablar con soporte 💬', type: 'success', action: () => handleEscalate('Cableado dañado') },
                { label: 'No, yo lo arreglo', action: () => setIsOpen(false) },
            ]
        },
        escalate_generic: {
            id: 'escalate_generic',
            text: 'Lo siento, no logramos solucionar el problema. Un asesor técnico te ayudará paso a paso por WhatsApp.',
            options: [
                { label: 'Ir a WhatsApp 💬', type: 'success', action: () => handleEscalate('Soporte General') },
                { label: 'Empezar de nuevo', nextNode: 'welcome' },
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
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        zIndex: 1000,
                        transition: 'transform 0.2s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    💬
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    width: '350px',
                    maxWidth: '90vw',
                    height: '500px',
                    backgroundColor: 'white',
                    borderRadius: '1rem',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 1001,
                    overflow: 'hidden',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '1rem',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '10px',
                                height: '10px',
                                backgroundColor: '#00ff00',
                                borderRadius: '50%'
                            }} />
                            <span style={{ fontWeight: 600 }}>Soporte MIRAMAX</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                fontSize: '1.2rem',
                                cursor: 'pointer'
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Chat Body */}
                    <div style={{
                        flex: 1,
                        padding: '1rem',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        backgroundColor: '#f8f9fa'
                    }}>
                        {/* History can be added here if needed, but for step-by-step we just show current */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '1rem',
                            borderRadius: '0.5rem 0.5rem 0.5rem 0',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            border: '1px solid #eee',
                            maxWidth: '90%'
                        }}>
                            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>
                                {currentNode.text}
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {currentNode.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionClick(option)}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        borderRadius: '0.5rem',
                                        backgroundColor: option.type === 'success' ? '#25D366' : (option.type === 'danger' ? 'var(--error)' : 'white'),
                                        color: option.type ? 'white' : 'var(--primary)',
                                        border: option.type ? 'none' : '1px solid var(--primary)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        if (!option.type) e.currentTarget.style.backgroundColor = '#fff5f0';
                                    }}
                                    onMouseOut={(e) => {
                                        if (!option.type) e.currentTarget.style.backgroundColor = 'white';
                                    }}
                                >
                                    {option.label}
                                </button>
                            ))}

                            {currentNodeId !== 'welcome' && (
                                <button
                                    onClick={() => {
                                        const prev = history[history.length - 1];
                                        if (prev) {
                                            setCurrentNodeId(prev);
                                            setHistory(history.slice(0, -1));
                                        } else {
                                            setCurrentNodeId('welcome');
                                        }
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--gray-500)',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        marginTop: '0.5rem',
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
                        padding: '0.5rem',
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        color: 'var(--gray-400)',
                        borderTop: '1px solid #eee'
                    }}>
                        MIRAMAX Asistente Virtual
                    </div>
                </div>
            )}

            <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </>
    );
};

export default SupportChatbot;
