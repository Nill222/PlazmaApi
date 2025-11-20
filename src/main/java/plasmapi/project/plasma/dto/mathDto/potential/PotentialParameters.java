package plasmapi.project.plasma.dto.mathDto.potential;

import plasmapi.project.plasma.service.math.potential.PotentialType;

public record PotentialParameters(

         // Потенциальная энергия V(r) в точке r, Дж
        Double value,
        //  Приближённое значение второй производной d^2V/dr^2 (N/m) — "stiffness"
        Double stiffness,
        //Характерная эквилибриум дистанция re (м) — если есть.
        Double re,

        // LJ sigma (м) если релевантно
        Double sigma,
        // LJ epsilon (Дж) если релевантно
        Double epsilon
) {}

