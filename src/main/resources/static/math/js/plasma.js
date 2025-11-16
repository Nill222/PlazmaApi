document.getElementById("plasmaForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Очистка ошибок
    document.querySelectorAll(".error-message").forEach(el => el.textContent = "");

    const request = {
        voltage: parseFloat(document.getElementById("voltage").value),
        pressure: parseFloat(document.getElementById("pressure").value),
        temperature: parseFloat(document.getElementById("temperature").value)
    };

    try {
        const response = await fetch("/api/plasma/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request)
        });

        const data = await response.json();

        if (!response.ok) {
            // Сервер вернул ошибку — обрабатываем валидацию
            if (data.message === "Ошибка валидации" && Array.isArray(data.data)) {
                data.data.forEach(err => {
                    const [field, msg] = err.split(": ");
                    const el = document.getElementById(`error-${field}`);
                    if (el) el.textContent = msg;
                });
            } else {
                showToast(data.message || "Ошибка при расчёте");
            }
            return;
        }

        // Успешный результат
        const plasma = data.data;
        const table = document.getElementById("resultsTable");
        table.innerHTML = `
            <tr><th>Плотность электронов (м⁻³)</th><td>${plasma.electronDensity.toExponential(4)}</td></tr>
            <tr><th>Скорость электронов (м/с)</th><td>${plasma.electronVelocity.toExponential(4)}</td></tr>
            <tr><th>Плотность тока (A/м²)</th><td>${plasma.currentDensity.toExponential(4)}</td></tr>
            <tr><th>Напряжение (В)</th><td>${plasma.voltage}</td></tr>
            <tr><th>Давление (Па)</th><td>${plasma.pressure}</td></tr>
            <tr><th>Температура (K)</th><td>${plasma.temperature}</td></tr>
        `;
        document.getElementById("resultSection").style.display = "block";
    } catch (err) {
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
    new bootstrap.Toast(toast, { delay: 3000 }).show();
}
