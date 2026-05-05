// charts.data.js — загрузка, нормализация и подготовка 3D-данных

export let allResults = [];
export const atomsMap = new Map();
export const ionsMap = new Map();

async function fetchJSON(url, headers = {}) {
    try {
        const res = await fetch(url, { headers });
        const json = await res.json();
        return json.data || [];
    } catch {
        return [];
    }
}

export async function loadAll(token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const [atoms, ions, results] = await Promise.all([
        fetchJSON('/atoms'),
        fetchJSON('/ions'),
        fetchJSON('/results/config', headers),
    ]);

    atoms.forEach(a => a?.id && atomsMap.set(a.id, a));
    ions.forEach(i => i?.id && ionsMap.set(i.id, i));

    if (!atomsMap.size && results.length) await loadMissing(results, 'atom');
    if (!ionsMap.size && results.length) await loadMissing(results, 'ion');

    allResults = results.map(enrich);
}

async function loadMissing(results, type) {
    const map = type === 'atom' ? atomsMap : ionsMap;
    const idKey = type === 'atom' ? 'atomId' : 'ionId';
    const endpoint = type === 'atom' ? '/atoms' : '/ions';

    const ids = [...new Set(results.map(r => r[idKey]).filter(Boolean))];

    await Promise.all(ids.map(async id => {
        if (map.has(id)) return;

        try {
            const res = await fetch(`${endpoint}/${id}`);
            if (!res.ok) return;
            const json = await res.json();
            if (json.data) map.set(id, json.data);
        } catch {}
    }));
}

function enrich(r) {
    if (!r) return r;

    const atom = atomsMap.get(r.atomId) || r.atom || null;
    const ion = ionsMap.get(r.ionId) || r.ion || null;

    return {
        ...r,
        atomId: r.atomId || atom?.id,
        ionId: r.ionId || ion?.id,
        atomName: atom?.atomName || atom?.name || atom?.symbol || 'Unknown',
        ionName: ion?.name || 'Unknown',
        ionCharge: ion?.charge || 0,

        voltage: Number(r.voltage || 0),
        pressure: Number(r.pressure || 0),
        electronDensity: Number(r.electronDensity || 0),
        electronVelocity: Number(r.electronVelocity || 0),
        electronTemperature: Number(r.electronTemperature || r.electronTemp || 0),
        currentDensity: Number(r.currentDensity || 0),
        ionEnergy: Number(r.ionEnergy || r.totalTransferredEnergy || 0),

        avgT: Number(r.avgT || 0),
        minT: Number(r.minT || 0),
        maxT: Number(r.maxT || 0),

        totalTransferredEnergy: Number(r.totalTransferredEnergy || 0),
        avgTransferredPerAtom: Number(r.avgTransferredPerAtom || 0),

        diffusionCoefficient1: Number(r.diffusionCoefficient1 || 0),
        diffusionCoefficient2: Number(r.diffusionCoefficient2 || 0),

        depths: Number(r.depths || 0),
        concentration: Number(r.concentration || 0),
        dThermal: Number(r.dThermal || 0),
        totalMomentum: Number(r.totalMomentum || 0),
        totalDamage: Number(r.totalDamage || 0),
        totalDisplacement: Number(r.totalDisplacement || 0),

        createdAt: r.createdAt || new Date().toISOString(),
        timeIndex: new Date(r.createdAt || Date.now()).getTime(),
    };
}

export function byAtom(name) {
    if (!name || name === 'all') return allResults;

    return allResults.filter(r =>
        r.atomName === name ||
        (name.match(/Атом (\d+)/)?.[1] && r.atomId === +name.match(/Атом (\d+)/)[1])
    );
}

export function byIon(name) {
    if (!name || name === 'all') return allResults;

    return allResults.filter(r =>
        r.ionName === name ||
        (name.match(/Ион (\d+)/)?.[1] && r.ionId === +name.match(/Ион (\d+)/)[1])
    );
}

// Универсальная подготовка данных для 3D-графиков
export function to3DScatter(data, xKey, yKey, zKey = null) {
    return data.map((row, i) => ({
        x: row[xKey] || 0,
        y: row[yKey] || 0,
        z: zKey ? (row[zKey] || 0) : i,
        meta: row,
    }));
}

export function to3DLine(data, xKey, yKey) {
    return data.map((row, i, arr) => ({
        x: row[xKey] || 0,
        y: row[yKey] || 0,
        z: i === 0 ? 0 : (row[yKey] - arr[i - 1][yKey]),
    }));
}

export function to3DBar(data, categoryKey, valueKey, depthKey = null) {
    return data.map((row, i) => ({
        x: i,
        y: row[valueKey] || 0,
        z: depthKey ? row[depthKey] || 0 : row[categoryKey] || i,
        label: row[categoryKey],
    }));
}