const API_BASE = "/atoms";

document.addEventListener("DOMContentLoaded", () => {
    const atomListEl = document.getElementById("atomList");
    const loadAtomsBtn = document.getElementById("loadAtoms");
    const createForm = document.getElementById("createAtomForm");
    const searchBtn = document.getElementById("searchAtom");
    const searchResult = document.getElementById("searchResult");

    // 📘 Загрузка всех атомов
    loadAtomsBtn.addEventListener("click", async () => {
        try {
            const response = await fetch(API_BASE);
            const data = await response.json();

            atomListEl.innerHTML = "";

            if (response.ok && data.data?.length) {
                data.data.forEach(atom => {
                    const li = document.createElement("li");
                    li.textContent = `${atom.id}: ${atom.atomName} (${atom.fullName}), масса = ${atom.mass}, валентность = ${atom.valence}`;
                    atomListEl.appendChild(li);
                });
            } else {
                atomListEl.innerHTML = "<li>Нет данных об атомах</li>";
            }
        } catch (err) {
            console.error("Ошибка загрузки:", err);
            atomListEl.innerHTML = "<li>Ошибка загрузки данных</li>";
        }
    });

    // ➕ Создание нового атома
    createForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const atom = {
            atomName: document.getElementById("atomName").value.trim(),
            fullName: document.getElementById("fullName").value.trim(),
            mass: parseFloat(document.getElementById("mass").value),
            a: parseFloat(document.getElementById("a").value),
            debyeTemperature: parseFloat(document.getElementById("debyeTemperature").value),
            valence: parseInt(document.getElementById("valence").value)
        };

        try {
            const response = await fetch(API_BASE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(atom)
            });

            const data = await response.json();

            if (response.ok) {
                alert("✅ " + data.message);
                createForm.reset();
                loadAtomsBtn.click(); // перезагрузить список
            } else {
                alert("❌ Ошибка: " + (data.message || "Не удалось создать атом"));
            }
        } catch (err) {
            alert("⚠️ Ошибка соединения с сервером");
            console.error(err);
        }
    });

    // 🔍 Поиск по символу (atomName)
    searchBtn.addEventListener("click", async () => {
        const symbol = document.getElementById("searchSymbol").value.trim();
        if (!symbol) return alert("Введите символ атома!");

        try {
            const response = await fetch(`${API_BASE}/symbol/${symbol}`);
            const data = await response.json();

            if (response.ok && data.data) {
                searchResult.textContent = JSON.stringify(data.data, null, 2);
            } else {
                searchResult.textContent = "Атом не найден";
            }
        } catch (err) {
            searchResult.textContent = "Ошибка при поиске";
            console.error(err);
        }
    });

});
