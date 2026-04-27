// charts.export.js — экспорт графиков в PNG и Word
// Требует: js/docx.iife.js подключён в HTML ДО этого скрипта (кладёт window.docx)

// ── helpers ───────────────────────────────────────────────────────────────────

function getDocx() {
    if (!window.docx) throw new Error('docx library not loaded. Add <script src="js/docx.iife.js"> to HTML');
    return window.docx;
}

function downloadBuffer(blob, filename) {
    // blob уже является Blob от Packer.toBlob() — не оборачиваем повторно
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function canvasToBase64(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const tmp = document.createElement('canvas');
    tmp.width = canvas.width; tmp.height = canvas.height;
    const ctx = tmp.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tmp.width, tmp.height);
    ctx.drawImage(canvas, 0, 0);
    return tmp.toDataURL('image/png').split(',')[1];
}

async function plotlyToBase64(divId) {
    const el = document.getElementById(divId);
    if (!el || typeof Plotly === 'undefined') return null;
    try {
        const url = await Plotly.toImage(el, { format: 'png', width: 1200, height: 700, scale: 1.5 });
        return url.split(',')[1];
    } catch (e) {
        console.error('[Export] plotlyToBase64:', e);
        return null;
    }
}

function b64ToBytes(b64) {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

// ── PNG export ─────────────────────────────────────────────────────────────────

export function saveChartPNG(canvasId, filename = 'chart') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const tmp = document.createElement('canvas');
    tmp.width = canvas.width; tmp.height = canvas.height;
    const ctx = tmp.getContext('2d');
    ctx.fillStyle = '#0f1729';
    ctx.fillRect(0, 0, tmp.width, tmp.height);
    ctx.drawImage(canvas, 0, 0);
    const a = document.createElement('a');
    a.download = `${filename}.png`;
    a.href = tmp.toDataURL('image/png');
    a.click();
}

export async function savePlotlyPNG(divId, filename = 'chart3d') {
    const el = document.getElementById(divId);
    if (!el) return;
    try {
        const url = await Plotly.toImage(el, { format: 'png', width: 1200, height: 700, scale: 2 });
        const a = document.createElement('a');
        a.download = `${filename}.png`; a.href = url; a.click();
    } catch (e) {
        console.error('[Export] Plotly PNG:', e);
        alert('Не удалось сохранить 3D-график');
    }
}

// ── Word builders ──────────────────────────────────────────────────────────────

function makeHeader(docx, subtitle = '') {
    const { Paragraph, TextRun, BorderStyle } = docx;
    return new Paragraph({
        children: [
            new TextRun({ text: 'PlasmaLab', bold: true, size: 28, color: '5eead4', font: 'Arial' }),
            ...(subtitle ? [new TextRun({ text: `  |  ${subtitle}`, size: 22, color: '94a3b8', font: 'Arial' })] : []),
        ],
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '5eead4', space: 1 } },
        spacing: { after: 280 },
    });
}

function makeFooter(docx) {
    const { Paragraph, TextRun, BorderStyle, AlignmentType } = docx;
    return new Paragraph({
        children: [new TextRun({ text: `Экспортировано: ${new Date().toLocaleString('ru-RU')}`, size: 18, color: '94a3b8', font: 'Arial' })],
        alignment: AlignmentType.RIGHT,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'e2e8f0', space: 1 } },
        spacing: { before: 240 },
    });
}

function makeImage(docx, bytes, width = 580, height = 360) {
    const { Paragraph, ImageRun, AlignmentType } = docx;
    return new Paragraph({
        children: [new ImageRun({ data: bytes, transformation: { width, height }, type: 'png' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
    });
}

// ── Single chart → Word ────────────────────────────────────────────────────────

export async function exportChartToWord(canvasId, chartTitle, formula) {
    const docx = getDocx();
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } = docx;

    const b64 = canvasToBase64(canvasId);
    if (!b64) { alert('Не удалось получить изображение графика'); return; }

    const doc = new Document({
        styles: { default: { document: { run: { font: 'Arial', size: 24 } } } },
        sections: [{
            properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
            children: [
                makeHeader(docx, 'Анализ плазменных симуляций'),
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [new TextRun({ text: chartTitle, font: 'Arial', size: 30, bold: true })],
                    spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                    children: [new TextRun({ text: `Формула: ${formula}`, italics: true, color: '64748b', font: 'Arial', size: 20 })],
                    spacing: { after: 300 },
                }),
                makeImage(docx, b64ToBytes(b64)),
                makeFooter(docx),
            ],
        }],
    });

    const buf = await Packer.toBlob(doc);
    downloadBuffer(buf, `plasmalab_${canvasId}.docx`);
}

// ── 3D chart → Word ────────────────────────────────────────────────────────────

export async function export3DChartToWord(divId, chartTitle) {
    const docx = getDocx();
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;

    const b64 = await plotlyToBase64(divId);
    if (!b64) { alert('Не удалось получить изображение 3D-графика'); return; }

    const doc = new Document({
        styles: { default: { document: { run: { font: 'Arial', size: 24 } } } },
        sections: [{
            properties: { page: { size: { width: 15840, height: 12240 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
            children: [
                makeHeader(docx, '3D визуализация'),
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [new TextRun({ text: chartTitle, font: 'Arial', size: 28, bold: true })],
                    spacing: { before: 180, after: 280 },
                }),
                makeImage(docx, b64ToBytes(b64), 840, 490),
                makeFooter(docx),
            ],
        }],
    });

    const buf = await Packer.toBlob(doc);
    downloadBuffer(buf, `plasmalab_3d_${Date.now()}.docx`);
}

// ── All charts → one Word report ───────────────────────────────────────────────

export async function exportAllChartsToWord() {
    const btn = document.getElementById('exportAllWordBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Генерация...'; }

    try {
        const docx = getDocx();
        const { Document, Packer, Paragraph, TextRun, ImageRun,
            AlignmentType, HeadingLevel, BorderStyle, PageBreak } = docx;

        const children = [];

        // Титульная страница
        children.push(
            new Paragraph({ spacing: { before: 3200 } }),
            new Paragraph({
                children: [new TextRun({ text: 'PlasmaLab', font: 'Arial', size: 80, bold: true, color: '5eead4' })],
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                children: [new TextRun({ text: 'Отчёт по физическим зависимостям', font: 'Arial', size: 36, color: '64748b' })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
            }),
            new Paragraph({
                children: [new TextRun({ text: new Date().toLocaleString('ru-RU'), font: 'Arial', size: 24, color: '94a3b8' })],
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ children: [new PageBreak()] }),
        );

        // Графики по категориям
        const categories = [...new Set(CHART_META.map(c => c.cat))];
        for (const cat of categories) {
            children.push(
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [new TextRun({ text: cat, font: 'Arial', size: 34, bold: true })],
                    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '5eead4', space: 1 } },
                    spacing: { before: 480, after: 240 },
                }),
            );

            for (const chart of CHART_META.filter(c => c.cat === cat)) {
                const b64 = canvasToBase64(chart.id);
                if (!b64) continue;

                children.push(
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: chart.title, font: 'Arial', size: 26, bold: true })],
                        spacing: { before: 320, after: 80 },
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: `Формула: ${chart.formula}`, italics: true, color: '64748b', font: 'Arial', size: 20 })],
                        spacing: { after: 180 },
                    }),
                    makeImage(docx, b64ToBytes(b64), 540, 330),
                );
            }
        }

        // 3D-график
        const b64_3d = await plotlyToBase64('chart3d');
        if (b64_3d) {
            children.push(
                new Paragraph({ children: [new PageBreak()] }),
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [new TextRun({ text: '3D зависимости', font: 'Arial', size: 34, bold: true })],
                    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '5eead4', space: 1 } },
                    spacing: { before: 240, after: 240 },
                }),
                makeImage(docx, b64ToBytes(b64_3d), 600, 370),
            );
        }

        // Финальный колонтитул
        children.push(makeFooter(docx));

        const doc = new Document({
            styles: { default: { document: { run: { font: 'Arial', size: 24 } } } },
            sections: [{
                properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
                children,
            }],
        });

        const buf = await Packer.toBlob(doc);
        downloadBuffer(buf, `plasmalab_report_${Date.now()}.docx`);
    } catch (e) {
        console.error('[Export] exportAll error:', e);
        alert('Ошибка генерации отчёта: ' + e.message);
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '📄 Скачать всё (Word)'; }
    }
}

// ── Мета-данные графиков ───────────────────────────────────────────────────────

export const CHART_META = [
    { id: 'chart1',  title: '1. Плотность электронов от давления',     cat: 'Параметры плазмы', formula: 'n_e ~ P' },
    { id: 'chart2',  title: '2. Скорость электронов от напряжения',     cat: 'Параметры плазмы', formula: 'v_e ~ √V' },
    { id: 'chart3',  title: '3. Плотность тока от напряжения (ВАХ)',    cat: 'Параметры плазмы', formula: 'I-V curve' },
    { id: 'chart4',  title: '4. Энергия ионов от напряжения',           cat: 'Параметры плазмы', formula: 'E = q·V' },
    { id: 'chart5',  title: '5. Температура электронов от напряжения',  cat: 'Параметры плазмы', formula: 'T_e ~ E_field' },
    { id: 'chart6',  title: '6. Средняя T от переданной энергии',       cat: 'Температура',      formula: 'Thermalization' },
    { id: 'chart7',  title: '7. Средняя T от напряжения',               cat: 'Температура',      formula: 'T ~ V²' },
    { id: 'chart8',  title: '8. Диапазон температур (Min/Avg/Max)',      cat: 'Температура',      formula: 'Min/Avg/Max' },
    { id: 'chart9',  title: '9. Средняя T от давления',                 cat: 'Температура',      formula: 'T ~ P' },
    { id: 'chart10', title: '10. Средняя T от плотности тока',          cat: 'Температура',      formula: 'T ~ j' },
    { id: 'chart11', title: '11. Полная энергия от напряжения',         cat: 'Энергия',          formula: 'E ~ V' },
    { id: 'chart12', title: '12. Энергия на атом от напряжения',        cat: 'Энергия',          formula: 'E/N ~ V' },
    { id: 'chart13', title: '13. Распределение энергии',                cat: 'Энергия',          formula: 'Histogram' },
    { id: 'chart14', title: '14. Энергия от температуры',               cat: 'Энергия',          formula: 'E ~ kT' },
    { id: 'chart15', title: '15. Энергия от давления',                  cat: 'Энергия',          formula: 'E ~ P' },
    { id: 'chart16', title: '16. Объёмная диффузия от T (Arrhenius)',   cat: 'Диффузия',         formula: 'Arrhenius' },
    { id: 'chart17', title: '17. Граничная диффузия от T',              cat: 'Диффузия',         formula: 'D=D₀exp(-Q/RT)' },
    { id: 'chart18', title: '18. Сравнение коэффициентов D₁/D₂',       cat: 'Диффузия',         formula: 'Comparison' },
    { id: 'chart19', title: '19. Диффузия от напряжения',               cat: 'Диффузия',         formula: 'D ~ T ~ V' },
    { id: 'chart20', title: '20. D₁ vs D₂ после SLR',                  cat: 'Диффузия',         formula: 'Корреляция D₁ и D₂' },
    { id: 'chart21', title: '21. Повреждения от энергии',               cat: 'Повреждения',      formula: 'E_damage ~ E' },
    { id: 'chart22', title: '22. Импульс от энергии',                   cat: 'Повреждения',      formula: 'Momentum' },
    { id: 'chart23', title: '23. Смещение от импульса',                 cat: 'Повреждения',      formula: 'p = mΔv' },
    { id: 'chart24', title: '24. Повреждения от температуры',           cat: 'Повреждения',      formula: 'Thermal damage' },
];

// ── Кнопки на графики ─────────────────────────────────────────────────────────

export function initExportButtons() {
    CHART_META.forEach(({ id, title, formula }) => {
        const canvas = document.getElementById(id);
        if (!canvas) return;
        const box = canvas.closest('.chart-box');
        if (!box || box.querySelector('.export-bar')) return;

        const bar = document.createElement('div');
        bar.className = 'export-bar';
        bar.innerHTML = `
            <button class="export-btn export-btn--png"  title="Сохранить PNG"><i class="fas fa-image"></i> PNG</button>
            <button class="export-btn export-btn--word" title="Экспорт в Word"><i class="fas fa-file-word"></i> Word</button>`;

        bar.querySelector('.export-btn--png') .addEventListener('click', () => saveChartPNG(id, `plasmalab_${id}`));
        bar.querySelector('.export-btn--word').addEventListener('click', () => exportChartToWord(id, title, formula));
        box.appendChild(bar);
    });

    // 3D-блок
    const box3d = document.getElementById('chart3d')?.closest('.chart-box');
    if (box3d && !box3d.querySelector('.export-bar')) {
        const bar = document.createElement('div');
        bar.className = 'export-bar';
        bar.innerHTML = `
            <button class="export-btn export-btn--png"  title="PNG"><i class="fas fa-image"></i> PNG</button>
            <button class="export-btn export-btn--word" title="Word"><i class="fas fa-file-word"></i> Word</button>`;

        bar.querySelector('.export-btn--png') .addEventListener('click', () => savePlotlyPNG('chart3d', 'plasmalab_3d'));
        bar.querySelector('.export-btn--word').addEventListener('click', () => {
            const sel = document.getElementById('chart3dMode');
            export3DChartToWord('chart3d', sel?.options[sel.selectedIndex]?.text || '3D зависимость');
        });
        box3d.appendChild(bar);
    }

    document.getElementById('exportAllWordBtn')?.addEventListener('click', exportAllChartsToWord);
}