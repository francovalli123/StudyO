import { initAuthGate } from "./auth-gate.js";
import { requestPasswordReset } from "./api.js";

initAuthGate({ mode: "public", redirectAuthenticatedTo: "dashboard.html" });

const form = document.getElementById("forgotPasswordForm") as HTMLFormElement | null;
const emailInput = document.getElementById("email") as HTMLInputElement | null;
const statusEl = document.getElementById("statusMessage") as HTMLElement | null;

if (form && emailInput && statusEl) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        statusEl.textContent = "";
        statusEl.classList.remove("error");

        const email = emailInput.value.trim();
        if (!email) {
            statusEl.textContent = "Ingresá tu correo electrónico.";
            statusEl.classList.add("error");
            return;
        }

        try {
            await requestPasswordReset(email);
            statusEl.textContent = "Si el correo existe, enviamos un link de recuperación.";
        } catch (error: any) {
            statusEl.textContent = error?.message || "No se pudo procesar la solicitud.";
            statusEl.classList.add("error");
        }
    });
}
