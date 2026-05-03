// charts.export.js — экспорт графиков в PNG/Word (Plotly 3D)
// Требует: js/docx.iife.js (window.docx) подключён ДО этого модуля.

import { allResults, loadAll } from './charts.data.js';

// Размеры для docx ImageRun (в px-единицах docx, не DXA)
// A4 landscape контентная ширина ~1122px при 96dpi минус поля
const DOCX_IMG_W = 950;
const DOCX_IMG_H = Math.round(DOCX_IMG_W * 1100 / 1800); // соотношение 1800:1100

// ── utils ──────────────────────────────────────────────────────────────────────

function getDocx() {
    if (!window.docx) throw new Error('docx library not loaded: add js/docx.iife.js');
    return window.docx;
}

function downloadBuffer(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function b64ToBytes(b64) {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

// Рендерим Plotly-div в base64 PNG
async function plotlyToBase64(divId, width = 1800, height = 1100) {
    const el = document.getElementById(divId);
    if (!el || typeof Plotly === 'undefined') return null;
    try {
        const url = await Plotly.toImage(el, {
            format: 'png',
            width,
            height,
            scale: 2
        });
        return url.split(',')[1];
    } catch (e) {
        console.error('[Export] plotlyToBase64:', e);
        return null;
    }
}

// ── math helpers ───────────────────────────────────────────────────────────────

function getSlope(data, keyX, keyY) {
    const pts = data
        .filter(d => isFinite(d[keyX]) && isFinite(d[keyY]))
        .sort((a, b) => a[keyX] - b[keyX]);
    if (pts.length < 3) return 0;
    const n = pts.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    pts.forEach(p => {
        sumX += p[keyX]; sumY += p[keyY];
        sumXY += p[keyX] * p[keyY];
        sumX2 += p[keyX] * p[keyX];
    });
    return (n * sumXY - sumX * sumY) / ((n * sumX2 - sumX * sumX) || 1);
}

function getArrows(rows, cfg) {
    return {
        x: '→',
        y: getSlope(rows, cfg.xKey, cfg.yKey) >= 0 ? '↑' : '↓',
        z: getSlope(rows, cfg.xKey, cfg.zKey) >= 0 ? '↗' : '↘',
    };
}

function prepareSurfaceData(rows, xKey, yKey, zKey) {
    const valid = rows.filter(r =>
        isFinite(r[xKey]) && isFinite(r[yKey]) && isFinite(r[zKey])
    );
    if (!valid.length) return null;

    const downsample = (arr, max) => {
        if (arr.length <= max) return arr;
        const out = [];
        const step = (arr.length - 1) / (max - 1);
        for (let i = 0; i < max; i++) out.push(arr[Math.round(i * step)]);
        return [...new Set(out)].sort((a, b) => a - b);
    };

    const xVals = downsample([...new Set(valid.map(r => r[xKey]))].sort((a, b) => a - b), 20);
    const yVals = downsample([...new Set(valid.map(r => r[yKey]))].sort((a, b) => a - b), 20);

    const zGrid = yVals.map(y =>
        xVals.map(x => {
            const pt = valid.find(p => p[xKey] === x && p[yKey] === y);
            return pt ? pt[zKey] : null;
        })
    );

    // интерполяция null
    for (let i = 0; i < zGrid.length; i++) {
        for (let j = 0; j < zGrid[i].length; j++) {
            if (zGrid[i][j] !== null) continue;
            const nb = [];
            if (i > 0 && zGrid[i-1][j] !== null) nb.push(zGrid[i-1][j]);
            if (i < zGrid.length-1 && zGrid[i+1][j] !== null) nb.push(zGrid[i+1][j]);
            if (j > 0 && zGrid[i][j-1] !== null) nb.push(zGrid[i][j-1]);
            if (j < zGrid[i].length-1 && zGrid[i][j+1] !== null) nb.push(zGrid[i][j+1]);
            zGrid[i][j] = nb.length ? nb.reduce((a, b) => a + b, 0) / nb.length : 0;
        }
    }

    return { x: xVals, y: yVals, z: zGrid };
}

// ── Layout для экспорта ────────────────────────────────────────────────────────
// ВАЖНО: для PNG-экспорта НЕ используем domain смещение и colorbar.x —
// Plotly сам разместит правильно без пустого места слева.
function getExportLayout(xTitle, yTitle, zTitle, arrows, chartTitle = '') {
    return {
        paper_bgcolor: '#0f1729',
        plot_bgcolor: '#0f1729',
        // Отступы: слева больше чтобы подписи осей не обрезались
        margin: { l: 80, r: 160, b: 80, t: chartTitle ? 60 : 20 },
        title: chartTitle ? {
            text: chartTitle,
            font: { color: '#f8fafc', size: 22, family: 'Arial' }
        } : undefined,
        scene: {
            aspectmode: 'cube',
            // НЕТ domain — Plotly сам займёт всё пространство
            xaxis: {
                title: { text: `${xTitle} ${arrows.x}`, font: { size: 13, color: '#cbd5e1', family: 'Arial' } },
                color: '#94a3b8',
                gridcolor: '#2a3650',
                linecolor: '#5eead4',
                linewidth: 2,
                showline: true,
                tickfont: { color: '#94a3b8', size: 10 }
            },
            yaxis: {
                title: { text: `${arrows.y} ${yTitle}`, font: { size: 13, color: '#cbd5e1', family: 'Arial' } },
                color: '#94a3b8',
                gridcolor: '#2a3650',
                linecolor: '#5eead4',
                linewidth: 2,
                showline: true,
                tickfont: { color: '#94a3b8', size: 10 }
            },
            zaxis: {
                title: { text: `${zTitle} ${arrows.z}`, font: { size: 13, color: '#cbd5e1', family: 'Arial' } },
                color: '#94a3b8',
                gridcolor: '#2a3650',
                linecolor: '#5eead4',
                linewidth: 2,
                showline: true,
                tickfont: { color: '#94a3b8', size: 10 }
            },
            bgcolor: 'rgba(0,0,0,0)',
            camera: { eye: { x: 1.7, y: 1.7, z: 1.3 } }
        },
        autosize: true,
        showlegend: false,
    };
}

// Colorbar БЕЗ смещения — для экспорта PNG
function makeExportColorbar(zTitle) {
    return {
        title: {
            text: zTitle,
            font: { color: '#cbd5e1', size: 11, family: 'Arial' },
            side: 'right'
        },
        tickfont: { color: '#94a3b8', size: 10, family: 'Arial' },
        // НЕТ x/xpad — Plotly сам прижмёт к правому краю сцены
        len: 0.75,
        thickness: 16,
        bgcolor: 'rgba(0,0,0,0)',
        outlinecolor: '#2a3650',
        outlinewidth: 1,
    };
}

// ── скрытый div для рендера ────────────────────────────────────────────────────
function ensureExportDiv() {
    let div = document.getElementById('exportRenderDiv');
    if (div) return div;
    div = document.createElement('div');
    div.id = 'exportRenderDiv';
    div.style.cssText = `
        position: fixed;
        left: -99999px;
        top: 0;
        width: 1400px;
        height: 900px;
        visibility: hidden;
        pointer-events: none;
    `;
    document.body.appendChild(div);
    return div;
}

// ── PNG export (для кнопки в модалке) ─────────────────────────────────────────
export async function savePlotlyPNG(divId, filename = 'chart3d') {
    const el = document.getElementById(divId);
    if (!el) return;
    try {
        const url = await Plotly.toImage(el, {
            format: 'png', width: 1920, height: 1080, scale: 2
        });
        const a = document.createElement('a');
        a.download = `${filename}.png`;
        a.href = url;
        a.click();
    } catch (e) {
        console.error('[Export] Plotly PNG:', e);
        alert('Не удалось сохранить PNG');
    }
}

// ── Word: одиночный график из модалки ─────────────────────────────────────────
// Здесь мы рендерим заново в скрытый div с правильным layout (без domain)
export async function export3DChartToWord(config, chartTitle, formula = '', modeText = '') {
    const docx = getDocx();
    const { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, BorderStyle } = docx;

    const exportDiv = ensureExportDiv();
    const arrows = getArrows(allResults, config);

    let b64 = null;

    if (modeText === 'Поверхность') {
        const surfaceData = prepareSurfaceData(allResults, config.xKey, config.yKey, config.zKey);
        if (!surfaceData) { alert('Недостаточно данных для построения поверхности'); return; }

        const trace = {
            type: 'surface',
            x: surfaceData.x,
            y: surfaceData.y,
            z: surfaceData.z,
            colorscale: 'Viridis',
            showscale: true,
            colorbar: makeExportColorbar(config.zLabel || config.zKey),
            contours: { z: { show: true, usecolormap: true, project: { z: true } } },
            lighting: { ambient: 0.8, diffuse: 0.9 }
        };

        const layout = getExportLayout(
            config.xLabel || config.xKey,
            config.yLabel || config.yKey,
            config.zLabel || config.zKey,
            arrows
        );

        await Plotly.react(exportDiv.id, [trace], layout, { responsive: false });
        b64 = await plotlyToBase64(exportDiv.id, 2400, 1500);

    } else {
        // Scatter
        const valid = allResults.filter(r =>
            isFinite(r[config.xKey]) && isFinite(r[config.yKey]) && isFinite(r[config.zKey])
        );
        if (!valid.length) { alert('Нет данных'); return; }

        const trace = {
            type: 'scatter3d',
            mode: 'markers',
            x: valid.map(r => r[config.xKey]),
            y: valid.map(r => r[config.yKey]),
            z: valid.map(r => r[config.zKey]),
            marker: {
                size: 4,
                color: valid.map(r => r[config.zKey]),
                colorscale: 'Viridis',
                opacity: 0.85,
                showscale: true,
                colorbar: makeExportColorbar(config.zLabel || config.zKey)
            }
        };

        const layout = getExportLayout(
            config.xLabel || config.xKey,
            config.yLabel || config.yKey,
            config.zLabel || config.zKey,
            arrows
        );

        await Plotly.react(exportDiv.id, [trace], layout, { responsive: false });
        b64 = await plotlyToBase64(exportDiv.id, 2400, 1500);
    }

    if (!b64) { alert('Не удалось получить изображение'); return; }

    // Размеры под A4 landscape: контент ~1585 x ~1120 pt (при 360 margin)
    // docx transformation в EMU-подобных единицах = просто px для docx
    const IMG_W = 1100; // px в docx
    const IMG_H = Math.round(IMG_W * 1500 / 2400); // = IMG_W * 5/8

    const doc = new Document({
        styles: { default: { document: { run: { font: 'Arial', size: 22 } } } },
        sections: [{
            properties: {
                page: {
                    size: { width: 16838, height: 11906 }, // A4 landscape
                    margin: { top: 500, right: 500, bottom: 500, left: 500 },
                }
            },
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'PlasmaLab  |  3D визуализация  |  ',
                            bold: true, size: 20, color: '5eead4', font: 'Arial'
                        }),
                        new TextRun({
                            text: chartTitle || 'График',
                            size: 20, color: '1e3a5f', font: 'Arial', bold: true
                        }),
                    ],
                    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '5eead4', space: 1 } },
                    spacing: { after: 160 },
                }),

                formula ? new Paragraph({
                    children: [new TextRun({
                        text: `Формула: ${formula}`,
                        italics: true, color: '475569', font: 'Arial', size: 18
                    })],
                    spacing: { after: 100 },
                }) : null,

                modeText ? new Paragraph({
                    children: [new TextRun({
                        text: `Режим: ${modeText}`,
                        color: '64748b', font: 'Arial', size: 18
                    })],
                    spacing: { after: 200 },
                }) : null,

                new Paragraph({
                    children: [new ImageRun({
                        data: b64ToBytes(b64),
                        transformation: { width: IMG_W, height: IMG_H },
                        type: 'png'
                    })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 100 },
                }),

                new Paragraph({
                    children: [new TextRun({
                        text: `Экспортировано: ${new Date().toLocaleString('ru-RU')}`,
                        size: 16, color: '94a3b8', font: 'Arial'
                    })],
                    alignment: AlignmentType.RIGHT,
                }),
            ].filter(Boolean)
        }]
    });

    const buf = await Packer.toBlob(doc);
    downloadBuffer(buf, `plasmalab_3d_${Date.now()}.docx`);
}

// ── Word: все 28 графиков ──────────────────────────────────────────────────────
export async function exportAllChartsToWord() {
    const btn = document.getElementById('exportAllWordBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Генерация...'; }

    try {
        if (!allResults?.length) {
            await loadAll(window.PlasmaAuth?.getToken());
        }
        if (!allResults?.length) throw new Error('Нет данных allResults');

        const docx = getDocx();
        const {
            Document, Packer, Paragraph, TextRun, ImageRun,
            AlignmentType, HeadingLevel, BorderStyle, PageBreak
        } = docx;

        const exportDiv = ensureExportDiv();

        const CONFIGS = {
            1:  { xKey:'pressure',              yKey:'electronDensity',         zKey:'voltage',                 xLabel:'Давление (Па)',                        yLabel:'Плотность электронов (м⁻³)',          zLabel:'Напряжение (В)' },
            2:  { xKey:'voltage',               yKey:'electronVelocity',        zKey:'currentDensity',          xLabel:'Напряжение (В)',                       yLabel:'Скорость электронов (м/с)',           zLabel:'Плотность тока (А/м²)' },
            3:  { xKey:'voltage',               yKey:'currentDensity',          zKey:'ionEnergy',               xLabel:'Напряжение (В)',                       yLabel:'Плотность тока (А/м²)',               zLabel:'Энергия ионов (Дж)' },
            4:  { xKey:'voltage',               yKey:'electronTemperature',     zKey:'currentDensity',          xLabel:'Напряжение (В)',                       yLabel:'Температура электронов (K)',          zLabel:'Плотность тока (А/м²)' },
            5:  { xKey:'totalTransferredEnergy',yKey:'depths',                  zKey:'avgT',                    xLabel:'Общая переданная энергия (Дж)',        yLabel:'Глубина слоя (м)',                    zLabel:'Средняя температура (K)' },
            6:  { xKey:'voltage',               yKey:'depths',                  zKey:'avgT',                    xLabel:'Напряжение (В)',                       yLabel:'Глубина слоя (м)',                    zLabel:'Средняя температура (K)' },
            7:  { xKey:'pressure',              yKey:'depths',                  zKey:'avgT',                    xLabel:'Давление (Па)',                        yLabel:'Глубина слоя (м)',                    zLabel:'Средняя температура (K)' },
            8:  { xKey:'currentDensity',        yKey:'depths',                  zKey:'avgT',                    xLabel:'Плотность тока (А/м²)',               yLabel:'Глубина слоя (м)',                    zLabel:'Средняя температура (K)' },
            9:  { xKey:'voltage',               yKey:'currentDensity',          zKey:'totalTransferredEnergy',  xLabel:'Напряжение (В)',                       yLabel:'Плотность тока (А/м²)',               zLabel:'Полная энергия (Дж)' },
            10: { xKey:'voltage',               yKey:'avgTransferredPerAtom',   zKey:'concentration',           xLabel:'Напряжение (В)',                       yLabel:'Ср. переданная энергия на атом (эВ)',  zLabel:'Концентрация (м⁻³)' },
            11: { xKey:'voltage',               yKey:'ionEnergy',               zKey:'concentration',           xLabel:'Напряжение (В)',                       yLabel:'Энергия иона (эВ)',                   zLabel:'Концентрация (м⁻³)' },
            12: { xKey:'diffusionCoefficient1', yKey:'totalTransferredEnergy',  zKey:'avgT',                    xLabel:'D₁ (м²/с)',                            yLabel:'Полная переданная энергия (эВ)',      zLabel:'Средняя температура (K)' },
            13: { xKey:'totalTransferredEnergy',yKey:'totalDamage',             zKey:'avgT',                    xLabel:'Переданная энергия (эВ)',              yLabel:'Суммарные повреждения (дефекты/м²)', zLabel:'Средняя температура (K)' },
            14: { xKey:'totalTransferredEnergy',yKey:'voltage',                 zKey:'avgT',                    xLabel:'Полная переданная энергия (эВ)',       yLabel:'Напряжение (В)',                      zLabel:'Средняя температура (K)' },
            15: { xKey:'pressure',              yKey:'totalTransferredEnergy',  zKey:'avgT',                    xLabel:'Давление (Па)',                        yLabel:'Полная переданная энергия (эВ)',      zLabel:'Средняя температура (K)' },
            16: { xKey:'diffusionCoefficient1', yKey:'voltage',                 zKey:'avgT',                    xLabel:'D₁ (м²/с)',                            yLabel:'Напряжение (В)',                      zLabel:'Средняя температура (K)' },
            17: { xKey:'diffusionCoefficient2', yKey:'voltage',                 zKey:'avgT',                    xLabel:'D₂ (м²/с)',                            yLabel:'Напряжение (В)',                      zLabel:'Средняя температура (K)' },
            18: { xKey:'diffusionCoefficient1', yKey:'diffusionCoefficient2',   zKey:'avgT',                    xLabel:'D₁ (м²/с)',                            yLabel:'D₂ (м²/с)',                           zLabel:'Средняя температура (K)' },
            19: { xKey:'voltage',               yKey:'diffusionCoefficient1',   zKey:'avgT',                    xLabel:'Напряжение (В)',                       yLabel:'Диффузия D (м²/с)',                   zLabel:'Средняя температура (K)' },
            20: { xKey:'diffusionCoefficient1', yKey:'diffusionCoefficient2',   zKey:'avgT',                    xLabel:'D₁ (м²/с)',                            yLabel:'D₂ (м²/с)',                           zLabel:'Средняя температура (K)' },
            21: { xKey:'totalTransferredEnergy',yKey:'totalDamage',             zKey:'avgT',                    xLabel:'Переданная энергия (эВ)',              yLabel:'Суммарные повреждения (дефекты/м²)', zLabel:'Средняя температура (K)' },
            22: { xKey:'totalTransferredEnergy',yKey:'totalMomentum',           zKey:'totalDamage',             xLabel:'Переданная энергия (эВ)',              yLabel:'Суммарный импульс (кг·м/с)',          zLabel:'Суммарные повреждения (дефекты/м²)' },
            23: { xKey:'totalMomentum',         yKey:'totalDisplacement',       zKey:'totalDamage',             xLabel:'Суммарный импульс (кг·м/с)',           yLabel:'Суммарное смещение (м)',               zLabel:'Суммарные повреждения (дефекты/м²)' },
            24: { xKey:'totalDamage',           yKey:'voltage',                 zKey:'avgT',                    xLabel:'Суммарные повреждения (дефекты/м²)',  yLabel:'Напряжение (В)',                      zLabel:'Средняя температура (K)' },
            25: { xKey:'voltage',               yKey:'currentDensity',          zKey:'depths',                  xLabel:'Напряжение (В)',                       yLabel:'Плотность тока (А/м²)',               zLabel:'Глубина проникновения (м)' },
            26: { xKey:'voltage',               yKey:'currentDensity',          zKey:'ionEnergy',               xLabel:'Напряжение (В)',                       yLabel:'Плотность тока (А/м²)',               zLabel:'Энергия ионов (Дж)' },
            27: { xKey:'avgT',                  yKey:'pressure',                zKey:'concentration',           xLabel:'Средняя температура (K)',              yLabel:'Давление (Па)',                       zLabel:'Концентрация (м⁻³)' },
            28: { xKey:'avgT',                  yKey:'voltage',                 zKey:'totalDamage',             xLabel:'Средняя температура (K)',              yLabel:'Напряжение (В)',                      zLabel:'Суммарные повреждения (дефекты/м²)' },
        };

        const cards = [...document.querySelectorAll('.chart-card[data-chart]')]
            .map(el => ({
                num: Number(el.dataset.chart),
                title: el.dataset.title || `График ${el.dataset.chart}`,
                formula: el.dataset.formula || '',
            }))
            .filter(c => Number.isFinite(c.num))
            .sort((a, b) => a.num - b.num);

        const IMG_W = 930;
        const IMG_H = Math.round(IMG_W * 1100 / 1800);

        const children = [];

        // Титульник
        children.push(
            new Paragraph({ spacing: { before: 3200 } }),
            new Paragraph({
                children: [new TextRun({
                    text: 'PlasmaLab', font: 'Arial', size: 80, bold: true, color: '5eead4'
                })],
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                children: [new TextRun({
                    text: 'Отчёт по физическим зависимостям плазмы',
                    font: 'Arial', size: 36, color: '334155'
                })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
            }),
            new Paragraph({
                children: [new TextRun({
                    text: new Date().toLocaleString('ru-RU'),
                    font: 'Arial', size: 24, color: '94a3b8'
                })],
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ children: [new PageBreak()] }),
        );

        for (const c of cards) {
            const cfg = CONFIGS[c.num];
            if (!cfg) continue;

            const surfaceData = prepareSurfaceData(allResults, cfg.xKey, cfg.yKey, cfg.zKey);
            if (!surfaceData) continue;

            const arrows = getArrows(allResults, cfg);

            const trace = {
                type: 'surface',
                x: surfaceData.x,
                y: surfaceData.y,
                z: surfaceData.z,
                colorscale: 'Viridis',
                showscale: true,
                // КЛЮЧЕВОЕ: colorbar без x/xpad, без domain в layout
                colorbar: makeExportColorbar(cfg.zLabel),
                contours: { z: { show: true, usecolormap: true, project: { z: true } } },
                lighting: { ambient: 0.8, diffuse: 0.9 }
            };

            const layout = getExportLayout(cfg.xLabel, cfg.yLabel, cfg.zLabel, arrows);

            // рендерим в скрытый div
            await Plotly.react(exportDiv.id, [trace], layout, { responsive: false });

            // ждём завершения рендера
            await new Promise(resolve => setTimeout(resolve, 300));

            const b64 = await plotlyToBase64(exportDiv.id, 1800, 1100);
            if (!b64) continue;

            children.push(
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [new TextRun({
                        text: c.title, font: 'Arial', size: 28, bold: true, color: '0f172a'
                    })],
                    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '5eead4', space: 1 } },
                    spacing: { before: 480, after: 200 },
                }),
            );

            if (c.formula) {
                children.push(
                    new Paragraph({
                        children: [new TextRun({
                            text: `Формула: ${c.formula}`,
                            italics: true, color: '64748b', font: 'Arial', size: 18
                        })],
                        spacing: { after: 200 },
                    })
                );
            }

            children.push(
                new Paragraph({
                    children: [new ImageRun({
                        data: b64ToBytes(b64),
                        transformation: { width: IMG_W, height: IMG_H },
                        type: 'png',
                    })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 160 },
                }),
                new Paragraph({ children: [new PageBreak()] })
            );
        }

        const doc = new Document({
            styles: { default: { document: { run: { font: 'Arial', size: 22 } } } },
            sections: [{
                properties: {
                    page: {
                        size: { width: 12240, height: 15840 }, // A4 portrait для отчёта
                        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
                    }
                },
                children: children.filter(Boolean),
            }]
        });

        const buf = await Packer.toBlob(doc);
        downloadBuffer(buf, `plasmalab_report_${Date.now()}.docx`);

    } catch (e) {
        console.error('[ExportAll] error:', e);
        alert('Ошибка генерации отчёта: ' + (e?.message || e));
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '📄 Скачать всё (Word)'; }
    }
}

export function initExportButtons() {}