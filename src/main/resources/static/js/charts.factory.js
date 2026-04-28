// charts.factory.js — фабрика Chart.js графиков

import { axisConfig, basePlugins, histogram, COLORS } from './charts.config.js';

const pool = {};

function destroy(id) { if (pool[id]) { pool[id].destroy(); delete pool[id]; } }

function empty(id, title, xL, yL) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    destroy(id);
    pool[id] = new Chart(ctx, {
        type: 'scatter',
        data: { datasets: [{ data: [] }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { ...basePlugins(title), legend: { display: false } },
            scales: { x: axisConfig(xL), y: axisConfig(yL) },
        },
    });
}

export function scatter(id, data, xL, yL, title, color, logY = false) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    destroy(id);
    if (!data?.length) return empty(id, title, xL, yL);

    pool[id] = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: title,
                data: [...data].sort((a, b) => a.x - b.x),
                backgroundColor: color + '80', borderColor: color, borderWidth: 2.5,
                pointRadius: 5, pointHoverRadius: 8,
                pointHoverBackgroundColor: color, pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2,
                showLine: true, tension: 0.2, fill: false,
            }],
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                ...basePlugins(title, color),
                tooltip: {
                    ...basePlugins(title, color).tooltip,
                    callbacks: { label: c => `${xL}: ${c.parsed.x.toPrecision(3)}, ${yL}: ${c.parsed.y.toPrecision(3)}` },
                },
            },
            scales: { x: axisConfig(xL), y: { ...axisConfig(yL), type: logY ? 'logarithmic' : 'linear' } },
        },
    });
}

export function line(id, labels, datasets, xL, yL, title) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    destroy(id);
    pool[id] = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: datasets.map(ds => ({
                label: ds.label, data: ds.data,
                borderColor: ds.color, backgroundColor: ds.color + '20', borderWidth: 3,
                tension: 0.3, fill: false, pointRadius: 4, pointHoverRadius: 7,
                pointBackgroundColor: ds.color, pointBorderColor: '#fff', pointBorderWidth: 2,
            })),
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                ...basePlugins(title),
                legend: {
                    display: true,
                    labels: { color: '#e2e8f0', font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' },
                    position: 'top',
                },
            },
            scales: { x: axisConfig(xL), y: axisConfig(yL) },
        },
    });
}

export function bar(id, labels, data, xL, yL, title, color) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    destroy(id);
    pool[id] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: title, data,
                backgroundColor: color + '80', borderColor: color, borderWidth: 2,
                borderRadius: 4, barPercentage: 0.7, categoryPercentage: 0.8,
            }],
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { ...basePlugins(title), legend: { display: false } },
            scales: {
                x: { ...axisConfig(xL), grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 45 } },
                y: { ...axisConfig(yL), beginAtZero: true },
            },
        },
    });
}

export function doublebar(id, labels, d1, d2, xL, yL, title) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    destroy(id);
    pool[id] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'D₁', data: d1, backgroundColor: COLORS.diffusion1 + '80', borderColor: COLORS.diffusion1, borderWidth: 2, borderRadius: 4, barPercentage: 0.7, categoryPercentage: 0.8 },
                { label: 'D₂', data: d2, backgroundColor: COLORS.diffusion2 + '80', borderColor: COLORS.diffusion2, borderWidth: 2, borderRadius: 4, barPercentage: 0.7, categoryPercentage: 0.8 },
            ],
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                ...basePlugins(title),
                legend: {
                    display: true,
                    labels: { color: '#e2e8f0', font: { size: 11 }, usePointStyle: true, pointStyle: 'rect' },
                    position: 'top',
                },
            },
            scales: {
                x: { ...axisConfig(xL), grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 45 } },
                y: { ...axisConfig(yL), beginAtZero: true },
            },
        },
    });
}

export function histChart(id, values, title, color) {
    if (!values?.length) return;
    const { labels, counts } = histogram(values);
    bar(id, labels, counts, 'Энергия (Дж)', 'Частота', title, color);
}