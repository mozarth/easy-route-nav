
## Problemas detectados

**1. Botón Editar (lápiz) parece no hacer nada**
El botón sí ejecuta `handleEdit` correctamente, pero el formulario de edición se renderiza **arriba de la lista de propiedades**. Cuando haces scroll y estás viendo una propiedad al medio/final de la lista y presionas ✏️, el formulario abre fuera de pantalla y da la impresión de que "no funciona".

**2. RINCONES no genera ruta**
En la base de datos la propiedad RINCONES tiene coordenadas corruptas:
- `latitude: 6.0942` ✅
- `longitude: -754971` ❌ (falta el punto decimal, debería ser `-75.4971`)

Como la longitud del origen es inválida, la URL de Google Maps que se genera no funciona y ningún lote de RINCONES puede mostrar ruta.

## Cambios propuestos

### A. UX del botón Editar (`src/pages/admin/AdminProperties.tsx`)
- Al hacer clic en ✏️: abrir el formulario **y** hacer `scrollTo({ top: 0, behavior: 'smooth' })` para que el usuario vea inmediatamente el formulario de edición.
- Agregar `title="Editar"` al botón para que se vea el tooltip al pasar el mouse.
- Aplicar el mismo scroll cuando se hace clic en "Nueva Propiedad".

### B. Corregir coordenadas de RINCONES (migración de datos)
Actualizar la fila en la tabla `properties`:
```
longitude: -754971  →  -75.4971
```
Con esto, todos los QR y botones "Ver Ruta en Google Maps / Waze" de los lotes de RINCONES pasarán a generar rutas válidas.

> Nota: varios lotes de RINCONES (8, 14, 15A, 17, 23, 24(2)) tienen longitud `-76.xx` en lugar de `-75.xx` — parece error de tipeo. No los toco en este plan porque no sé cuáles son correctos; si quieres los revisamos aparte con la foto/coordenadas reales.

## Confirmación
¿Confirmas que la longitud correcta de la entrada de RINCONES es **-75.4971**? Si tienes las coordenadas exactas de la portería, pásamelas y las uso en la corrección.
