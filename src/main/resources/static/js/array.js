const API_BASE = "/atoms";

document.addEventListener("DOMContentLoaded", () => {
    const atomTableContainer = document.getElementById("atomTableContainer");
    const loadAtomsBtn = document.getElementById("loadAtoms");
    const createForm = document.getElementById("createAtomForm");
    const searchBtn = document.getElementById("searchAtom");
    const searchResult = document.getElementById("searchResult");

    // функция генерации таблицы
    function renderTable(atoms) {
        if (!atoms || atoms.length === 0) return "<p>Нет данных для отображения</p>";

        let html = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Символ</th>
                    <th>Полное название</th>
                    <th>Масса (кг)</th>
                    <th>Парам. решетки a</th>
                    <th>Темп. Дебая</th>
                    <th>Валентность</th>
                </tr>
            </thead>
            <tbody>
        `;

        atoms.forEach(atom => {
            html += `
                <tr>
                    <td>${atom.id}</td>
                    <td>${atom.atomName}</td>
                    <td>${atom.fullName}</td>
                    <td>${atom.mass}</td>
                    <td>${atom.a}</td>
                    <td>${atom.debyeTemperature}</td>
                    <td>${atom.valence}</td>
                </tr>`;
        });

        html += "</tbody></table>";
        return html;
    }

    // 📘 Загрузить все атомы
    loadAtomsBtn.addEventListener("click", async () => {
        const response = await fetch(API_BASE);
        const data = await response.json();

        if (response.ok && data.data) {
            atomTableContainer.innerHTML = renderTable(data.data);
        } else {
            atomTableContainer.innerHTML = `<p>Ошибка загрузки атомов</p>`;
        }
    });

    // ➕ Создать атом
    createForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const atom = {
            atomName: document.getElementById("atomName").value,
            fullName: document.getElementById("fullName").value,
            mass: parseFloat(document.getElementById("mass").value),
            a: parseFloat(document.getElementById("a").value),
            debyeTemperature: parseFloat(document.getElementById("debyeTemperature").value),
            valence: parseInt(document.getElementById("valence").value)
        };

        const response = await fetch(API_BASE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(atom)
        });

        const data = await response.json();
        if (response.ok) {
            alert("✅ " + data.message);
            createForm.reset();
        } else {
            alert("❌ Ошибка: " + (data.message || "Не удалось создать атом"));
        }
    });

    // 🔍 Найти по символу
    searchBtn.addEventListener("click", async () => {
        const symbol = document.getElementById("searchSymbol").value.trim();
        if (!symbol) return;

        const response = await fetch(`${API_BASE}/symbol/${symbol}`);
        const data = await response.json();

        if (response.ok && data.data && data.data.length > 0) {
            searchResult.innerHTML = renderTable(data.data);
        } else {
            searchResult.innerHTML = "<p>Атом не найден</p>";
        }
    });
});
