import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/permissions';
import { toast } from 'sonner';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export function ChatbotHelper() {
  const { user } = useAuth();
  const userRole = getUserRole(user);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: `¡Hola ${user?.name}! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?`,
      isBot: true,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');

  // No mostrar chatbot para encargado de compras
  if (userRole === 'encargado_compras') {
    return null;
  }

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Generar respuesta del bot
    setTimeout(() => {
      const botResponse = generateBotResponse(inputText.toLowerCase(), userRole);
      const botMessage: Message = {
        id: messages.length + 2,
        text: botResponse,
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }, 500);

    setInputText('');
  };

  const generateBotResponse = (query: string, role: string): string => {
    // Buscar eventos y gastos en localStorage
    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    
    // Queries sobre gastos
    if (query.includes('gasto') || query.includes('gastado')) {
      if (query.includes('luz') || query.includes('electricidad')) {
        return 'Actualmente no tengo registro de gastos de luz en el sistema. Puedes registrarlos en la sección de gastos de cada evento.';
      }
      
      const totalExpenses = storedEvents.reduce((sum: number, event: any) => {
        return sum + (event.expenses?.reduce((s: number, e: any) => s + (e.amount || 0), 0) || 0);
      }, 0);
      
      return `El total de gastos registrados hasta ahora es: S/ ${totalExpenses.toLocaleString()}`;
    }

    // Queries sobre ingresos
    if (query.includes('ingreso') || query.includes('ganancia') || query.includes('gano') || query.includes('ganó')) {
      const totalIncome = storedEvents.reduce((sum: number, event: any) => {
        return sum + (event.financial?.totalIncome || 0);
      }, 0);
      
      if (totalIncome === 0) {
        return 'Aún no hay ingresos registrados. Los ingresos se registran automáticamente al crear eventos y recibir pagos.';
      }
      
      return `Los ingresos totales registrados son: S/ ${totalIncome.toLocaleString()}`;
    }

    // Queries sobre eventos
    if (query.includes('evento') || query.includes('eventos')) {
      if (storedEvents.length === 0) {
        return 'No hay eventos registrados aún. Puedes crear un nuevo evento desde el botón "Nuevo Evento".';
      }
      
      const confirmed = storedEvents.filter((e: any) => e.status === 'confirmed').length;
      const inProgress = storedEvents.filter((e: any) => e.status === 'in_progress').length;
      const completed = storedEvents.filter((e: any) => e.status === 'completed').length;
      
      return `Tienes ${storedEvents.length} evento(s) en total:\n- ${confirmed} confirmado(s)\n- ${inProgress} en progreso\n- ${completed} completado(s)`;
    }

    // Queries sobre el día de hoy
    if (query.includes('hoy')) {
      const today = new Date().toISOString().split('T')[0];
      const todayEvents = storedEvents.filter((e: any) => e.date === today);
      
      if (todayEvents.length === 0) {
        return 'No hay eventos programados para hoy.';
      }
      
      return `Hoy tienes ${todayEvents.length} evento(s): ${todayEvents.map((e: any) => e.name).join(', ')}`;
    }

    // Queries de ayuda general
    if (query.includes('ayuda') || query.includes('cómo') || query.includes('como')) {
      if (role === 'admin' || role === 'socio') {
        return 'Puedo ayudarte con:\n- Información sobre gastos e ingresos\n- Estado de eventos\n- Estadísticas generales\n\nPrueba preguntándome: "¿Cuánto se ha gastado?" o "¿Cuántos eventos tenemos?"';
      }
      
      if (role === 'servicio') {
        return 'Puedo ayudarte con:\n- Ver tus eventos asignados\n- Información sobre gastos de tus eventos\n\nPrueba preguntándome: "¿Qué eventos tengo?" o "¿Cuánto he gastado?"';
      }
    }

    // Respuesta por defecto
    return 'Interesante pregunta. Por ahora puedo ayudarte con información sobre gastos, ingresos y eventos. ¿Sobre qué te gustaría saber?';
  };

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 hover:scale-110"
          aria-label="Abrir chat de ayuda"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Ventana del chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-gradient-card border border-border rounded-xl shadow-2xl flex flex-col z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5 rounded-t-xl">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">¿Necesitas ayuda?</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.isBot
                      ? 'bg-muted text-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              <Button
                size="sm"
                onClick={handleSendMessage}
                className="px-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
