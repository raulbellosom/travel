import { m } from "framer-motion";

export default function ComponentSection({
  title,
  description,
  children,
  id,
  className = "",
}) {
  return (
    <m.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`mb-16 ${className}`}
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <div className="space-y-8">{children}</div>
    </m.section>
  );
}
