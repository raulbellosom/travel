import { useTranslation } from "react-i18next";
import BrandLogo from "../common/BrandLogo";

const LoadingScreen = ({ title, message, transparent = true }) => {
  const { t } = useTranslation();

  const resolvedTitle = title || t("loadingScreen.title");
  const resolvedMessage = message || t("loadingScreen.message");

  return (
    <div
      className={`fixed inset-0 z-120 flex min-h-dvh items-center justify-center ${
        transparent
          ? "bg-slate-950/50 backdrop-blur-md"
          : "bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900"
      }`}
      role="status"
      aria-live="polite"
      aria-label={resolvedTitle}
    >
      {/* Animated mesh gradient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute -top-1/2 -left-1/2 h-[200%] w-[200%]"
          style={{
            background:
              "radial-gradient(circle at 30% 40%, rgba(99,102,241,0.18) 0%, transparent 50%), " +
              "radial-gradient(circle at 70% 60%, rgba(14,165,233,0.14) 0%, transparent 50%), " +
              "radial-gradient(circle at 50% 80%, rgba(168,85,247,0.10) 0%, transparent 40%)",
            animation: "loadingDrift 8s ease-in-out infinite alternate",
          }}
        />
      </div>

      {/* Floating particles */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {[...Array(6)].map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${4 + i * 2}px`,
              height: `${4 + i * 2}px`,
              left: `${15 + i * 14}%`,
              top: `${20 + ((i * 37) % 60)}%`,
              background: `linear-gradient(135deg, rgba(99,102,241,${0.3 + i * 0.05}), rgba(14,165,233,${0.2 + i * 0.05}))`,
              animation: `loadingFloat ${3 + i * 0.7}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <div
        className="relative flex w-[88%] max-w-sm flex-col items-center overflow-hidden rounded-3xl px-8 py-10 text-center"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow:
            "0 32px 64px -12px rgba(0,0,0,0.45), " +
            "0 0 0 1px rgba(255,255,255,0.05), " +
            "inset 0 1px 0 rgba(255,255,255,0.12)",
          backdropFilter: "blur(24px) saturate(1.4)",
        }}
      >
        {/* Card inner glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)",
          }}
        />

        {/* Animated spinner */}
        <div className="relative mb-7 h-24 w-24">
          {/* Outer orbit ring */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            style={{ animation: "loadingSpin 3s linear infinite" }}
          >
            <defs>
              <linearGradient
                id="spinnerGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1.5"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="url(#spinnerGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="289"
              strokeDashoffset="180"
            />
          </svg>

          {/* Inner spinning ring */}
          <svg
            className="absolute inset-2 h-[calc(100%-16px)] w-[calc(100%-16px)]"
            viewBox="0 0 100 100"
            style={{ animation: "loadingSpin 2s linear infinite reverse" }}
          >
            <defs>
              <linearGradient id="innerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="url(#innerGrad)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="276"
              strokeDashoffset="200"
            />
          </svg>

          {/* Center logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="grid h-14 w-14 place-items-center rounded-2xl"
              style={{
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(241,245,249,0.9) 100%)",
                boxShadow:
                  "0 8px 24px -4px rgba(99,102,241,0.25), " +
                  "0 0 0 1px rgba(255,255,255,0.3), " +
                  "inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
            >
              <BrandLogo
                size="sm"
                mode="color"
                alt={t("loadingScreen.badge")}
              />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2
          className="text-xl font-semibold tracking-tight"
          style={{
            background: "linear-gradient(to right, #e2e8f0, #f8fafc, #cbd5e1)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {resolvedTitle}
        </h2>

        {/* Message */}
        <p className="mt-2.5 max-w-[260px] text-sm leading-relaxed text-slate-300/80">
          {resolvedMessage}
        </p>

        {/* Animated progress bar */}
        <div className="mt-7 h-1 w-32 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #818cf8, #38bdf8, #a78bfa, #818cf8)",
              backgroundSize: "200% 100%",
              animation: "loadingShimmer 1.8s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes loadingSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes loadingDrift {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(3%, 2%) rotate(4deg); }
        }
        @keyframes loadingFloat {
          0% { transform: translateY(0) scale(1); opacity: 0.4; }
          100% { transform: translateY(-20px) scale(1.3); opacity: 0.8; }
        }
        @keyframes loadingShimmer {
          0% { background-position: 200% 0; width: 20%; }
          50% { width: 80%; }
          100% { background-position: -200% 0; width: 20%; }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
