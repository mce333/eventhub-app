import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, DollarSign, User, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

interface ReserveDateModalProps {
  open: boolean;
  onClose: () => void;
  selectedDate: Date | null;
}

export function ReserveDateModal({ open, onClose, selectedDate }: ReserveDateModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    advancePayment: 0,
  });

  const handleSubmit = () => {
    if (!selectedDate) {
      toast.error('No se ha seleccionado una fecha');
      return;
    }

    if (!formData.clientName || !formData.clientPhone || formData.advancePayment <= 0) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      const reservationId = Date.now();
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      // Crear evento de reserva simple
      const reservation = {
        id: reservationId,
        name: `Reserva - ${formData.clientName}`,
        description: `Fecha reservada por ${formData.clientName}`,
        type: 'otro',
        eventCategory: 'reserva', // Marcar como reserva
        status: 'confirmed',
        date: dateStr,
        endDate: dateStr,
        location: 'Por definir',
        venue: 'Por definir',
        attendees: 0,
        maxAttendees: 0,
        client: {
          id: reservationId,
          name: formData.clientName,
          last_name: '',
          phone: formData.clientPhone,
          email: '',
          address: '',
          document_type: 'DNI',
          document_number: '',
        },
        serviceType: 'sin_comida',
        contract: {
          tipoContrato: 'privado',
          precioTotal: formData.advancePayment,
          pagoAdelantado: formData.advancePayment,
          saldoPendiente: 0,
          fechaFirma: new Date().toISOString().split('T')[0],
        },
        financial: {
          budget: formData.advancePayment,
          totalIncome: formData.advancePayment,
          totalExpenses: 0,
          balance: formData.advancePayment,
          advancePayment: formData.advancePayment,
          pendingPayment: 0,
        },
        payments: [],
        expenses: [],
        decoration: [],
        furniture: [],
        staff: [],
        timeline: [],
        tags: ['reserva'],
        assignedServiceUsers: [],
        createdBy: user?.id || 1,
        createdByName: `${user?.name} ${user?.last_name}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        auditLog: [],
      };

      // Guardar en localStorage
      const existingEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
      const updatedEvents = [...existingEvents, reservation];
      localStorage.setItem('demo_events', JSON.stringify(updatedEvents));

      toast.success('¡Fecha reservada exitosamente!');
      
      // Limpiar formulario
      setFormData({
        clientName: '',
        clientPhone: '',
        advancePayment: 0,
      });

      onClose();

      // Recargar página para actualizar calendario
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error al reservar fecha:', error);
      toast.error('Error al reservar la fecha');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5" />
            Reservar Fecha
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {selectedDate && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">Fecha seleccionada:</p>
              <p className="text-lg font-semibold text-primary">
                {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nombre del Cliente *
              </Label>
              <Input
                placeholder="Ej: María González"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Número de Contacto *
              </Label>
              <Input
                placeholder="Ej: +51 999 999 999"
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Adelanto de Reserva (S/) *
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ej: 500"
                value={formData.advancePayment || ''}
                onChange={(e) => setFormData({ ...formData, advancePayment: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="flex-1 bg-gradient-primary">
              Confirmar Reserva
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
