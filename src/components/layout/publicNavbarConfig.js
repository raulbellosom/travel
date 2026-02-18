import {
  BadgeDollarSign,
  Building2,
  Castle,
  Home as HomeIcon,
  Hotel,
  Landmark,
  Palmtree,
  Warehouse,
} from "lucide-react";

export const buildPublicNavLinks = (t) => [
  {
    name: t("nav.realEstate", "Bienes Raices"),
    path: "/buscar?operationType=sale",
    items: [
      {
        icon: HomeIcon,
        label: t("nav.dropdown.houses", "Casas"),
        desc: t(
          "nav.dropdown.housesDesc",
          "Casas en venta en las mejores zonas",
        ),
        to: "/buscar?operationType=sale&propertyType=house",
      },
      {
        icon: Building2,
        label: t("nav.dropdown.apartments", "Departamentos"),
        desc: t("nav.dropdown.apartmentsDesc", "Departamentos y condominios"),
        to: "/buscar?operationType=sale&propertyType=apartment",
      },
      {
        icon: Landmark,
        label: t("nav.dropdown.land", "Terrenos"),
        desc: t("nav.dropdown.landDesc", "Terrenos listos para construir"),
        to: "/buscar?operationType=sale&propertyType=land",
      },
      {
        icon: Warehouse,
        label: t("nav.dropdown.commercial", "Comercial"),
        desc: t(
          "nav.dropdown.commercialDesc",
          "Locales y oficinas comerciales",
        ),
        to: "/buscar?operationType=sale&propertyType=commercial",
      },
    ],
  },
  {
    name: t("nav.vacation", "Rentas Vacacionales"),
    path: "/buscar?operationType=vacation_rental",
    items: [
      {
        icon: Hotel,
        label: t("nav.dropdown.hotels", "Hoteles"),
        desc: t("nav.dropdown.hotelsDesc", "Alojamiento en hoteles de la zona"),
        to: "/buscar?operationType=vacation_rental",
      },
      {
        icon: Castle,
        label: t("nav.dropdown.condos", "Condominios"),
        desc: t(
          "nav.dropdown.condosDesc",
          "Condominios para estancias cortas",
        ),
        to: "/buscar?operationType=vacation_rental&propertyType=apartment",
      },
      {
        icon: Palmtree,
        label: t("nav.dropdown.villas", "Villas"),
        desc: t("nav.dropdown.villasDesc", "Villas de lujo para vacaciones"),
        to: "/buscar?operationType=vacation_rental&propertyType=house",
      },
      {
        icon: BadgeDollarSign,
        label: t("nav.dropdown.budget", "Economicas"),
        desc: t("nav.dropdown.budgetDesc", "Opciones accesibles para todos"),
        to: "/buscar?operationType=vacation_rental&sort=price-asc",
      },
    ],
  },
];
