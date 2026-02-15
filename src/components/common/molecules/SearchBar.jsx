import React, { useState } from "react";
import { Search, MapPin, Calendar, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { cn } from "../../../utils/cn";

const SearchBar = ({ className }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("vacation_rental");

  const [searchParams, setSearchParams] = useState({
    location: "",
    dates: "",
    guests: "",
    type: "",
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchParams.location) params.set("q", searchParams.location);
    if (activeTab === "vacation_rental")
      params.set("operationType", "vacation_rental");
    else if (activeTab === "real_estate") params.set("operationType", "sale");
    if (searchParams.type) params.set("propertyType", searchParams.type);

    navigate(`/buscar?${params.toString()}`);
  };

  return (
    <div className={cn("w-full max-w-5xl mx-auto", className)}>
      <div className="flex justify-center mb-6">
        <div className="bg-white/20 backdrop-blur-md p-1 rounded-full inline-flex">
          {[
            {
              id: "vacation_rental",
              label: t("search.vacationRentals"),
            },
            {
              id: "real_estate",
              label: t("search.realEstate"),
            },
            { id: "services", label: t("search.services") },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300",
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-lg"
                  : "text-white hover:bg-white/10",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-2xl p-2 pl-6 flex flex-col md:flex-row items-center gap-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        <div className="flex-1 w-full p-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
            {t("search.location")}
          </label>
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder={t("search.locationPlaceholder")}
              className="w-full outline-none text-slate-600 font-medium placeholder:text-slate-400"
              value={searchParams.location}
              onChange={(event) =>
                setSearchParams({
                  ...searchParams,
                  location: event.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="flex-1 w-full p-2 pl-4">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
            {t("search.dates")}
          </label>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder={t("search.datesPlaceholder")}
              className="w-full outline-none text-slate-600 font-medium placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex-1 w-full p-2 pl-4">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
            {t("search.guests")}
          </label>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder={t("search.guestsPlaceholder")}
              className="w-full outline-none text-slate-600 font-medium placeholder:text-slate-400"
              value={searchParams.guests}
              onChange={(event) =>
                setSearchParams({ ...searchParams, guests: event.target.value })
              }
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          className="bg-cyan-500 hover:bg-cyan-600 text-white p-4 rounded-full shadow-lg hover:shadow-cyan-500/40 transition-all duration-300 md:ml-2 flex items-center justify-center gap-2 w-full md:w-auto mt-2 md:mt-0"
        >
          <Search size={24} strokeWidth={2.5} />
          <span className="md:hidden font-bold">{t("common.search")}</span>
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
