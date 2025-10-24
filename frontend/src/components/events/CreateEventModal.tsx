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
import { cn } from '@/lib/utils';

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
}

interface DecorationItem {
  provider: string;
  package: string;
  providerCost: number;
  clientCost: number;
  profit: number;
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

export function CreateEventModal({ open, onClose }: CreateEventModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>();
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
        status: 'draft' as const,
        description: formData.description || '',
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

      const existingEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
      const updatedEvents = [...existingEvents, newEvent];
      localStorage.setItem('demo_events', JSON.stringify(updatedEvents));
      
      // Update assigned events for service users
      if (selectedServiceUsers.length > 0) {
        const storedUsers = JSON.parse(localStorage.getItem('demo_users') || JSON.stringify(DEMO_USERS));
        const updatedUsers = storedUsers.map((u: any) => {
          if (selectedServiceUsers.includes(u.id)) {
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
          hours: 0,
          hourlyRate: 0,
          totalCost: 0,
          contact: '',
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

  const updateStaff = (index: number, field: keyof EventStaff, value: string | number) => {
    const updated = [...(formData.staff || [])];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    
    if (field === 'hours' || field === 'hourlyRate') {
      updated[index].totalCost = updated[index].hours * updated[index].hourlyRate;
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
                placeholder="Ej: Quinceañera de María"
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
                placeholder="150"
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
                      placeholder="150"
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
            {/* Service Users Section */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Personal de Servicio (Usuarios del Sistema)
                </CardTitle>
                <CardDescription>
                  Selecciona usuarios que tendrán acceso para registrar gastos en este evento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {serviceUsers.map((serviceUser) => (
                  <div
                    key={serviceUser.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedServiceUsers.includes(serviceUser.id)}
                        onCheckedChange={() => toggleServiceUser(serviceUser.id)}
                      />
                      <div>
                        <p className="font-medium">{serviceUser.name} {serviceUser.last_name}</p>
                        <p className="text-xs text-muted-foreground">{serviceUser.email}</p>
                      </div>
                    </div>
                    {selectedServiceUsers.includes(serviceUser.id) && (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        Asignado
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Temporary Staff Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Personal Temporal</CardTitle>
                    <CardDescription>
                      Personal sin cuenta en el sistema (mozos, limpieza, etc.)
                    </CardDescription>
                  </div>
                  <Button type="button" onClick={addStaff} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {formData.staff && formData.staff.filter(s => !s.userId).length > 0 ? (
                  <div className="space-y-3">
                    {formData.staff.filter(s => !s.userId).map((person, index) => {
                      const actualIndex = formData.staff!.indexOf(person);
                      return (
                        <Card key={actualIndex}>
                          <CardContent className="pt-6 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 grid grid-cols-2 gap-3">
                                <div>
                                  <Label>Nombre</Label>
                                  <Input
                                    placeholder="Juan Pérez"
                                    value={person.name}
                                    onChange={(e) => updateStaff(actualIndex, 'name', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Rol</Label>
                                  <Input
                                    placeholder="Mesero"
                                    value={person.role}
                                    onChange={(e) => updateStaff(actualIndex, 'role', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Horas</Label>
                                  <Input
                                    type="number"
                                    value={person.hours}
                                    onChange={(e) =>
                                      updateStaff(actualIndex, 'hours', parseInt(e.target.value))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>Tarifa/Hora</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={person.hourlyRate}
                                    onChange={(e) =>
                                      updateStaff(actualIndex, 'hourlyRate', parseFloat(e.target.value))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>Contacto</Label>
                                  <Input
                                    placeholder="+51 999 999 999"
                                    value={person.contact}
                                    onChange={(e) => updateStaff(actualIndex, 'contact', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Costo Total</Label>
                                  <Input type="number" value={person.totalCost} disabled className="bg-muted" />
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeStaff(actualIndex)}
                                className="ml-2"
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
                  <div className="py-8 text-center text-muted-foreground">
                    <p>No hay personal temporal agregado</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Total Cost Card */}
            {formData.staff && formData.staff.length > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Costo Total de Personal:</span>
                    <span className="text-xl font-bold text-primary">
                      S/ {(formData.staff || []).reduce((sum, p) => sum + p.totalCost, 0).toFixed(2)}
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