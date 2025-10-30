import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, Search, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { Event, EventClient } from '@/types/events';

export default function Clientes() {
  const [clients, setClients] = useState<EventClient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'individual' | 'corporativo'>('all');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    const storedEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
    
    // Extraer clientes únicos de todos los eventos
    const uniqueClients: Map<string, EventClient & { tipo: string; eventos: number }> = new Map();
    
    storedEvents.forEach((event: Event) => {
      const clientKey = event.client.email || event.client.phone;
      // Usar tipoCliente del cliente, o inferir por document_type o tipoContrato
      const isCorporativo = 
        event.client.tipoCliente === 'corporativo' ||
        event.client.document_type === 'RUC' || 
        event.contract?.tipoContrato === 'corporativo';
      
      if (uniqueClients.has(clientKey)) {
        const existing = uniqueClients.get(clientKey)!;
        uniqueClients.set(clientKey, {
          ...existing,
          eventos: existing.eventos + 1,
        });
      } else {
        uniqueClients.set(clientKey, {
          ...event.client,
          tipo: isCorporativo ? 'corporativo' : 'individual',
          eventos: 1,
        });
      }
    });
    
    setClients(Array.from(uniqueClients.values()));
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.phone && client.phone.includes(searchTerm));
    
    const matchesFilter = 
      filter === 'all' || 
      (client as any).tipo === filter;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: clients.length,
    corporativos: clients.filter(c => (c as any).tipo === 'corporativo').length,
    individuales: clients.filter(c => (c as any).tipo === 'individual').length,
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Base de Datos de Clientes</h1>
              <p className="text-muted-foreground">Gestiona la información de tus clientes corporativos e individuales</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{stats.total}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Corporativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">{stats.corporativos}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Individuales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{stats.individuales}</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre, email o teléfono..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setFilter('corporativo')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === 'corporativo' ? 'bg-blue-600 text-white' : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      Corporativos
                    </button>
                    <button
                      onClick={() => setFilter('individual')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === 'individual' ? 'bg-green-600 text-white' : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      Individuales
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clients List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredClients.map((client, idx) => (
                <Card key={idx} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${
                          (client as any).tipo === 'corporativo' 
                            ? 'bg-blue-500/10 text-blue-600' 
                            : 'bg-green-500/10 text-green-600'
                        }`}>
                          {(client as any).tipo === 'corporativo' ? (
                            <Building2 className="h-6 w-6" />
                          ) : (
                            <Users className="h-6 w-6" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {client.name} {client.last_name}
                          </h3>
                          <Badge variant="outline" className={(
                            (client as any).tipo === 'corporativo' 
                              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                              : 'bg-green-500/10 text-green-600 border-green-500/20'
                          )}>
                            {(client as any).tipo === 'corporativo' ? 'Corporativo' : 'Individual'}
                          </Badge>
                        </div>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        {(client as any).eventos} evento{(client as any).eventos !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      {client.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{client.address}</span>
                        </div>
                      )}
                      {client.document_number && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>{client.document_type}: {client.document_number}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredClients.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No se encontraron clientes</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
