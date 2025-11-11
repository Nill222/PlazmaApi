document.addEventListener("DOMContentLoaded", () => {
    const atomTableBody = document.querySelector("#atomTable tbody");
    const ionTableBody = document.querySelector("#ionTable tbody");

    // Загрузка атомов
    async function loadAtoms() {
        try {
            const response = await fetch("/atoms"); // GET эндпоинт, который возвращает atom_list
            const atoms = await response.json();

            atomTableBody.innerHTML = "";

            if (atoms && atoms.length > 0) {
                atoms.forEach(atom => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${atom.id}</td>
                        <td>${atom.atomName}</td>
                        <td>${atom.fullName}</td>
                        <td>${atom.mass}</td>
                        <td>${atom.a}</td>
                        <td>${atom.debyeTemperature}</td>
                        <td>${atom.valence}</td>
                    `;
                    atomTableBody.appendChild(tr);
                });
            } else {
                atomTableBody.innerHTML = `<tr><td colspan="7">Нет данных</td></tr>`;
            }
        } catch (e) {
            console.error(e);
            atomTableBody.innerHTML = `<tr><td colspan="7" style="color:red;">Ошибка загрузки данных</td></tr>`;
        }
    }

    // Загрузка ионов
    async function loadIons() {
        try {
            const response = await fetch("/ions"); // GET эндпоинт для ионов
            const ions = await response.json();

            ionTableBody.innerHTML = "";

            if (ions && ions.length > 0) {
                ions.forEach(ion => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${ion.id}</td>
                        <td>${ion.name ?? '—'}</td>
                        <td>${ion.charge ?? '—'}</td>
                        <td>${ion.mass ?? '—'}</td>
                    `;
                    ionTableBody.appendChild(tr);
                });
            } else {
                ionTableBody.innerHTML = `<tr><td colspan="4">Нет данных</td></tr>`;
            }
        } catch (e) {
            console.error(e);
            ionTableBody.innerHTML = `<tr><td colspan="4" style="color:red;">Ошибка загрузки данных</td></tr>`;
        }
    }

    // Кнопки обновления
    document.getElementById("refreshAtoms").addEventListener("click", loadAtoms);
    document.getElementById("refreshIons").addEventListener("click", loadIons);

    // Автозагрузка при загрузке страницы
    loadAtoms();
    loadIons();
});
