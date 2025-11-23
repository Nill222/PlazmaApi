// lattice.js - Генерация кристаллических решёток для PlasmaLab

let currentAtoms = [];
let availableAtoms = [];
let availableConfigurations = [];
let calculationInProgress = false;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log("Lattice page initialized");
    setupEventListeners();
    initializeAuth();
    setupProgressIndicator();
    loadAtomsFromDatabase();
    loadConfigurationsFromDatabase();
});

function setupProgressIndicator() {
    const progressHTML = `
        <div class="progress mt-3" id="calculationProgress" style="display: none; height: 20px;">
            <div class="progress-bar progress-bar-striped progress-bar-animated" 
                 role="progressbar" style="width: 0%"></div>
        </div>
    `;
    document.querySelector('.calculation-card .card-body').insertAdjacentHTML('beforeend', progressHTML);
}

// Загрузка атомов из базы данных
async function loadAtomsFromDatabase() {
    const token = getToken();
    if (!token) {
        showAuthWarning();
        return;
    }

    const atomsList = document.getElementById('atomsList');
    const atomSelect = document.getElementById('atomListId');

    try {
        atomsList.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                </div>
                <p class="mt-2 text-muted">Загрузка атомов из базы данных...</p>
            </div>
        `;

        const response = await fetch('/atoms', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка загрузки атомов');
        }

        const result = await response.json();
        availableAtoms = result.data || [];

        // Очищаем select
        atomSelect.innerHTML = '<option value="" disabled selected>Выберите атом</option>';

        if (availableAtoms.length === 0) {
            atomsList.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    В базе данных нет атомов.
                </div>
            `;
            return;
        }

        // Заполняем select
        availableAtoms.forEach(atom => {
            const option = document.createElement('option');
            option.value = atom.id;
            option.textContent = `${atom.atomName} - ${atom.fullName} (a=${atom.a} Å)`;
            atomSelect.appendChild(option);
        });

        // Показываем список атомов
        let atomsHTML = '<div class="row g-2">';
        availableAtoms.slice(0, 6).forEach(atom => {
            atomsHTML += `
                <div class="col-md-4">
                    <div class="card atom-card">
                        <div class="card-body p-3">
                            <h6 class="card-title">${atom.atomName}</h6>
                            <p class="card-text small mb-1">${atom.fullName}</p>
                            <p class="card-text small text-muted mb-0">
                                a=${atom.a} Å, m=${formatScientific(atom.mass)} кг
                            </p>
                        </div>
                    </div>
                </div>
            `;
        });
        atomsHTML += '</div>';

        if (availableAtoms.length > 6) {
            atomsHTML += `<div class="mt-2 text-center">
                <small class="text-muted">И еще ${availableAtoms.length - 6} атомов...</small>
            </div>`;
        }

        atomsList.innerHTML = atomsHTML;

    } catch (error) {
        console.error('Ошибка загрузки атомов:', error);
        atomsList.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Ошибка загрузки атомов: ${error.message}
            </div>
        `;
    }
}

// Загрузка конфигураций из базы данных
async function loadConfigurationsFromDatabase() {
    const token = getToken();
    if (!token) {
        return;
    }

    const configList = document.getElementById('configurationsList');
    const configSelect = document.getElementById('configId');

    try {
        configList.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                </div>
                <p class="mt-2 text-muted">Загрузка конфигураций...</p>
            </div>
        `;

        const response = await fetch('/configs', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка загрузки конфигураций');
        }

        const result = await response.json();
        availableConfigurations = result.data || [];

        // Очищаем select
        configSelect.innerHTML = '<option value="" disabled selected>Выберите конфигурацию</option>';

        if (availableConfigurations.length === 0) {
            configList.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    В базе данных нет конфигураций.
                </div>
            `;
            return;
        }

        // Заполняем select
        availableConfigurations.forEach(config => {
            const option = document.createElement('option');
            option.value = config.id;
            const configName = config.name || `Конфигурация ${config.id}`;
            option.textContent = `#${config.id} - ${configName}`;
            configSelect.appendChild(option);
        });

        // Показываем список конфигураций
        let configsHTML = '<div class="row g-2">';
        availableConfigurations.slice(0, 4).forEach(config => {
            const configName = config.name || `Конфигурация ${config.id}`;
            const createdAt = config.createdAt ? new Date(config.createdAt).toLocaleDateString() : 'Неизвестно';

            configsHTML += `
                <div class="col-md-6">
                    <div class="card config-card">
                        <div class="card-body p-3">
                            <h6 class="card-title">#${config.id} - ${configName}</h6>
                            <p class="card-text small text-muted mb-0">
                                Создана: ${createdAt}
                            </p>
                        </div>
                    </div>
                </div>
            `;
        });
        configsHTML += '</div>';

        if (availableConfigurations.length > 4) {
            configsHTML += `<div class="mt-2 text-center">
                <small class="text-muted">И еще ${availableConfigurations.length - 4} конфигураций...</small>
            </div>`;
        }

        configList.innerHTML = configsHTML;

    } catch (error) {
        console.error('Ошибка загрузки конфигураций:', error);
        configList.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Ошибка загрузки конфигураций: ${error.message}
            </div>
        `;
    }
}

// Инициализация авторизации
function initializeAuth() {
    const token = getToken();
    const userMenu = document.querySelector('.user-menu');
    const authButtons = document.querySelector('.auth-buttons');

    if (token) {
        if (userMenu) userMenu.style.display = 'flex';
        if (authButtons) authButtons.style.display = 'none';
        document.body.classList.add('logged-in');

        const alertBox = document.getElementById("alertBox");
        if (alertBox) {
            alertBox.classList.add("d-none");
        }
    } else {
        if (userMenu) userMenu.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
        document.body.classList.remove('logged-in');
        showAuthWarning();
    }
}

function setupEventListeners() {
    document.getElementById("latticeForm").addEventListener("submit", handleFormSubmit);

    document.querySelectorAll('.form-control, .form-select').forEach(input => {
        input.addEventListener('input', function() {
            const errorEl = document.getElementById(`error-${this.id}`);
            if (errorEl) {
                errorEl.textContent = "";
                errorEl.style.display = "none";
                this.classList.remove("is-invalid");
            }
        });

        input.addEventListener('change', function() {
            const errorEl = document.getElementById(`error-${this.id}`);
            if (errorEl) {
                errorEl.textContent = "";
                errorEl.style.display = "none";
                this.classList.remove("is-invalid");
            }
        });
    });

    // Показ информации об атоме при выборе
    document.getElementById('atomListId').addEventListener('change', function() {
        const atomId = parseInt(this.value);
        const atom = availableAtoms.find(a => a.id === atomId);
        const infoSection = document.getElementById('atomInfo');
        const structureHelp = document.getElementById('structureHelp');
        const structureSelect = document.getElementById('structure');

        if (atom) {
            const structureInfo = atom.structure ?
                `<span class="text-success">Структура атома: ${getStructureName(atom.structure)}</span>` :
                '<span class="text-warning">Структура не указана</span>';

            document.getElementById('atomDescription').innerHTML = `
                <strong>${atom.atomName} - ${atom.fullName}</strong><br>
                <small>Параметр решётки: ${atom.a} Å</small><br>
                <small>Масса: ${formatScientific(atom.mass)} кг</small><br>
                <small>${structureInfo}</small>
            `;
            infoSection.style.display = 'block';

            if (atom.structure) {
                structureHelp.innerHTML = `Атом имеет свою структуру: ${getStructureName(atom.structure)}. Выбранная структура будет проигнорирована.`;
                structureSelect.disabled = true;
                structureSelect.value = atom.structure;
            } else {
                structureHelp.innerHTML = 'Структура будет использована, если у атома не указана своя';
                structureSelect.disabled = false;
                structureSelect.value = "";
            }
        } else {
            infoSection.style.display = 'none';
            structureHelp.innerHTML = 'Структура будет использована, если у атома не указана своя';
            structureSelect.disabled = false;
            structureSelect.value = "";
        }
    });
}

function getToken() {
    return localStorage.getItem('authToken');
}

function showAuthWarning() {
    const alertBox = document.getElementById("alertBox");
    if (alertBox) {
        alertBox.className = "alert alert-custom alert-warning";
        alertBox.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            Для выполнения расчётов необходимо <a href="#" onclick="showAuthModal()" class="alert-link">войти в систему</a>
        `;
        alertBox.classList.remove("d-none");
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    if (calculationInProgress) {
        showToast('Генерация уже выполняется...');
        return;
    }

    const token = getToken();
    if (!token) {
        showAuthWarning();
        return;
    }

    document.querySelectorAll(".error-message").forEach(el => {
        el.textContent = "";
        el.style.display = "none";
    });
    document.querySelectorAll(".form-control, .form-select").forEach(el => el.classList.remove("is-invalid"));

    const generateBtn = document.getElementById("generateBtn");
    const spinner = generateBtn.querySelector(".loading-spinner");
    const buttonText = generateBtn.querySelector("span");
    const progressBar = document.getElementById('calculationProgress');

    calculationInProgress = true;
    buttonText.textContent = "Генерация...";
    spinner.style.display = "inline-block";
    generateBtn.disabled = true;

    if (progressBar) {
        progressBar.style.display = 'block';
        progressBar.querySelector('.progress-bar').style.width = '0%';
    }

    // Получаем значения
    const configIdSelect = document.getElementById("configId");
    const atomListIdSelect = document.getElementById("atomListId");
    const countInput = document.getElementById("count");
    const structureSelect = document.getElementById("structure");

    const configIdValue = configIdSelect.value;
    const atomListIdValue = atomListIdSelect.value;
    const countValue = countInput.value;

    // Преобразуем в числа
    const configId = parseInt(configIdValue);
    const atomListId = parseInt(atomListIdValue);
    const count = parseInt(countValue);

    // Получаем выбранный атом
    const selectedAtom = availableAtoms.find(a => a.id === atomListId);

    // Определяем структуру: если у атома есть своя структура, используем её
    let finalStructure = structureSelect.value;
    let structureSource = "form";

    if (selectedAtom && selectedAtom.structure) {
        finalStructure = selectedAtom.structure;
        structureSource = "atom";
    }

    // Проверка параметров
    let validationErrors = [];

    if (!configIdValue || isNaN(configId) || configId <= 0) {
        validationErrors.push("configId: Выберите конфигурацию из списка");
    }

    if (!atomListIdValue || isNaN(atomListId) || atomListId <= 0) {
        validationErrors.push("atomListId: Выберите атом из списка");
    }

    if (!countValue || isNaN(count) || count <= 0) {
        validationErrors.push("count: Количество атомов должно быть положительным числом");
    } else if (count > 10000) {
        validationErrors.push("count: Слишком большое количество атомов. Максимум: 10,000");
    }

    if (!finalStructure) {
        validationErrors.push("structure: Не выбрана структура");
    }

    // Если есть ошибки валидации
    if (validationErrors.length > 0) {
        showError("Пожалуйста, заполните все поля корректными значениями");

        validationErrors.forEach(error => {
            const [field, message] = error.split(": ");
            showFieldError(field, message);
        });

        resetCalculationState(generateBtn, buttonText, spinner, progressBar);
        return;
    }

    const request = {
        configId,
        atomListId,
        count,
        structure: finalStructure
    };

    // Таймаут для длительных расчетов
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
        timeoutController.abort();
    }, 30000);

    try {
        const headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const progressInterval = setInterval(() => {
            if (progressBar) {
                const currentWidth = parseInt(progressBar.querySelector('.progress-bar').style.width);
                if (currentWidth < 90) {
                    progressBar.querySelector('.progress-bar').style.width = (currentWidth + 10) + '%';
                }
            }
        }, 300);

        const res = await fetch("/api/lattice/generate", {
            method: "POST",
            headers: headers,
            body: JSON.stringify(request),
            signal: timeoutController.signal
        });

        clearInterval(progressInterval);
        clearTimeout(timeoutId);

        if (res.status === 401) {
            localStorage.removeItem('authToken');
            showAuthWarning();
            initializeAuth();
            resetCalculationState(generateBtn, buttonText, spinner, progressBar);
            return;
        }

        const data = await res.json();

        const alertBox = document.getElementById("alertBox");
        if (alertBox) {
            alertBox.className = "alert alert-custom d-none";
            alertBox.innerText = "";
        }

        if (!res.ok) {
            if (data.message && data.message.includes("not found")) {
                showError(`Ошибка: ${data.message}. Убедитесь, что указанные ID существуют в базе данных.`);
            } else if (data.message === "Ошибка валидации" && Array.isArray(data.data)) {
                data.data.forEach(err => {
                    const [field, msg] = err.split(": ");
                    const errorEl = document.getElementById(`error-${field}`);
                    const inputEl = document.getElementById(field);
                    if (errorEl) {
                        errorEl.textContent = msg;
                        errorEl.style.display = "block";
                    }
                    if (inputEl) {
                        inputEl.classList.add("is-invalid");
                    }
                });
            } else {
                const errorMessage = data.message || `HTTP error! status: ${res.status}`;
                showError(errorMessage);
            }

            document.getElementById("resultSection").style.display = "none";
            resetCalculationState(generateBtn, buttonText, spinner, progressBar);
            return;
        }

        // Успешная генерация
        if (progressBar) {
            progressBar.querySelector('.progress-bar').style.width = '100%';
        }

        const atoms = data.data || [];

        if (Array.isArray(atoms)) {
            currentAtoms = atoms;
            updateResultsTable(atoms);
            updateStatistics(atoms, finalStructure, selectedAtom);

            document.getElementById("resultSection").style.display = "block";
            document.getElementById("resultSection").scrollIntoView({behavior: "smooth"});

            const structureSourceText = structureSource === "atom" ? "структура атома" : "выбранная структура";
            showToast(`Решётка успешно сгенерирована! Создано ${atoms.length} атомов (${structureSourceText})`);
        } else {
            throw new Error("Некорректный формат ответа от сервера");
        }

    } catch (err) {
        clearTimeout(timeoutId);
        console.error("Ошибка при выполнении запроса:", err);

        if (err.name === 'AbortError') {
            showError('Генерация заняла слишком много времени. Попробуйте уменьшить количество атомов.');
        } else {
            showToast("Ошибка соединения с сервером: " + err.message);
        }
    } finally {
        resetCalculationState(generateBtn, buttonText, spinner, progressBar);
    }
}

function updateResultsTable(atoms) {
    const table = document.getElementById("atomsTable");
    table.innerHTML = "";

    const step = Math.max(1, Math.floor(atoms.length / 100));

    for (let i = 0; i < atoms.length; i += step) {
        const atom = atoms[i];
        const selectedAtom = availableAtoms.find(a => a.id === atom.atomListId);
        const atomName = selectedAtom ? selectedAtom.atomName : 'Unknown';

        table.insertAdjacentHTML("beforeend", `
            <tr>
                <td>${atom.id}</td>
                <td>${atom.x.toExponential(6)}</td>
                <td>${atom.y.toExponential(6)}</td>
                <td>${atom.z ? atom.z.toExponential(6) : '0.0'}</td>
                <td>${atom.atomListId}</td>
                <td><span class="badge bg-primary">${atomName}</span></td>
            </tr>
        `);
    }
}

function updateStatistics(atoms, structure, atom) {
    const structureNames = {
        'SC': 'Простая кубическая',
        'BCC': 'ОЦК',
        'FCC': 'ГЦК',
        'HCP': 'Гексагональная'
    };

    document.getElementById("totalAtoms").textContent = atoms.length;
    document.getElementById("atomsCount").textContent = atoms.length;
    document.getElementById("latticeTypeInfo").textContent = structureNames[structure] || structure;

    if (atom) {
        document.getElementById("latticeParameter").textContent = `${atom.a} Å`;
        const physics = calculateLatticePhysics(structure, atom.a);
        updatePhysicsInfo(physics, atom.a);
    }
}

// Расчет физических параметров решетки
function calculateLatticePhysics(structure, a_angstrom) {
    const a = a_angstrom * 1e-10;

    const factors = {
        nnDistance: 0,
        packingFactor: 0,
        collisionStructureFactor: 0,
        diffusionStructureFactor: 0,
        thermalConductivityFactor: 0
    };

    switch(structure) {
        case 'SC':
            factors.nnDistance = a;
            factors.packingFactor = 0.52;
            factors.collisionStructureFactor = 1.0;
            factors.diffusionStructureFactor = 1.0;
            factors.thermalConductivityFactor = 1.0;
            break;
        case 'BCC':
            factors.nnDistance = Math.sqrt(3.0) / 2.0 * a;
            factors.packingFactor = 0.68;
            factors.collisionStructureFactor = 1.08;
            factors.diffusionStructureFactor = 0.9;
            factors.thermalConductivityFactor = 1.2;
            break;
        case 'FCC':
            factors.nnDistance = Math.sqrt(2.0) / 2.0 * a;
            factors.packingFactor = 0.74;
            factors.collisionStructureFactor = 1.15;
            factors.diffusionStructureFactor = 0.75;
            factors.thermalConductivityFactor = 1.35;
            break;
        case 'HCP':
            factors.nnDistance = a;
            factors.packingFactor = 0.74;
            factors.collisionStructureFactor = 1.18;
            factors.diffusionStructureFactor = 0.7;
            factors.thermalConductivityFactor = 1.4;
            break;
    }

    return factors;
}

function updatePhysicsInfo(physics, a_angstrom) {
    const physicsHTML = `
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-light">
                        <h6 class="mb-0"><i class="fas fa-ruler me-2"></i>Геометрические параметры</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6">
                                <small class="text-muted">Расстояние до ближайшего соседа:</small>
                                <div class="fw-bold">${(physics.nnDistance * 1e10).toFixed(3)} Å</div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Фактор упаковки:</small>
                                <div class="fw-bold">${physics.packingFactor}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-light">
                        <h6 class="mb-0"><i class="fas fa-atom me-2"></i>Структурные факторы</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6">
                                <small class="text-muted">Столкновений:</small>
                                <div class="fw-bold">${physics.collisionStructureFactor}</div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Диффузии:</small>
                                <div class="fw-bold">${physics.diffusionStructureFactor}</div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Теплопроводности:</small>
                                <div class="fw-bold">${physics.thermalConductivityFactor}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    let physicsSection = document.getElementById('physicsInfo');
    if (!physicsSection) {
        physicsSection = document.createElement('div');
        physicsSection.id = 'physicsInfo';
        document.querySelector('.result-card .card-body').insertBefore(physicsSection, document.querySelector('.result-card .mt-4.text-center'));
    }
    physicsSection.innerHTML = physicsHTML;
}

function resetCalculationState(button, buttonText, spinner, progressBar) {
    calculationInProgress = false;
    buttonText.textContent = "Сгенерировать решётку";
    spinner.style.display = "none";
    button.disabled = false;

    if (progressBar) {
        setTimeout(() => {
            progressBar.style.display = 'none';
        }, 1000);
    }
}

function showFieldError(fieldId, message) {
    const errorEl = document.getElementById(`error-${fieldId}`);
    const inputEl = document.getElementById(fieldId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = "block";
    }
    if (inputEl) {
        inputEl.classList.add("is-invalid");
    }
}

function showError(message) {
    const alertBox = document.getElementById("alertBox");
    if (alertBox) {
        alertBox.className = "alert alert-custom alert-danger";
        alertBox.innerText = message;
        alertBox.classList.remove("d-none");
    }
}

function showToast(message) {
    if (typeof showMessage === 'function') {
        showMessage(message, 'success');
    } else {
        const toast = document.createElement("div");
        toast.className = "toast align-items-center text-white bg-success border-0 position-fixed bottom-0 end-0 m-3";
        toast.setAttribute("role", "alert");
        toast.setAttribute("aria-live", "assertive");
        toast.setAttribute("aria-atomic", "true");

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-check-circle me-2"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

        document.body.appendChild(toast);
        const toastInstance = new bootstrap.Toast(toast, {delay: 3000});
        toastInstance.show();

        toast.addEventListener('hidden.bs.toast', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }
}

// Вспомогательные функции
function formatScientific(number) {
    if (!number || isNaN(number)) return '0';
    if (Math.abs(number) < 0.001 || Math.abs(number) > 1000) {
        return Number(number).toExponential(3);
    }
    return Number(number).toPrecision(6);
}

function getStructureName(structureCode) {
    const structureNames = {
        'SC': 'Простая кубическая',
        'BCC': 'Объемно-центрированная кубическая',
        'FCC': 'Гранецентрированная кубическая',
        'HCP': 'Гексагональная плотноупакованная'
    };
    return structureNames[structureCode] || structureCode;
}

// Функции для работы с результатами
function exportToJSON() {
    if (currentAtoms.length === 0) {
        showToast('Нет данных для экспорта');
        return;
    }

    const dataStr = JSON.stringify(currentAtoms, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `lattice_${Date.now()}.json`;
    link.click();

    showToast('Данные экспортированы в JSON');
}

function copyToClipboard() {
    if (currentAtoms.length === 0) {
        showToast('Нет данных для копирования');
        return;
    }

    const text = JSON.stringify(currentAtoms, null, 2);
    navigator.clipboard.writeText(text).then(() => {
        showToast('Данные скопированы в буфер обмена');
    }).catch(() => {
        showToast('Ошибка при копировании данных');
    });
}

// Глобальные функции
window.showAuthModal = function(tab = 'login') {
    const authModalElement = document.getElementById('authModal');
    if (!authModalElement) return;

    const authModal = new bootstrap.Modal(authModalElement);

    if (tab === 'register') {
        const registerTab = document.querySelector('[data-bs-target="#register"]');
        if (registerTab) {
            const tabInstance = new bootstrap.Tab(registerTab);
            tabInstance.show();
        }
    }

    authModal.show();
};

// Callback для успешной авторизации
if (typeof window !== 'undefined') {
    window.authSuccessCallback = function() {
        initializeAuth();
        loadAtomsFromDatabase();
        loadConfigurationsFromDatabase();
    };
}

// Сделаем функции глобальными
window.loadAtomsFromDatabase = loadAtomsFromDatabase;
window.loadConfigurationsFromDatabase = loadConfigurationsFromDatabase;