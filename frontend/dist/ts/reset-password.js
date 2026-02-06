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
import { confirmPasswordReset, validatePasswordReset } from "./api.js";
initAuthGate();
const form = document.getElementById("resetPasswordForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const statusEl = document.getElementById("statusMessage");
const params = new URLSearchParams(window.location.search);
const tokenParam = params.get("token") || "";
const emailParam = params.get("email") || "";
if (emailInput && emailParam) {
    emailInput.value = emailParam;
}
function validateToken() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!tokenParam || !emailParam || !statusEl) {
            return;
        }
        try {
            yield validatePasswordReset(emailParam, tokenParam);
        }
        catch (error) {
            statusEl.textContent = "El enlace es inválido o expiró.";
            statusEl.classList.add("error");
            if (form) {
                form.querySelectorAll("input, button").forEach((el) => el.disabled = true);
            }
        }
    });
}
if (form && emailInput && passwordInput && statusEl) {
    form.addEventListener("submit", (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        statusEl.textContent = "";
        statusEl.classList.remove("error");
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        if (!email || !tokenParam || !password) {
            statusEl.textContent = "Completá todos los campos.";
            statusEl.classList.add("error");
            return;
        }
        try {
            yield confirmPasswordReset(email, tokenParam, password);
            statusEl.textContent = "Contraseña actualizada. Redirigiendo al login...";
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1200);
        }
        catch (error) {
            statusEl.textContent = (error === null || error === void 0 ? void 0 : error.message) || "No se pudo restablecer la contraseña.";
            statusEl.classList.add("error");
        }
    }));
}
validateToken();
