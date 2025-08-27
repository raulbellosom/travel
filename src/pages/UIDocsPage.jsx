import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useUI } from "../contexts/UIContext";
import {
  Heart,
  Share2,
  Bookmark,
  Trash2,
  Search,
  Settings,
  Plus,
  Download,
  Upload,
  Edit,
  Star,
  Filter,
} from "lucide-react";
import {
  Button,
  Badge,
  Avatar,
  RatingStars,
  PriceBadge,
  Spinner,
  Toggle,
  Checkbox,
  Radio,
  TextInput,
  Select,
  IconButton,
  ListingCard,
  Modal,
  Carousel,
  DateRangePicker,
  ComponentDemo,
} from "../components/common";

// Component Section wrapper
const ComponentSection = ({ title, description, children }) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="mb-16"
  >
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
    <div className="space-y-8">{children}</div>
  </motion.section>
);

/**
 * UI Documentation and Component Showcase
 * Interactive demo of all available components
 */
const UIDocsPage = () => {
  const { t } = useTranslation();
  const { theme } = useUI();

  // Demo states
  const [selectedSize, setSelectedSize] = useState("md");
  const [selectedVariant, setSelectedVariant] = useState("primary");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [newsletterChecked, setNewsletterChecked] = useState(true);
  const [selectAllIndeterminate, setSelectAllIndeterminate] = useState(true);
  const [rememberChecked, setRememberChecked] = useState(false);
  const [radioValue, setRadioValue] = useState("option1");
  const [toggleChecked, setToggleChecked] = useState(false);
  const [toggleChecked2, setToggleChecked2] = useState(true);
  const [cloudSaveToggle, setCloudSaveToggle] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  // Form states for inputs
  const [searchText, setSearchText] = useState("");
  const [filterText, setFilterText] = useState("");
  const [selectValue, setSelectValue] = useState(""); // Event handlers
  const handleButtonClick = (e) => {
    e.preventDefault();
    console.log("Button clicked!");
  };

  const handleDateChange = ({ startDate, endDate }) => {
    setDateRange({ startDate, endDate });
  };

  // Modal demo states
  const [modalStates, setModalStates] = useState({
    small: false,
    medium: false,
    large: false,
    xl: false,
    confirmation: false,
    success: false,
    contact: false,
  });

  // Helper function to toggle modal states
  const toggleModal = (modalKey) => {
    setModalStates((prev) => ({
      ...prev,
      [modalKey]: !prev[modalKey],
    }));
  };

  // Sample data for components
  const carouselImages = [
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1502775789162-9f8e7bb65ab2?w=800&h=600&fit=crop",
  ];

  const sampleListing = {
    id: "listing-1",
    title: "Beautiful Beach House",
    location: "Sayulita, Nayarit",
    price: 120,
    currency: "USD",
    rating: 4.8,
    reviewCount: 156,
    images: [carouselImages[0]],
    host: {
      name: "María García",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b047?w=100&h=100&fit=crop&crop=face",
      verified: true,
    },
    capacity: {
      guests: 6,
      bedrooms: 3,
      bathrooms: 2,
    },
    badges: ["premium"],
    area: 120,
  };

  const sampleListingWithCarousel = {
    id: "listing-2",
    title: "Villa de Lujo con Vista al Océano",
    location: "Punta Mita, Nayarit",
    price: 350,
    currency: "USD",
    rating: 4.9,
    reviewCount: 89,
    images: carouselImages,
    host: {
      name: "Carlos Mendoza",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      verified: true,
    },
    capacity: {
      guests: 8,
      bedrooms: 4,
      bathrooms: 3,
    },
    badges: ["premium", "featured"],
    area: 200,
  };

  // Prevent form submission on Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            UI Components Library
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Sistema completo de componentes con múltiples variantes, tamaños y
            temas dinámicos
          </p>

          {/* Global Controls */}
          <div className="flex flex-wrap justify-center gap-6 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tamaño Global:
              </label>
              <Select
                value={selectedSize}
                onChange={setSelectedSize}
                options={[
                  { value: "xs", label: "Extra Pequeño" },
                  { value: "sm", label: "Pequeño" },
                  { value: "md", label: "Mediano" },
                  { value: "lg", label: "Grande" },
                  { value: "xl", label: "Extra Grande" },
                ]}
                size="sm"
              />
            </div>

            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Variante Global:
              </label>
              <Select
                value={selectedVariant}
                onChange={setSelectedVariant}
                options={[
                  { value: "primary", label: "Primario" },
                  { value: "secondary", label: "Secundario" },
                  { value: "success", label: "Éxito" },
                  { value: "warning", label: "Advertencia" },
                  { value: "danger", label: "Peligro" },
                  { value: "info", label: "Información" },
                ]}
                size="sm"
              />
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Tema actual:{" "}
              <span className="font-medium capitalize">{theme}</span>
            </div>
          </div>
        </motion.div>

        {/* ATOMS SECTION */}
        <ComponentSection
          title="Atoms - Elementos Básicos"
          description="Componentes fundamentales del sistema de diseño"
        >
          {/* Buttons */}
          <ComponentDemo
            title="Botones"
            description="Componentes de botón con diferentes variantes, tamaños y estados"
            code={`<Button variant="${selectedVariant}" size="${selectedSize}">Click me!</Button>
<Button variant="secondary" size="${selectedSize}">Secondary</Button>
<Button variant="ghost" size="${selectedSize}">Ghost</Button>
<Button variant="destructive" size="${selectedSize}">Destructive</Button>
<Button variant="${selectedVariant}" size="${selectedSize}" loading>Loading...</Button>
<Button variant="${selectedVariant}" size="${selectedSize}" disabled>Disabled</Button>`}
          >
            <div className="flex flex-wrap gap-4 items-center">
              <Button
                variant={selectedVariant}
                size={selectedSize}
                onClick={handleButtonClick}
              >
                Click me!
              </Button>
              <Button
                variant="secondary"
                size={selectedSize}
                onClick={handleButtonClick}
              >
                Secondary
              </Button>
              <Button
                variant="ghost"
                size={selectedSize}
                onClick={handleButtonClick}
              >
                Ghost
              </Button>
              <Button
                variant="destructive"
                size={selectedSize}
                onClick={handleButtonClick}
              >
                Destructive
              </Button>
              <Button
                variant={selectedVariant}
                size={selectedSize}
                loading
                onClick={handleButtonClick}
              >
                Loading...
              </Button>
              <Button
                variant={selectedVariant}
                size={selectedSize}
                disabled
                onClick={handleButtonClick}
              >
                Disabled
              </Button>
            </div>
          </ComponentDemo>

          {/* Icon Buttons */}
          <ComponentDemo
            title="Botones con Iconos"
            description="Botones especializados para iconos con diferentes formas"
            code={`<IconButton variant="${selectedVariant}" size="${selectedSize}" shape="circle">
  <Heart size={16} />
</IconButton>
<IconButton variant="secondary" size="${selectedSize}" shape="square">
  <Share2 size={16} />
</IconButton>
<IconButton variant="ghost" size="${selectedSize}" shape="circle">
  <Bookmark size={16} />
</IconButton>`}
          >
            <div className="flex space-x-4">
              <IconButton
                icon={Heart}
                variant={selectedVariant}
                size={selectedSize}
                shape="circle"
                onClick={handleButtonClick}
              />
              <IconButton
                icon={Share2}
                variant="secondary"
                size={selectedSize}
                shape="square"
                onClick={handleButtonClick}
              />
              <IconButton
                icon={Bookmark}
                variant="ghost"
                size={selectedSize}
                shape="circle"
                onClick={handleButtonClick}
              />
              <IconButton
                icon={Trash2}
                variant="danger"
                size={selectedSize}
                shape="circle"
                onClick={handleButtonClick}
              />
              <IconButton
                icon={Settings}
                variant={selectedVariant}
                size={selectedSize}
                shape="square"
                onClick={handleButtonClick}
              />
            </div>
          </ComponentDemo>

          {/* Text Inputs */}
          <ComponentDemo
            title="Campos de Texto"
            description="Inputs con etiquetas, iconos y estados de validación"
            code={`<TextInput
  label="Email"
  placeholder="tu@email.com"
  size="${selectedSize}"
  variant="outlined"
  leftIcon={Search}
/>
<TextInput
  label="Contraseña"
  type="password"
  placeholder="••••••••"
  size="${selectedSize}"
  variant="outlined"
  helperText="Mínimo 8 caracteres"
/>
<TextInput
  label="Con Error"
  placeholder="Campo requerido"
  size="${selectedSize}"
  error="Este campo es obligatorio"
/>`}
          >
            <div className="w-full max-w-md space-y-4">
              <TextInput
                label="Email"
                placeholder="tu@email.com"
                size={selectedSize}
                variant="outlined"
                leftIcon={Search}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <TextInput
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                size={selectedSize}
                variant="outlined"
                helperText="Mínimo 8 caracteres"
              />
              <TextInput
                label="Con Error"
                placeholder="Campo requerido"
                size={selectedSize}
                error="Este campo es obligatorio"
              />
              <TextInput
                label="Búsqueda"
                placeholder="Buscar propiedades..."
                size={selectedSize}
                variant="outlined"
                leftIcon={Search}
                rightIcon={Filter}
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
          </ComponentDemo>

          {/* Select Demo */}
          <ComponentDemo
            title="Selectores"
            description="Menús desplegables con opciones múltiples"
            code={`<Select
  label="País"
  placeholder="Selecciona tu país"
  size="${selectedSize}"
  variant="outlined"
  value={selectValue}
  onChange={setSelectValue}
  options={[
    { value: "mx", label: "México" },
    { value: "us", label: "Estados Unidos" },
    { value: "ca", label: "Canadá" }
  ]}
/>`}
          >
            <div className="w-full max-w-md space-y-4">
              <Select
                label="País"
                placeholder="Selecciona tu país"
                size={selectedSize}
                variant="outlined"
                value={selectValue}
                onChange={setSelectValue}
                options={[
                  { value: "mx", label: "México" },
                  { value: "us", label: "Estados Unidos" },
                  { value: "ca", label: "Canadá" },
                  { value: "es", label: "España" },
                  { value: "fr", label: "Francia" },
                ]}
              />
              <Select
                label="Categoría de Viaje"
                placeholder="Selecciona una categoría"
                size={selectedSize}
                variant="outlined"
                options={[
                  { value: "beach", label: "🏖️ Playa" },
                  { value: "mountain", label: "🏔️ Montaña" },
                  { value: "city", label: "🏙️ Ciudad" },
                  { value: "adventure", label: "🎒 Aventura" },
                  { value: "relax", label: "🧘 Relajación" },
                ]}
              />
            </div>
          </ComponentDemo>

          {/* Toggles */}
          <ComponentDemo
            title="Interruptores"
            description="Switches para estados booleanos"
            code={`<Toggle
  checked={${toggleChecked}}
  onChange={setToggleChecked}
  size="${selectedSize}"
  variant="${selectedVariant}"
  label="Activar notificaciones"
/>
<Toggle
  checked={true}
  size="${selectedSize}"
  variant="success"
  label="Modo oscuro automático"
  description="Se activará según tus preferencias del sistema"
/>`}
          >
            <div className="space-y-4">
              <Toggle
                checked={toggleChecked}
                onChange={setToggleChecked}
                size={selectedSize}
                variant={selectedVariant}
                label="Activar notificaciones"
              />
              <Toggle
                checked={toggleChecked2}
                onChange={setToggleChecked2}
                size={selectedSize}
                variant="success"
                label="Modo oscuro automático"
                description="Se activará según tus preferencias del sistema"
              />
              <Toggle
                checked={cloudSaveToggle}
                onChange={setCloudSaveToggle}
                size={selectedSize}
                variant="warning"
                label="Guardar en la nube"
                description="Sincronizar datos con todos tus dispositivos"
              />
            </div>
          </ComponentDemo>

          {/* Checkboxes */}
          <ComponentDemo
            title="Casillas de Verificación"
            description="Checkboxes con estados normales e intermedios"
            code={`<Checkbox
  checked={${checkboxChecked}}
  onChange={setCheckboxChecked}
  size="${selectedSize}"
  variant="${selectedVariant}"
  label="Acepto términos y condiciones"
/>
<Checkbox
  checked={true}
  size="${selectedSize}"
  variant="success"
  label="Suscribirme al newsletter"
  description="Recibe actualizaciones y ofertas especiales"
/>
<Checkbox
  indeterminate={true}
  size="${selectedSize}"
  variant="${selectedVariant}"
  label="Seleccionar todo"
/>`}
          >
            <div className="space-y-4">
              <Checkbox
                id="checkbox-terms"
                checked={checkboxChecked}
                onChange={setCheckboxChecked}
                size={selectedSize}
                variant={selectedVariant}
                label="Acepto términos y condiciones"
              />
              <Checkbox
                id="checkbox-newsletter"
                checked={newsletterChecked}
                onChange={setNewsletterChecked}
                size={selectedSize}
                variant="success"
                label="Suscribirme al newsletter"
                description="Recibe actualizaciones y ofertas especiales"
              />
              <Checkbox
                id="checkbox-select-all"
                indeterminate={selectAllIndeterminate}
                onChange={(checked) =>
                  setSelectAllIndeterminate(!selectAllIndeterminate)
                }
                size={selectedSize}
                variant={selectedVariant}
                label="Seleccionar todo"
              />
              <Checkbox
                id="checkbox-remember"
                checked={rememberChecked}
                onChange={setRememberChecked}
                size={selectedSize}
                variant="warning"
                label="Recordar mis preferencias"
              />
            </div>
          </ComponentDemo>

          {/* Radio Buttons */}
          <ComponentDemo
            title="Botones de Radio"
            description="Radio buttons para selección única"
            code={`<Radio
  name="payment"
  value="credit"
  checked={radioValue === "credit"}
  onChange={() => setRadioValue("credit")}
  size="${selectedSize}"
  variant="${selectedVariant}"
  label="Tarjeta de crédito"
/>
<Radio
  name="payment"
  value="paypal"
  checked={radioValue === "paypal"}
  onChange={() => setRadioValue("paypal")}
  size="${selectedSize}"
  variant="${selectedVariant}"
  label="PayPal"
/>`}
          >
            <div className="space-y-4">
              <Radio
                id="radio-credit"
                name="payment"
                value="credit"
                checked={radioValue === "credit"}
                onChange={() => setRadioValue("credit")}
                size={selectedSize}
                variant={selectedVariant}
                label="Tarjeta de crédito"
              />
              <Radio
                id="radio-paypal"
                name="payment"
                value="paypal"
                checked={radioValue === "paypal"}
                onChange={() => setRadioValue("paypal")}
                size={selectedSize}
                variant={selectedVariant}
                label="PayPal"
              />
              <Radio
                id="radio-bank"
                name="payment"
                value="bank"
                checked={radioValue === "bank"}
                onChange={() => setRadioValue("bank")}
                size={selectedSize}
                variant={selectedVariant}
                label="Transferencia bancaria"
                description="Procesamiento en 1-2 días hábiles"
              />
            </div>
          </ComponentDemo>

          {/* Badges */}
          <ComponentDemo
            title="Etiquetas"
            description="Badges para mostrar estado, categoría o información adicional"
            code={`<Badge variant="info" size="${selectedSize}">Nuevo</Badge>
<Badge variant="success" size="${selectedSize}">Activo</Badge>
<Badge variant="warning" size="${selectedSize}">Pendiente</Badge>
<Badge variant="danger" size="${selectedSize}">Error</Badge>
<Badge variant="premium" size="${selectedSize}">Premium</Badge>
<Badge variant="featured" size="${selectedSize}">Destacado</Badge>`}
          >
            <div className="flex flex-wrap gap-3">
              <Badge variant="info" size={selectedSize}>
                Nuevo
              </Badge>
              <Badge variant="success" size={selectedSize}>
                Activo
              </Badge>
              <Badge variant="warning" size={selectedSize}>
                Pendiente
              </Badge>
              <Badge variant="danger" size={selectedSize}>
                Error
              </Badge>
              <Badge variant="premium" size={selectedSize}>
                Premium
              </Badge>
              <Badge variant="featured" size={selectedSize}>
                Destacado
              </Badge>
            </div>
          </ComponentDemo>

          {/* Avatars */}
          <ComponentDemo
            title="Avatares"
            description="Imágenes de perfil con soporte para iniciales y estados"
            code={`<Avatar 
  name="María García" 
  size="${selectedSize}" 
  status="online"
  src="https://images.unsplash.com/photo-1494790108755-2616b612b047?w=100&q=80"
/>
<Avatar name="Juan Pérez" size="${selectedSize}" status="away" />
<Avatar name="Ana López" size="${selectedSize}" status="busy" />
<Avatar name="Carlos Mendoza" size="${selectedSize}" />`}
          >
            <div className="flex space-x-4 items-center">
              <Avatar
                name="María García"
                size={selectedSize}
                status="online"
                src="https://images.unsplash.com/photo-1494790108755-2616b612b047?w=100&q=80"
              />
              <Avatar name="Juan Pérez" size={selectedSize} status="away" />
              <Avatar
                name="Ana López"
                size={selectedSize}
                status="busy"
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"
              />
              <Avatar name="Carlos Mendoza" size={selectedSize} />
            </div>
          </ComponentDemo>

          {/* Rating Stars */}
          <ComponentDemo
            title="Calificaciones"
            description="Estrellas para mostrar calificaciones y reseñas"
            code={`<RatingStars 
  rating={4.8} 
  reviewCount={124} 
  variant="default"
  size="${selectedSize}"
  showValue={true}
/>
<RatingStars 
  rating={3.5} 
  reviewCount={67} 
  variant="compact"
  size="${selectedSize}"
/>
<RatingStars 
  rating={5.0} 
  reviewCount={234} 
  variant="detailed"
  size="${selectedSize}"
/>`}
          >
            <div className="space-y-4">
              <RatingStars
                rating={4.8}
                reviewCount={124}
                variant="default"
                size={selectedSize}
                showValue={true}
              />
              <RatingStars
                rating={3.5}
                reviewCount={67}
                variant="compact"
                size={selectedSize}
                showValue={true}
              />
              <RatingStars
                rating={5.0}
                reviewCount={234}
                variant="detailed"
                size={selectedSize}
                showValue={true}
              />
            </div>
          </ComponentDemo>

          {/* Spinners */}
          <ComponentDemo
            title="Indicadores de Carga"
            description="Spinners para mostrar estados de carga con diferentes variantes"
            code={`<Spinner size="${selectedSize}" variant="${selectedVariant}" />
<Spinner size="${selectedSize}" variant="${selectedVariant}" type="dots" />
<Spinner size="${selectedSize}" variant="${selectedVariant}" type="bars" />
<Spinner size="${selectedSize}" variant="${selectedVariant}" type="pulse" />
<div className="flex items-center space-x-2">
  <Spinner size="sm" variant="${selectedVariant}" />
  <span>Cargando...</span>
</div>`}
          >
            <div className="space-y-6">
              <div className="flex space-x-6 items-center">
                <div className="text-center">
                  <Spinner size={selectedSize} variant={selectedVariant} />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Circular
                  </p>
                </div>
                <div className="text-center">
                  <Spinner
                    size={selectedSize}
                    variant={selectedVariant}
                    type="dots"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Puntos
                  </p>
                </div>
                <div className="text-center">
                  <Spinner
                    size={selectedSize}
                    variant={selectedVariant}
                    type="bars"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Barras
                  </p>
                </div>
                <div className="text-center">
                  <Spinner
                    size={selectedSize}
                    variant={selectedVariant}
                    type="pulse"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Pulso
                  </p>
                </div>
              </div>

              <div className="flex space-x-6 items-center">
                <div className="flex items-center space-x-2">
                  <Spinner size="sm" variant={selectedVariant} />
                  <span className="text-gray-600 dark:text-gray-400">
                    Cargando datos...
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Spinner size="sm" variant="success" type="dots" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Procesando...
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Spinner size="sm" variant="warning" type="bars" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Subiendo archivo...
                  </span>
                </div>
              </div>
            </div>
          </ComponentDemo>

          {/* Price Badge */}
          <ComponentDemo
            title="Etiquetas de Precio"
            description="Componentes para mostrar precios con divisas"
            code={`<PriceBadge 
  amount={1200} 
  currency="MXN" 
  period="night"
  variant="default"
  size="${selectedSize}"
/>
<PriceBadge 
  amount={150} 
  currency="USD" 
  period="night"
  variant="highlighted"
  size="${selectedSize}"
/>
<PriceBadge 
  amount={2500} 
  currency="MXN" 
  period="night"
  variant="large"
  size="${selectedSize}"
/>`}
          >
            <div className="flex flex-wrap gap-4">
              <PriceBadge
                amount={1200}
                currency="MXN"
                period="night"
                variant="default"
                size={selectedSize}
              />
              <PriceBadge
                amount={150}
                currency="USD"
                period="night"
                variant="highlighted"
                size={selectedSize}
              />
              <PriceBadge
                amount={2500}
                currency="MXN"
                period="night"
                variant="large"
                size={selectedSize}
              />
            </div>
          </ComponentDemo>
        </ComponentSection>

        {/* MOLECULES SECTION */}
        <ComponentSection
          title="Molecules - Componentes Compuestos"
          description="Combinaciones de atoms que funcionan juntos"
        >
          {/* Date Range Picker */}
          <ComponentDemo
            title="Selector de Fechas"
            description="Componente para seleccionar rangos de fechas con información detallada"
            code={`<DateRangePicker
  size="${selectedSize}"
  variant="outlined"
  placeholder="Seleccionar fechas"
  value={dateRange}
  onChange={setDateRange}
/>`}
          >
            <div className="w-full max-w-md space-y-4">
              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onDateChange={handleDateChange}
                size={selectedSize}
                variant="outlined"
                placeholder="Seleccionar fechas"
              />
              {dateRange.startDate && dateRange.endDate && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Fechas seleccionadas:</strong>
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                    Desde: {dateRange.startDate?.toLocaleDateString("es-ES")}{" "}
                    <br />
                    Hasta: {dateRange.endDate?.toLocaleDateString("es-ES")}{" "}
                    <br />
                    <strong>
                      Total:{" "}
                      {Math.ceil(
                        (dateRange.endDate - dateRange.startDate) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      días
                    </strong>
                  </p>
                </div>
              )}
              {!dateRange.startDate && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Selecciona un rango de fechas para ver los detalles
                  </p>
                </div>
              )}
            </div>
          </ComponentDemo>

          {/* Carousel */}
          <ComponentDemo
            title="Carrusel de Imágenes"
            description="Componente para mostrar múltiples imágenes con navegación y autoplay"
            code={`<Carousel
  images={carouselImages}
  aspectRatio="16/9"
  showDots={true}
  showArrows={true}
  autoPlay={false}
/>
<Carousel
  images={carouselImages}
  aspectRatio="4/3"
  showDots={false}
  showArrows={false}
  autoPlay={true}
  autoPlayInterval={2000}
/>`}
          >
            <div className="space-y-6">
              {/* Carousel with controls */}
              <div className="w-full max-w-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Con controles y puntos
                </h4>
                <Carousel
                  images={carouselImages}
                  aspectRatio="16/9"
                  showDots={true}
                  showArrows={true}
                  autoPlay={false}
                />
              </div>

              {/* Carousel with autoplay */}
              <div className="w-full max-w-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Con autoplay (sin controles)
                </h4>
                <Carousel
                  images={carouselImages}
                  aspectRatio="4/3"
                  showDots={false}
                  showArrows={false}
                  autoPlay={true}
                  autoPlayInterval={2000}
                />
              </div>

              {/* Square carousel */}
              <div className="w-full max-w-sm">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formato cuadrado con puntos
                </h4>
                <Carousel
                  images={carouselImages}
                  aspectRatio="1/1"
                  showDots={true}
                  showArrows={true}
                  autoPlay={false}
                />
              </div>
            </div>
          </ComponentDemo>
        </ComponentSection>

        {/* ORGANISMS SECTION */}
        <ComponentSection
          title="Organisms - Componentes Complejos"
          description="Componentes complejos construidos a partir de molecules y atoms"
        >
          {/* Listing Cards */}
          <ComponentDemo
            title="Tarjetas de Propiedades"
            description="Tarjetas completas para mostrar propiedades con toda la información"
            code={`<ListingCard
  listing={sampleListing}
  onCardClick={(listing) => console.log('Card clicked:', listing)}
  onFavoriteClick={(id, isFav) => console.log('Favorite:', id, isFav)}
/>
<ListingCard
  listing={sampleListingWithCarousel}
  onCardClick={(listing) => console.log('Card clicked:', listing)}
  onFavoriteClick={(id, isFav) => console.log('Favorite:', id, isFav)}
/>`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
              <ListingCard
                listing={sampleListing}
                onCardClick={(listing) => console.log("Card clicked:", listing)}
                onFavoriteClick={(id, isFav) =>
                  console.log("Favorite:", id, isFav)
                }
              />
              <ListingCard
                listing={sampleListingWithCarousel}
                onCardClick={(listing) => console.log("Card clicked:", listing)}
                onFavoriteClick={(id, isFav) =>
                  console.log("Favorite:", id, isFav)
                }
              />
            </div>
          </ComponentDemo>

          {/* Modals */}
          <ComponentDemo
            title="Modales"
            description="Componentes de modal para mostrar contenido superpuesto"
            code={`<Modal
  isOpen={modalStates.small}
  onClose={() => toggleModal('small')}
  title="Modal Pequeño"
  size="sm"
>
  <p>Este es un modal pequeño con contenido básico.</p>
</Modal>

<Button onClick={() => toggleModal('small')}>
  Abrir Modal Pequeño
</Button>`}
          >
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" onClick={() => toggleModal("small")}>
                  Modal Pequeño
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => toggleModal("medium")}
                >
                  Modal Mediano
                </Button>
                <Button variant="success" onClick={() => toggleModal("large")}>
                  Modal Grande
                </Button>
                <Button variant="warning" onClick={() => toggleModal("xl")}>
                  Modal Extra Grande
                </Button>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  variant="danger"
                  onClick={() => toggleModal("confirmation")}
                >
                  Confirmación
                </Button>
                <Button variant="info" onClick={() => toggleModal("success")}>
                  Éxito
                </Button>
                <Button
                  variant="tertiary"
                  onClick={() => toggleModal("contact")}
                >
                  Formulario de Contacto
                </Button>
              </div>

              {/* Modal Components */}
              <Modal
                isOpen={modalStates.small}
                onClose={() => toggleModal("small")}
                title="Modal Pequeño"
                size="sm"
              >
                <p className="text-gray-600 dark:text-gray-400">
                  Este es un modal pequeño con contenido básico. Ideal para
                  confirmaciones simples.
                </p>
              </Modal>

              <Modal
                isOpen={modalStates.medium}
                onClose={() => toggleModal("medium")}
                title="Modal Mediano"
                size="md"
              >
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Este es un modal de tamaño mediano con más contenido.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nombre</label>
                      <TextInput placeholder="Tu nombre" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <TextInput placeholder="tu@email.com" />
                    </div>
                  </div>
                </div>
              </Modal>

              <Modal
                isOpen={modalStates.large}
                onClose={() => toggleModal("large")}
                title="Modal Grande"
                size="lg"
              >
                <div className="space-y-6">
                  <p className="text-gray-600 dark:text-gray-400">
                    Este es un modal grande que puede contener mucho más
                    contenido.
                  </p>
                  <div className="aspect-video">
                    <Carousel
                      images={carouselImages}
                      aspectRatio="16:9"
                      showThumbnails={true}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Información</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Contenido adicional que requiere más espacio para
                        mostrar.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Detalles</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• Característica 1</li>
                        <li>• Característica 2</li>
                        <li>• Característica 3</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Modal>

              <Modal
                isOpen={modalStates.xl}
                onClose={() => toggleModal("xl")}
                title="Modal Extra Grande"
                size="xl"
              >
                <div className="space-y-6">
                  <p className="text-gray-600 dark:text-gray-400">
                    Este modal extra grande puede mostrar contenido complejo
                    como formularios extensos.
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Información Personal</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <TextInput label="Nombre" placeholder="Tu nombre" />
                        <TextInput label="Apellido" placeholder="Tu apellido" />
                      </div>
                      <TextInput label="Email" placeholder="tu@email.com" />
                      <TextInput
                        label="Teléfono"
                        placeholder="+52 xxx xxx xxxx"
                      />
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold">Preferencias</h4>
                      <div className="space-y-3">
                        <Toggle label="Recibir notificaciones" checked={true} />
                        <Toggle label="Newsletter semanal" checked={false} />
                        <Toggle label="Ofertas especiales" checked={true} />
                      </div>
                      <div className="space-y-3">
                        <Checkbox
                          label="Acepto términos y condiciones"
                          checked={false}
                        />
                        <Checkbox
                          label="Acepto política de privacidad"
                          checked={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Modal>

              {/* Confirmation Modal */}
              <Modal
                isOpen={modalStates.confirmation}
                onClose={() => toggleModal("confirmation")}
                title="Confirmar Acción"
                size="sm"
                variant="danger"
              >
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    ¿Estás seguro de que quieres realizar esta acción? Esta
                    operación no se puede deshacer.
                  </p>
                  <div className="flex space-x-3 justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => toggleModal("confirmation")}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => toggleModal("confirmation")}
                    >
                      Confirmar
                    </Button>
                  </div>
                </div>
              </Modal>

              {/* Success Modal */}
              <Modal
                isOpen={modalStates.success}
                onClose={() => toggleModal("success")}
                title="¡Operación Exitosa!"
                size="md"
                variant="success"
              >
                <div className="space-y-4 text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 text-2xl">
                      ✓
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Tu operación se ha completado exitosamente. Recibirás una
                    confirmación por email.
                  </p>
                  <Button
                    variant="success"
                    onClick={() => toggleModal("success")}
                  >
                    Entendido
                  </Button>
                </div>
              </Modal>

              {/* Contact Form Modal */}
              <Modal
                isOpen={modalStates.contact}
                onClose={() => toggleModal("contact")}
                title="Formulario de Contacto"
                size="lg"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput
                      label="Nombre"
                      placeholder="Tu nombre completo"
                    />
                    <TextInput label="Email" placeholder="tu@email.com" />
                  </div>
                  <TextInput
                    label="Asunto"
                    placeholder="¿En qué podemos ayudarte?"
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mensaje</label>
                    <textarea
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="4"
                      placeholder="Escribe tu mensaje aquí..."
                    ></textarea>
                  </div>
                  <div className="flex space-x-3 justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => toggleModal("contact")}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => toggleModal("contact")}
                    >
                      Enviar Mensaje
                    </Button>
                  </div>
                </div>
              </Modal>
            </div>
          </ComponentDemo>
        </ComponentSection>
      </div>
    </div>
  );
};

export default UIDocsPage;
