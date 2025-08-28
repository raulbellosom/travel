import { useState } from "react";
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
  ComponentDemo,
} from "../../../components/common";
import {
  Heart,
  Share2,
  Bookmark,
  Trash2,
  Search,
  Settings,
  Filter,
} from "lucide-react";
import { ComponentSection } from "../components";
import { useUIDocsTranslation } from "../../../hooks/useUIDocsTranslation";

export default function AtomsSection({
  selectedSize,
  selectedVariant,
  id = "atoms",
}) {
  const { t } = useUIDocsTranslation();

  // estados locales (idénticos a los que tenías)
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [newsletterChecked, setNewsletterChecked] = useState(true);
  const [selectAllIndeterminate, setSelectAllIndeterminate] = useState(true);
  const [rememberChecked, setRememberChecked] = useState(false);
  const [radioValue, setRadioValue] = useState("option1");
  const [toggleChecked, setToggleChecked] = useState(false);
  const [toggleChecked2, setToggleChecked2] = useState(true);
  const [cloudSaveToggle, setCloudSaveToggle] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterText, setFilterText] = useState("");
  const [selectValue, setSelectValue] = useState("");

  const handleButtonClick = (e) => {
    e.preventDefault();
    console.log("Button clicked!");
  };

  return (
    <ComponentSection
      id={id}
      title={t("sections.atoms.title")}
      description={t("sections.atoms.description")}
      className="scroll-mt-8"
    >
      {/* Botones */}
      <ComponentDemo
        id="atoms-button"
        title={t("sections.atoms.components.button.title")}
        description={t("sections.atoms.components.button.description")}
        code={`<Button variant="${selectedVariant}" size="${selectedSize}">Click me!</Button>
<Button variant="secondary" size="${selectedSize}">Secondary</Button>
<Button variant="ghost" size="${selectedSize}">Ghost</Button>
<Button variant="destructive" size="${selectedSize}">Destructive</Button>
<Button variant="outline" size="${selectedSize}">Outline</Button>
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
            variant="outline"
            size={selectedSize}
            onClick={handleButtonClick}
          >
            Outline
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

      {/* Botones con Iconos y Texto */}
      <ComponentDemo
        id="atoms-button-icons"
        title={t("sections.atoms.components.buttonIcons.title")}
        description={t("sections.atoms.components.buttonIcons.description")}
        code={`<Button leftIcon={Search} variant="${selectedVariant}" size="${selectedSize}">
  Buscar
</Button>
<Button rightIcon={Settings} variant="secondary" size="${selectedSize}">
  Configuración
</Button>
<Button leftIcon={Heart} variant="ghost" size="${selectedSize}">
  Favoritos
</Button>
<Button rightIcon={Trash2} variant="destructive" size="${selectedSize}">
  Eliminar
</Button>
<Button leftIcon={Bookmark} variant="outline" size="${selectedSize}">
  Guardar
</Button>
<Button rightIcon={Share2} variant="success" size="${selectedSize}">
  Compartir
</Button>`}
      >
        <div className="flex flex-wrap gap-4 items-center">
          <Button
            leftIcon={Search}
            variant={selectedVariant}
            size={selectedSize}
            onClick={handleButtonClick}
          >
            Buscar
          </Button>
          <Button
            rightIcon={Settings}
            variant="secondary"
            size={selectedSize}
            onClick={handleButtonClick}
          >
            Configuración
          </Button>
          <Button
            leftIcon={Heart}
            variant="ghost"
            size={selectedSize}
            onClick={handleButtonClick}
          >
            Favoritos
          </Button>
          <Button
            rightIcon={Trash2}
            variant="destructive"
            size={selectedSize}
            onClick={handleButtonClick}
          >
            Eliminar
          </Button>
          <Button
            leftIcon={Bookmark}
            variant="outline"
            size={selectedSize}
            onClick={handleButtonClick}
          >
            Guardar
          </Button>
          <Button
            rightIcon={Share2}
            variant="success"
            size={selectedSize}
            onClick={handleButtonClick}
          >
            Compartir
          </Button>
        </div>
      </ComponentDemo>

      {/* Botones Solo Icono (Button variant="icon-only") */}
      <ComponentDemo
        id="atoms-icon-button"
        title={t("sections.atoms.components.iconButton.title")}
        description={t("sections.atoms.components.iconButton.description")}
        code={`<Button variant="icon-only" size="${selectedSize}" leftIcon={Heart} ariaLabel="Favorito" />
<Button variant="icon-only" size="${selectedSize}" leftIcon={Search} ariaLabel="Buscar" />
<Button variant="icon-only" size="${selectedSize}" leftIcon={Settings} ariaLabel="Configuración" />
<Button variant="icon-only" size="${selectedSize}" leftIcon={Trash2} ariaLabel="Eliminar" />`}
      >
        <div className="flex space-x-4">
          <Button
            variant="icon-only"
            size={selectedSize}
            leftIcon={Heart}
            ariaLabel="Favorito"
            onClick={handleButtonClick}
          />
          <Button
            variant="icon-only"
            size={selectedSize}
            leftIcon={Search}
            ariaLabel="Buscar"
            onClick={handleButtonClick}
          />
          <Button
            variant="icon-only"
            size={selectedSize}
            leftIcon={Settings}
            ariaLabel="Configuración"
            onClick={handleButtonClick}
          />
          <Button
            variant="icon-only"
            size={selectedSize}
            leftIcon={Trash2}
            ariaLabel="Eliminar"
            onClick={handleButtonClick}
          />
          <Button
            variant="icon-only"
            size={selectedSize}
            leftIcon={Bookmark}
            ariaLabel="Guardar"
            onClick={handleButtonClick}
          />
        </div>
      </ComponentDemo>

      {/* Icon Buttons */}
      <ComponentDemo
        id="atoms-iconbutton"
        title={t("sections.atoms.components.iconButtonComponent.title")}
        description={t(
          "sections.atoms.components.iconButtonComponent.description"
        )}
        code={`<IconButton icon={Heart} variant="${selectedVariant}" size="${selectedSize}" shape="circle" />
        <IconButton icon={Share2} variant="secondary" size="${selectedSize}" shape="square" />
        <IconButton icon={Bookmark} variant="ghost" size="${selectedSize}" shape="circle" />
        <IconButton icon={Trash2} variant="danger" size="${selectedSize}" shape="circle" />
        <IconButton icon={Settings} variant="${selectedVariant}" size="${selectedSize}" shape="square" />`}
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
        id="atoms-textinput"
        title={t("sections.atoms.components.textInput.title")}
        description={t("sections.atoms.components.textInput.description")}
        code={`<TextInput label="Email" placeholder="tu@email.com" size="${selectedSize}" variant="outlined" leftIcon={Search}/>`}
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

      {/* Select */}
      <ComponentDemo
        id="atoms-select"
        title={t("sections.atoms.components.select.title")}
        description={t("sections.atoms.components.select.description")}
        code={`<Select label="País" placeholder="Selecciona tu país" size="${selectedSize}" variant="outlined" />
<Select label="Categoría de Viaje" placeholder="Selecciona una categoría" size="${selectedSize}" variant="outlined" />`}
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
        id="atoms-toggle"
        title={t("sections.atoms.components.toggle.title")}
        description={t("sections.atoms.components.toggle.description")}
        code={`<Toggle checked size="${selectedSize}" variant="${selectedVariant}" label="Activar notificaciones" />
<Toggle checked size="${selectedSize}" variant="success" label="Modo oscuro automático" />
<Toggle size="${selectedSize}" variant="warning" label="Guardar en la nube" />`}
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
        id="atoms-checkbox"
        title={t("sections.atoms.components.checkbox.title")}
        description={t("sections.atoms.components.checkbox.description")}
        code={`<Checkbox label="Acepto términos y condiciones" size="${selectedSize}" variant="${selectedVariant}" />
<Checkbox label="Suscribirme al newsletter" size="${selectedSize}" variant="success" />
<Checkbox label="Seleccionar todo" indeterminate size="${selectedSize}" variant="${selectedVariant}" />
<Checkbox label="Recordar mis preferencias" size="${selectedSize}" variant="warning" />`}
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
            onChange={() => setSelectAllIndeterminate(!selectAllIndeterminate)}
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

      {/* Radios */}
      <ComponentDemo
        id="atoms-radio"
        title={t("sections.atoms.components.radio.title")}
        description={t("sections.atoms.components.radio.description")}
        code={`<Radio name="payment" value="credit" label="Tarjeta de crédito" size="${selectedSize}" variant="${selectedVariant}" />
<Radio name="payment" value="paypal" label="PayPal" size="${selectedSize}" variant="${selectedVariant}" />
<Radio name="payment" value="bank" label="Transferencia bancaria" size="${selectedSize}" variant="${selectedVariant}" />`}
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
        id="atoms-badge"
        title={t("sections.atoms.components.badge.title")}
        description={t("sections.atoms.components.badge.description")}
        code={`<Badge variant="info">Nuevo</Badge>
<Badge variant="success">Activo</Badge>
<Badge variant="warning">Pendiente</Badge>
<Badge variant="danger">Error</Badge>
<Badge variant="premium">Premium</Badge>
<Badge variant="featured">Destacado</Badge>`}
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

      {/* Avatares */}
      <ComponentDemo
        id="atoms-avatar"
        title={t("sections.atoms.components.avatar.title")}
        description={t("sections.atoms.components.avatar.description")}
        code={`<Avatar name="María García" status="online" />
<Avatar name="Juan Pérez" status="away" />
<Avatar name="Ana López" status="busy" />
<Avatar name="Carlos Mendoza" />`}
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

      {/* Rating */}
      <ComponentDemo
        id="atoms-ratingStars"
        title={t("sections.atoms.components.ratingStars.title")}
        description={t("sections.atoms.components.ratingStars.description")}
        code="<RatingStars .../>"
      >
        <div className="space-y-4">
          <RatingStars
            rating={4.8}
            reviewCount={124}
            variant="default"
            size={selectedSize}
            showValue
          />
          <RatingStars
            rating={3.5}
            reviewCount={67}
            variant="compact"
            size={selectedSize}
            showValue
          />
          <RatingStars
            rating={5.0}
            reviewCount={234}
            variant="detailed"
            size={selectedSize}
            showValue
          />
        </div>
      </ComponentDemo>

      {/* Spinners */}
      <ComponentDemo
        id="atoms-spinner"
        title={t("sections.atoms.components.spinner.title")}
        description={t("sections.atoms.components.spinner.description")}
        code={`<Spinner variant="${selectedVariant}" />
<Spinner variant="${selectedVariant}" type="dots" />
<Spinner variant="${selectedVariant}" type="bars" />
<Spinner variant="${selectedVariant}" type="pulse" />`}
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
        </div>
      </ComponentDemo>

      {/* Price */}
      <ComponentDemo
        id="atoms-priceBadge"
        title={t("sections.atoms.components.priceBadge.title")}
        description={t("sections.atoms.components.priceBadge.description")}
        code={`<PriceBadge amount={1200} currency="MXN" period="night" variant="default" />
<PriceBadge amount={150} currency="USD" period="night" variant="highlighted" />
<PriceBadge amount={2500} currency="MXN" period="night" variant="large" />`}
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
  );
}
