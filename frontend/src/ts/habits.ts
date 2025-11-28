import { apiGet } from "./api.js";

async function loadHabits() {
    const habits = await apiGet("/habits/");
    const container = document.getElementById("habit-list");

    if (!container) return;

    container.innerHTML = habits
        .map((h: any) => `<p>${h.name} — Streak: ${h.streak}</p>`)
        .join("");
}

loadHabits();
