# 📋 GUÍA DE USO - SISTEMA DE CONTROL DE EVENTOS

## 🎯 ¿Qué es este sistema?

El **Sistema de Control de Eventos** es una plataforma completa diseñada para gestionar todos los aspectos de la organización de eventos sociales (bodas, quinceañeras, cumpleaños, eventos corporativos). Permite controlar desde la creación del evento hasta el seguimiento financiero, gastos, personal, decoración y más.

---

## 👥 ROLES Y PERMISOS

El sistema cuenta con **3 roles principales**, cada uno con diferentes niveles de acceso:

### 🔑 1. ADMINISTRADOR (Admin)
**Acceso Total al Sistema**

✅ **Puede hacer TODO:**
- Crear, editar y eliminar eventos
- Gestionar clientes
- Ver y modificar todos los gastos e ingresos
- Acceder al almacén completo
- Ver estadísticas financieras
- Asignar eventos a otros usuarios
- Registrar decoración, personal y servicios
- Modificar caja chica del evento
- Acceder a todas las secciones

---

### 📦 2. ENCARGADO DE COMPRAS
**Especializado en Gestión de Insumos**

✅ **Puede:**
- Ver eventos asignados a él
- Registrar gastos de **Comida (Insumos)** solamente
- Añadir verduras y ajíes
- Registrar ingredientes dinámicos según el plato
- Agregar gastos adicionales

❌ **NO puede:**
- Ver sección de **Almacén**
- Ver o modificar **Ingresos**
- Ver **Reservas**
- Acceder a **Estadísticas Financieras**
- Ver decoración completa
- Modificar personal o bebidas

---

### 🎯 3. COORDINADOR
**Gestión de Ingresos y Gastos Adicionales**

✅ **Puede:**
- Ver eventos asignados a él
- Acceder al **Almacén** (solo ver su propio historial)
- Registrar **Ingresos** en campos limitados:
  - ✓ Kiosco
  - ✓ Horas Extras
- Agregar **Gastos Adicionales** solamente

❌ **NO puede:**
- Ver o modificar **Comida (Insumos)**
- Ver o modificar **Bebidas**
- Ver totales de gastos del evento
- Ver **Reservas**
- Acceder a **Estadísticas Financieras**

---

## 🗂️ SECCIONES DEL SISTEMA

### 📅 1. CALENDARIO Y EVENTOS

#### **Vista Principal**
- **Calendario interactivo** con todos los eventos programados
- **Dos tabs principales:**
  - 🎉 **Eventos**: Eventos confirmados y completos
  - 📝 **Reservas**: Reservaciones preliminares (solo Admin)

#### **Crear Reserva desde Calendario**
1. Click en una fecha del calendario
2. Se abre modal rápido de reserva
3. Ingresar datos básicos del cliente
4. La reserva aparece en el calendario
5. Más tarde puede convertirse en evento completo

---

### 🎉 2. CREACIÓN DE EVENTOS (Solo Admin)

El proceso de crear un evento tiene **7 pasos**:

#### **PASO 1: Información del Cliente**
- Nombre completo
- Teléfono
- Email
- Tipo de cliente (Individual/Corporativo)

#### **PASO 2: Detalles del Evento**
- Tipo de evento (Boda, XV años, Cumpleaños, etc.)
- Fecha y hora
- Lugar del evento
- Número de invitados
- Tipo de servicio:
  - Con comida
  - Solo alquiler

#### **PASO 3: Comida y Bebidas**
- **Comida:**
  - Tipo de plato
  - Cantidad de platos
  - Precio por plato
- **Bebidas:**
  - Tipos: Gaseosa, Agua, Champán, Vino, Cerveza, Cóctel
  - Cantidad y precio
  - Modalidad: Cover o Compra Local

#### **PASO 4: Decoración y Paquetes**
- Agregar paquetes de decoración
- Definir:
  - Paquete/Item
  - Proveedor
  - Costo del proveedor
  - Precio al cliente
  - Utilidad
  - **Estado de Pago**: Pendiente, Adelanto, Pagado
  - **Monto Pagado**: Si hay adelanto o pago completo

💡 **IMPORTANTE**: El adelanto registrado aquí se guardará y mostrará en:
- Paso 7 (Resumen)
- Pestaña de Decoración
- Gastos del evento

#### **PASO 5: Personal del Evento**
- Agregar personal necesario:
  - Meseros
  - Chef
  - DJ/Música
  - Seguridad
  - Limpieza
- Definir:
  - Nombre
  - Rol
  - Costo por hora
  - Horas trabajadas
  - Costo total

#### **PASO 6: Contrato y Financiero**
- Precio total del evento
- Pago adelantado por el cliente
- Saldo pendiente
- **Presupuesto asignado (Caja Chica)**
- Garantía (opcional)

#### **PASO 7: Resumen y Confirmación**
- Resumen completo de:
  - Cliente
  - Detalles del evento
  - Comida y bebidas
  - Decoración (con adelantos registrados)
  - Personal
  - Totales financieros
- Botón "Crear Evento"

---

### 💰 3. GESTIÓN DE GASTOS

Esta es una de las secciones más importantes y complejas del sistema.

#### **Vista de Gastos (Según rol)**

**🔵 ADMIN - Ve TODO:**
- Total Gastos del Evento
- Comida (Insumos)
- Verduras - Total
- Bebidas
- Decoración
- Personal
- Gastos Adicionales

**🟢 ENCARGADO DE COMPRAS - Solo ve:**
- Comida (Insumos)
- Gastos Adicionales

**🟡 COORDINADOR - Solo ve:**
- Botón "Registrar Gastos e Ingresos"
- Gastos Adicionales

---

#### **💚 COMIDA (INSUMOS) - Sistema Dinámico**

Esta sección es **inteligente** y se adapta al plato seleccionado.

##### **Paso 1: Guía de Compras**
1. Seleccionar el plato del menú (Pollo a la Parrilla, Lomo Saltado, etc.)
2. El sistema calcula automáticamente:
   - Ingredientes necesarios según plato y cantidad de porciones
   - Cantidades estimadas
   - Costos sugeridos

##### **Paso 2: Registrar Verduras**
- Sección especial para verduras
- **Agregar verduras:**
  - Tipo de verdura (sin precio predefinido)
  - Kilogramos
  - Precio por kilo (manual)
  - Total calculado automáticamente
- **Ver total acumulado** en el resumen de gastos
- Registrar múltiples verduras y guardar todas juntas

##### **Paso 3: Registrar Ajíes** (Si aplica al plato)
- Solo aparece si el plato requiere ajíes
- Tipos: Rojo, Amarillo, Panka
- Kilogramos y precio manual
- Total calculado

##### **Paso 4: Ingredientes Dinámicos del Plato**
- El sistema muestra **solo los ingredientes necesarios**
- **Excluye automáticamente** las verduras comunes:
  - ❌ Tomate
  - ❌ Lechuga
  - ❌ Limón
  - ❌ Zanahoria
  - ❌ Cebolla
  - ❌ Pimiento
  - ❌ Pepino
  - ❌ Culantro

Para cada ingrediente:
1. Ver cantidad sugerida y costo estimado
2. **Ingresar manualmente:**
   - Cantidad real comprada
   - Costo unitario real (NO se auto-rellena)
3. Ver total calculado
4. Click en botón **"Registrar"**
5. El sistema guarda:
   - El ingrediente
   - El monto
   - **Quién lo registró** (aparece como badge verde)

📌 **Tracking de Usuario:**
- Cada ingrediente registrado muestra:
  - ✓ [Nombre del Usuario] que lo registró
  - Fecha y hora
  - Monto exacto

---

#### **🍺 BEBIDAS**

Sección colapsable para gestionar bebidas del evento.

**Agregar bebida:**
- Tipo
- Cantidad
- Precio
- Modalidad (cover o compra local)

**Editar/Eliminar:**
- Botón "editar" en cada bebida
- Opción de eliminar
- Totales actualizados automáticamente

---

#### **➕ GASTOS ADICIONALES**

Todos los roles con acceso pueden agregar gastos extras:
- Descripción del gasto
- Cantidad
- Precio unitario
- Método de pago
- Total calculado

**Tracking:**
- Fecha de registro
- Registrado por: [Nombre]
- Método de pago

---

### 💵 4. GESTIÓN DE INGRESOS

**🔴 Solo Admin y Coordinador tienen acceso**

#### **Admin - Ve y modifica TODO:**
- Pago por comida
- Pago por alquiler
- Kiosco
- Horas extras
- Ingresos adicionales

#### **Coordinador - Solo estos campos:**
- ✓ Kiosco
- ✓ Horas extras
- ❌ Todo lo demás está deshabilitado

**Botón especial para Coordinador:**
- En lugar de "Registrar Gastos", dice:
  - **"Registrar Gastos e Ingresos"**

---

### 🎨 5. DECORACIÓN

**Vista de decoración:**
- Lista de paquetes/items de decoración
- Para cada item:
  - Proveedor
  - Costo proveedor
  - Precio cliente
  - Utilidad
  - **Estado de pago actual**
  - **Historial de pagos** (adelantos y pagos)

**Registrar adelanto/pago:**
1. Click en "Registrar Pago"
2. Elegir tipo:
   - Adelanto (monto parcial)
   - Pago completo
3. Ingresar monto
4. Guardar
5. El sistema registra:
   - Monto
   - Fecha
   - Quién lo registró
   - Saldo pendiente actualizado

💡 **Los adelantos registrados en la creación del evento (Paso 4) ya aparecen aquí automáticamente.**

---

### 👷 6. PERSONAL

Vista de todo el personal asignado al evento:
- Nombre
- Rol
- Horas
- Costo por hora
- Total pagado
- Estado de pago

---

### 📦 7. ALMACÉN

**🔴 Solo Admin y Coordinador**

#### **Admin - Vista completa:**
- Ver todo el inventario
- Ver historial de movimientos de todos
- Registrar nuevos movimientos
- Editar y eliminar

#### **Coordinador - Vista limitada:**
- Solo ve sus propios movimientos
- No puede ver historial de otros usuarios
- Puede registrar movimientos propios

**Tipos de movimiento:**
- Entrada
- Salida
- Ajuste

**Información registrada:**
- Producto
- Cantidad
- Tipo de movimiento
- Fecha
- Usuario que lo registró

---

### 📊 8. ESTADÍSTICAS FINANCIERAS

**🔴 Solo Admin**

Dashboard completo con:
- Ingresos totales
- Gastos totales
- Balance general
- Gráficos y reportes
- Eventos más rentables
- Análisis por período

---

### 👤 9. CLIENTES

**🔴 Solo Admin**

Base de datos de clientes:
- Información completa
- Historial de eventos
- Datos de contacto
- Documentos

---

## 📱 FLUJOS DE TRABAJO TÍPICOS

### 🎯 Flujo del ADMIN

1. **Crear evento completo:**
   - Calendario → Fecha → Crear Evento
   - Completar los 7 pasos
   - Asignar a Encargado de Compras

2. **Supervisar gastos:**
   - Entrar al evento
   - Ver que Encargado registró ingredientes
   - Verificar tracking de quién registró qué
   - Ver totales actualizados

3. **Registrar ingresos y decoración:**
   - Registrar pagos de clientes
   - Actualizar estado de decoración
   - Ver balance del evento

4. **Revisar estadísticas:**
   - Dashboard financiero
   - Análisis de rentabilidad

---

### 🛒 Flujo del ENCARGADO DE COMPRAS

1. **Ver eventos asignados:**
   - Dashboard → Mis Eventos

2. **Ir al evento y Gastos:**
   - Click en evento
   - Pestaña "Gastos"

3. **Seleccionar plato:**
   - Ver guía de compras generada

4. **Registrar compras:**
   - Agregar verduras con precios reales
   - Registrar ingredientes del plato
   - Ingresar cantidades y costos reales (manual)
   - Click "Registrar" en cada ingrediente
   - Sistema guarda con tu nombre

5. **Agregar gastos extras:**
   - Si hay gastos adicionales relacionados

---

### 🎯 Flujo del COORDINADOR

1. **Ver eventos asignados:**
   - Dashboard → Mis Eventos

2. **Ir a Gastos Adicionales:**
   - Registrar gastos extras del evento

3. **Registrar Ingresos:**
   - Pestaña "Ingresos"
   - Solo kiosco y horas extras
   - Ingresar montos

4. **Ver Almacén:**
   - Ver solo mis movimientos
   - Registrar salidas/entradas que hice

---

## 🎨 CARACTERÍSTICAS ESPECIALES

### ✨ Tracking Completo
- Cada acción registra quién la hizo
- Fecha y hora exacta
- Historial de cambios

### 🧮 Cálculos Automáticos
- Ingredientes según plato y porciones
- Totales de gastos por categoría
- Balance automático (presupuesto - gastado)
- Utilidad de decoración

### 🔒 Seguridad por Roles
- Cada usuario solo ve lo que le corresponde
- No puede acceder a secciones restringidas
- Permisos validados en backend

### 📊 Resumen Financiero en Tiempo Real
- **Total Gastos del Evento** con desglose:
  - Comida (Insumos)
  - Verduras - Total ✨
  - Bebidas
  - Decoración
  - Personal
  - Gastos Adicionales
  
- **Caja Chica del Evento:**
  - Presupuesto asignado
  - Gastado
  - Sobrante (verde si positivo, rojo si negativo)

### 🎯 Sistema de Ingredientes Inteligente
- Se adapta al plato seleccionado
- Excluye verduras que ya tienen su sección
- Precios manuales (no predefinidos)
- Tracking de quién registró cada compra

---

## 💡 MEJORES PRÁCTICAS

### Para el Admin:
1. Asignar eventos apenas se creen
2. Revisar diariamente los registros de gastos
3. Verificar el tracking de cada usuario
4. Mantener actualizada la caja chica

### Para el Encargado de Compras:
1. Registrar compras el mismo día
2. Ingresar precios reales, no estimados
3. Registrar cada ingrediente inmediatamente
4. Revisar la guía de compras antes de ir al mercado

### Para el Coordinador:
1. Registrar ingresos de kiosco diariamente
2. Actualizar horas extras conforme ocurran
3. Registrar gastos adicionales con detalle
4. Verificar acceso al almacén para movimientos propios

---

## 🚀 VENTAJAS DEL SISTEMA

✅ **Control total** de cada evento
✅ **Transparencia** con tracking de usuarios
✅ **Cálculos automáticos** que ahorran tiempo
✅ **Adaptabilidad** según el tipo de plato
✅ **Roles específicos** que evitan errores
✅ **Visibilidad en tiempo real** del estado financiero
✅ **Historial completo** de todas las acciones

---

