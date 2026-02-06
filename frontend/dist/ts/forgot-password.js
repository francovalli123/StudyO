var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { initAuthGate } from "./auth-gate.js";
import { requestPasswordReset } from "./api.js";
initAuthGate();
const form = document.getElementById("forgotPasswordForm");
const emailInput = document.getElementById("email");
const statusEl = document.getElementById("statusMessage");
if (form && emailInput && statusEl) {
    form.addEventListener("submit", (e) => __awaiter(void 0, void 0, void 0, function* () {
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
            yield requestPasswordReset(email);
            statusEl.textContent = "Si el correo existe, enviamos un link de recuperación.";
        }
        catch (error) {
            statusEl.textContent = (error === null || error === void 0 ? void 0 : error.message) || "No se pudo procesar la solicitud.";
            statusEl.classList.add("error");
        }
    }));
}
