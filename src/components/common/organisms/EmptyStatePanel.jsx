import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const EmptyStatePanel = ({
  icon: Icon,
  title,
  description,
  actionLabel = "",
  actionTo = "",
  onAction,
  compact = false,
  className = "",
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 ${compact ? "sm:p-4" : "sm:p-6"} ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_88%_88%,rgba(56,189,248,0.12),transparent_35%)]"
      />

      <div className={`relative mx-auto flex max-w-xl flex-col items-center text-center ${compact ? "gap-2" : "gap-3"}`}>
        {Icon ? (
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/50 dark:bg-cyan-900/20 dark:text-cyan-200"
          >
            <Icon size={24} />
          </motion.div>
        ) : null}

        <h3 className={`${compact ? "text-base" : "text-lg"} font-semibold text-slate-900 dark:text-slate-100`}>
          {title}
        </h3>
        {description ? (
          <p className="max-w-lg text-sm text-slate-600 dark:text-slate-300">{description}</p>
        ) : null}

        {actionLabel ? (
          actionTo ? (
            <Link
              to={actionTo}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500"
            >
              {actionLabel}
            </button>
          )
        ) : null}
      </div>
    </motion.section>
  );
};

export default EmptyStatePanel;
