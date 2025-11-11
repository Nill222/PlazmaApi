// Пример обработки формы через JS
document.getElementById("calcForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
        temperature: parseFloat(document.getElementById("temperature").value),
        pressure: parseFloat(document.getElementById("pressure").value),
        concentration: parseFloat(document.getElementById("concentration").value),
        energy: parseFloat(document.getElementById("energy").value)
    };

    try {
        const response = await fetch("", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (response.ok) {
            alert("✅ Параметры сохранены!");
        } else {
            alert("❌ Ошибка: " + (data.message || "Не удалось сохранить"));
        }
    } catch (err) {
        alert("⚠️ Ошибка соединения с сервером");
        console.error(err);
    }
});