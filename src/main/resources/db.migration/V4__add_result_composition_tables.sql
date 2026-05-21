CREATE TABLE plazma.result_atom_components (
    id SERIAL PRIMARY KEY,
    result_id INT NOT NULL REFERENCES plazma.results(id) ON DELETE CASCADE,
    atom_list_id INT NOT NULL REFERENCES plazma.atom_list(id) ON DELETE RESTRICT,
    fraction DOUBLE PRECISION NOT NULL CHECK (fraction > 0 AND fraction <= 1),
    UNIQUE (result_id, atom_list_id)
);

CREATE TABLE plazma.result_ion_components (
    id SERIAL PRIMARY KEY,
    result_id INT NOT NULL REFERENCES plazma.results(id) ON DELETE CASCADE,
    ion_id INT NOT NULL REFERENCES plazma.ions(id) ON DELETE RESTRICT,
    fraction DOUBLE PRECISION NOT NULL CHECK (fraction > 0 AND fraction <= 1),
    UNIQUE (result_id, ion_id)
);

CREATE INDEX idx_result_atom_components_result ON plazma.result_atom_components(result_id);
CREATE INDEX idx_result_ion_components_result ON plazma.result_ion_components(result_id);

-- Backfill existing single-atom/ion results
INSERT INTO plazma.result_atom_components (result_id, atom_list_id, fraction)
SELECT id, atom_list_id, 1.0
FROM plazma.results
WHERE atom_list_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM plazma.result_atom_components c WHERE c.result_id = results.id
  );

INSERT INTO plazma.result_ion_components (result_id, ion_id, fraction)
SELECT id, ion_id, 1.0
FROM plazma.results
WHERE ion_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM plazma.result_ion_components c WHERE c.result_id = results.id
  );
