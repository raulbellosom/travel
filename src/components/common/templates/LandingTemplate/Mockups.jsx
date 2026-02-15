import React from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  Plus,
  MapPin,
  Eye,
  MessageSquare,
  Globe,
  MoreVertical,
  DollarSign,
  Calendar,
  BedDouble,
  Bath,
} from "lucide-react";

// Property images
import houseFachada from "../../../../assets/img/examples/house/fachada.webp";
import houseSala from "../../../../assets/img/examples/house/sala.webp";
import houseJardin from "../../../../assets/img/examples/house/jardin_alberca.webp";
import houseHabitacion from "../../../../assets/img/examples/house/habitacion_principal.webp";
import depaEdificio from "../../../../assets/img/examples/depa/edificio.webp";
import depaSala from "../../../../assets/img/examples/depa/depa_sala.webp";
import depaCocina from "../../../../assets/img/examples/depa/depa_cocina.webp";

const propertyImages = [houseFachada, depaEdificio, depaSala];
const websiteHeroImage = houseJardin;
const websiteCardImages = [houseSala, depaCocina, houseHabitacion];

// 1. Listings Table Mockup
export const ListingsMockup = ({ hideUI = false }) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-900 flex flex-col font-sans text-xs sm:text-sm overflow-hidden">
      {/* Toolbar */}
      {!hideUI && (
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">
              {t("landing:showcase.listings.toolbar.title", "Propiedades")}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-medium">
              124 {t("landing:showcase.listings.toolbar.total", "total")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
              <Search size={14} />
              <span>
                {t("landing:showcase.listings.toolbar.search", "Buscar...")}
              </span>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              <Plus size={16} />
              <span className="hidden sm:inline">
                {t(
                  "landing:showcase.listings.toolbar.newProperty",
                  "Nueva propiedad",
                )}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 font-medium text-xs uppercase tracking-wider">
        <div className="col-span-5 sm:col-span-4">
          {t("landing:showcase.listings.table.property", "Propiedad")}
        </div>
        <div className="hidden sm:block col-span-2">
          {t("landing:showcase.listings.table.status", "Estado")}
        </div>
        <div className="hidden md:block col-span-2">
          {t("landing:showcase.listings.table.price", "Precio")}
        </div>
        <div className="hidden lg:block col-span-2">
          {t("landing:showcase.listings.table.stats", "Estadísticas")}
        </div>
        <div className="col-span-7 sm:col-span-4 md:col-span-2 lg:col-span-2 text-right">
          {t("landing:showcase.listings.table.actions", "Acciones")}
        </div>
      </div>

      {/* Table Rows */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-6 py-4 items-center border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
          >
            {/* Property Info */}
            <div className="col-span-5 sm:col-span-4 flex gap-3 items-center">
              <div
                className={`w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0 bg-cover bg-center`}
                style={{
                  backgroundImage: `url(${propertyImages[i - 1]})`,
                }}
              />
              <div className="min-w-0">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  {i === 1
                    ? "Villa Ocean Breeze"
                    : i === 2
                      ? "Penthouse Luxury"
                      : "Casa Moderna Centro"}
                </h4>
                <div className="flex items-center gap-1 text-slate-500 text-xs truncate">
                  <MapPin size={10} />
                  <span>Puerto Vallarta, Jal.</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="hidden sm:block col-span-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${i === 1 ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${i === 1 ? "bg-emerald-500" : "bg-amber-500"}`}
                />
                {i === 1
                  ? t("landing:showcase.listings.status.published", "Publicada")
                  : t("landing:showcase.listings.status.draft", "Borrador")}
              </span>
            </div>

            {/* Price */}
            <div className="hidden md:block col-span-2">
              <div className="font-bold text-slate-700 dark:text-slate-300">
                $450,000 USD
              </div>
              <div className="text-slate-400 text-xs">
                {t("landing:showcase.listings.type.sale", "Venta")}
              </div>
            </div>

            {/* Stats */}
            <div className="hidden lg:block col-span-2">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span title="Vistas" className="flex items-center gap-1">
                  <Eye size={14} /> 1.2k
                </span>
                <span title="Leads" className="flex items-center gap-1">
                  <MessageSquare size={14} /> 45
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="col-span-7 sm:col-span-4 md:col-span-2 lg:col-span-2 flex justify-end gap-2">
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-cyan-500 transition-colors">
                <Globe size={16} />
              </button>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 2. CRM Kanban/Pipeline Mockup
export const CrmMockup = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-900 flex flex-col font-sans p-4">
      <div className="flex gap-4 overflow-x-auto pb-2 h-full">
        {/* Column 1: New */}
        <div className="w-64 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
              {t("landing:showcase.crm.columns.new", "Nuevos")}
            </span>
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full">
              3
            </span>
          </div>
          {[1, 2].map((i) => (
            <div
              key={`col1-${i}`}
              className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-linear-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
                    {i === 1 ? "JD" : "AS"}
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white text-sm">
                    {i === 1 ? "John Doe" : "Alice Smith"}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {t("landing:showcase.crm.cards.ago.2h", "Hace 2h")}
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                Hola, me interesa la Villa Ocean Breeze para marzo...
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  <DollarSign size={10} />
                  <span>
                    {t(
                      "landing:showcase.crm.cards.highIntent",
                      "Alta intención",
                    )}
                  </span>
                </div>
                <div className="flex gap-1">
                  <div className="w-5 h-5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 cursor-pointer">
                    <MessageSquare size={12} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Column 2: Contacted */}
        <div className="w-64 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
              {t("landing:showcase.crm.columns.contacted", "Contactados")}
            </span>
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full">
              5
            </span>
          </div>
          {[3, 4].map((i) => (
            <div
              key={`col2-${i}`}
              className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm opacity-80"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] text-slate-600 font-bold">
                    {i === 3 ? "MR" : "TK"}
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white text-sm">
                    {i === 3 ? "Mike Ross" : "Tom Klein"}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {t("landing:showcase.crm.cards.ago.yesterday", "Ayer")}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <Calendar size={12} className="text-amber-500" />
                <span>
                  {t(
                    "landing:showcase.crm.cards.appointment",
                    "Cita: Mañana 10:00 AM",
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Column 3: Closing */}
        <div className="w-64 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
              {t("landing:showcase.crm.columns.closing", "Cierre")}
            </span>
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full">
              1
            </span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border-l-4 border-l-emerald-500 border-y border-r border-slate-200 dark:border-slate-700 shadow-md">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center text-[10px] font-bold">
                  ES
                </div>
                <span className="font-bold text-slate-800 dark:text-white text-sm">
                  Elena Stone
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              {t(
                "landing:showcase.crm.cards.contractSent",
                "Contrato enviado para firma",
              )}
            </p>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-emerald-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. Website Mockup
export const WebsiteMockup = ({ hideUI = false }) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
      {/* Hero Section */}
      <div className="relative h-40 sm:h-48 bg-slate-900 flex items-center justify-center text-center px-4 overflow-hidden shrink-0">
        <div
          className="absolute inset-0 opacity-50 bg-cover bg-center"
          style={{
            backgroundImage: `url('${websiteHeroImage}')`,
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent" />
        <div className="relative z-10 w-full">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
            {t(
              "landing:showcase.website.hero.title",
              "Encuentra tu hogar ideal",
            )}
          </h2>
          <div className="flex items-center bg-white rounded-full p-1.5 sm:p-2 pl-3 sm:pl-4 mx-auto max-w-xs shadow-lg">
            <span className="text-slate-400 text-[10px] sm:text-xs flex-1 text-left">
              {t(
                "landing:showcase.website.hero.searchPlaceholder",
                "Buscar propiedades...",
              )}
            </span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white shrink-0">
              <Search size={12} />
            </div>
          </div>
        </div>
      </div>

      {/* Property Cards - Horizontal Layout */}
      <div className="p-3 sm:p-4 flex flex-col gap-3 bg-slate-50 dark:bg-slate-950 flex-1 overflow-y-auto">
        {[
          {
            name: "Condominio Frente al Mar",
            location: "Conchas Chinas",
            price: "$380,000",
            currency: "USD",
            beds: 3,
            baths: 2,
            area: "200m²",
            desc: "Moderno condominio con acceso directo a la playa",
          },
          {
            name: "Apartamento Moderno Marina",
            location: "Marina Vallarta",
            price: "$280,000",
            currency: "USD",
            beds: 2,
            baths: 2,
            area: "150m²",
            desc: "Elegante apartamento con vistas a la marina",
          },
        ].map((prop, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all group cursor-pointer flex"
          >
            {/* Image Left */}
            <div className="relative w-28 sm:w-36 md:w-44 shrink-0 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${websiteCardImages[i]})`,
                }}
              />
              <div className="absolute top-2 left-2 bg-cyan-500 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded">
                {t("landing:showcase.website.cards.sale", "Venta")}
              </div>
            </div>

            {/* Info Right */}
            <div className="flex-1 p-2.5 sm:p-3 flex flex-col justify-between min-w-0">
              <div>
                <div className="flex justify-between items-start gap-1 mb-0.5">
                  <h5 className="font-bold text-slate-800 dark:text-white text-[11px] sm:text-xs leading-tight truncate">
                    {prop.name}
                  </h5>
                </div>
                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-500 mb-1">
                  <MapPin size={9} className="shrink-0" />
                  <span className="truncate">{prop.location}</span>
                </div>
                <p className="text-[8px] sm:text-[9px] text-left text-slate-400 leading-snug line-clamp-2 mb-1.5 hidden sm:block">
                  {prop.desc}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs sm:text-sm font-black text-cyan-600 dark:text-cyan-400">
                    {prop.price}
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium">
                    {prop.currency}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[9px] sm:text-[10px] text-slate-500 font-medium">
                  <span className="flex items-center gap-0.5">
                    <BedDouble size={10} /> {prop.beds}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Bath size={10} /> {prop.baths}
                  </span>
                  <span className="text-slate-400">{prop.area}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 4. Reservations Mockup
export const ReservationsMockup = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-900 flex flex-col font-sans text-xs sm:text-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-slate-800 dark:text-white text-lg">
            {t("landing:showcase.reservations.title", "Reservaciones")}
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            +12%
          </span>
        </div>
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-xs">
                {i === 1 ? "JD" : i === 2 ? "SM" : "RA"}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                  {i === 1
                    ? "John Doe"
                    : i === 2
                      ? "Sarah Miller"
                      : "Robert Allen"}
                </h4>
                <div className="flex items-center gap-1 text-slate-500 text-xs">
                  <Calendar size={10} />
                  <span>
                    {i === 1
                      ? "12 - 18 Mar"
                      : i === 2
                        ? "05 - 10 Abr"
                        : "22 - 25 May"}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="font-bold text-slate-800 dark:text-white text-sm">
                ${i === 1 ? "1,200" : i === 2 ? "850" : "450"}
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-block mt-1 ${
                  i === 1
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : i === 2
                      ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                      : "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                }`}
              >
                {i === 1
                  ? t(
                      "landing:showcase.reservations.status.confirmed",
                      "Confirmada",
                    )
                  : i === 2
                    ? t(
                        "landing:showcase.reservations.status.pending",
                        "Pendiente",
                      )
                    : t(
                        "landing:showcase.reservations.status.inquiry",
                        "Consulta",
                      )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 5. Users/Team Mockup
export const UsersMockup = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-900 flex flex-col font-sans text-xs sm:text-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-lg">
            {t("landing:showcase.users.title", "Equipo")}
          </h3>
          <p className="text-slate-500 text-xs">
            {t("landing:showcase.users.subtitle", "3 miembros activos")}
          </p>
        </div>
        <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                    i === 1
                      ? "bg-rose-500"
                      : i === 2
                        ? "bg-violet-500"
                        : "bg-cyan-500"
                  }`}
                >
                  {i === 1 ? "AD" : i === 2 ? "JS" : "MK"}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                  {i === 1
                    ? "Admin User"
                    : i === 2
                      ? "Jane Smith"
                      : "Mike Kowalski"}
                </h4>
                <div className="text-slate-500 text-xs">
                  {i === 1
                    ? "admin@company.com"
                    : i === 2
                      ? "jane@company.com"
                      : "mike@company.com"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                  i === 1
                    ? "bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30"
                    : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
                }`}
              >
                {i === 1 ? "Owner" : "Agent"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
