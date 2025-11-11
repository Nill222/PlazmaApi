const modelSelect = document.getElementById("modelSelect");
const formSection = document.getElementById("formSection");
const resultOutput = document.getElementById("resultOutput");
const validationInfo = document.getElementById("validationInfo");

// 🔹 Описание ограничений для каждой модели
const validationRules = {
    plasma: [
        { field: "Напряжение", rule: "Положительное, ≤ 1e6" },
        { field: "Давление", rule: "Положительное, ≤ 1e5" },
        { field: "Температура", rule: "Положительная, ≤ 1e5" }
    ],
    collision: [
        { field: "Энергия", rule: "Положительная, ≤ 1e6" },
        { field: "Масса иона", rule: "Положительная, ≤ 1e-20" },
        { field: "Масса атома", rule: "Положительная, ≤ 1e-20" },
        { field: "Угол", rule: "0° ≤ угол ≤ 180°" }
    ],
    diffusion: [
        { field: "Коэффициент D", rule: "Положительный, ≤ 1e-2" },
        { field: "Концентрация c₀", rule: "≥ 0, ≤ 1e3" },
        { field: "Макс. время tₘₐₓ", rule: "Положительное, ≤ 1e6" },
        { field: "Глубина", rule: "Положительная, ≤ 1e3" }
    ],
    lattice: [
        { field: "ID конфигурации", rule: "Положительное число" },
        { field: "ID атома", rule: "Положительное число" },
        { field: "Количество атомов", rule: "Положительное, ≤ 1e6" },
        { field: "Размерность", rule: "1–3" }
    ],
    simulation: [
        { field: "Напряжение", rule: "Положительное, ≤ 1e6" },
        { field: "Давление", rule: "Положительное, ≤ 1e5" },
        { field: "Электронная температура", rule: "Положительная, ≤ 1e5" },
        { field: "Угол", rule: "0°–180°" },
        { field: "Энергия активации", rule: "Положительная, ≤ 1e6" },
        { field: "Глубина", rule: "Положительная, ≤ 1e3" }
    ]
};

// 🔹 Конфигурация форм для разных моделей
const formTemplates = {
    plasma: `
        <h3>Параметры плазмы</h3>
        <form id="plasmaForm">
            <label>Напряжение (V): <input type="number" name="voltage" required></label>
            <label>Давление (Pa): <input type="number" name="pressure" required></label>
            <label>Температура (K): <input type="number" name="temperature" required></label>
            <button type="submit">Рассчитать</button>
        </form>
    `,
    collision: `
        <h3>Параметры столкновения</h3>
        <form id="collisionForm">
            <label>Энергия (Эв): <input type="number" name="E" required></label>
            <label>Масса иона (кг): <input type="number" name="mIon" required></label>
            <label>Масса атома (кг): <input type="number" name="mAtom" required></label>
            <label>Угол (°): <input type="number" name="angle" required></label>
            <button type="submit">Смоделировать</button>
        </form>
    `,
    diffusion: `
        <h3>Параметры диффузии</h3>
        <form id="diffusionForm">
            <label>D (м²/с): <input type="number" name="D" required></label>
            <label>Начальная концентрация c₀: <input type="number" name="c0" required></label>
            <label>Макс. время (с): <input type="number" name="tMax" required></label>
            <label>Глубина (мкм): <input type="number" name="depth" required></label>
            <button type="submit">Рассчитать</button>
        </form>
    `,
    lattice: `
        <h3>Параметры решётки</h3>
        <form id="latticeForm">
            <label>ID конфигурации: <input type="number" name="configId" required></label>
            <label>ID атома: <input type="number" name="atomListId" required></label>
            <label>Количество атомов: <input type="number" name="count" required></label>
            <label>Размерность (1-3): <input type="number" name="dimension" required></label>
            <button type="submit">Сгенерировать</button>
        </form>
    `,
    simulation: `
        <h3>Параметры симуляции</h3>
        <form id="simulationForm">
            <label>ID конфигурации: <input type="number" name="configId" required></label>
            <label>ID иона: <input type="number" name="ionId" required></label>
            <label>ID атома: <input type="number" name="atomListId" required></label>
            <label>Напряжение плазмы (V): <input type="number" name="plasmaVoltage" required></label>
            <label>Давление (Pa): <input type="number" name="pressure" required></label>
            <label>Температура (K): <input type="number" name="electronTemp" required></label>
            <button type="submit">Запустить симуляцию</button>
        </form>
    `
};

// 🔹 При выборе модели — подставляем форму
modelSelect.addEventListener("change", (e) => {
    const value = e.target.value;
    formSection.innerHTML = formTemplates[value] || "";
    resultOutput.textContent = "Ожидание данных...";

    showValidationInfo(value);
    attachFormHandler(value);
});

function showValidationInfo(model) {
    if (!validationRules[model]) {
        validationInfo.classList.add("hidden");
        return;
    }

    const rules = validationRules[model]
        .map(r => `<div class="validation-item"><span>${r.field}:</span> ${r.rule}</div>`)
        .join("");

    validationInfo.innerHTML = `
        <h4>📘 Ограничения параметров (${model})</h4>
        ${rules}
    `;
    validationInfo.classList.remove("hidden");
}

let collisionChart; // глобальная переменная

function initCollisionChart() {
    const ctx = document.getElementById("collisionChart").getContext("2d");
    collisionChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Collision: переданная энергия vs коэффициент отражения',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.7)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'График столкновения'
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: { display: true, text: 'переданная энергия (Дж)' }
                },
                y: {
                    title: { display: true, text: 'коэффициент отражения' }
                }
            }
        }
    });
}

// 🔹 Привязка обработчиков форм
function attachFormHandler(model) {
    const form = document.querySelector(`#${model}Form`);
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(form));

        let url = "";
        let method = "POST";

        switch (model) {
            case "plasma":
                url = "/api/plasma/calculate";
                break;
            case "collision":
                url = "/api/collision/simulate";
                break;
            case "diffusion":
                url = "/api/diffusion/calculate";
                break;
            case "lattice":
                url = "/api/lattice/generate";
                break;
            case "simulation":
                url = "/api/simulation/run";
                break;
        }

        try {
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            const resultBox = document.getElementById("result-box");

            if (response.ok && result.status === 200 && result.data) {
                const d = result.data;

                // ✅ Красивый вывод для плазмы
                if (model === "plasma") {
                    resultBox.innerHTML = `
                        <h3>Результаты расчёта плазмы</h3>
                        <table class="result-table">
                            <tr><td><strong>Плотность электронов:</strong></td><td>${d.electronDensity.toExponential(3)} м⁻³</td></tr>
                            <tr><td><strong>Скорость электронов:</strong></td><td>${d.electronVelocity.toFixed(2)} м/с</td></tr>
                            <tr><td><strong>Плотность тока:</strong></td><td>${d.currentDensity.toFixed(2)} А/м²</td></tr>
                            <tr><td><strong>Напряжение:</strong></td><td>${d.voltage} В</td></tr>
                            <tr><td><strong>Давление:</strong></td><td>${d.pressure} Па</td></tr>
                            <tr><td><strong>Температура:</strong></td><td>${d.temperature} K</td></tr>
                        </table>
                    `;
                }

                else if (model === "collision") {
                    resultBox.innerHTML = `
                        <h3>Результаты расчёта плазмы</h3>
                        <table class="result-table">
                            <tr><td><strong>Переданная энергия:</strong></td><td>${d.transferredEnergy} Дж</td></tr>
                            <tr><td><strong>Коэффициент отражения:</strong></td><td>${d.reflectionCoefficient}</td></tr>
                        </table>
                    `;

                    // показываем блок с графиком
                    const chartSection = document.getElementById("chartSection");
                    chartSection.innerHTML = `<h3>График столкновения</h3><canvas id="collisionChart" width="600" height="400"></canvas>`;
                    chartSection.classList.remove("hidden");

                    initCollisionChart();

                    // обновляем данные
                    collisionChart.data.datasets[0].data = [{
                        x: d.transferredEnergy,
                        y: d.reflectionCoefficient
                    }];
                    collisionChart.update();

                    if (window.updateCollisionChart) {
                        window.updateCollisionChart([d]); // передаем массив с одной точкой
                    }
                }

                else {
                    // Для других моделей — просто показать JSON
                    resultBox.innerHTML = `<pre>${JSON.stringify(d, null, 2)}</pre>`;
                }

                // 🔹 Плавное появление блока с результатами
                resultBox.classList.remove("show");
                void resultBox.offsetWidth; // сброс анимации
                resultBox.classList.add("show");

            } else {
                resultBox.innerHTML = `<p class="error">Ошибка: ${result.message}</p>`;
            }

        } catch (error) {
            document.getElementById("result-box").innerHTML =
                `<p class="error">Ошибка при расчёте: ${error}</p>`;
        }


    });
}


