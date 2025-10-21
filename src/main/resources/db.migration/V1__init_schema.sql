CREATE SCHEMA plazma;

CREATE TABLE plazma.users (
                              id SERIAL PRIMARY KEY,
                              username VARCHAR(50) UNIQUE NOT NULL,
                              password_hash VARCHAR(255) NOT NULL,
                              email VARCHAR(100),
                              role VARCHAR(30) DEFAULT 'USER',
                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE plazma.atom_list (
                                  id SERIAL PRIMARY KEY,
                                  atom_name VARCHAR(20) NOT NULL,
                                  full_name VARCHAR(50),
                                  u DOUBLE PRECISION,
                                  a DOUBLE PRECISION,
                                  debye_temperature DOUBLE PRECISION,
                                  valence INT DEFAULT 1
);

CREATE TABLE plazma.ions (
                             id SERIAL PRIMARY KEY,
                             name VARCHAR(20) NOT NULL,
                             mass DOUBLE PRECISION,
                             charge INT DEFAULT 1
);

CREATE TABLE plazma.configs (
                                id SERIAL PRIMARY KEY,
                                user_id INT REFERENCES plazma.users(id) ON DELETE CASCADE,
                                name VARCHAR(100) NOT NULL,
                                description TEXT,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE plazma.atoms (
                              id SERIAL PRIMARY KEY,
                              config_id INT REFERENCES plazma.configs(id) ON DELETE CASCADE,
                              atom_list_id INT REFERENCES plazma.atom_list(id) ON DELETE SET NULL,
                              x DOUBLE PRECISION,
                              y DOUBLE PRECISION,
                              vx DOUBLE PRECISION,
                              vy DOUBLE PRECISION
);

CREATE TABLE plazma.results (
                                id SERIAL PRIMARY KEY,
                                config_id INT REFERENCES plazma.configs(id) ON DELETE CASCADE,
                                ion_id INT REFERENCES plazma.ions(id) ON DELETE SET NULL,
                                energy DOUBLE PRECISION,
                                potential DOUBLE PRECISION,
                                temperature DOUBLE PRECISION,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
