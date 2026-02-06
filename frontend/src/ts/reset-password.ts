import { initAuthGate } from "./auth-gate.js";
import { confirmPasswordReset, validatePasswordReset } from "./api.js";

initAuthGate();

const form = document.getElementById("resetPasswordForm") as HTMLFormElement | null;
const emailInput = document.getElementById("email") as HTMLInputElement | null;
const passwordInput = document.getElementById("password") as HTMLInputElement | null;
const statusEl = document.getElementById("statusMessage") as HTMLElement | null;

const params = new URLSearchParams(window.location.search);
const tokenParam = params.get("token") || "";
const emailParam = params.get("email") || "";

if (emailInput && emailParam) {
    emailInput.value = emailParam;
}

async function validateToken() {
    if (!tokenParam || !emailParam || !statusEl) {
        return;
    }
    try {
        await validatePasswordReset(emailParam, tokenParam);
    } catch (error: any) {
        statusEl.textContent = "El enlace es inválido o expiró.";
        statusEl.classList.add("error");
        if (form) {
            form.querySelectorAll("input, button").forEach((el) => (el as HTMLInputElement).disabled = true);
        }
    }
}

if (form && emailInput && passwordInput && statusEl) {
    form.addEventListener("submit", async (e) => {
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
            await confirmPasswordReset(email, tokenParam, password);
            statusEl.textContent = "Contraseña actualizada. Redirigiendo al login...";
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1200);
        } catch (error: any) {
            statusEl.textContent = error?.message || "No se pudo restablecer la contraseña.";
            statusEl.classList.add("error");
        }
    });
}

validateToken();
