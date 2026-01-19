+# Плазменная симуляция взаимодействия ионов с материалом

Этот проект реализует модульную систему для моделирования воздействия плазмы на атомную решётку материала. Симуляция учитывает плазменные параметры, коллизии ионов с атомами, тепловые эффекты и диффузию.

---

## 1. Параметры плазмы (PlasmaService)

Параметры задаются пользователем через `SimulationRequestDto`:

- Напряжение: `voltage` (V)
- Ток: `current` (A)
- Давление: `pressure` (Pa)
- Электронная температура: `electronTemperature` (K)
- Геометрия камеры: `chamberWidth` и `chamberDepth` (м)
- Время экспозиции: `exposureTime` (с)

**Формулы:**

- Плотность электронов:
  \[
  n_e = \frac{P}{k_B T_e}
  \]

- Скорость электронов:
  \[
  v_e = \sqrt{\frac{2 e V}{m_e}}
  \]

- Плотность тока:
  \[
  J = \frac{I}{w \cdot d}
  \]

- Эффективная энергия ионов:
  \[
  E_\text{ion} = V \cdot I \cdot t_\text{exp}
  \]

**Выход:** объект `PlasmaResultDto`.

---

## 2. Тепловая симуляция (ThermalService)

Используются:

- Плотность материала \(\rho\)
- Толщина слоя \(h\)
- Площадь \(A\)
- Энергия ионов \(E_\text{ion}\)
- Время экспозиции \(t_\text{exp}\)

**Выход:** массив температур по времени `temperatures`.

---

## 3. Генерация атомной решётки (LatticeService)

Создаётся массив атомов в кристаллической решётке на основе данных `AtomListDto`.

---

## 4. Коллизии и энергия передачи (CollisionService)

Для каждого атома решётки:

- Используем ионную энергию \(E_\text{ion}\) и расстояние до атома \(r\)
- Масса иона \(m_\text{ion}\), масса атома \(m_\text{atom}\)

**Формулы:**

- Коэффициент передачи энергии:
  \[
  K = \frac{4 m_\text{ion} m_\text{atom}}{(m_\text{ion}+m_\text{atom})^2}
  \]

- Переданная энергия:
  \[
  E_\text{transferred} = K \cdot E_\text{ion} \cdot \cos(\theta)
  \]

- Повреждение атома:
  \[
  E_\text{damage} =
  \begin{cases}
  0.8 \cdot E_\text{transferred}, & E_\text{transferred} > 2 E_\text{surface} \\
  0, & \text{иначе}
  \end{cases}
  \]

- Моментум атома:
  \[
  p = \sqrt{2 \mu E_\text{transferred}}, \quad \mu = \frac{m_\text{ion} m_\text{atom}}{m_\text{ion}+m_\text{atom}}
  \]

SLR-модель усредняет локальную энергию столкновения.

---

## 5. Диффузия (DiffusionService)

Диффузионный коэффициент учитывает:

- Термальные колебания атомов (из ThermalResultDto)
- Коллизии с ионами
- Потенциал атома (PotentialService)
- Эффект SLR
- Резонансное воздействие (ResonanceService)

**Термально активная диффузия:**
\[
D_\text{thermal} = D_0 \cdot \exp\left(-\frac{Q}{R T}\right)
\]

- Коллизии: \(D_\text{thermal} \to D_\text{thermal} \cdot (1 + E_\text{coll} \cdot 10^{-3})\)
- Потенциал: \(D_\text{pot} = D_\text{thermal} \cdot (1 + |k| \cdot 10^{-20})\)
- SLR и резонанс: дополнительные множители

**Профиль проникновения атомов:**
\[
C(x) \sim \exp\left(-\frac{x}{\sqrt{2 D_\text{effective} t_\text{exp}}}\right)
\]

---

## 6. Оркестрация симуляции (SimulationOrchestratorService)

**Последовательность шагов:**

1. Получение атомного списка (`AtomListDto`)
2. Генерация решётки атомов
3. Вычисление параметров плазмы (`PlasmaResultDto`)
4. Тепловая симуляция (`ThermalResultDto`)
5. Коллизии для всех атомов (`CollisionResult`)
6. Диффузия с учётом всех эффектов (`DiffusionProfileDto`)
7. Средние значения энергии, моментума, повреждений, температуры
8. Сбор всех данных в `SimulationResultDto`
