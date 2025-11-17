document.getElementById("diffusionForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Очистка сообщений об ошибках
    document.querySelectorAll(".error-message").forEach(el => el.textContent = "");

    const alertBox = document.getElementById('alertBox');
    alertBox.className = 'alert d-none mt-3';
    alertBox.innerText = '';

    const resultSection = document.getElementById("resultSection");
    const table = document.getElementById("resultsTable");
    table.innerHTML = "";
    resultSection.style.display = "none";

    const request = {
        D: parseFloat(document.getElementById("D").value),
        c0: parseFloat(document.getElementById("c0").value),
        tMax: parseFloat(document.getElementById("tMax").value),
        depth: parseFloat(document.getElementById("depth").value)
    };

    try {
        const res = await fetch("/api/diffusion/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request)
        });

        const data = await res.json();

        // --- 🛑 Ошибка ---
        if (!res.ok) {
            if (Array.isArray(data.data)) {
                data.data.forEach(err => {
                    const [field, msg] = err.split(": ");
                    const el = document.getElementById(`error-${field}`);
                    if (el) el.textContent = msg;
                });
            } else {
                alertBox.classList.remove('d-none');
                alertBox.classList.add('alert-danger');
                alertBox.innerText = data.message || "Произошла ошибка при расчёте.";
            }
            return;
        }

        // --- ⚠ Предупреждение ---
        if (data.message && data.message.includes("⚠")) {
            alertBox.classList.remove("d-none");
            alertBox.classList.add("alert-warning");
            alertBox.innerText = data.message;
        }

        // --- ✅ Успешный результат ---
        const profile = data.data;
        if (!profile || !Array.isArray(profile.depths) || !Array.isArray(profile.concentration)) {
            alertBox.classList.remove("d-none");
            alertBox.classList.add("alert-danger");
            alertBox.innerText = "Ошибка: некорректные данные от сервера.";
            return;
        }

        const depths = profile.depths;
        const concentrations = profile.concentration;

        if (depths.length === 0) {
            table.innerHTML = `<tr><td colspan="2" class="text-center text-muted">Нет данных</td></tr>`;
        } else {
            const step = Math.max(1, Math.floor(depths.length / 100)); // максимум 100 строк
            for (let i = 0; i < depths.length; i += step) {
                table.insertAdjacentHTML("beforeend", `
                    <tr>
                        <td>${depths[i].toExponential(4)}</td>
                        <td>${concentrations[i].toExponential(4)}</td>
                    </tr>
                `);
            }
        }

        resultSection.style.display = "block";
        resultSection.scrollIntoView({ behavior: "smooth" });

    } catch (err) {
        console.error("Ошибка соединения:", err);
        showToast("Ошибка соединения с сервером");
    }
});

function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast align-items-center text-white bg-danger border-0 position-fixed bottom-0 end-0 m-3";
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    document.body.appendChild(toast);
    new bootstrap.Toast(toast, { delay: 5 }).show();
}
