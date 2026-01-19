CREATE SCHEMA IF NOT EXISTS plazma;

-- =======================
-- USERS
-- =======================
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');

CREATE TABLE plazma.users (
                              id SERIAL PRIMARY KEY,
                              username VARCHAR(50) UNIQUE NOT NULL,
                              password_hash VARCHAR(255) NOT NULL,
                              email VARCHAR(100),
                              role user_role NOT NULL DEFAULT 'USER',
                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =======================
-- ATOM LIST
-- =======================
CREATE TYPE structure_type AS ENUM ('SC', 'BCC', 'FCC', 'HCP');

CREATE TABLE plazma.atom_list (
                                  id SERIAL PRIMARY KEY,
                                  atom_name VARCHAR(20) NOT NULL,
                                  full_name VARCHAR(50),
                                  u DOUBLE PRECISION,
                                  a DOUBLE PRECISION,
                                  debye_temperature DOUBLE PRECISION,
                                  valence INT DEFAULT 1,
                                  atom_structure structure_type NOT NULL,

                                  cohesive_energy_ev1 DOUBLE PRECISION,
                                  cohesive_energy_ev2 DOUBLE PRECISION,
                                  screening_length DOUBLE PRECISION,
                                  packing_factor1 DOUBLE PRECISION,
                                  packing_factor2 DOUBLE PRECISION
);

-- =======================
-- IONS
-- =======================
CREATE TABLE plazma.ions (
                             id SERIAL PRIMARY KEY,
                             name VARCHAR(20) NOT NULL,
                             mass DOUBLE PRECISION,
                             charge INT DEFAULT 1
);

-- =======================
-- CONFIGS
-- =======================
CREATE TABLE plazma.configs (
                                id SERIAL PRIMARY KEY,
                                user_id INT REFERENCES plazma.users(id) ON DELETE CASCADE,
                                name VARCHAR(100) NOT NULL,
                                description TEXT,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =======================
-- PLASMA CONFIGURATION (1:1)
-- =======================
CREATE TABLE plazma.plasma_configurations (
                                              id SERIAL PRIMARY KEY,

                                              voltage DOUBLE PRECISION,
                                              current DOUBLE PRECISION,
                                              pressure DOUBLE PRECISION,
                                              electron_temperature DOUBLE PRECISION,
                                              ion_temperature DOUBLE PRECISION,
                                              exposure_time DOUBLE PRECISION,

                                              chamber_width DOUBLE PRECISION,
                                              chamber_height DOUBLE PRECISION,
                                              chamber_depth DOUBLE PRECISION,
                                              electrode_distance DOUBLE PRECISION,
                                              chamber_material VARCHAR(255),

                                              ion_energy_override DOUBLE PRECISION,
                                              ion_incidence_angle DOUBLE PRECISION,
                                              target_temperature DOUBLE PRECISION,
                                              surface_binding_energy DOUBLE PRECISION,
                                              surface_roughness DOUBLE PRECISION,

                                              thermal_conductivity DOUBLE PRECISION,
                                              heat_capacity DOUBLE PRECISION,
                                              density DOUBLE PRECISION,
                                              melting_point DOUBLE PRECISION,
                                              lattice_parameter_override DOUBLE PRECISION,

                                              config_id INT UNIQUE REFERENCES plazma.configs(id) ON DELETE CASCADE
);

-- =======================
-- ATOMS (3D MODEL)
-- =======================
CREATE TABLE plazma.atoms (
                              id SERIAL PRIMARY KEY,
                              config_id INT REFERENCES plazma.configs(id) ON DELETE CASCADE,
                              atom_list_id INT REFERENCES plazma.atom_list(id) ON DELETE SET NULL,

                              x DOUBLE PRECISION,
                              y DOUBLE PRECISION,
                              z DOUBLE PRECISION,

                              vx DOUBLE PRECISION,
                              vy DOUBLE PRECISION,
                              vz DOUBLE PRECISION
);

-- =======================
-- RESULTS (UPDATED FIELDS)
-- =======================
CREATE TABLE plazma.results (
                                id SERIAL PRIMARY KEY,

                                config_id INT REFERENCES plazma.configs(id) ON DELETE CASCADE,
                                atom_list_id INT REFERENCES plazma.atom_list(id) ON DELETE SET NULL,
                                ion_id INT REFERENCES plazma.ions(id) ON DELETE SET NULL,

    -- Energy
                                total_transferred_energy DOUBLE PRECISION NOT NULL,
                                avg_transferred_per_atom DOUBLE PRECISION NOT NULL,

    -- Temperature
                                avg_t DOUBLE PRECISION NOT NULL,
                                min_t DOUBLE PRECISION NOT NULL,
                                max_t DOUBLE PRECISION NOT NULL,

    -- Diffusion
                                diffusion_coefficient_1 DOUBLE PRECISION,
                                diffusion_coefficient_2 DOUBLE PRECISION,

    -- Plasma parameters
                                voltage DOUBLE PRECISION,
                                electron_temperature DOUBLE PRECISION,
                                ion_energy DOUBLE PRECISION,
                                pressure DOUBLE PRECISION,
                                electron_density DOUBLE PRECISION,
                                electron_velocity DOUBLE PRECISION,
                                current_density DOUBLE PRECISION,

    -- Additional physics
                                depths DOUBLE PRECISION,
                                concentration DOUBLE PRECISION,
                                d_thermal DOUBLE PRECISION,
                                total_momentum DOUBLE PRECISION,
                                total_damage DOUBLE PRECISION,
                                total_displacement DOUBLE PRECISION,

                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
