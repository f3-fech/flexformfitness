# Roadmap de Tareas - Flex Form Fitness

Este es el listado de nuevas funcionalidades que implementaremos en la tienda para hacerla más premium y funcional.

## Funcionalidades Solicitadas

### 1. Programa de Puntos (Loyalty Program)
- `[ ]` Diseñar modelo de datos en Firestore para almacenar puntos de usuario (asociados al perfil) y transacciones de puntos.
- `[ ]` Implementar lógica para otorgar puntos al completar una compra (ej. 1 punto por cada $1 gastado).
- `[ ]` Crear sección de "Mis Puntos" en el panel del cliente (`/mi-cuenta`) mostrando el balance actual y el historial.
- `[ ]` Desarrollar la opción de canje de puntos por cupones de descuento en el checkout.

### 2. Reseñas de Productos (Product Reviews)
- `[ ]` Diseñar modelo de datos para opiniones/reseñas en Firestore (`products/{prodId}/reviews`).
- `[ ]` Crear el componente de formulario de opinión en la página del producto (solo para usuarios autenticados que hayan comprado el producto).
- `[ ]` Mostrar la valoración media con estrellas y el listado de reseñas debajo de la ficha del producto.
- `[ ]` (Opcional) Implementar la carga de fotos en las opiniones usando Firebase Storage.

### 3. Sección de Preguntas Frecuentes (FAQ) Dinámica
- `[ ]` Crear una nueva página `/faq` con diseño de acordeones interactivos y fluidos.
- `[ ]` Diseñar la gestión de preguntas y respuestas desde el panel de administración (añadir, editar y ordenar).
- `[ ]` Implementar un buscador rápido dentro de la página de FAQs.

### 4. Gestión de Cupones de Descuento
- `[ ]` Diseñar modelo de datos de cupones en Firestore (`coupons`) con campos para porcentaje/monto fijo, fecha de expiración, límite de usos y estado activo.
- `[ ]` Crear la pestaña de administración de cupones en el panel de control del administrador.
- `[ ]` Implementar el input de aplicar cupón en el resumen del carrito / checkout y validar las condiciones.

### 5. Seguimiento Público de Pedidos (Order Tracking)
- `[ ]` Crear una ruta pública para el seguimiento `/seguimiento-pedido`.
- `[ ]` Diseñar el formulario que solicita el ID de pedido y el correo electrónico del comprador.
- `[ ]` Crear una pantalla informativa premium y visual que muestre la línea de tiempo del pedido (Recibido, Preparando, Enviado, Entregado) con su estado e información de envío.
