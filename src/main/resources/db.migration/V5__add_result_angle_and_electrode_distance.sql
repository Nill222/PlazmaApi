ALTER TABLE plazma.results
    ADD COLUMN IF NOT EXISTS ion_incidence_angle DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS electrode_distance DOUBLE PRECISION;
