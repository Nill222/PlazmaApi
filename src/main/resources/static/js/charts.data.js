// charts.data.js — загрузка, обогащение, фильтрация данных

export let allResults = [];
export const atomsMap = new Map();
export const ionsMap  = new Map();

async function fetchJSON(url, headers = {}) {
    try {
        const r = await fetch(url, { headers });
        const d = await r.json();
        return d.data || [];
    } catch { return []; }
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

    allResults = results.map(enrich);

    if (!atomsMap.size && results.length) await loadMissing(results, 'atom');
    if (!ionsMap.size  && results.length) await loadMissing(results, 'ion');

    allResults = results.map(enrich);
}

async function loadMissing(results, type) {
    const map   = type === 'atom' ? atomsMap : ionsMap;
    const idKey = type === 'atom' ? 'atomId'  : 'ionId';
    const url   = type === 'atom' ? '/atoms'  : '/ions';
    const ids   = [...new Set(results.map(r => r[idKey]).filter(Boolean))];
    await Promise.all(ids.filter(id => !map.has(id)).map(async id => {
        try {
            const r = await fetch(`${url}/${id}`);
            if (r.ok) { const d = await r.json(); if (d.data) map.set(id, d.data); }
        } catch { /* skip */ }
    }));
}

function enrich(r) {
    if (!r) return r;
    const atom = r.atomId && atomsMap.has(r.atomId) ? atomsMap.get(r.atomId) : r.atom ?? null;
    const ion  = r.ionId  && ionsMap.has(r.ionId)   ? ionsMap.get(r.ionId)   : r.ion  ?? null;
    if (atom?.id) atomsMap.set(atom.id, atom);
    if (ion?.id)  ionsMap.set(ion.id, ion);
    return {
        ...r,
        atomId:   r.atomId || r.atom?.id,
        atomName: atom?.atomName || atom?.name || atom?.symbol || 'Unknown',
        ionId:    r.ionId  || r.ion?.id,
        ionName:  ion?.name || 'Unknown',
        ionCharge: ion?.charge || 0,
        // plasma
        voltage:             r.voltage || 0,
        pressure:            r.pressure || 0,
        electronDensity:     r.electronDensity || 0,
        electronVelocity:    r.electronVelocity || 0,
        electronTemperature: r.electronTemperature || r.electronTemp || 0,
        currentDensity:      r.currentDensity || 0,
        ionEnergy:           r.ionEnergy || r.totalTransferredEnergy || 0,
        // thermal
        avgT: r.avgT || 0, minT: r.minT || 0, maxT: r.maxT || 0,
        // energy
        totalTransferredEnergy: r.totalTransferredEnergy || 0,
        avgTransferredPerAtom:  r.avgTransferredPerAtom  || 0,
        // diffusion
        diffusionCoefficient1: r.diffusionCoefficient1 || 0,
        diffusionCoefficient2: r.diffusionCoefficient2 || 0,
        // mechanics
        depths:            r.depths            || 0,
        concentration:     r.concentration     || 0,
        dThermal:          r.dThermal          || 0,
        totalMomentum:     r.totalMomentum     || 0,
        totalDamage:       r.totalDamage       || 0,
        totalDisplacement: r.totalDisplacement || 0,
        createdAt: r.createdAt || new Date().toISOString(),
    };
}

export function byAtom(name) {
    if (!name || name === 'all') return allResults;
    return allResults.filter(r => {
        if (r.atomName === name) return true;
        const m = name.match(/Атом (\d+)/);
        return m && r.atomId === +m[1];
    });
}

export function byIon(name) {
    if (!name || name === 'all') return allResults;
    return allResults.filter(r => {
        if (r.ionName === name) return true;
        const m = name.match(/Ион (\d+)/);
        return m && r.ionId === +m[1];
    });
}