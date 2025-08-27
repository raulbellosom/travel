import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Badge,
  Avatar,
  RatingStars,
  ListingCard,
  PriceBadge,
  Spinner,
} from "../components/common";
import { ComponentDemo } from "../components/common/molecules";

export default function Home() {
  const { t } = useTranslation();

  // Sample listing data for demonstration
  const sampleListings = [
    {
      id: "1",
      title: "Casa Frente al Mar en Sayulita",
      location: "Sayulita, Nayarit, México",
      images: [
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      ],
      price: 1200,
      currency: "MXN",
      rating: 4.8,
      reviewCount: 124,
      host: {
        name: "María García",
        avatar:
          "https://images.unsplash.com/photo-1494790108755-2616b612b047?w=100&q=80",
        verified: true,
      },
      capacity: {
        guests: 6,
        bedrooms: 3,
        bathrooms: 2,
      },
      badges: ["premium"],
      area: 120,
    },
    {
      id: "2",
      title: "Departamento Moderno en Centro",
      location: "Puerto Vallarta, Jalisco, México",
      images: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
      ],
      price: 800,
      currency: "MXN",
      rating: 4.6,
      reviewCount: 89,
      host: {
        name: "Carlos Mendoza",
        avatar: null,
        verified: true,
      },
      capacity: {
        guests: 4,
        bedrooms: 2,
        bathrooms: 1,
      },
      badges: ["featured"],
      area: 85,
    },
    {
      id: "3",
      title: "Villa de Lujo con Vista al Océano",
      location: "Punta Mita, Nayarit, México",
      images: [
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
      ],
      price: 2500,
      currency: "MXN",
      rating: 4.9,
      reviewCount: 67,
      host: {
        name: "Ana López",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
        verified: true,
      },
      capacity: {
        guests: 8,
        bedrooms: 4,
        bathrooms: 3,
      },
      badges: ["premium", "featured"],
      area: 200,
    },
  ];

  const handleCardClick = (listing) => {
    console.log("Card clicked:", listing);
  };

  const handleFavoriteClick = (listingId, isFavorited) => {
    console.log("Favorite toggled:", listingId, isFavorited);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {t("home.hero.title", "Descubre Sayulita Travel")}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              {t(
                "home.hero.subtitle",
                "Encuentra el lugar perfecto para tus vacaciones"
              )}
            </p>
            <Button
              variant="primary"
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              {t("home.hero.cta", "Explorar Propiedades")}
            </Button>
          </div>
        </div>
      </section>

      {/* Components Demo Section */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
            Sistema de Componentes UI
          </h2>

          {/* Buttons Demo */}
          <ComponentDemo
            title="Botones"
            description="Componentes de botón con diferentes variantes y tamaños"
            code={`<Button variant="primary" size="sm">Pequeño</Button>
<Button variant="primary" size="md">Mediano</Button>
<Button variant="primary" size="lg">Grande</Button>
<Button variant="secondary" size="md">Secundario</Button>
<Button variant="tertiary" size="md">Terciario</Button>
<Button variant="destructive" size="md">Destructivo</Button>
<Button variant="primary" size="md" loading>Cargando...</Button>`}
          >
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="primary" size="sm">
                Pequeño
              </Button>
              <Button variant="primary" size="md">
                Mediano
              </Button>
              <Button variant="primary" size="lg">
                Grande
              </Button>
              <Button variant="secondary" size="md">
                Secundario
              </Button>
              <Button variant="tertiary" size="md">
                Terciario
              </Button>
              <Button variant="destructive" size="md">
                Destructivo
              </Button>
              <Button variant="primary" size="md" loading>
                Cargando...
              </Button>
            </div>
          </ComponentDemo>

          {/* Badges Demo */}
          <ComponentDemo
            title="Badges"
            description="Etiquetas para mostrar estado, categoría o información adicional"
            code={`<Badge variant="info">Info</Badge>
<Badge variant="success">Éxito</Badge>
<Badge variant="warning">Advertencia</Badge>
<Badge variant="danger">Peligro</Badge>
<Badge variant="premium">Premium</Badge>
<Badge variant="featured">Destacado</Badge>`}
          >
            <div className="flex flex-wrap gap-3">
              <Badge variant="info">Info</Badge>
              <Badge variant="success">Éxito</Badge>
              <Badge variant="warning">Advertencia</Badge>
              <Badge variant="danger">Peligro</Badge>
              <Badge variant="premium">Premium</Badge>
              <Badge variant="featured">Destacado</Badge>
            </div>
          </ComponentDemo>

          {/* Avatars Demo */}
          <ComponentDemo
            title="Avatares"
            description="Imágenes de perfil con soporte para iniciales y estados de presencia"
            code={`<Avatar name="Juan Pérez" size="sm" />
<Avatar name="María García" size="md" />
<Avatar name="Carlos López" size="lg" status="online" />
<Avatar
  name="Ana Rodríguez"
  src="https://images.unsplash.com/photo-1494790108755-2616b612b047?w=100&q=80"
  size="xl"
  status="away"
/>`}
          >
            <div className="flex flex-wrap gap-4 items-center">
              <Avatar name="Juan Pérez" size="sm" />
              <Avatar name="María García" size="md" />
              <Avatar name="Carlos López" size="lg" status="online" />
              <Avatar
                name="Ana Rodríguez"
                src="https://images.unsplash.com/photo-1494790108755-2616b612b047?w=100&q=80"
                size="xl"
                status="away"
              />
            </div>
          </ComponentDemo>

          {/* Rating Stars Demo */}
          <ComponentDemo
            title="Calificaciones"
            description="Componente de estrellas para mostrar calificaciones y reseñas"
            code={`<RatingStars rating={4.8} reviewCount={124} showValue />
<RatingStars rating={3.5} reviewCount={67} variant="compact" />
<RatingStars rating={2.0} reviewCount={12} size="lg" />
<RatingStars rating={5.0} showValue interactive />`}
          >
            <div className="space-y-3">
              <RatingStars rating={4.8} reviewCount={124} showValue />
              <RatingStars
                rating={3.5}
                reviewCount={67}
                variant="compact"
                showValue
              />
              <RatingStars rating={5.0} reviewCount={234} variant="detailed" />
            </div>
          </ComponentDemo>

          {/* Price Badge Demo */}
          <ComponentDemo
            title="Precios"
            description="Componentes para mostrar precios con diferentes variantes y divisas"
            code={`<PriceBadge amount={1200} currency="MXN" period="night" />
<PriceBadge
  amount={150}
  currency="USD"
  period="night"
  variant="highlighted"
/>
<PriceBadge
  amount={2500}
  currency="MXN"
  period="night"
  size="lg"
  variant="large"
/>`}
          >
            <div className="flex flex-wrap gap-4 items-center">
              <PriceBadge amount={1200} currency="MXN" period="night" />
              <PriceBadge
                amount={150}
                currency="USD"
                period="night"
                variant="highlighted"
              />
              <PriceBadge
                amount={2500}
                currency="MXN"
                period="night"
                size="lg"
                variant="large"
              />
            </div>
          </ComponentDemo>
        </div>
      </section>

      {/* Listings Section */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
            {t("home.listings.title", "Propiedades Destacadas")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onCardClick={handleCardClick}
                onFavoriteClick={handleFavoriteClick}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Loading State Demo */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4">
          <ComponentDemo
            title="Estados de Carga"
            description="Spinners para mostrar estados de carga con diferentes tamaños y variantes"
            code={`<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" variant="primary" />
<Spinner size="xl" variant="secondary" />`}
          >
            <div className="flex justify-center gap-4">
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" variant="primary" />
              <Spinner size="xl" variant="secondary" />
            </div>
          </ComponentDemo>
        </div>
      </section>
    </div>
  );
}
