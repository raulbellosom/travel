import {
  BadgeDollarSign,
  Bike,
  Briefcase,
  Building2,
  Bus,
  CalendarHeart,
  Camera,
  Car,
  CarFront,
  Castle,
  ChefHat,
  Clapperboard,
  Compass,
  GraduationCap,
  Hammer,
  Heart,
  Home as HomeIcon,
  Hotel,
  Landmark,
  Laptop,
  Map,
  Mountain,
  Music,
  Palmtree,
  PartyPopper,
  Ship,
  Sparkles,
  Store,
  Truck,
  Users,
  UtensilsCrossed,
  Warehouse,
  Wine,
  Wrench,
} from "lucide-react";

const catLabel = (t, slug, fallback) =>
  t(`client:common.enums.category.${slug}`, fallback);

export const buildPublicNavLinks = (t) => [
  {
    name: t("client:nav.mapExplore", "Explore Map"),
    path: "/explorar-mapa",
    items: [
      {
        icon: Map,
        label: t("client:nav.dropdown.mapExploreNearby", "Near me"),
        desc: t(
          "client:nav.dropdown.mapExploreNearbyDesc",
          "Explore nearby resources with map and live prices",
        ),
        to: "/explorar-mapa",
      },
      {
        icon: Compass,
        label: t("client:nav.dropdown.mapExploreByArea", "By area"),
        desc: t(
          "client:nav.dropdown.mapExploreByAreaDesc",
          "Search streets, neighborhoods or cities from the map",
        ),
        to: "/explorar-mapa",
      },
      {
        icon: HomeIcon,
        label: t("client:nav.dropdown.mapExploreHomes", "Homes nearby"),
        desc: t(
          "client:nav.dropdown.mapExploreHomesDesc",
          "Properties and stays around your selected location",
        ),
        to: "/explorar-mapa?resourceType=property",
      },
      {
        icon: Car,
        label: t("client:nav.dropdown.mapExploreVehicles", "Vehicles nearby"),
        desc: t(
          "client:nav.dropdown.mapExploreVehiclesDesc",
          "Cars, bikes and more available around your area",
        ),
        to: "/explorar-mapa?resourceType=vehicle",
      },
    ],
  },
  {
    name: t("client:nav.realEstate", "Real Estate"),
    path: "/buscar?resourceType=property&commercialMode=sale",
    items: [
      {
        icon: HomeIcon,
        label: catLabel(t, "house", "Houses"),
        desc: t("client:nav.dropdown.housesDesc", "Homes for sale in the best areas"),
        to: "/buscar?resourceType=property&commercialMode=sale&category=house",
      },
      {
        icon: Building2,
        label: catLabel(t, "apartment", "Apartments"),
        desc: t("client:nav.dropdown.apartmentsDesc", "Apartments and condos"),
        to: "/buscar?resourceType=property&commercialMode=sale&category=apartment",
      },
      {
        icon: Landmark,
        label: catLabel(t, "land", "Land"),
        desc: t("client:nav.dropdown.landDesc", "Land ready to build"),
        to: "/buscar?resourceType=property&commercialMode=sale&category=land",
      },
      {
        icon: Store,
        label: catLabel(t, "commercial", "Commercial"),
        desc: t("client:nav.dropdown.commercialDesc", "Commercial premises and offices"),
        to: "/buscar?resourceType=property&commercialMode=sale&category=commercial",
      },
      {
        icon: Briefcase,
        label: catLabel(t, "office", "Office"),
        desc: t("client:nav.dropdown.officesDesc", "Offices in strategic locations"),
        to: "/buscar?resourceType=property&commercialMode=sale&category=office",
      },
      {
        icon: Warehouse,
        label: catLabel(t, "warehouse", "Warehouse"),
        desc: t("client:nav.dropdown.warehousesDesc", "Warehouses and industrial spaces"),
        to: "/buscar?resourceType=property&commercialMode=sale&category=warehouse",
      },
    ],
  },
  {
    name: t("client:nav.vacation", "Vacation Rentals"),
    path: "/buscar?resourceType=property&commercialMode=rent_short_term",
    items: [
      {
        icon: Hotel,
        label: t("client:nav.dropdown.hotels", "Hotels"),
        desc: t("client:nav.dropdown.hotelsDesc", "Accommodation in local hotels"),
        to: "/buscar?resourceType=property&commercialMode=rent_short_term",
      },
      {
        icon: Castle,
        label: t("client:nav.dropdown.condos", "Condos"),
        desc: t("client:nav.dropdown.condosDesc", "Condos for short stays"),
        to: "/buscar?resourceType=property&commercialMode=rent_short_term&category=apartment",
      },
      {
        icon: Palmtree,
        label: t("client:nav.dropdown.villas", "Villas"),
        desc: t("client:nav.dropdown.villasDesc", "Luxury villas for vacations"),
        to: "/buscar?resourceType=property&commercialMode=rent_short_term&category=house",
      },
      {
        icon: BadgeDollarSign,
        label: t("client:nav.dropdown.budget", "Budget"),
        desc: t("client:nav.dropdown.budgetDesc", "Affordable options for everyone"),
        to: "/buscar?resourceType=property&commercialMode=rent_short_term&sort=price-asc",
      },
    ],
  },
  {
    name: t("client:nav.vehicles", "Vehicles"),
    path: "/buscar?resourceType=vehicle",
    items: [
      {
        icon: Car,
        label: catLabel(t, "car", "Cars"),
        desc: t("client:nav.dropdown.vehicleCarDesc", "Compact cars and sedans"),
        to: "/buscar?resourceType=vehicle&category=car",
      },
      {
        icon: CarFront,
        label: catLabel(t, "suv", "SUVs"),
        desc: t("client:nav.dropdown.vehicleSuvDesc", "Family SUVs"),
        to: "/buscar?resourceType=vehicle&category=suv",
      },
      {
        icon: Truck,
        label: catLabel(t, "pickup", "Pickups"),
        desc: t("client:nav.dropdown.vehiclePickupDesc", "Pickups for work and adventure"),
        to: "/buscar?resourceType=vehicle&category=pickup",
      },
      {
        icon: Bus,
        label: catLabel(t, "van", "Vans"),
        desc: t("client:nav.dropdown.vehicleVanDesc", "Passenger vans"),
        to: "/buscar?resourceType=vehicle&category=van",
      },
      {
        icon: Bike,
        label: catLabel(t, "motorcycle", "Motorcycles"),
        desc: t("client:nav.dropdown.vehicleMotorcycleDesc", "Motorcycles and scooters"),
        to: "/buscar?resourceType=vehicle&category=motorcycle",
      },
      {
        icon: Ship,
        label: catLabel(t, "boat", "Boats"),
        desc: t("client:nav.dropdown.vehicleBoatDesc", "Boats and yachts"),
        to: "/buscar?resourceType=vehicle&category=boat",
      },
    ],
  },
  {
    name: t("client:nav.services", "Services"),
    path: "/buscar?resourceType=service",
    items: [
      {
        icon: Sparkles,
        label: catLabel(t, "cleaning", "Cleaning"),
        desc: t("client:nav.dropdown.serviceCleaningDesc", "Professional cleaning services"),
        to: "/buscar?resourceType=service&category=cleaning",
      },
      {
        icon: ChefHat,
        label: catLabel(t, "chef", "Chef"),
        desc: t("client:nav.dropdown.serviceChefDesc", "Private chefs"),
        to: "/buscar?resourceType=service&category=chef",
      },
      {
        icon: Camera,
        label: catLabel(t, "photography", "Photography"),
        desc: t("client:nav.dropdown.servicePhotographyDesc", "Professional photographers"),
        to: "/buscar?resourceType=service&category=photography",
      },
      {
        icon: UtensilsCrossed,
        label: catLabel(t, "catering", "Catering"),
        desc: t("client:nav.dropdown.serviceCateringDesc", "Food and banquet service"),
        to: "/buscar?resourceType=service&category=catering",
      },
      {
        icon: Wrench,
        label: catLabel(t, "maintenance", "Maintenance"),
        desc: t("client:nav.dropdown.serviceMaintenanceDesc", "General maintenance and repairs"),
        to: "/buscar?resourceType=service&category=maintenance",
      },
    ],
  },
  {
    name: t("client:nav.music", "Music"),
    path: "/buscar?resourceType=music",
    items: [
      {
        icon: Music,
        label: catLabel(t, "dj", "DJ"),
        desc: t("client:nav.dropdown.musicDjDesc", "DJs for private events"),
        to: "/buscar?resourceType=music&category=dj",
      },
      {
        icon: PartyPopper,
        label: catLabel(t, "banda", "Banda"),
        desc: t("client:nav.dropdown.musicBandaDesc", "Live banda for celebrations"),
        to: "/buscar?resourceType=music&category=banda",
      },
      {
        icon: Users,
        label: catLabel(t, "mariachi", "Mariachi"),
        desc: t("client:nav.dropdown.musicMariachiDesc", "Traditional mariachi groups"),
        to: "/buscar?resourceType=music&category=mariachi",
      },
      {
        icon: Sparkles,
        label: catLabel(t, "corridos_tumbados", "Corridos tumbados"),
        desc: t("client:nav.dropdown.musicCorridosDesc", "Modern regional Mexican acts"),
        to: "/buscar?resourceType=music&category=corridos_tumbados",
      },
      {
        icon: CalendarHeart,
        label: catLabel(t, "versatil", "Versatil"),
        desc: t("client:nav.dropdown.musicVersatilDesc", "Versatile sets for all audiences"),
        to: "/buscar?resourceType=music&category=versatil",
      },
    ],
  },
  {
    name: t("client:nav.experiences", "Experiences"),
    path: "/buscar?resourceType=experience",
    items: [
      {
        icon: Map,
        label: catLabel(t, "tour", "Tours"),
        desc: t("client:nav.dropdown.experienceTourDesc", "Guided local tours"),
        to: "/buscar?resourceType=experience&category=tour",
      },
      {
        icon: GraduationCap,
        label: catLabel(t, "class", "Classes"),
        desc: t("client:nav.dropdown.experienceClassDesc", "Classes and courses"),
        to: "/buscar?resourceType=experience&category=class",
      },
      {
        icon: Hammer,
        label: catLabel(t, "workshop", "Workshops"),
        desc: t("client:nav.dropdown.experienceWorkshopDesc", "Creative workshops"),
        to: "/buscar?resourceType=experience&category=workshop",
      },
      {
        icon: Mountain,
        label: catLabel(t, "adventure", "Adventure"),
        desc: t("client:nav.dropdown.experienceAdventureDesc", "Outdoor adventures"),
        to: "/buscar?resourceType=experience&category=adventure",
      },
      {
        icon: Heart,
        label: catLabel(t, "wellness", "Wellness"),
        desc: t("client:nav.dropdown.experienceWellnessDesc", "Spa, yoga and wellness"),
        to: "/buscar?resourceType=experience&category=wellness",
      },
      {
        icon: Wine,
        label: catLabel(t, "gastronomy", "Gastronomy"),
        desc: t("client:nav.dropdown.experienceGastronomyDesc", "Tastings and food tours"),
        to: "/buscar?resourceType=experience&category=gastronomy",
      },
    ],
  },
  {
    name: t("client:nav.venues", "Venues"),
    path: "/buscar?resourceType=venue",
    items: [
      {
        icon: PartyPopper,
        label: catLabel(t, "event_hall", "Event halls"),
        desc: t("client:nav.dropdown.venueEventHallDesc", "Spaces for social events"),
        to: "/buscar?resourceType=venue&category=event_hall",
      },
      {
        icon: Store,
        label: catLabel(t, "commercial_local", "Commercial unit"),
        desc: t("client:nav.dropdown.venueCommercialLocalDesc", "Flexible spaces for business"),
        to: "/buscar?resourceType=venue&category=commercial_local",
      },
      {
        icon: Clapperboard,
        label: catLabel(t, "studio", "Studios"),
        desc: t("client:nav.dropdown.venueStudioDesc", "Production and recording studios"),
        to: "/buscar?resourceType=venue&category=studio",
      },
      {
        icon: Laptop,
        label: catLabel(t, "coworking", "Coworking"),
        desc: t("client:nav.dropdown.venueCoworkingDesc", "Shared workspaces"),
        to: "/buscar?resourceType=venue&category=coworking",
      },
      {
        icon: Users,
        label: catLabel(t, "meeting_room", "Meeting rooms"),
        desc: t("client:nav.dropdown.venueMeetingRoomDesc", "Equipped rooms for meetings"),
        to: "/buscar?resourceType=venue&category=meeting_room",
      },
    ],
  },
];
