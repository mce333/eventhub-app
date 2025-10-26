import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Upload, Plus, Trash2, CalendarIcon, Users } from 'lucide-react';
import { toast } from 'sonner';
import { CreateEventDTO, EventType, ServiceType, PaymentType, EventStaff } from '@/types/events';
import { useAuth } from '@/contexts/AuthContext';
import { calculatePredeterminedExpenses, convertToEventExpenses } from '@/lib/expenseCalculator';
import { createAuditLog } from '@/lib/auditLogger';
import { LOCATIONS } from '@/lib/menuItems';
import { DECORATION_PROVIDERS, DECORATION_PACKAGES } from '@/lib/decorationData';
import { menuService } from '@/services/menu.service';
import { DEMO_USERS } from '@/lib/mockData';
import { getServiceUsers } from '@/lib/permissions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getEventImageByType } from '@/lib/eventImages';
import { cn } from '@/lib/utils';
import { STAFF_ROLES, getDefaultRate, getRateType, canRoleHaveSystemAccess } from '@/lib/staffRoles';

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  initialDate?: Date;
}

interface DecorationItem {
  provider: string;
  package: string;
  providerCost: number;
  clientCost: number;
  profit: number;
  estadoPago: 'pendiente' | 'adelanto' | 'pagado';
  montoPagado: number;
}

const STEPS = [
  'Información Básica',
  'Tipo de Servicio',
  'Cliente',
  'Contrato y Pagos',
  'Decoración',
  'Personal',
  'Resumen',
];

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'quince_años', label: '15 Años' },
  { value: 'boda', label: 'Boda' },
  { value: 'cumpleaños', label: 'Cumpleaños' },
  { value: 'corporativo', label: 'Corporativo' },
  { value: 'otro', label: 'Otro' },
];

export function CreateEventModal({ open, onClose, initialDate }: CreateEventModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [menuItems, setMenuItems] = useState(menuService.getMenuItems());
  const [decorationItems, setDecorationItems] = useState<DecorationItem[]>([]);
  const [selectedServiceUsers, setSelectedServiceUsers] = useState<number[]>([]);
  const [formData, setFormData] = useState<Partial<CreateEventDTO>>({
    serviceType: 'con_comida',
    decoration: [],
    staff: [],
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const serviceUsers = getServiceUsers(DEMO_USERS);

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0:
        if (!formData.name || !formData.type || !formData.date || !formData.maxAttendees || !formData.location) {
          toast.error('Por favor completa todos los campos requeridos');
          return false;
        }
        break;
      case 1:
        if (formData.serviceType === 'con_comida') {
          if (!formData.foodDetails?.tipoDePlato || !formData.foodDetails?.cantidadDePlatos || !formData.foodDetails?.precioPorPlato) {
            toast.error('Por favor completa los detalles de comida');
            return false;
          }
        } else {
          if (!formData.rentalDetails?.cantidadMesas || !formData.rentalDetails?.cantidadVasos) {
            toast.error('Por favor completa los detalles de alquiler');
            return false;
          }
        }
        break;
      case 2:
        if (!formData.client?.name || !formData.client?.email || !formData.client?.phone) {
          toast.error('Por favor completa los datos del cliente');
          return false;
        }
        break;
      case 3:
        if (!formData.contract?.pagoAdelantado) {
          toast.error('Por favor completa el pago adelantado');
          return false;
        }
        break;
    }
    return true;
  };

  const handleSubmit = async () => {
    try {
      console.log('=== INICIANDO CREACIÓN DE EVENTO ===');
      
      let predeterminedExpenses: ReturnType<typeof convertToEventExpenses> = [];
      if (formData.serviceType === 'con_comida' && formData.foodDetails) {
        const calculated = calculatePredeterminedExpenses(formData.foodDetails);
        predeterminedExpenses = convertToEventExpenses(
          calculated,
          user?.id || 1,
          `${user?.name} ${user?.last_name}`
        );
      }

      // Calculate totals
      const foodCost = formData.serviceType === 'con_comida' && formData.foodDetails
        ? formData.foodDetails.cantidadDePlatos * formData.foodDetails.precioPorPlato
        : 0;
      
      const decorationClientCost = decorationItems.reduce((sum, item) => sum + item.clientCost, 0);
      const decorationProviderCost = decorationItems.reduce((sum, item) => sum + item.providerCost, 0);
      const decorationProfit = decorationClientCost - decorationProviderCost;
      
      const staffCost = (formData.staff || []).reduce((sum, person) => sum + person.totalCost, 0);
      
      const totalPrice = foodCost + decorationClientCost + staffCost;

      const newEventId = Date.now();
      
      // Determinar status basado en la fecha del evento
      const eventDate = new Date(formData.date!);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventStatus = eventDate < today ? 'completed' : 'confirmed';
      
      const newEvent = {
        id: newEventId,
        name: formData.name!,
        type: formData.type!,
        date: formData.date!,
        endDate: formData.date,
        location: formData.location!,
        venue: formData.location!,
        maxAttendees: formData.maxAttendees!,
        attendees: 0,
        status: eventStatus as const,
        description: formData.description || '',
        imageUrl: getEventImageByType(formData.type!),
        serviceType: formData.serviceType!,
        foodDetails: formData.foodDetails,
        rentalDetails: formData.rentalDetails,
        client: {
          id: Date.now(),
          ...formData.client!,
        },
        contract: {
          ...formData.contract,
          precioTotal: totalPrice,
          saldoPendiente: totalPrice - (formData.contract?.pagoAdelantado || 0),
        },
        financial: {
          budget: totalPrice,
          totalIncome: formData.contract?.pagoAdelantado || 0,
          totalExpenses: decorationProviderCost + staffCost,
          balance: (formData.contract?.pagoAdelantado || 0) - (decorationProviderCost + staffCost),
          advancePayment: formData.contract?.pagoAdelantado || 0,
          pendingPayment: totalPrice - (formData.contract?.pagoAdelantado || 0),
        },
        expenses: predeterminedExpenses,
        payments: [],
        decoration: decorationItems.map((item, idx) => ({
          id: idx + 1,
          item: item.package,
          quantity: 1,
          unitPrice: item.clientCost,
          totalPrice: item.clientCost,
          supplier: item.provider,
          providerCost: item.providerCost,
          profit: item.profit,
          estado: 'pendiente' as const,
        })),
        furniture: [],
        staff: formData.staff || [],
        timeline: [],
        tags: [],
        createdBy: user?.id || 1,
        createdByName: `${user?.name} ${user?.last_name}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        auditLog: [
          createAuditLog({
            eventId: newEventId,
            userId: user?.id || 1,
            userName: `${user?.name} ${user?.last_name}`,
            userRole: user?.role?.name || 'admin',
            action: 'created',
            section: 'evento',
            description: 'Evento creado',
          }),
        ],
      };

      console.log('Nuevo evento creado:', newEvent);

      // Obtener IDs de personal con acceso al sistema
      const staffWithAccess = (formData.staff || [])
        .filter(s => s.hasSystemAccess && s.userId)
        .map(s => s.userId!);

      // Agregar assignedServiceUsers al evento
      newEvent.assignedServiceUsers = staffWithAccess;

      const existingEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
      const updatedEvents = [...existingEvents, newEvent];
      localStorage.setItem('demo_events', JSON.stringify(updatedEvents));
      
      // Update assigned events for service users with system access
      if (staffWithAccess.length > 0) {
        const storedUsers = JSON.parse(localStorage.getItem('demo_users') || JSON.stringify(DEMO_USERS));
        const updatedUsers = storedUsers.map((u: any) => {
          if (staffWithAccess.includes(u.id)) {
            return {
              ...u,
              assignedEventIds: [...(u.assignedEventIds || []), newEventId],
            };
          }
          return u;
        });
        localStorage.setItem('demo_users', JSON.stringify(updatedUsers));
      }
      
      console.log('Total de eventos:', updatedEvents.length);
      console.log('Personal con acceso:', staffWithAccess);

      toast.success('¡Evento creado exitosamente!');
      
      onClose();
      
      setTimeout(() => {
        window.location.href = '/eventos';
      }, 500);
      
    } catch (error) {
      console.error('Error al crear el evento:', error);
      toast.error('Error al crear el evento');
    }
  };

  const addDecoration = () => {
    setDecorationItems([
      ...decorationItems,
      {
        provider: '',
        package: '',
        providerCost: 0,
        clientCost: 0,
        profit: 0,
        estadoPago: 'pendiente',
        montoPagado: 0,
      },
    ]);
  };

  const removeDecoration = (index: number) => {
    setDecorationItems(decorationItems.filter((_, i) => i !== index));
  };

  const updateDecoration = (index: number, field: keyof DecorationItem, value: string | number) => {
    const updated = [...decorationItems];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    
    if (field === 'package') {
      const selectedPackage = DECORATION_PACKAGES.find(p => p.name === value);
      if (selectedPackage) {
        updated[index].providerCost = selectedPackage.providerCost;
        updated[index].clientCost = selectedPackage.clientCost;
      }
    }
    
    if (field === 'providerCost' || field === 'clientCost') {
      updated[index].profit = updated[index].clientCost - updated[index].providerCost;
    }
    
    setDecorationItems(updated);
  };

  const toggleServiceUser = (userId: number) => {
    setSelectedServiceUsers(prev => {
      if (prev.includes(userId)) {
        // Remove user and their staff entry
        setFormData({
          ...formData,
          staff: formData.staff?.filter(s => s.userId !== userId),
        });
        return prev.filter(id => id !== userId);
      } else {
        // Add user and create staff entry
        const serviceUser = serviceUsers.find(u => u.id === userId);
        if (serviceUser) {
          setFormData({
            ...formData,
            staff: [
              ...(formData.staff || []),
              {
                userId: serviceUser.id,
                name: `${serviceUser.name} ${serviceUser.last_name}`,
                role: 'Encargado de Compras',
                hours: 8,
                hourlyRate: 25,
                totalCost: 200,
                contact: serviceUser.email,
              },
            ],
          });
        }
        return [...prev, userId];
      }
    });
  };

  const addStaff = () => {
    setFormData({
      ...formData,
      staff: [
        ...(formData.staff || []),
        {
          name: '',
          role: '',
          roleId: '',
          hours: 0,
          plates: 0,
          hourlyRate: 0,
          totalCost: 0,
          contact: '',
          hasSystemAccess: false,
        },
      ],
    });
  };

  const removeStaff = (index: number) => {
    const staffMember = formData.staff?.[index];
    if (staffMember?.userId) {
      setSelectedServiceUsers(prev => prev.filter(id => id !== staffMember.userId));
    }
    setFormData({
      ...formData,
      staff: formData.staff?.filter((_, i) => i !== index),
    });
  };

  const updateStaff = (index: number, field: keyof EventStaff, value: string | number | boolean) => {
    const updated = [...(formData.staff || [])];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    
    // Si cambia el roleId, actualizar tarifa predeterminada y tipo de tarifa
    if (field === 'roleId' && typeof value === 'string') {
      const defaultRate = getDefaultRate(value);
      const rateType = getRateType(value);
      const canAccess = canRoleHaveSystemAccess(value);
      const roleName = STAFF_ROLES.find(r => r.id === value)?.name || '';
      
      updated[index].role = roleName;
      updated[index].hourlyRate = defaultRate;
      updated[index].hasSystemAccess = canAccess ? updated[index].hasSystemAccess : false;
      
      // Auto-llenar email y password según el rol
      if (value === 'coordinador') {
        updated[index].systemEmail = 'coordinador@eventhub.com';
        updated[index].systemPassword = 'coord123';
        updated[index].userId = 2; // ID del usuario Coordinador
      } else if (value === 'encargado_compras') {
        updated[index].systemEmail = 'compras@eventhub.com';
        updated[index].systemPassword = 'compras123';
        updated[index].userId = 3; // ID del usuario Encargado de Compras
      }
      
      // Calcular costo según tipo de tarifa
      if (rateType === 'perPlate' && formData.foodDetails?.cantidadDePlatos) {
        updated[index].plates = formData.foodDetails.cantidadDePlatos;
        updated[index].totalCost = defaultRate * formData.foodDetails.cantidadDePlatos;
      } else {
        updated[index].hours = updated[index].hours || 8; // Default 8 horas
        updated[index].totalCost = defaultRate * (updated[index].hours || 8);
      }
    }
    
    // Si se activa hasSystemAccess, asegurarse de que tenga credenciales
    if (field === 'hasSystemAccess' && value === true && updated[index].roleId) {
      const roleId = updated[index].roleId!;
      if (roleId === 'coordinador') {
        updated[index].systemEmail = 'coordinador@eventhub.com';
        updated[index].systemPassword = 'coord123';
        updated[index].userId = 2;
      } else if (roleId === 'encargado_compras') {
        updated[index].systemEmail = 'compras@eventhub.com';
        updated[index].systemPassword = 'compras123';
        updated[index].userId = 3;
      }
    }
    
    // Recalcular costo si cambian horas o tarifa
    if (field === 'hours' || field === 'hourlyRate') {
      const rateType = updated[index].roleId ? getRateType(updated[index].roleId!) : 'hourly';
      if (rateType === 'hourly') {
        updated[index].totalCost = (updated[index].hours || 0) * (updated[index].hourlyRate || 0);
      }
    }
    
    // Recalcular costo si cambian platos o tarifa
    if (field === 'plates' || (field === 'hourlyRate' && updated[index].roleId && getRateType(updated[index].roleId!) === 'perPlate')) {
      updated[index].totalCost = (updated[index].plates || 0) * (updated[index].hourlyRate || 0);
    }
    
    setFormData({ ...formData, staff: updated });
  };

  const calculateTotals = () => {
    const foodCost = formData.serviceType === 'con_comida' && formData.foodDetails
      ? formData.foodDetails.cantidadDePlatos * formData.foodDetails.precioPorPlato
      : 0;
    
    const decorationClientCost = decorationItems.reduce((sum, item) => sum + item.clientCost, 0);
    const decorationProfit = decorationItems.reduce((sum, item) => sum + item.profit, 0);
    
    const staffCost = (formData.staff || []).reduce((sum, person) => sum + person.totalCost, 0);
    
    const totalPrice = foodCost + decorationClientCost + staffCost;
    const advancePayment = formData.contract?.pagoAdelantado || 0;
    const balance = totalPrice - advancePayment;
    
    return {
      foodCost,
      decorationClientCost,
      decorationProfit,
      staffCost,
      totalPrice,
      advancePayment,
      balance,
    };
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <Label>Tipo de Evento *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as EventType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Título del Evento *</Label>
              <Input
                placeholder="Nombre del evento"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Fecha del Evento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP', { locale: es }) : 'Selecciona una fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      if (date) {
                        setFormData({ ...formData, date: format(date, 'yyyy-MM-dd') });
                      }
                    }}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Cantidad de Personas *</Label>
              <Input
                type="number"
                placeholder="Número de asistentes"
                value={formData.maxAttendees || ''}
                onChange={(e) => setFormData({ ...formData, maxAttendees: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label>Ubicación *</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => setFormData({ ...formData, location: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el local" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((location) => (
                    <SelectItem key={location.value} value={location.value}>
                      {location.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label>Tipo de Servicio *</Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) => setFormData({ ...formData, serviceType: value as ServiceType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="con_comida">Con Comida</SelectItem>
                  <SelectItem value="solo_alquiler">Solo Alquiler</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.serviceType === 'con_comida' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detalles de Comida</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Tipo de Plato *</Label>
                    <Select
                      value={formData.foodDetails?.tipoDePlato || ''}
                      onValueChange={(value) => {
                        const selectedItem = menuItems.find(item => item.name === value);
                        setFormData({
                          ...formData,
                          foodDetails: {
                            ...formData.foodDetails!,
                            tipoDePlato: value,
                            precioPorPlato: selectedItem?.price || 0,
                          },
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un plato" />
                      </SelectTrigger>
                      <SelectContent>
                        {menuItems.map((item) => (
                          <SelectItem key={item.id} value={item.name}>
                            {item.name} - S/ {item.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Cantidad de Platos *</Label>
                    <Input
                      type="number"
                      placeholder="Número de platos"
                      value={formData.foodDetails?.cantidadDePlatos || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          foodDetails: {
                            ...formData.foodDetails!,
                            cantidadDePlatos: parseInt(e.target.value),
                          },
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Precio por Plato *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.foodDetails?.precioPorPlato || ''}
                      disabled={!!formData.foodDetails?.tipoDePlato}
                      className={formData.foodDetails?.tipoDePlato ? 'bg-muted' : ''}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cerveza"
                      checked={formData.foodDetails?.incluyeCerveza || false}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          foodDetails: { ...formData.foodDetails!, incluyeCerveza: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="cerveza">¿Incluye Cerveza?</Label>
                  </div>

                  <div>
                    <Label>Tipo de Pago *</Label>
                    <Select
                      value={formData.foodDetails?.tipoDePago || 'cover'}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          foodDetails: { ...formData.foodDetails!, tipoDePago: value as PaymentType },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">Cover (pago fijo)</SelectItem>
                        <SelectItem value="compra_local">Compra en el local</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.serviceType === 'solo_alquiler' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detalles de Alquiler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cantidad de Mesas</Label>
                      <Input
                        type="number"
                        placeholder="Ej: 20"
                        value={formData.rentalDetails?.cantidadMesas || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rentalDetails: {
                              ...formData.rentalDetails!,
                              cantidadMesas: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label>Cantidad de Vasos</Label>
                      <Input
                        type="number"
                        placeholder="Ej: 100"
                        value={formData.rentalDetails?.cantidadVasos || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rentalDetails: {
                              ...formData.rentalDetails!,
                              cantidadVasos: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label>Mantelería</Label>
                      <Input
                        type="number"
                        placeholder="Cantidad"
                        value={formData.rentalDetails?.cantidadManteleria || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rentalDetails: {
                              ...formData.rentalDetails!,
                              cantidadManteleria: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="vigilante"
                        checked={formData.rentalDetails?.incluyeVigilante || false}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            rentalDetails: { ...formData.rentalDetails!, incluyeVigilante: checked as boolean },
                          })
                        }
                      />
                      <Label htmlFor="vigilante">¿Incluye Vigilante?</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label>Nombre del Cliente *</Label>
              <Input
                placeholder="Juan Pérez"
                value={formData.client?.name || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    client: { ...formData.client!, name: e.target.value },
                  })
                }
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="cliente@email.com"
                value={formData.client?.email || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    client: { ...formData.client!, email: e.target.value },
                  })
                }
              />
            </div>

            <div>
              <Label>Teléfono *</Label>
              <Input
                type="tel"
                placeholder="+51 999 999 999"
                value={formData.client?.phone || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    client: { ...formData.client!, phone: e.target.value },
                  })
                }
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label>Pago Adelantado *</Label>
              <Input
                type="number"
                placeholder="2500.00"
                step="0.01"
                value={formData.contract?.pagoAdelantado || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contract: {
                      ...formData.contract!,
                      pagoAdelantado: parseFloat(e.target.value),
                    },
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                El precio total se calculará automáticamente en el resumen
              </p>
            </div>

            <div>
              <Label>Garantía (S/)</Label>
              <Input
                type="number"
                placeholder="500.00"
                step="0.01"
                value={formData.contract?.garantia || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contract: {
                      ...formData.contract!,
                      garantia: parseFloat(e.target.value) || 0,
                    },
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Monto de garantía por daños o cancelación
              </p>
            </div>

            <div>
              <Label>Foto del Contrato</Label>
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*" />
                <Button type="button" variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Recibos de Pago</Label>
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*" multiple />
                <Button type="button" variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Decoración (Opcional)</h3>
                <p className="text-sm text-muted-foreground">
                  Agrega paquetes de decoración
                </p>
              </div>
              <Button type="button" onClick={addDecoration} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>

            {decorationItems.length > 0 ? (
              <div className="space-y-3">
                {decorationItems.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <Label>Proveedor</Label>
                            <Select
                              value={item.provider}
                              onValueChange={(value) => updateDecoration(index, 'provider', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona" />
                              </SelectTrigger>
                              <SelectContent>
                                {DECORATION_PROVIDERS.map((p) => (
                                  <SelectItem key={p.id} value={p.name}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Paquete</Label>
                            <Select
                              value={item.package}
                              onValueChange={(value) => updateDecoration(index, 'package', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona" />
                              </SelectTrigger>
                              <SelectContent>
                                {DECORATION_PACKAGES.map((p) => (
                                  <SelectItem key={p.id} value={p.name}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Costo Proveedor</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.providerCost}
                              onChange={(e) =>
                                updateDecoration(index, 'providerCost', parseFloat(e.target.value))
                              }
                            />
                          </div>
                          <div>
                            <Label>Costo al Cliente</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.clientCost}
                              onChange={(e) =>
                                updateDecoration(index, 'clientCost', parseFloat(e.target.value))
                              }
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Ganancia</Label>
                            <Input
                              type="number"
                              value={item.profit}
                              disabled
                              className="bg-success/10 font-bold"
                            />
                          </div>
                          
                          {/* Estado de Pago */}
                          <div>
                            <Label>Estado de Pago</Label>
                            <select
                              className="w-full h-10 px-3 rounded-md border border-input bg-background"
                              value={item.estadoPago || 'pendiente'}
                              onChange={(e) => updateDecoration(index, 'estadoPago', e.target.value)}
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="adelanto">Adelanto Dado</option>
                              <option value="pagado">Pagado Completo</option>
                            </select>
                          </div>
                          
                          {/* Monto Pagado */}
                          {(item.estadoPago === 'adelanto' || item.estadoPago === 'pagado') && (
                            <div>
                              <Label>Monto Pagado (S/)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.montoPagado || 0}
                                onChange={(e) => updateDecoration(index, 'montoPagado', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDecoration(index)}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p>No hay decoración agregada</p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            {/* Personal Temporal Section - ÚNICO LUGAR PARA AGREGAR PERSONAL */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Personal del Evento</CardTitle>
                    <CardDescription>
                      Agrega el personal necesario para el evento. Los roles de Coordinador y Encargado de Compras pueden tener acceso al sistema.
                    </CardDescription>
                  </div>
                  <Button type="button" onClick={addStaff} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Personal
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {formData.staff && formData.staff.length > 0 ? (
                  <div className="space-y-4">
                    {formData.staff.map((person, index) => {
                      const rateType = person.roleId ? getRateType(person.roleId) : 'hourly';
                      const canAccess = person.roleId ? canRoleHaveSystemAccess(person.roleId) : false;
                      
                      return (
                        <Card key={index} className="border-2">
                          <CardContent className="pt-6 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-4">
                                {/* Fila 1: Nombre y Rol */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label>Nombre *</Label>
                                    <Input
                                      placeholder="Juan Pérez"
                                      value={person.name}
                                      onChange={(e) => updateStaff(index, 'name', e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <Label>Rol *</Label>
                                    <Select
                                      value={person.roleId || ''}
                                      onValueChange={(value) => updateStaff(index, 'roleId', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un rol" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {STAFF_ROLES.map((role) => (
                                          <SelectItem key={role.id} value={role.id}>
                                            <div className="flex flex-col">
                                              <span>{role.name}</span>
                                              <span className="text-xs text-muted-foreground">
                                                S/ {role.defaultRate}/{role.rateType === 'hourly' ? 'hora' : 'plato'}
                                              </span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Fila 2: Tarifa y Cantidad */}
                                <div className="grid grid-cols-3 gap-3">
                                  {rateType === 'hourly' ? (
                                    <>
                                      <div>
                                        <Label>Horas</Label>
                                        <Input
                                          type="number"
                                          value={person.hours || 0}
                                          onChange={(e) => updateStaff(index, 'hours', parseInt(e.target.value) || 0)}
                                        />
                                      </div>
                                      <div>
                                        <Label>Tarifa/Hora (S/)</Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={person.hourlyRate || 0}
                                          onChange={(e) => updateStaff(index, 'hourlyRate', parseFloat(e.target.value) || 0)}
                                        />
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div>
                                        <Label>Platos</Label>
                                        <Input
                                          type="number"
                                          value={person.plates || 0}
                                          onChange={(e) => updateStaff(index, 'plates', parseInt(e.target.value) || 0)}
                                        />
                                      </div>
                                      <div>
                                        <Label>Tarifa/Plato (S/)</Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={person.hourlyRate || 0}
                                          onChange={(e) => updateStaff(index, 'hourlyRate', parseFloat(e.target.value) || 0)}
                                        />
                                      </div>
                                    </>
                                  )}
                                  <div>
                                    <Label>Costo Total</Label>
                                    <Input
                                      type="number"
                                      value={person.totalCost || 0}
                                      disabled
                                      className="bg-muted font-bold"
                                    />
                                  </div>
                                </div>

                                {/* Fila 3: Contacto */}
                                <div>
                                  <Label>Contacto *</Label>
                                  <Input
                                    placeholder="+51 999 999 999"
                                    value={person.contact}
                                    onChange={(e) => updateStaff(index, 'contact', e.target.value)}
                                  />
                                </div>

                                {/* Opción de acceso al sistema (solo para Coordinador y Encargado de Compras) */}
                                {canAccess && (
                                  <div className="border-t pt-4 space-y-3">
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`access-${index}`}
                                        checked={person.hasSystemAccess || false}
                                        onCheckedChange={(checked) => updateStaff(index, 'hasSystemAccess', checked as boolean)}
                                      />
                                      <label
                                        htmlFor={`access-${index}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        Conceder acceso al sistema
                                      </label>
                                    </div>
                                    
                                    {person.hasSystemAccess && (
                                      <Card className="bg-primary/5 border-primary/20">
                                        <CardContent className="pt-4 space-y-3">
                                          <div className="grid grid-cols-2 gap-3">
                                            <div>
                                              <Label className="text-xs">Email de acceso</Label>
                                              <Input
                                                type="email"
                                                value={person.systemEmail || ''}
                                                readOnly
                                                disabled
                                                className="h-9 bg-muted"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-xs">Contraseña</Label>
                                              <Input
                                                type="text"
                                                value={person.systemPassword || ''}
                                                readOnly
                                                disabled
                                                className="h-9 bg-muted"
                                              />
                                            </div>
                                          </div>
                                          <p className="text-xs text-muted-foreground">
                                            ✅ Credenciales asignadas automáticamente según el rol seleccionado
                                          </p>
                                        </CardContent>
                                      </Card>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Botón eliminar */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeStaff(index)}
                                className="shrink-0"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No hay personal agregado</p>
                    <p className="text-sm mt-1">Haz clic en "Agregar Personal" para comenzar</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Total Cost Card */}
            {formData.staff && formData.staff.length > 0 && (
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Costo Total de Personal</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.staff.length} persona{formData.staff.length !== 1 ? 's' : ''} contratada{formData.staff.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-primary">
                      S/ {(formData.staff || []).reduce((sum, p) => sum + (p.totalCost || 0), 0).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 6:
        const totals = calculateTotals();
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resumen del Evento</h3>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium">
                    {EVENT_TYPES.find((t) => t.value === formData.type)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Título:</span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span className="font-medium">{formData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ubicación:</span>
                  <span className="font-medium">
                    {LOCATIONS.find(l => l.value === formData.location)?.label}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Desglose de Costos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {totals.foodCost > 0 && (
                  <div className="flex justify-between">
                    <span>Costo de Comida:</span>
                    <span className="font-medium">S/ {totals.foodCost.toFixed(2)}</span>
                  </div>
                )}
                {totals.decorationClientCost > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span>Costo Decoración (Cliente):</span>
                      <span className="font-medium">S/ {totals.decorationClientCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-success">
                      <span>Ganancia Decoración:</span>
                      <span className="font-bold">S/ {totals.decorationProfit.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {totals.staffCost > 0 && (
                  <div className="flex justify-between">
                    <span>Costo de Personal:</span>
                    <span className="font-medium">S/ {totals.staffCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold text-lg">PRECIO TOTAL:</span>
                  <span className="font-bold text-xl text-primary">S/ {totals.totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pago Adelantado:</span>
                  <span className="font-medium">S/ {totals.advancePayment.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-warning">
                  <span className="font-semibold">Saldo Pendiente:</span>
                  <span className="font-bold">S/ {totals.balance.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {selectedServiceUsers.length > 0 && (
              <Card className="border-success/30 bg-success/5">
                <CardHeader>
                  <CardTitle className="text-base">Personal de Servicio Asignado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedServiceUsers.map(userId => {
                      const serviceUser = serviceUsers.find(u => u.id === userId);
                      return serviceUser ? (
                        <div key={userId} className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                            ✓
                          </Badge>
                          <span className="text-sm">{serviceUser.name} {serviceUser.last_name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Crear Nuevo Evento</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{STEPS[currentStep]}</span>
              <span className="text-muted-foreground">
                Paso {currentStep + 1} de {STEPS.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="min-h-[400px]">{renderStep()}</div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <Button type="button" onClick={handleNext} className="bg-gradient-primary">
              {currentStep === STEPS.length - 1 ? (
                'Crear Evento'
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}