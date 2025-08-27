import { useState } from "react";
import {
  DateRangePicker,
  Carousel,
  ComponentDemo,
} from "../../../components/common";
import { ComponentSection } from "../components";
import { useUIDocsTranslation } from "../../../hooks/useUIDocsTranslation";

export default function MoleculesSection({ selectedSize, id = "molecules" }) {
  const { t } = useUIDocsTranslation();
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const handleDateChange = ({ startDate, endDate }) =>
    setDateRange({ startDate, endDate });

  const carouselImages = [
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1502775789162-9f8e7bb65ab2?w=800&h=600&fit=crop",
  ];

  return (
    <ComponentSection
      id={id}
      title={t("sections.molecules.title")}
      description={t("sections.molecules.description")}
      className="scroll-mt-8"
    >
      <ComponentDemo
        id="molecules-dateRangePicker"
        title={t("sections.molecules.components.dateRangePicker.title")}
        description="Rango de fechas con feedback"
        code={`<DateRangePicker size="${selectedSize}" variant="outlined" />`}
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
          {dateRange.startDate && dateRange.endDate ? (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-sm">
              <b>Fechas seleccionadas:</b>
              <br />
              Desde: {dateRange.startDate?.toLocaleDateString("es-ES")}
              <br />
              Hasta: {dateRange.endDate?.toLocaleDateString("es-ES")}
              <br />
              <b>
                Total:{" "}
                {Math.ceil(
                  (dateRange.endDate - dateRange.startDate) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                días
              </b>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
              Selecciona un rango de fechas para ver los detalles
            </div>
          )}
        </div>
      </ComponentDemo>

      <ComponentDemo
        id="molecules-carousel"
        title={t("sections.molecules.components.carousel.title")}
        description="Con y sin controles, y autoplay"
        code={`<Carousel images={carouselImages} aspectRatio="16/9" showDots />`}
      >
        <div className="space-y-6">
          <div className="w-full max-w-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Con controles y puntos
            </h4>
            <Carousel
              images={carouselImages}
              aspectRatio="16/9"
              showDots
              showArrows
              autoPlay={false}
            />
          </div>
          <div className="w-full max-w-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Autoplay (sin controles)
            </h4>
            <Carousel
              images={carouselImages}
              aspectRatio="4/3"
              showDots={false}
              showArrows={false}
              autoPlay
              autoPlayInterval={2000}
            />
          </div>
          <div className="w-full max-w-sm">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cuadrado con puntos
            </h4>
            <Carousel
              images={carouselImages}
              aspectRatio="1/1"
              showDots
              showArrows
              autoPlay={false}
            />
          </div>
        </div>
      </ComponentDemo>
    </ComponentSection>
  );
}
