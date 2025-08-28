# Carousel Component - Guía Completa

El `Carousel` ha sido completamente rediseñado para ofrecer transiciones suaves de deslizamiento en lugar de efectos fade, con mejor integración visual y múltiples variantes para diferentes casos de uso.

## 🎯 Características Principales

- **Transiciones Suaves**: Efecto de deslizamiento horizontal (sin fade/opacity)
- **Múltiples Variantes**: Para diferentes contextos (listings, compacto, mínimo)
- **Controles Rediseñados**: Glassmorphism y mejor integración visual
- **AutoPlay Inteligente**: Con control manual de pausa/reproducción
- **Responsive**: Optimizado para móvil y desktop
- **Accesibilidad Completa**: Navegación por teclado y screen readers

## 🔧 Props del Componente

### Props Principales

| Prop               | Tipo                                               | Default     | Descripción               |
| ------------------ | -------------------------------------------------- | ----------- | ------------------------- |
| `images`           | `string[]`                                         | `[]`        | Array de URLs de imágenes |
| `variant`          | `'default' \| 'minimal' \| 'compact' \| 'listing'` | `'default'` | Variante del carousel     |
| `aspectRatio`      | `'16/9' \| '4/3' \| '1/1' \| '3/2'`                | `'16/9'`    | Relación de aspecto       |
| `autoPlay`         | `boolean`                                          | `false`     | Reproducción automática   |
| `autoPlayInterval` | `number`                                           | `3000`      | Intervalo en milisegundos |

### Props de Controles

| Prop            | Tipo      | Default | Descripción                   |
| --------------- | --------- | ------- | ----------------------------- |
| `showArrows`    | `boolean` | `true`  | Mostrar flechas de navegación |
| `showDots`      | `boolean` | `true`  | Mostrar indicadores de puntos |
| `showCounter`   | `boolean` | `true`  | Mostrar contador (1/5)        |
| `showPlayPause` | `boolean` | `false` | Mostrar botón play/pause      |

### Props de Eventos

| Prop            | Tipo                                     | Descripción                       |
| --------------- | ---------------------------------------- | --------------------------------- |
| `onImageClick`  | `(image: string, index: number) => void` | Callback al hacer click en imagen |
| `onImageChange` | `(index: number, image: string) => void` | Callback al cambiar de imagen     |

### Props de Contenido

| Prop       | Tipo        | Descripción                                                   |
| ---------- | ----------- | ------------------------------------------------------------- |
| `children` | `ReactNode` | Contenido personalizado para overlays (badges, botones, etc.) |

## 🎨 Overlays y Contenido Personalizado

El Carousel soporta contenido personalizado superpuesto sobre las imágenes mediante la prop `children`. Esto es perfecto para agregar badges, botones de favorito, información del host, etc.

### Ejemplo con Overlays

```jsx
<Carousel
  images={propertyImages}
  variant="listing"
  aspectRatio="4/3"
  showArrows
  showCounter
  autoPlay={false}
>
  {/* Badges */}
  <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
    <Badge variant="premium" size="sm">
      Premium
    </Badge>
    <Badge variant="featured" size="sm">
      Featured
    </Badge>
  </div>

  {/* Favorite Button */}
  <div className="absolute top-3 right-3 z-20">
    <IconButton
      icon={Heart}
      variant="ghost"
      size="sm"
      onClick={handleFavorite}
      className="bg-white/80 backdrop-blur-sm hover:bg-white"
    />
  </div>

  {/* Host Info */}
  <div className="absolute bottom-3 left-3 z-20">
    <button className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs">
      <Avatar src={host.avatar} name={host.name} size="xs" />
      <span className="font-medium">{host.name}</span>
    </button>
  </div>
</Carousel>
```

**Nota:** Los elementos superpuestos deben tener `z-20` o superior para aparecer encima de los controles del carousel.

## 📝 Variantes Disponibles

### 1. Default - Funcionalidad Completa

```jsx
<Carousel
  images={images}
  variant="default"
  aspectRatio="16/9"
  showArrows
  showDots
  showCounter
  showPlayPause
  autoPlay={false}
/>
```

**Características:**

- ✅ Todos los controles visibles
- ✅ Diseño con sombras y bordes redondeados
- ✅ Ideal para galerías principales

### 2. Listing - Optimizado para Propiedades

```jsx
<Carousel
  images={images}
  variant="listing"
  aspectRatio="4/3"
  showArrows
  showCounter
  autoPlay={false}
/>
```

**Características:**

- ✅ Solo flechas y contador
- ✅ Sin puntos (para mejor limpieza visual)
- ✅ Sombra sutil
- ✅ Perfecto para cards de propiedades

### 3. Compact - Para Espacios Reducidos

```jsx
<Carousel
  images={images}
  variant="compact"
  aspectRatio="3/2"
  showArrows
  showCounter
/>
```

**Características:**

- ✅ Solo controles esenciales
- ✅ Sin autoplay ni puntos
- ✅ Ideal para sidebars o componentes pequeños

### 4. Minimal - Solo Navegación Táctil

```jsx
<Carousel images={images} variant="minimal" aspectRatio="1/1" />
```

**Características:**

- ✅ Sin controles visibles
- ✅ Solo navegación por swipe/touch
- ✅ Bordes simples
- ✅ Ideal para miniaturas o previews

## 🎨 Mejoras Visuales Implementadas

### Controles con Glassmorphism

```jsx
// Flechas de navegación rediseñadas
const arrowStyle =
  "bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20";

// Contador mejorado
const counterStyle =
  "bg-black/50 backdrop-blur-md text-white border border-white/20";

// Puntos indicadores
const dotsContainer =
  "bg-black/20 backdrop-blur-md rounded-full border border-white/10";
```

### Transiciones de Deslizamiento

```jsx
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0.8,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0.8,
  }),
};

const slideTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.4,
};
```

## 📱 Ejemplos de Uso Prácticos

### 1. Galería de Propiedad

```jsx
function PropertyGallery({ propertyImages }) {
  const [currentImage, setCurrentImage] = useState(0);

  return (
    <div className="space-y-4">
      <Carousel
        images={propertyImages}
        variant="default"
        aspectRatio="16/9"
        showArrows
        showDots
        showCounter
        onImageChange={(index) => setCurrentImage(index)}
        onImageClick={(image) => openLightbox(image)}
      />
      <div className="text-sm text-gray-600">
        Imagen {currentImage + 1} de {propertyImages.length}
      </div>
    </div>
  );
}
```

### 2. Card de Listing con Overlays

```jsx
function PropertyCard({ property }) {
  const [isFavorited, setIsFavorited] = useState(false);

  const handleFavorite = (e) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer">
      <Carousel
        images={property.images}
        variant="listing"
        aspectRatio="4/3"
        showArrows
        showCounter
        showDots={property.images.length <= 8}
        autoPlay={false}
        className="w-full"
      >
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
          {property.badges?.includes("premium") && (
            <Badge variant="premium" size="sm">
              Premium
            </Badge>
          )}
          {property.badges?.includes("featured") && (
            <Badge variant="featured" size="sm">
              Featured
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <div className="absolute top-3 right-3 z-20">
          <IconButton
            icon={Heart}
            variant="ghost"
            size="sm"
            onClick={handleFavorite}
            className={`bg-white/80 backdrop-blur-sm hover:bg-white ${
              isFavorited ? "text-red-500" : "text-gray-600"
            }`}
          />
        </div>

        {/* Host Info */}
        {property.host && (
          <div className="absolute bottom-3 left-3 z-20">
            <button className="flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs hover:bg-white dark:hover:bg-gray-800 transition-colors">
              <Avatar
                src={property.host.avatar}
                name={property.host.name}
                size="xs"
              />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {property.host.name}
              </span>
              {property.host.verified && (
                <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-2 h-2 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          </div>
        )}
      </Carousel>

      <div className="p-4">
        <h3 className="font-semibold">{property.title}</h3>
        <p className="text-gray-600">{property.description}</p>
        <p className="text-2xl font-bold text-blue-600">
          ${property.price.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
```

### 3. Carousel con AutoPlay Pausable

```jsx
function AutoPlayCarousel({ images }) {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <Carousel
      images={images}
      variant="default"
      autoPlay={isPlaying}
      autoPlayInterval={4000}
      showArrows
      showDots
      showCounter
      showPlayPause
      onImageChange={(index, image) => {
        console.log(`Changed to image ${index + 1}: ${image}`);
      }}
    />
  );
}
```

### 4. Carousel Compacto para Sidebar

```jsx
function SidebarGallery({ images }) {
  return (
    <div className="w-64">
      <h4 className="font-semibold mb-2">Imágenes Relacionadas</h4>
      <Carousel
        images={images}
        variant="compact"
        aspectRatio="3/2"
        showArrows
        showCounter
        className="w-full"
      />
    </div>
  );
}
```

### 5. Carousel Mínimo para Thumbnails

```jsx
function ThumbnailCarousel({ thumbnails, onSelect }) {
  return (
    <div className="flex gap-2">
      {thumbnails.map((thumb, index) => (
        <div key={index} className="w-20 h-20">
          <Carousel
            images={[thumb]}
            variant="minimal"
            aspectRatio="1/1"
            onImageClick={() => onSelect(thumb, index)}
          />
        </div>
      ))}
    </div>
  );
}
```

## ⌨️ Navegación por Teclado

| Tecla     | Acción                                      |
| --------- | ------------------------------------------- |
| `←`       | Imagen anterior                             |
| `→`       | Imagen siguiente                            |
| `Espacio` | Play/Pause (si `showPlayPause` está activo) |
| `Enter`   | Click en imagen actual                      |

## 📱 Soporte Touch/Swipe

- **Swipe Left**: Siguiente imagen
- **Swipe Right**: Imagen anterior
- **Distancia mínima**: 50px para activar
- **Compatibilidad**: Todos los dispositivos táctiles

## 🎯 Casos de Uso Recomendados

### Por Variante

| Variante  | Uso Recomendado                 | Contexto                  |
| --------- | ------------------------------- | ------------------------- |
| `default` | Galerías principales, showcases | Páginas de detalle, heros |
| `listing` | Cards de propiedades, productos | Grids, listados           |
| `compact` | Sidebars, espacios reducidos    | Componentes secundarios   |
| `minimal` | Thumbnails, previews            | Elementos pequeños        |

### Por Aspecto

| Ratio  | Uso Recomendado                        |
| ------ | -------------------------------------- |
| `16/9` | Paisajes, videos, contenido multimedia |
| `4/3`  | Propiedades, fotografía tradicional    |
| `3/2`  | Fotografía profesional, portraits      |
| `1/1`  | Productos, avatares, contenido square  |

## 🔄 Migración desde Versión Anterior

### Cambios Principales

1. **Eliminado efecto fade**: Ahora usa transiciones de deslizamiento
2. **Nueva prop `variant`**: Para diferentes estilos predefinidos
3. **Controles rediseñados**: Mejor integración visual
4. **Nueva prop `showPlayPause`**: Control manual de autoplay
5. **Callback `onImageChange`**: Para tracking de cambios

### Ejemplo de Migración

```jsx
// ❌ Versión anterior
<Carousel
  images={images}
  showDots
  showArrows
  autoPlay={true}
  loop={true}
/>

// ✅ Nueva versión
<Carousel
  images={images}
  variant="default"
  showDots
  showArrows
  showCounter
  autoPlay={true}
  showPlayPause={true}
/>
```

## 🚀 Conclusión

El nuevo Carousel ofrece una experiencia visual mucho más fluida y natural, con transiciones de deslizamiento que se sienten más intuitivas que los efectos fade. Las múltiples variantes lo hacen perfecto para cualquier contexto, desde galerías principales hasta thumbnails compactos en listings.
