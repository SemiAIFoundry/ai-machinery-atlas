# Orbital mission: governing science and authored boundaries

This is one synthetic payload-workload budget with prescribed sunlight, contacts and reset events. It is not an actual spacecraft, a current orbital-computing claim, an orbit/attitude solution, a link budget or evidence of flight readiness. Hardware rates, loads, storage, geometry, efficiencies and event times are authored assumptions. Primary sources support the relationships below, not the chosen spacecraft values.

## Solar and stored electrical energy

The electrical boundary begins at solar DC power available to the regulated spacecraft bus. The model computes sunlit power as irradiance × array area × cell efficiency × incidence cosine × derating × delivery efficiency; eclipse power is zero. The default 1361 W/m² is a representative irradiance near Earth's distance from the Sun, not a prediction for every location or time. [NASA Goddard, *Solar Irradiance*](https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science).

Sunlight duration and incidence matter, and batteries must bridge periods when solar power is unavailable. Actual solar-cell output and battery performance depend on mission conditions and degradation. [NASA Small Spacecraft Technology, *Power*, §§3.2–3.4](https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/).

The model treats charge/discharge efficiencies as fixed conversion factors. With charging power Pc measured from the bus, discharge Pd delivered to the bus, and stored energy E:

```
dE/dt = ηc Pc − Pd/ηd                         [J/s = W]
battery heat = (1−ηc) Pc + (1/ηd−1) Pd        [W]
solar used + battery discharge = loads + battery charge
```

These equations imply the independently tested integral balance:

```
solar used J + initial battery J − final battery J
  = bus load energy J + battery conversion losses J
```

Available but unused solar is curtailed. It is not charged into a full battery or silently counted as useful energy. Battery limits are applied by stopping an event segment exactly at reserve, resume, empty or full energy. A reserve/resume hysteresis controller prevents optional loads from rapidly switching on and off at a single threshold. Housekeeping can use the reserve. It includes payload state retention and relaunch support.

The model reports housekeeping energy shortfall and discards volatile payload work when the bus cannot support housekeeping. It does not allow negative battery energy or hide a failed budget by reducing the stated housekeeping requirement. Real battery voltage/SOC curves, temperature, aging, depth-of-discharge life, self-discharge and peak-current transients are excluded. There is no facility PUE in this spacecraft boundary. Array/cell/converter waste heat lies outside the payload radiator, an explicit idealized thermal separation.

## Heat rejection and its coupling to power

The radiator is an ideal isothermal effective surface. Temperatures are absolute kelvin. Area means total effective emitting area; do not silently double it for two sides. A view factor scales coupling to a single effective sink. Absorbed environmental heat is separately declared for sunlight and eclipse.

```
net radiator bound W
  = ε σ A F (Tmax⁴ − Tsink⁴) − absorbed environment W
internal heat W
  = bus load W − exported radio RF W + battery losses W
radiator heat W = internal heat W + absorbed environment W
```

The Stefan–Boltzmann constant used is 5.670374419×10⁻⁸ W/(m² K⁴), rounded from its exact SI expression. A test independently derives it from Planck's constant, Boltzmann's constant and the speed of light. [NIST, 2022 CODATA complete constants table](https://physics.nist.gov/cuu/Constants/Table/allascii.txt).

Spacecraft thermal balance includes absorbed solar/planetary radiation, internally generated heat, radiation to a sink and stored heat. This model sets stored thermal energy to zero and solves a steady-state bound, so its displayed equilibrium temperature is not a temperature transient. [NASA Small Spacecraft Technology, *Thermal Control*, §7.1](https://www.nasa.gov/smallsat-institute/sst-soa/thermal-control/).

Battery loss heat is added once. Transmitter RF export leaves the thermal boundary and is subtracted once. Solar curtailment is outside the regulated-bus thermal boundary; it is not another payload heat source. The controller may limit charging when charging losses would exceed radiator headroom, even while unused solar remains. Optional transmitter and payload loads are refused if their power or heat budgets fail. If housekeeping or environmental heat alone violates the radiator bound, the model reports that failure explicitly.

No junction-to-radiator thermal resistance, internal thermal gradient, minimum survival temperature, eclipse heater demand, radiator deployment, detailed view geometry, convection, heat capacity or coolant loop is solved. In particular, a low calculated equilibrium temperature is not evidence that the spacecraft can safely run cold. There is no claim that a radiative upper bound establishes mission feasibility.

## Products, contact schedule and retained useful work

The workload is a stream of independent dense matrix products with fixed dimensions. Compute time is the larger of operations/compute rate and memory traffic/memory rate. It is followed by product write time and atomic commit delay. Only a committed product is retained. A conventional leading-order GEMM count of 2mnk operations and an ideal one-read input/one-write output traffic bound are used; these are accounting assumptions, not measured implementations. [Netlib reference DGEMM](https://www.netlib.org/lapack/explore-html/dd/d09/group__gemm_ga1e899f8453bcbfde78e91a86a2dab984.html).

The operating-hall model's work-equivalent convention is preserved, with a different declared workload: orbital products are independent and each product commits separately. Its ledger is:

```
executed work-equivalents = retained complete products + pending work + lost work
received bytes = delivered complete products × bytes/product + receiver partial bytes
onboard bytes = (retained products − delivered products) × bytes/product
```

Each stored product occupies its whole slot until complete acknowledgement. Receiver partial progress survives contact closure. An uncommitted product reserves one slot before computation begins. When no slot is free, buffer backpressure stops new work. Retained products include those already delivered; never add delivered products to retained products as if they were disjoint work.

The idea of buffering data across interruptions is grounded in store-and-forward space networking. The implementation here is an authored one-hop reliable transfer abstraction, not an implementation of DTN, CFDP or a particular acknowledgement protocol. [NASA, *Delay/Disruption Tolerant Networking Overview*](https://www.nasa.gov/reference/delay-disruption-tolerant-networking-overview/).

Contacts are prescribed windows and useful byte rates; they are not derived from the illustrative orbit or transmitter power. Scheduled capacity is only an upper bound: no data move before a product exists, outside contact, or when power/heat blocks the radio. Transmitter electrical load and byte rate are independently declared operating-point assumptions. Changing byte rate does not establish RF or optical link closure. Antenna aperture, pointing, distance, atmospheric loss, coding, latency, packet loss, retry overhead and ground-network capacity are excluded.

## Radiation and reset semantics

The radiation context uses an already angle-integrated effective flux Φ in particles/(cm² s), effective reset cross-section σr in cm²/device and susceptible-device count N:

```
reset rate λ = Φ σr N                         [1/s]
expected reset count = λ × duration           [dimensionless]
```

This compact effective-rate scenario is not a radiation-environment calculation. Actual SEE rate estimation combines device response, particle distributions and sensitive geometry; shielding and environment assumptions matter. Do not substitute a per-steradian particle flux without the needed angular treatment, or identify every upset with a processor reset. [NASA NEPP, *Single Event Effect Criticality Analysis*, §4.3, pp.28–30](https://nepp.nasa.gov/DocUploads/6D728AF0-2817-4530-97555B6DCB26D083/seecai.pdf).

A constant independent Poisson-rate assumption gives zero-event probability exp(−λT). This is a reset-count context, not mission survival probability. [NIST Engineering Statistics Handbook, *Poisson Distribution*](https://itl.nist.gov/div898/handbook/eda/section3/eda366j.htm).

Explicit scripted resets drive the actual trace. They discard only pending arithmetic/output state and impose a relaunch pause. Completed nonvolatile products and the independent radio are assumed to survive. Overlapping pauses form a union. An atomic product commit at exactly the reset time is processed first. The Poisson readout is not multiplied into retained work; doing so would double count a separate loss model. Flux controls change the rate-context display; scripted event/recovery controls change the deterministic work trace.

Total ionizing dose, displacement damage, latch-up, permanent failures, ECC efficacy, repair failure and storage corruption are not modeled. “Useful” means a complete retained product under the declared criterion, not guaranteed numerical correctness or scientific value.

## Reading the budget checks

`passesDeclaredChecks` means only that the finite-horizon retained/delivered targets, housekeeping and thermal checks pass, plus battery final ≥ initial when that check is requested. It does not certify a spacecraft. Battery closure at the selected initial state is a useful check, not proof of all future cycles; failure can also mean the chosen initial state is above the eventual periodic state. Repeated horizons require rechecking battery state, buffer backlog, contacts and workload, not just average solar watts. Default objectives request battery closure. All comparisons must show the final backlog alongside delivered work.
