const resultSection = document.getElementById("resultSection");
const resIon = document.getElementById("resIon");
const resAtom = document.getElementById("resAtom");
const resTotalE = document.getElementById("resTotalE");
const resAvgE = document.getElementById("resAvgE");
const resTemp = document.getElementById("resTemp");
const resDiff = document.getElementById("resDiff");

document.getElementById("simulationForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    document.querySelectorAll(".error-message").forEach(el => el.textContent = "");


    const req = {
        configId: +configId.value,
        ionId: +ionId.value,
        atomListId: atomListId.value,
        generateLattice: generateLattice.checked,

        latticeRequest: generateLattice.checked ? {
            sizeX: +latX.value,
            sizeY: +latY.value,
            sizeZ: +latZ.value
        } : null,

        plasmaVoltage: +plasmaVoltage.value,
        pressure: +pressure.value,
        electronTemp: +electronTemp.value,
        timeStep: +timeStep.value,
        totalTime: +totalTime.value,
        impactAngle: +impactAngle.value,
        diffusionPrefactor: +diffusionPrefactor.value,
        activationEnergy: +activationEnergy.value,
        surfaceConcentration: +surfaceConcentration.value,
        depth: +depth.value,
        thermalConductivity: +thermalConductivity.value
    };

    try {
        const res = await fetch("/api/simulation/run",{
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(req)
        });

        const data = await res.json();

        const alertBox = document.getElementById("alertBox");
        alertBox.className = "alert d-none";

        if (!res.ok) {
            if (data.message === "Ошибка валидации" && Array.isArray(data.data)) {
                data.data.forEach(err => {
                    const [field,msg] = err.split(": ");
                    const el = document.getElementById(`error-${field}`);
                    if (el) el.textContent = msg;
                });
            } else {
                alertBox.className = "alert alert-danger";
                alertBox.textContent = data.message || "Ошибка симуляции";
            }

            resultSection.style.display = "none";
            return;
        }

        const r = data.data;

        resIon.textContent = r.ionName;
        resAtom.textContent = r.atomName;
        resTotalE.textContent = r.totalTransferredEnergy.toExponential(6);
        resAvgE.textContent = r.avgTransferredPerAtom.toExponential(6);
        resTemp.textContent = r.estimatedTemperature.toFixed(2);
        resDiff.textContent = r.diffusionCoefficient.toExponential(6);

        resultSection.style.display = "block";
        resultSection.scrollIntoView({behavior: "smooth"});
    } catch (err) {
        console.error(err);
        alertBox.className = "alert alert-danger";
        alertBox.textContent = "Ошибка соединения с сервером";
    }
} );