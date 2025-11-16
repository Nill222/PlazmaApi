document.getElementById("latticeForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const request = {
        configId: parseInt(document.getElementById("configId").value),
        atomListId: parseInt(document.getElementById("atomListId").value),
        count: parseInt(document.getElementById("count").value),
        dimension: parseInt(document.getElementById("dimension").value)
    };

    const response = await fetch("/api/lattice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request)
    });

    const resultsSection = document.getElementById("resultsSection");
    const table = document.getElementById("atomsTable");
    table.innerHTML = "";

    if (!response.ok) {
        alert("Ошибка при генерации решётки");
        resultsSection.style.display = "none";
        return;
    }

    const data = await response.json();
    const atoms = data.data || [];

    if (atoms.length === 0) {
        table.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Нет данных</td></tr>`;
    } else {
        atoms.forEach(atom => {
            const row = `<tr>
                    <td>${atom.id}</td>
                    <td>${atom.x.toExponential(4)}</td>
                    <td>${atom.y.toExponential(4)}</td>
                    <td>${atom.atomListId}</td>
                </tr>`;
            table.insertAdjacentHTML("beforeend", row);
        });
    }

    resultsSection.style.display = "block";
    resultsSection.scrollIntoView({ behavior: "smooth" });
});