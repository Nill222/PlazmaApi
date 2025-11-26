-- ===============================
-- SCHEMA: PLAZMA — initial data
-- ===============================

-- 🔹 Atom list with all valence variants
-- ===============================
-- 🔹 Atom list with diffusion parameters
-- ===============================

-- Вставка с учетом структуры и диффузии
INSERT INTO plazma.atom_list (atom_name, full_name, u, a, debye_temperature, valence, atom_structure,
                              packing_factor1, cohesive_energy_ev1, packing_factor2, cohesive_energy_ev2)
VALUES
-- Carbon (C)
('C(IV)', 'Carboneum', 1.994E-26, 6.71, 1956.85, 4, 'BCC', 2.0E-7, 80, 5.0E-9, 67),

-- Chromium (Cr)
('Cr(II)', 'Chromium', 8.634E-26, 2.88, 356.85, 2, 'BCC', 2.5E-5, 268, 1.1E-7, 190),
('Cr(III)', 'Chromium', 8.634E-26, 2.88, 356.85, 3, 'BCC', 2.5E-5, 268, 1.1E-7, 190),
('Cr(VI)', 'Chromium', 8.634E-26, 2.88, 356.85, 6, 'BCC', 2.5E-5, 268, 1.1E-7, 190),

-- Nickel (Ni)
('Ni(II)', 'Niccolum', 9.746E-26, 9.352, 176.85, 2, 'FCC', 3.0E-5, 284, 4.2E-7, 210),
('Ni(III)', 'Niccolum', 9.746E-26, 9.352, 176.85, 3, 'FCC', 3.0E-5, 284, 4.2E-7, 210),

-- Iron (Fe)
('Fe(II)', 'Ferrum', 9.273E-26, 2.866, 196.85, 2, 'FCC', 1.5E-5, 280, 2.0E-7, 200),
('Fe(III)', 'Ferrum', 9.273E-26, 2.866, 196.85, 3, 'FCC', 1.5E-5, 280, 2.0E-7, 200),

-- Molybdenum (Mo)
('Mo(IV)', 'Molybdaenum', 1.593E-25, 3.14, 176.85, 4, 'BCC', 1.0E-4, 310, 3.0E-6, 240),
('Mo(VI)', 'Molybdaenum', 1.593E-25, 3.14, 176.85, 6, 'BCC', 1.0E-4, 310, 3.0E-6, 240),

-- Tungsten (W)
('W(IV)', 'Wolfram', 3.052E-25, 3.16, 126.85, 4, 'BCC', 8.0E-5, 330, 5.0E-6, 260),
('W(VI)', 'Wolfram', 3.052E-25, 3.16, 126.85, 6, 'BCC', 8.0E-5, 330, 5.0E-6, 260),

-- Cobalt (Co)
('Co(II)', 'Cobaltum', 9.786E-26, 4.089, 171.85, 2, 'FCC', 1.8E-5, 270, 1.0E-7, 190),
('Co(III)', 'Cobaltum', 9.786E-26, 4.089, 171.85, 3, 'FCC', 1.8E-5, 270, 1.0E-7, 190);

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
