import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="min-h-dvh grid place-items-center p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">404</h1>
        <p className="mb-4 text-gray-600">Página no encontrada</p>
        <Link to="/" className="underline">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
