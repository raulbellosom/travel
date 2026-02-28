import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { reservationsService } from "../../../services/reservationsService";
import { getErrorMessage } from "../../../utils/errors";
import { useToast } from "../../../hooks/useToast";
import { MANUAL_FORM_INITIAL_STATE } from "../constants";

// ── Validation ───────────────────────────────────────────────────────────────
const validate = (form) => {
  const errors = {};

  if (!form.resourceId) {
    errors.resourceId = "Selecciona un recurso.";
  }

  if (form.scheduleType === "date_range") {
    if (!form.checkInDate)
      errors.checkInDate = "La fecha de entrada es requerida.";
    if (!form.checkOutDate)
      errors.checkOutDate = "La fecha de salida es requerida.";
    if (
      form.checkInDate &&
      form.checkOutDate &&
      form.checkInDate >= form.checkOutDate
    ) {
      errors.checkOutDate = "La salida debe ser después de la entrada.";
    }
  } else {
    if (!form.startDateTime)
      errors.startDateTime = "La fecha/hora de inicio es requerida.";
    if (!form.endDateTime)
      errors.endDateTime = "La fecha/hora de fin es requerida.";
    if (
      form.startDateTime &&
      form.endDateTime &&
      form.startDateTime >= form.endDateTime
    ) {
      errors.endDateTime = "El fin debe ser después del inicio.";
    }
  }

  if (form.totalAmount !== "" && Number.isNaN(Number(form.totalAmount))) {
    errors.totalAmount = "Ingresa un monto válido.";
  }
  if (form.baseAmount !== "" && Number.isNaN(Number(form.baseAmount))) {
    errors.baseAmount = "Ingresa un monto válido.";
  }

  return errors;
};

// ── Hook ─────────────────────────────────────────────────────────────────────
export const useReservationForm = (initialValues = {}) => {
  const { t: _t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState(() => ({
    ...MANUAL_FORM_INITIAL_STATE,
    ...initialValues,
  }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ── Sync form when initialValues arrive asynchronously ────────────────────
  // Keyed on resourceId so it only fires once when real data lands.
  const syncedRef = useRef(initialValues?.resourceId || "");
  useEffect(() => {
    const incoming = initialValues?.resourceId || "";
    if (incoming && incoming !== syncedRef.current) {
      setForm({ ...MANUAL_FORM_INITIAL_STATE, ...initialValues });
      setErrors({});
      setSubmitError("");
      syncedRef.current = incoming;
    }
  }, [initialValues?.resourceId]); // stable primitive dep

  const onChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setForm({ ...MANUAL_FORM_INITIAL_STATE });
    setErrors({});
    setSubmitError("");
  }, []);

  // ── Build API payload ────────────────────────────────────────────────────
  const buildPayload = (f) => {
    const payload = {
      resourceId: f.resourceId,
      scheduleType: f.scheduleType,
      status: f.status,
      paymentStatus: f.paymentStatus,
      currency: f.currency || "MXN",
      closeLead: false,
      guestName: String(f.guestName || "").trim() || undefined,
      guestEmail:
        String(f.guestEmail || "")
          .trim()
          .toLowerCase() || undefined,
      guestPhone: String(f.guestPhone || "").trim() || undefined,
      guestCount: Number(f.guestCount || 1),
      externalRef: String(f.externalRef || "").trim() || undefined,
      specialRequests: String(f.specialRequests || "").trim() || undefined,
    };

    if (f.scheduleType === "date_range") {
      payload.checkInDate = f.checkInDate;
      payload.checkOutDate = f.checkOutDate;
    } else {
      payload.startDateTime = f.startDateTime;
      payload.endDateTime = f.endDateTime;
    }
    if (f.baseAmount !== "") payload.baseAmount = Number(f.baseAmount);
    if (f.totalAmount !== "") payload.totalAmount = Number(f.totalAmount);

    return payload;
  };

  // ── Submit: CREATE ───────────────────────────────────────────────────────
  const submitCreate = useCallback(
    async (e) => {
      e?.preventDefault();

      const fieldErrors = validate(form);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        return;
      }

      setSubmitting(true);
      setSubmitError("");
      try {
        const result = await reservationsService.createManualReservation(
          buildPayload(form),
        );
        const newId = result?.$id || result?.reservationId;
        showToast({
          type: "success",
          message: "Reserva creada correctamente.",
        });
        if (newId) {
          navigate(`/app/reservations/${newId}`);
        } else {
          navigate("/app/reservations");
        }
      } catch (err) {
        const msg = getErrorMessage(err, "No se pudo crear la reserva.");
        setSubmitError(msg);
        showToast({ type: "error", message: msg });
      } finally {
        setSubmitting(false);
      }
    },
    [form, navigate, showToast],
  );

  // ── Submit: UPDATE ───────────────────────────────────────────────────────
  const submitUpdate = useCallback(
    async (e, reservationId) => {
      e?.preventDefault();

      const fieldErrors = validate(form);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        return;
      }

      setSubmitting(true);
      setSubmitError("");
      try {
        await reservationsService.updateStatus(
          reservationId,
          buildPayload(form),
        );
        showToast({ type: "success", message: "Reserva actualizada." });
        navigate(`/app/reservations/${reservationId}`);
      } catch (err) {
        const msg = getErrorMessage(err, "No se pudo actualizar la reserva.");
        setSubmitError(msg);
        showToast({ type: "error", message: msg });
      } finally {
        setSubmitting(false);
      }
    },
    [form, navigate, showToast],
  );

  return {
    form,
    errors,
    submitting,
    submitError,
    onChange,
    reset,
    submitCreate,
    submitUpdate,
  };
};
