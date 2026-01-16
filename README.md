# DevolucionesApp

Sistema de gestión de devoluciones para TAT Distribuciones y Tiendas y Marcas (TYM).

## 🚀 Quick Start

### Desarrollo Local

1. Clone el repositorio
2. Abra `index.html` en un servidor local (Live Server, etc.)
3. La aplicación se conecta automáticamente a Supabase

### Producción

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para instrucciones completas de despliegue.

## 📋 Características

- ✅ PWA con soporte offline completo
- ✅ Gestión de rutas y devoluciones
- ✅ Compresión automática de imágenes
- ✅ Sincronización por lotes optimizada
- ✅ Dashboard administrativo con métricas en tiempo real
- ✅ Exportación a Excel y PDF
- ✅ Soporte multi-organización (TAT/TYM)

## 🔧 Optimizaciones de Rendimiento

### Para 60+ Usuarios Concurrentes

- **Consultas optimizadas**: Filtros de fecha por defecto (últimos 7 días)
- **Batch sync**: Sincronización en lotes de 10 items
- **Compresión de imágenes**: Reducción automática antes de almacenar
- **Índices de base de datos**: 15+ índices para queries rápidas
- **Paginación**: Carga progresiva de datos

### Métricas Esperadas

| Métrica | Valor |
|---------|-------|
| Carga inicial dashboard | 1-2s |
| Sincronización (20 items) | 2-3s |
| Memoria navegador | 50-80MB |
| Consultas por carga | 2-3 |

## 📁 Estructura del Proyecto

```
AppDevoluciones/
├── index.html              # Punto de entrada
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── database-indexes.sql    # Scripts de índices DB
├── DEPLOYMENT.md           # Guía de despliegue
├── PRODUCTION-CHECKLIST.md # Checklist de producción
├── css/
│   ├── styles.css
│   ├── components.css
│   ├── ui.css
│   └── variables.css
└── js/
    ├── app.js              # Inicialización
    ├── auth.js             # Autenticación
    ├── data.js             # Capa de datos (optimizada)
    ├── config.js           # Configuración centralizada
    ├── supabase.js         # Cliente Supabase
    ├── utils/
    │   ├── formatters.js
    │   ├── ui.js
    │   └── imageCompression.js  # Compresión de imágenes
    └── views/
        ├── login.js
        ├── admin.js        # Dashboard admin (optimizado)
        ├── auxiliar.js
        └── admin/
            ├── dashboard.js
            ├── history.js
            ├── users.js
            ├── products.js
            └── reports.js
```

## 🔐 Seguridad

⚠️ **IMPORTANTE**: Antes de desplegar a producción:

1. Cambiar contraseñas por defecto en `js/data.js`
2. Habilitar Row Level Security en Supabase
3. Configurar HTTPS en el dominio
4. Revisar políticas de acceso

Ver [DEPLOYMENT.md](DEPLOYMENT.md) sección de seguridad para más detalles.

## 📊 Base de Datos

### Índices Requeridos

Ejecutar `database-indexes.sql` en Supabase SQL Editor antes del despliegue.

**Índices críticos:**
- `idx_routes_date` - Consultas por fecha
- `idx_return_items_route_id` - Devoluciones por ruta
- `idx_return_items_created_at` - Devoluciones recientes
- `idx_return_items_duplicate_check` - Prevención de duplicados

### Tablas Principales

- `users` - Usuarios (admin/auxiliar)
- `routes` - Rutas diarias
- `return_items` - Devoluciones registradas
- `products` - Inventario de productos

## 🛠️ Configuración

### Performance Settings

Editar `js/config.js` para ajustar:

```javascript
CONFIG.PERFORMANCE = {
    DEFAULT_DAYS_FILTER: 7,        // Días a cargar por defecto
    DASHBOARD_RETURNS_LIMIT: 20,   // Límite de devoluciones
    SYNC_BATCH_SIZE: 10,           // Tamaño de lote para sync
    MAX_IMAGE_WIDTH: 1200,         // Ancho máximo de imagen
    IMAGE_QUALITY: 0.7,            // Calidad de compresión
}
```

## 📱 PWA Installation

La app se puede instalar como PWA en:
- Windows (Chrome/Edge)
- Android (Chrome)
- iOS (Safari - con limitaciones)

## 🐛 Troubleshooting

### Dashboard carga lento
1. Verificar índices de base de datos
2. Revisar filtros de fecha
3. Comprobar conexión a Supabase

### Sync offline falla
1. Revisar consola del navegador
2. Verificar espacio en IndexedDB
3. Comprobar conexión a internet

### PWA no se instala
1. Verificar HTTPS habilitado
2. Revisar manifest.json
3. Comprobar service worker activo

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para más soluciones.

## 📈 Monitoreo

### Métricas a vigilar

- Tiempo de carga del dashboard
- Tasa de éxito de sincronización
- Uso de almacenamiento IndexedDB
- Errores en consola del navegador

### Herramientas

- Supabase Dashboard - Logs y métricas
- Browser DevTools - Performance y Network
- Lighthouse - Auditoría PWA

## 🔄 Actualizaciones

El service worker se actualiza automáticamente cada 60 segundos.

Para forzar actualización:
1. Incrementar `CACHE_NAME` en `sw.js`
2. Desplegar nueva versión
3. Los usuarios recibirán actualización automática

## 📞 Soporte

Para problemas o preguntas:
1. Revisar [DEPLOYMENT.md](DEPLOYMENT.md)
2. Revisar [PRODUCTION-CHECKLIST.md](PRODUCTION-CHECKLIST.md)
3. Consultar logs de Supabase
4. Revisar consola del navegador

## 📄 Licencia

Uso interno - TAT Distribuciones / Tiendas y Marcas

---

**Versión:** 2.0 (Production Ready)  
**Última actualización:** Enero 2026  
**Service Worker:** v18
