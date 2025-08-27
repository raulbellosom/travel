import { useState } from "react";
import {
  ListingCard,
  Modal,
  Button,
  TextInput,
  Toggle,
  Checkbox,
  Carousel,
  ComponentDemo,
} from "../../../components/common";
import { ComponentSection } from "../components";
import { useUIDocsTranslation } from "../../../hooks/useUIDocsTranslation";

export default function OrganismsSection({
  selectedVariant,
  selectedSize,
  id = "organisms",
}) {
  const { t } = useUIDocsTranslation();
  const carouselImages = [
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
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
    capacity: { guests: 6, bedrooms: 3, bathrooms: 2 },
    badges: ["premium"],
    area: 120,
  };

  const sampleListingWithCarousel = {
    ...sampleListing,
    id: "listing-2",
    title: "Villa de Lujo con Vista al Océano",
    images: carouselImages,
    badges: ["premium", "featured"],
    price: 350,
    reviewCount: 89,
    area: 200,
    host: {
      name: "Carlos Mendoza",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      verified: true,
    },
  };

  const [modalStates, setModalStates] = useState({
    small: false,
    medium: false,
    large: false,
    xl: false,
    confirmation: false,
    success: false,
    contact: false,
  });
  const toggleModal = (k) => setModalStates((p) => ({ ...p, [k]: !p[k] }));

  return (
    <ComponentSection
      id={id}
      title={t("sections.organisms.title")}
      description="Construidos a partir de molecules y atoms"
      className="scroll-mt-8"
    >
      <ComponentDemo
        id="organisms-listingCard"
        title={t("sections.organisms.components.listingCard.title")}
        description="Tarjetas completas"
        code="<ListingCard .../>"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <ListingCard
            listing={sampleListing}
            onCardClick={(l) => console.log("Card clicked:", l)}
            onFavoriteClick={(id, isFav) => console.log("Favorite:", id, isFav)}
          />
          <ListingCard
            listing={sampleListingWithCarousel}
            onCardClick={(l) => console.log("Card clicked:", l)}
            onFavoriteClick={(id, isFav) => console.log("Favorite:", id, isFav)}
          />
        </div>
      </ComponentDemo>

      <ComponentDemo
        id="organisms-modal"
        title={t("sections.organisms.components.modal.title")}
        description="Tamaños y variantes"
        code="<Modal .../>"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" onClick={() => toggleModal("small")}>
              Modal Pequeño
            </Button>
            <Button variant="secondary" onClick={() => toggleModal("medium")}>
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
            <Button variant="tertiary" onClick={() => toggleModal("contact")}>
              Formulario de Contacto
            </Button>
          </div>

          {/* Small */}
          <Modal
            isOpen={modalStates.small}
            onClose={() => toggleModal("small")}
            title="Modal Pequeño"
            size="sm"
          >
            <p className="text-gray-600 dark:text-gray-400">
              Modal pequeño con contenido básico.
            </p>
          </Modal>

          {/* Medium */}
          <Modal
            isOpen={modalStates.medium}
            onClose={() => toggleModal("medium")}
            title="Modal Mediano"
            size="md"
          >
            <div className="grid grid-cols-2 gap-4">
              <TextInput placeholder="Tu nombre" label="Nombre" />
              <TextInput placeholder="tu@email.com" label="Email" />
            </div>
          </Modal>

          {/* Large */}
          <Modal
            isOpen={modalStates.large}
            onClose={() => toggleModal("large")}
            title="Modal Grande"
            size="lg"
          >
            <div className="space-y-6">
              <div className="aspect-video">
                <Carousel
                  images={carouselImages}
                  aspectRatio="16:9"
                  showThumbnails
                />
              </div>
            </div>
          </Modal>

          {/* XL */}
          <Modal
            isOpen={modalStates.xl}
            onClose={() => toggleModal("xl")}
            title="Modal Extra Grande"
            size="xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Información Personal</h4>
                <div className="grid grid-cols-2 gap-4">
                  <TextInput label="Nombre" placeholder="Tu nombre" />
                  <TextInput label="Apellido" placeholder="Tu apellido" />
                </div>
                <TextInput label="Email" placeholder="tu@email.com" />
                <TextInput label="Teléfono" placeholder="+52 xxx xxx xxxx" />
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold">Preferencias</h4>
                <Toggle label="Recibir notificaciones" checked />
                <Toggle label="Newsletter semanal" />
                <Toggle label="Ofertas especiales" checked />
                <Checkbox label="Acepto términos y condiciones" />
                <Checkbox label="Acepto política de privacidad" />
              </div>
            </div>
          </Modal>

          {/* Confirmation */}
          <Modal
            isOpen={modalStates.confirmation}
            onClose={() => toggleModal("confirmation")}
            title="Confirmar Acción"
            size="sm"
            variant="danger"
          >
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                ¿Seguro? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
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

          {/* Success */}
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
                Tu operación se completó exitosamente.
              </p>
              <Button variant="success" onClick={() => toggleModal("success")}>
                Entendido
              </Button>
            </div>
          </Modal>

          {/* Contact */}
          <Modal
            isOpen={modalStates.contact}
            onClose={() => toggleModal("contact")}
            title="Formulario de Contacto"
            size="lg"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput label="Nombre" placeholder="Tu nombre completo" />
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
                />
              </div>
              <div className="flex justify-end gap-3">
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
  );
}
