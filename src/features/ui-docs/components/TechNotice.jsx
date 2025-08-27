export default function TechNotice() {
  return (
    <div className="rounded-xl border border-amber-300/40 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/40 p-4 text-amber-900 dark:text-amber-100">
      <h3 className="font-semibold mb-1">Base tecnológica</h3>
      <ul className="list-disc pl-5 text-sm space-y-1">
        <li>
          <b>TailwindCSS v4.1</b> (utilidades y variantes <code>dark:</code>{" "}
          habilitadas con <code>@custom-variant</code>).
        </li>
        <li>
          <b>Lucide React</b> para íconos.
        </li>
        <li>
          <b>Framer Motion</b> para animaciones.
        </li>
      </ul>
      <p className="text-xs mt-3 opacity-80">
        Nota: en Tailwind v4+ debes declarar{" "}
        <code>@custom-variant dark (&:where(.dark, .dark *))</code> en tu CSS
        global para que <code>dark:</code> dependa de la clase{" "}
        <code>.dark</code> (no sólo del media query del sistema).
      </p>
    </div>
  );
}
