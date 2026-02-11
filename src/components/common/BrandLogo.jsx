import iconColor from "../../../resources/icons/icon_color.png";
import iconWhite from "../../../resources/icons/icon_white.png";

const sizeClassMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-11 w-11",
  xl: "h-12 w-12",
};

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

const BrandLogo = ({ size = "md", mode = "adaptive", alt = "Brand logo", className = "" }) => {
  const sizeClass = sizeClassMap[size] || sizeClassMap.md;
  const sharedClass = joinClasses(sizeClass, "object-contain", className);

  if (mode === "color") {
    return <img src={iconColor} alt={alt} className={sharedClass} loading="eager" />;
  }

  if (mode === "white") {
    return <img src={iconWhite} alt={alt} className={sharedClass} loading="eager" />;
  }

  return (
    <>
      <img src={iconColor} alt={alt} className={joinClasses(sharedClass, "dark:hidden")} loading="eager" />
      <img src={iconWhite} alt={alt} className={joinClasses(sharedClass, "hidden dark:block")} loading="eager" />
    </>
  );
};

export default BrandLogo;
