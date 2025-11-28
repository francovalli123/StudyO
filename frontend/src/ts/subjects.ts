import { apiGet } from "./api.js";

async function loadSubjects() {
    const subjects = await apiGet("/subjects/");
    const container = document.getElementById("subjects-container");

    if (!container) return;

    container.innerHTML = subjects
        .map((s: any) => `<p>${s.name} — Progress: ${s.progress}%</p>`)
        .join("");
}

loadSubjects();
