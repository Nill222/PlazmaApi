document.addEventListener("DOMContentLoaded", () => {
    const graphDiv = document.getElementById("mainGraph");

    // Построение графика
    const xValues = [];
    const yValues = [];
    for (let i = 0; i <= 360; i += 5) {
        xValues.push(i);
        yValues.push(Math.sin(i * Math.PI / 180));
    }
    const trace = { x: xValues, y: yValues, mode: "lines", line: { color: "#42a5f5", width: 3 }, name: "Плазменный сигнал" };
    const layout = { paper_bgcolor: "#121c33", plot_bgcolor: "#121c33", font: { color: "#e8eefc" }, xaxis: { title: "Угол (°)" }, yaxis: { title: "Амплитуда" }, margin: { t: 40, b: 40, l: 60, r: 20 } };
    Plotly.newPlot(graphDiv, [trace], layout, { displayModeBar: false });

    // Обработчики форм
    const atomsForm = document.getElementById("atomsForm");
    const ionsForm = document.getElementById("ionsForm");

    atomsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = {
            useFile: document.getElementById("enableAtomFile").checked,
            count: parseInt(document.getElementById("atomCount").value)
        };
        try {
            const response = await fetch("/api/atoms/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (response.ok) alert("✅ Данные по атомам сохранены");
            else alert("❌ Ошибка сохранения атомов");
        } catch (err) {
            alert("⚠️ Ошибка соединения");
            console.error(err);
        }
    });

    ionsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = {
            useFile: document.getElementById("enableIonFile").checked,
            count: parseInt(document.getElementById("ionCount").value)
        };
        try {
            const response = await fetch("/api/ions/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (response.ok) alert("✅ Данные по ионам сохранены");
            else alert("❌ Ошибка сохранения ионов");
        } catch (err) {
            alert("⚠️ Ошибка соединения");
            console.error(err);
        }
    });
});