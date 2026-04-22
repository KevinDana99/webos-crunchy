# Control del Magic Remote en webOS 1.4 (Preact + Vite)

## Implementación de Flechas y Scroll

Este proyecto incluye un hook `useMagicNavigation` que maneja:

1. **Flechas D-Pad** (códigos 37-40) → Navegación entre elementos
2. **Botón OK** (código 13) → Selección del elemento enfocado
3. **Botón Back** (código 461/27) → Navegación hacia atrás
4. **Rueda de Scroll** (evento `mousewheel`) → Scroll vertical

## Archivos Modificados/Creados

- `src/lib/magicNavigation.js` - Hook principal y componente FocusProvider
- `src/App.jsx` - Ejemplo de uso con grid de 20 elementos
- `src/App.css` - Estilos con clase `.is-focused` para el foco visual

## Cómo Funciona

### Hook useMagicNavigation

```js
const { focusedIndex, setFocusedIndex } = useMagicNavigation(
  items,        // Array de items a navegar
  onSelect,     // Callback al presionar OK
  onScroll      // Callback al hacer scroll ('up' | 'down')
);
```

**Características:**
- Maneja `keydown` para flechas (37-40), OK (13), Back (461/27)
- Usa `mousewheel` con `e.wheelDeltaY` (compatible Chrome 26/34)
- Llama a `preventDefault()` para evitar scroll nativo del body
- Mantiene sincronizado `focusedIndex` con atributos `data-focus-index`
- Garantiza visibilidad del elemento con `scrollIntoView`

### FocusProvider

Componente wrapper que:
- Aplica clase `.is-focused` al elemento con índice actual
- Configura `tabindex` y `aria-selected` para accesibilidad
- Delega eventos `click` para Compatibilidad con puntero Magic Mouse
- Ejecuta `focus()` en el elemento activo (necesario para Chrome 34)

### Eventos Soportados

| Botón | Código | Acción |
|-------|--------|--------|
| Izquierda | 37 | Mover foco a la izquierda |
| Arriba | 38 | Mover foco arriba |
| Derecha | 39 | Mover foco a la derecha |
| Abajo | 40 | Mover foco abajo |
| OK/Center | 13 | Seleccionar elemento |
| Back | 461 o 27 | Navegación atrás |

## Notas de Compatibilidad

### Vite Config
```js
// Ya configurado en vite.config.js
legacy({
  targets: ['chrome 34'], // Chrome de webOS
  polyfills: true
})
```

### Limitaciones webOS 1.4
- `wheelDeltaY` en lugar de `deltaY` (Chrome 26/34)
- No soporta `gap` en Flexbox (usamos márgenes negativos)
- Variables CSS NO soportadas (usamos valores hardcodeados)
- Foco nativo del navegador es limitado (usamos gestión manual)

## Optimizaciones para TV 2014

1. **Transiciones ligeras** (0.15s-0.2s) vs animaciones pesadas
2. **User-select: none** evita resaltados de texto con flechas
3. **requestAnimationFrame** doble para asegurar renderizado
4. **Scale(1.02)** en vez de transformaciones complejas

## Debug

Abre la consola remota en webOS 1.4:
```bash
# Conectar a la TV en red
$ palm-log -f  # Para dispositivos antiguos Palm/HP
# o
$ arsdk-shell <tv-ip>
```

Verás logs:
- `Scroll detectado: up/down`
- `Seleccionado: { id, title }`

## Próximos Pasos

- [ ] Añadir soporte para directional pad pattern (Enyo-style spotlight)
- [ ] Integrar con enyo-loader si usas Enyo embebido
- [ ] Testear en hardware real webOS 1.4 (LG 2014)
