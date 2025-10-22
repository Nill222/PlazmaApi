-- ===============================
-- SCHEMA: PLAZMA — initial data
-- ===============================

-- 🔹 Atom list with all valence variants
INSERT INTO plazma.atom_list (atom_name, full_name, u, a, debye_temperature, valence) VALUES
-- Iron (Fe)
('Fe(II)', 'Ferrum', 9.273E-26, 2.866, 196.85, 2),
('Fe(III)', 'Ferrum', 9.273E-26, 2.866, 196.85, 3),

-- Chromium (Cr)
('Cr(II)', 'Chromium', 8.634E-26, 2.88, 356.85, 2),
('Cr(III)', 'Chromium', 8.634E-26, 2.88, 356.85, 3),
('Cr(VI)', 'Chromium', 8.634E-26, 2.88, 356.85, 6),

-- Nickel (Ni)
('Ni(II)', 'Niccolum', 9.746E-26, 9.352, 176.85, 2),
('Ni(III)', 'Niccolum', 9.746E-26, 9.352, 176.85, 3),

-- Vanadium (V)
('V(III)', 'Vanadium', 8.459E-26, 3.024, 106.85, 3),
('V(V)', 'Vanadium', 8.459E-26, 3.024, 106.85, 5),

-- Molybdenum (Mo)
('Mo(IV)', 'Molybdaenum', 1.593E-25, 3.14, 176.85, 4),
('Mo(VI)', 'Molybdaenum', 1.593E-25, 3.14, 176.85, 6),

-- Silicon (Si)
('Si(IV)', 'Silicium', 4.663E-26, 5.43, 371.85, 4),

-- Tungsten (W)
('W(IV)', 'Wolfram', 3.052E-25, 3.16, 126.85, 4),
('W(VI)', 'Wolfram', 3.052E-25, 3.16, 126.85, 6),

-- Tantalum (Ta)
('Ta(V)', 'Tantalum', 3.004E-25, 3.31, -33.15, 5),

-- Titanium (Ti)
('Ti(III)', 'Titanium', 7.948E-26, 4.697, 146.85, 3),
('Ti(IV)', 'Titanium', 7.948E-26, 4.697, 146.85, 4),

-- Niobium (Nb)
('Nb(V)', 'Niobium', 1.542E-26, 3.301, 1.85, 5),

-- Rhenium (Re)
('Re(IV)', 'Rhenium', 3.092E-25, 4.456, 143.85, 4),
('Re(VII)', 'Rhenium', 3.092E-25, 4.456, 143.85, 7),

-- Carbon (C)
('C(IV)', 'Carboneum', 1.994E-26, 6.71, 1956.85, 4),

-- Manganese (Mn)
('Mn(II)', 'Manganum', 9.122E-26, 8.912, 36.85, 2),
('Mn(IV)', 'Manganum', 9.122E-26, 8.912, 36.85, 4),
('Mn(VII)', 'Manganum', 9.122E-26, 8.912, 36.85, 7),

-- Phosphorus (P)
('P(III)', 'Phosphorus', 5.143E-26, 18.51, 226.85, 3),
('P(V)', 'Phosphorus', 5.143E-26, 18.51, 226.85, 5),

-- Cobalt (Co)
('Co(II)', 'Cobaltum', 9.786E-26, 4.089, 171.85, 2),
('Co(III)', 'Cobaltum', 9.786E-26, 4.089, 171.85, 3),

-- Lead (Pb)
('Pb(II)', 'Plumbum', 3.44E-25, 4.95, -168.15, 2),
('Pb(IV)', 'Plumbum', 3.44E-25, 4.95, -168.15, 4),

-- Sulfur (S)
('S(IV)', 'Sulfur', 5.324E-26, 24.369, 366.85, 4),
('S(VI)', 'Sulfur', 5.324E-26, 24.369, 366.85, 6);

-- ===============================
-- 🔹 Ion table
-- ===============================

INSERT INTO plazma.ions (name, mass, charge) VALUES
                                                 ('H2O', 2.99E-26, 1),
                                                 ('CHN4', 1.1465E-25, 1),
                                                 ('O2', 5.31E-26, 2),
                                                 ('H2', 3.347E-27, 1),
                                                 ('CO2', 7.3E-26, 2),
                                                 ('Ar', 6.63E-26, 0),
                                                 ('N', 2.326E-26, 3),
                                                 ('N2', 4.652E-26, 0),
                                                 ('C2H2', 4.323E-26, 1);

-- ===============================
-- 🔹 Example users and config
-- ===============================

INSERT INTO plazma.users (username, password_hash, email, role)
VALUES
    ('admin', '$2a$10$examplehash', 'admin@plasma.local', 'ADMIN');

INSERT INTO plazma.configs (user_id, name, description)
VALUES (
           (SELECT id FROM plazma.users WHERE username='admin'),
           'Default Lattice Config',
           'Auto-generated lattice for simulation base state.'
       );

-- ===============================
-- 🔹 Bulk insertion for atoms (Fe, Cr, W, Mo, etc.)
-- ===============================

INSERT INTO plazma.atoms (config_id, atom_list_id, x, y, vx, vy)
SELECT
    c.id,
    a.id,
    i * 2.5e-9, -- step between atoms
    0.0,
    0.0,
    0.0
FROM
    plazma.configs c,
    plazma.atom_list a,
    generate_series(1, 100) AS i
WHERE
    a.atom_name IN ('Fe(II)', 'Cr(III)', 'W(VI)', 'Mo(IV)');

-- ===============================
-- 🔹 Example result record
-- ===============================

INSERT INTO plazma.results (config_id, ion_id, energy, potential, temperature)
VALUES (
           (SELECT id FROM plazma.configs WHERE name='Default Lattice Config'),
           (SELECT id FROM plazma.ions WHERE name='Ar'),
           1.23E-18,
           3.21E-19,
           1250.0
       );
