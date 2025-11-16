document.getElementById("collisionForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Очистить ошибки
    document.querySelectorAll(".error-message").forEach(el => el.textContent = "");

    const request = {
        E: parseFloat(document.getElementById("E").value),
        mIon: parseFloat(document.getElementById("mIon").value),
        mAtom: parseFloat(document.getElementById("mAtom").value),
        angle: parseFloat(document.getElementById("angle").value)
    };

    try {
        const res = await fetch("/api/collision/simulate", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(request)
        });

        const data = await res.json();

        const alertBox = document.getElementById("alertBox");
        alertBox.className = "alert d-none mt-3";
        alertBox.innerText = "";

        if (!res.ok) {

            // Ошибка валидации полей
            if (data.message === "Ошибка валидации" && Array.isArray(data.data)) {
                data.data.forEach(err => {
                    const [field, msg] = err.split(": ");
                    const el = document.getElementById(`error-${field}`);
                    if (el) el.textContent = msg;
                });
            } else {
                alertBox.className = "alert alert-danger mt-3";
                alertBox.innerText = data.message || "Ошибка расчёта";
            }

            document.getElementById("resultSection").style.display = "none";
            return;
        }

        // Успешный расчёт
        const result = data.data;

        document.getElementById("outTransferred").textContent =
            result.transferredEnergy.toExponential(6);

        document.getElementById("outReflection").textContent =
            result.reflectionCoefficient.toFixed(6);

        document.getElementById("resultSection").style.display = "block";
        document.getElementById("resultSection")
            .scrollIntoView({behavior: "smooth"});

    } catch (err) {
        console.error(err);
        showToast("Ошибка соединения с сервером");
    }
});

function showToast(message) {
    const toast = document.createElement("div");
    toast.className =
        "toast align-items-center text-white bg-danger border-0 position-fixed bottom-0 end-0 m-3";

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    document.body.appendChild(toast);
    new bootstrap.Toast(toast, {delay: 3000}).show();
}
