const modelSelect = document.getElementById("modelSelect");
const formSection = document.getElementById("formSection");
const validationInfo = document.getElementById("validationInfo");
const resultBox = document.getElementById("result-box");
const chartSection = document.getElementById("chartSection");

let latticeChart;

// 🔹 Ограничения параметров
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
        { field: "ID конфигурации", rule: "Положительное целое число" },
        { field: "ID иона", rule: "Положительное целое число" },
        { field: "ID атома", rule: "Положительное целое число" },
        { field: "Напряжение плазмы (V)", rule: "Положительное, ≤ 1e6" },
        { field: "Давление (Pa)", rule: "Положительное, ≤ 1e5" },
        { field: "Электронная температура (K)", rule: "Положительная, ≤ 1e5" },
        { field: "Шаг времени (с)", rule: "Положительный, ≥ 1e-6" },
        { field: "Общее время (с)", rule: "Положительное, ≤ 1e6" },
        { field: "Угол столкновения (°)", rule: "0° ≤ угол ≤ 180°" },
        { field: "Коэффициент диффузии D0", rule: "Положительный, ≤ 1e-2" },
        { field: "Энергия активации (Q)", rule: "Положительная, ≤ 1e6" },
        { field: "Поверхностная концентрация", rule: "≥ 0, ≤ 1e3" },
        { field: "Глубина (мкм)", rule: "Положительная, ≤ 1e3" },
        { field: "Теплопроводность", rule: "Положительная, ≤ 1e3" } ]
};

// 🔹 Формы моделей
const formTemplates = {
    plasma: `
        <h3>Параметры плазмы</h3>
        <form id="plasmaForm" class="form-grid">
            <label>Напряжение (V): <input type="number" name="voltage" required></label>
            <label>Давление (Pa): <input type="number" name="pressure" required></label>
            <label>Температура (K): <input type="number" name="temperature" required></label>
            <button type="submit">Рассчитать</button>
        </form>
    `,
    collision: `
        <h3>Параметры столкновения</h3>
        <form id="collisionForm" class="form-grid">
            <label>Энергия (Эв): <input type="number" name="E" required></label>
            <label>Масса иона (кг): <input type="number" name="mIon" required></label>
            <label>Масса атома (кг): <input type="number" name="mAtom" required></label>
            <label>Угол (°): <input type="number" name="angle" required></label>
            <button type="submit">Смоделировать</button>
        </form>
    `,
    diffusion: `
        <h3>Параметры диффузии</h3>
        <form id="diffusionForm" class="form-grid">
            <label>D (м²/с, ≤ 0.01): <input type="number" name="D" min="0" max="0.01" step="0.0001" required></label>
            <label>Начальная концентрация c₀: <input type="number" name="c0" required></label>
            <label>Макс. время (с): <input type="number" name="tMax" required></label>
            <label>Глубина (мкм): <input type="number" name="depth" required></label>
            <button type="submit">Рассчитать</button>
        </form>
    `,
    lattice: `
        <h3>Параметры решётки</h3>
        <form id="latticeForm" class="form-grid">
            <label>ID конфигурации: <input type="number" name="configId" min="1" step="1" required></label>
            <label>ID атома: <input type="number" name="atomListId" min="1" step="1" required></label>
            <label>Количество атомов: <input type="number" name="count" min="1" max="1000000" step="1" required></label>
            <label>Размерность (1-3): <input type="number" name="dimension" min="1" max="3" step="1" required></label>
            <button type="submit">Сгенерировать</button>
        </form>
    `,
    simulation: ` <h3>Параметры симуляции</h3> 
    <form id="simulationForm" class="form-grid"> 
        <label>ID конфигурации: <input type="number" name="configId" required></label> 
        <label>ID иона: <input type="number" name="ionId" required></label> 
        <label>ID атома: <input type="number" name="atomListId" required></label> 
        <label>Напряжение плазмы (V): <input type="number" name="plasmaVoltage" required></label> 
        <label>Давление (Pa): <input type="number" name="pressure" required></label> 
        <label>Электронная температура (K): <input type="number" name="electronTemp" required>
        </label> <label>Шаг времени (с): <input type="number" name="timeStep" step="any" required>
        </label> <label>Общее время (с): <input type="number" name="totalTime" step="any" required></label> 
        <label>Угол столкновения (°): <input type="number" name="impactAngle" step="any" required></label> 
        <label>Коэффициент диффузии D0: <input type="number" name="diffusionPrefactor" step="any" required></label> 
        <label>Энергия активации Q: <input type="number" name="activationEnergy" step="any" required></label> 
        <label>Поверхностная концентрация: <input type="number" name="surfaceConcentration" step="any" required></label> 
        <label>Глубина (мкм): <input type="number" name="depth" step="any" required></label> 
        <label>Теплопроводность: <input type="number" name="thermalConductivity" step="any" required></label> 
        <button type="submit">Запустить симуляцию</button> 
        </form>
`
};

// 🔹 Выбор модели
modelSelect.addEventListener("change", (e) => {
    const model = e.target.value;
    formSection.innerHTML = formTemplates[model] || "";
    resultBox.innerHTML = "<p>Ожидание данных...</p>";
    chartSection.innerHTML = "";
    showValidationInfo(model);
    attachFormHandler(model);
});

// 🔹 Ограничения
function showValidationInfo(model) {
    if (!validationRules[model]) {
        validationInfo.classList.add("hidden");
        return;
    }
    const rules = validationRules[model].map(r => `<div>${r.field}: ${r.rule}</div>`).join("");
    validationInfo.innerHTML = `<h4>📘 Ограничения параметров (${model})</h4>${rules}`;
    validationInfo.classList.remove("hidden");
}

// 🔹 Обработка форм
function attachFormHandler(model) {
    const form = document.querySelector(`#${model}Form`);
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));

        // 🔹 Заглушка для имитации ответа от сервера
        let resultData;

        if (model === "plasma") {
            try {
                const response = await fetch("/api/plasma/calculate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        voltage: parseFloat(data.voltage),
                        pressure: parseFloat(data.pressure),
                        temperature: parseFloat(data.temperature)
                    })
                });

                const json = await response.json();
                resultData = json.data; // PlasmaParameters
            } catch (err) {
                console.error(err);
                alert("Ошибка при расчёте плазмы");
                return;
            }
        }
        else if (model === "collision") {
            try {
                const response = await fetch("/api/collision/simulate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        E: parseFloat(data.E),
                        mIon: parseFloat(data.mIon),
                        mAtom: parseFloat(data.mAtom),
                        angle: parseFloat(data.angle)
                    })
                });

                const json = await response.json();
                const resultData = json.data; // CollisionResult

                displayResult("collision", resultData);
            } catch (err) {
                console.error(err);
                alert("Ошибка при расчёте столкновения");
            }
        }

        else if (model === "diffusion") {
            const nPoints = 50;
            resultData = {
                D: parseFloat(data.D),
                c0: parseFloat(data.c0),
                tMax: parseFloat(data.tMax),
                depth: parseFloat(data.depth),
                depths: Array.from({ length: nPoints }, (_, i) => i * (data.depth / (nPoints-1))),
                concentration: Array.from({ length: nPoints }, () => Math.random() * data.c0)
            };
        }
        else if (model === "lattice") {
            const count = parseInt(data.count, 10) || 1;
            const atomListId = parseInt(data.atomListId, 10) || 1;
            resultData = Array.from({ length: count }, (_, i) => ({
                id: i + 1,
                x: Math.random(),
                y: Math.random(),
                atomListId: atomListId
            }));
        }
        else if (model === "simulation") {
            try {
                // Формируем тело запроса
                const requestBody = {
                    configId: parseInt(data.configId),
                    ionId: parseInt(data.ionId),
                    atomListId: parseInt(data.atomListId),
                    plasmaVoltage: parseFloat(data.plasmaVoltage),
                    pressure: parseFloat(data.pressure),
                    electronTemp: parseFloat(data.electronTemp),
                    timeStep: parseFloat(data.timeStep),
                    totalTime: parseFloat(data.totalTime),
                    impactAngle: parseFloat(data.impactAngle),
                    diffusionPrefactor: parseFloat(data.diffusionPrefactor),
                    activationEnergy: parseFloat(data.activationEnergy),
                    surfaceConcentration: parseFloat(data.surfaceConcentration),
                    depth: parseFloat(data.depth),
                    thermalConductivity: parseFloat(data.thermalConductivity)
                };

                const response = await fetch("/api/simulation/run", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Ошибка сервера: ${errText}`);
                }

                const json = await response.json();
                const resultData = json.data; // SimulationResultDto

                displayResult("simulation", resultData);

            } catch (err) {
                console.error(err);
                alert(`Ошибка при расчёте симуляции: ${err.message}`);
            }
        }

        else {
            resultData = data;
        }

        displayResult(model, resultData);
    });
}


// 🔹 Отображение результатов
function displayResult(model, d) {
    let html = "";

    chartSection.innerHTML = ""; // очистка графиков

    if (model === "plasma") {
        const html = `
        <h3>Результаты плазмы</h3>
        <table class="table table-striped">
            <tr><td>Напряжение</td><td>${d.voltage} В</td></tr>
            <tr><td>Давление</td><td>${d.pressure} Па</td></tr>
            <tr><td>Температура</td><td>${d.temperature} K</td></tr>
            <tr><td>Плотность электронов</td><td>${d.electronDensity.toExponential(3)} м⁻³</td></tr>
            <tr><td>Скорость электронов</td><td>${d.electronVelocity.toFixed(2)} м/с</td></tr>
            <tr><td>Плотность тока</td><td>${d.currentDensity.toFixed(2)} А/м²</td></tr>
        </table>
        `;
        resultBox.innerHTML = html;

        chartSection.classList.remove("hidden");
        chartSection.innerHTML = `<canvas id="plasmaChart" width="600" height="400"></canvas>`;

        const ctx = document.getElementById("plasmaChart").getContext("2d");
        if (window.plasmaChart) window.plasmaChart.destroy();

        window.plasmaChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Плотность электронов', 'Скорость электронов', 'Плотность тока'],
                datasets: [{
                    label: 'Значения',
                    data: [d.electronDensity, d.electronVelocity, d.currentDensity],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)'
                    ]
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value >= 1e3 ? value.toExponential(2) : value;
                            }
                        }
                    }
                }
            }
        });
    }

    else if(model === "collision") {
        html = `
            <h3>Результаты столкновения</h3>
            <table class="table table-striped">
                <tr><td>Переданная энергия</td><td>${d.transferredEnergy}</td></tr>
                <tr><td>Коэффициент отражения</td><td>${d.reflectionCoefficient}</td></tr>
            </table>
            <canvas id="collisionChart" width="600" height="400"></canvas>
        `;
        resultBox.innerHTML = html;

        return;
    }
    else if(model === "diffusion") {
        let tableRows = d.depths.map((depth, i) => {
            const conc = d.concentration[i] !== undefined ? d.concentration[i].toFixed(3) : '';
            return `<tr><td>${depth.toFixed(3)}</td><td>${conc}</td></tr>`;
        }).join('');
        html = `
            <h3>Профиль диффузии</h3>
            <table class="table table-striped">
                <thead>
                <tr><th>Глубина</th><th>Концентрация</th></tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
            </table>
            <canvas id="diffusionChart" width="600" height="400"></canvas>
        `;
        resultBox.innerHTML = html;

        const ctx = document.getElementById("diffusionChart").getContext("2d");
        new Chart(ctx, {
            type:'line',
            data:{
                labels:d.depths.map(v => v.toFixed(3)),
                datasets:[{
                    label:'Концентрация',
                    data:d.concentration,
                    borderColor:'rgba(75,192,192,1)',
                    backgroundColor:'rgba(75,192,192,0.2)',
                    fill:true
                }]
            },
            options:{
                responsive:true,
                scales:{
                    x:{ title:{display:true,text:'Глубина'} },
                    y:{ title:{display:true,text:'Концентрация'} }
                }
            }
        });
        return;
    }
    else if(model === "lattice") {
        html = `
            <h3>Сгенерированные атомы</h3>
            <table class="table table-striped">
                <tr>
                    <th>ID</th>
                    <th>X</th>
                    <th>Y</th>
                    <th>atomListId</th>
                </tr>
                ${d.map(atom => `<tr>
                        <td>${atom.id}</td>
                        <td>${atom.x.toExponential(2)}</td>
                        <td>${atom.y.toExponential(2)}</td>
                        <td>${atom.atomListId}</td>
                    </tr>`).join('')}
            </table>
            <canvas id="latticeChart" width="600" height="400"></canvas>
        `;
        resultBox.innerHTML = html;

        const ctx = document.getElementById("latticeChart").getContext("2d");
        if(latticeChart) latticeChart.destroy();
        latticeChart = new Chart(ctx, {
            type:'scatter',
            data:{
                datasets:[{
                    label:'Атомы решётки',
                    data:d.map(a=>({x:a.x*1e10, y:a.y*1e10})),
                    pointRadius:4,
                    backgroundColor:'rgba(54,162,235,0.7)'
                }]
            },
            options:{
                responsive:true,
                scales:{
                    x:{title:{display:true,text:'X (Å)'}},
                    y:{title:{display:true,text:'Y (Å)'}}
                }
            }
        });
        return;
    }
    else if(model === "simulation") {
        let html = `
    <h3>Результаты симуляции</h3>
    <table class="table table-striped">
        <tr><td>Ион</td><td>${d.ionName}</td></tr>
        <tr><td>Атом</td><td>${d.atomName}</td></tr>
        <tr><td>Общая переданная энергия</td><td>${d.totalTransferredEnergy.toExponential(3)} Дж</td></tr>
        <tr><td>Средняя энергия на атом</td><td>${d.avgTransferredPerAtom.toExponential(3)} Дж</td></tr>
        <tr><td>Оценочная температура</td><td>${d.estimatedTemperature.toFixed(2)} K</td></tr>
        <tr><td>Коэффициент диффузии</td><td>${d.diffusionCoefficient.toExponential(3)} м²/с</td></tr>
    </table>
    `;

        // График perAtomTransferredEnergies
        if(d.perAtomTransferredEnergies?.length) {
            html += `<h4>Энергия на каждый атом</h4><canvas id="perAtomChart" width="600" height="400"></canvas>`;
        }

        // График diffusionProfile (ограничиваем количество точек до 50)
        if(d.diffusionProfile?.depths?.length) {
            html += `<h4>Профиль диффузии</h4><canvas id="diffusionProfileChart" width="600" height="400"></canvas>`;
        }

        // График coolingProfile (ограничиваем количество точек до 50)
        if(d.coolingProfile?.length) {
            html += `<h4>Профиль охлаждения</h4><canvas id="coolingChart" width="600" height="400"></canvas>`;
        }

        resultBox.innerHTML = html;

        // perAtomTransferredEnergies chart
        if(d.perAtomTransferredEnergies?.length) {
            const ctx1 = document.getElementById("perAtomChart").getContext("2d");
            if(window.perAtomChart) window.perAtomChart.destroy();
            window.perAtomChart = new Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: d.perAtomTransferredEnergies.map((_, i) => `Атом ${i+1}`),
                    datasets: [{
                        label: 'Переданная энергия',
                        data: d.perAtomTransferredEnergies,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)'
                    }]
                },
                options: { responsive: true, scales: { y: { beginAtZero: true } } }
            });
        }

        // diffusionProfile chart с ограничением точек
        if(d.diffusionProfile?.depths?.length) {
            const nPoints = 50;
            const step = Math.max(1, Math.floor(d.diffusionProfile.depths.length / nPoints));
            const sampledDepths = d.diffusionProfile.depths.filter((_, i) => i % step === 0);
            const sampledConcentrations = d.diffusionProfile.concentrations.filter((_, i) => i % step === 0);

            const ctx2 = document.getElementById("diffusionProfileChart").getContext("2d");
            if(window.diffusionProfileChart) window.diffusionProfileChart.destroy();
            window.diffusionProfileChart = new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: sampledDepths.map(v => v.toFixed(3)),
                    datasets: [{
                        label: 'Концентрация',
                        data: sampledConcentrations,
                        borderColor: 'rgba(75,192,192,1)',
                        backgroundColor: 'rgba(75,192,192,0.2)',
                        fill: true
                    }]
                },
                options: { responsive: true }
            });
        }

        // coolingProfile chart с ограничением точек
        if(d.coolingProfile?.length) {
            const nPoints = 50;
            const step = Math.max(1, Math.floor(d.coolingProfile.length / nPoints));
            const sampledCooling = d.coolingProfile.filter((_, i) => i % step === 0);
            const ctx3 = document.getElementById("coolingChart").getContext("2d");
            if(window.coolingChart) window.coolingChart.destroy();
            window.coolingChart = new Chart(ctx3, {
                type: 'line',
                data: {
                    labels: sampledCooling.map((_, i) => `t${i}`),
                    datasets: [{
                        label: 'Температура',
                        data: sampledCooling,
                        borderColor: 'rgba(255,99,132,1)',
                        backgroundColor: 'rgba(255,99,132,0.2)',
                        fill: true
                    }]
                },
                options: { responsive: true }
            });
        }

        // Если есть plasmaParameters
        if(d.plasmaParameters) {
            html += `
        <h4>Параметры плазмы</h4>
        <table class="table table-striped">
            <tr><td>Напряжение</td><td>${d.plasmaParameters.voltage} В</td></tr>
            <tr><td>Давление</td><td>${d.plasmaParameters.pressure} Па</td></tr>
            <tr><td>Температура</td><td>${d.plasmaParameters.temperature} K</td></tr>
            <tr><td>Плотность электронов</td><td>${d.plasmaParameters.electronDensity.toExponential(3)} м⁻³</td></tr>
            <tr><td>Скорость электронов</td><td>${d.plasmaParameters.electronVelocity.toFixed(2)} м/с</td></tr>
            <tr><td>Плотность тока</td><td>${d.plasmaParameters.currentDensity.toFixed(2)} А/м²</td></tr>
        </table>
        `;
        }
    }




    resultBox.innerHTML = html;
}
