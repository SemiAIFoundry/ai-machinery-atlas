# Operating hall: science and model boundary

This is a synthetic teaching calculation for one fixed global workload. It is not a measured system, vendor forecast, electrical design, coolant design or commissioning certification. Every hardware rate, phase power, limit, readiness time and fault schedule is authored input. The sources below support the governing relationships; they do not validate those input values.

## Electrical and heat boundary

The model starts at the incremental facility electricity serving this hall. It contains admitted IT racks, their internal conversion losses, and the facility overhead allocated to those racks. Unadmitted racks are off. Building standing loads, commissioning tests, embodied energy and external users of the computed data are excluded.

For an admitted rack with N packages, package DC power p, auxiliary output power a and internal conversion efficiency η:

```
rack IT input W = (N p + a) / η
internal conversion loss W = rack IT input W − (N p + a)
package equivalent DC current A = p / package rail V
rack DC input current A = rack IT input W / rack bus V
hall IT input W = admitted racks × rack IT input W
facility input W = scenario PUE × hall IT input W
external overhead W = facility input W − hall IT input W
```

P = VI is applied to explicitly DC boundaries. A package's current and a rack's current occur at different voltages and must not be added. The package rail is an equivalent representation of aggregate package supply power, not a claim that a real package uses a single physical rail. AC line current, power factor, phases, protection coordination, transients and wire losses require additional models. The electrical power relation is derived in [OpenStax University Physics 2, §9.5](https://openstax.org/books/university-physics-volume-2/pages/9-5-electrical-energy-and-power).

PUE is an energy ratio, with facility support loads outside the IT equipment boundary. Here a constant scenario PUE also maps phase powers, which guarantees the same ratio after integration. Internal rack conversion losses are already included in IT input; they are not added again as an extra facility loss. The modeled ratio is not an annual measured PUE or a productivity score. [DOE/LBNL, *Data Center Metering and Resource Guide*, February 2017, §§2.1 and 3.2](https://datacenters.lbl.gov/sites/default/files/DataCenterMeteringandResourceGuide_02072017.pdf).

An ideal aggregate water loop captures all IT-input power, including internal IT conversion losses. There is no stored thermal energy or external heat gain in this steady-state approximation:

```
IT heat W = mass flow kg/s × specific heat J/(kg K) × coolant rise K
coolant rise K = hall IT input W / (mass flow × specific heat)
facility rejected heat W = IT heat W + external overhead W = facility input W
```

The coolant heat is part of the facility heat, so adding coolant heat to facility power would double count it. Default water cp = 4180 J/(kg K) is a rounded teaching value. NASA's heat-exchanger analysis uses ṁcp and an average water cp of 4181.3 J/(kg K) across its stated temperature range. [Colozza and Burke, NASA/TM-2011-216962, §heat-exchanger sizing, Eq. 12 and p.12](https://ntrs.nasa.gov/api/citations/20110007103/downloads/20110007103.pdf).

This loop is an authored idealization. Actual water properties vary with temperature and composition; mixed air/liquid capture, inlet temperature, junction temperatures, pressure drop, pump curves, flow maldistribution, boiling and heat-exchanger approach are not solved. Mass flow is recirculating flow, not water consumption. Changing flow while keeping PUE fixed deliberately holds auxiliary energy assumptions fixed; it does not demonstrate free pumping.

Whole-rack admission uses the highest configured package power across run, checkpoint and recovery. A rack must pass both package and rack DC current limits. The admitted count is the smaller whole number fitting the facility-input budget and loop heat-capacity budget. This is conservative static admission, not dynamic throttling or a guarantee of plant operability.

## One workload and its service bounds

The default example repeatedly updates a fixed dense matrix C ← AB + C. With A of shape m×k, B of shape k×n, and s bytes per scalar, the authored accounting is:

```
arithmetic operations per step = 2 m n k
ideal memory bytes per step = s (m k + k n + 2 m n)
network output payload per step = s m n
checkpoint bytes = s m n
```

The scalar update has one multiplication and one addition for each i,j,k. Read A, B and previous C once; write new C once. Immutable A/B are assumed recoverable, while mutable C is checkpointed. Network traffic is one declared delivery of C, counted once at transmission. It is not an all-reduce formula. Matrix shapes and the general GEMM operation are specified by the primary [Netlib reference DGEMM routine](https://www.netlib.org/lapack/explore-html/dd/d09/group__gemm_ga1e899f8453bcbfde78e91a86a2dab984.html).

Each field is traffic across a named interface; summing memory and network bytes does not measure unique information. Checkpoint read/write bytes use a separate dedicated storage path. Memory requirements, replication and the actual cache blocking needed to achieve the ideal traffic bound are not established by this model.

The fixed workload is ideally sharded across admitted packages. Compute and memory service time are work/rate; local time is their maximum. Communication time is payload divided by the smaller of aggregate rack bandwidth and the explicit hall/receiver ceiling. A serialized schedule adds communication to local time. The fully overlapped option takes their maximum. Roofline is a performance bound, not evidence that implementations attain it. [Berkeley Lab's Roofline model guidance](https://amcr.lbl.gov/departments/computer-science-department/ppan/roofline-performance-model/).

Both schedules are authored bounds. Fully overlapping output communication requires a valid chunked/pipelined schedule and buffering; this model does not prove those dependencies or include pipeline fill/drain. Default serial communication is the simpler explanatory case. Run-phase rates are averaged over a whole step, so animated traffic must not be presented as an actual instruction or packet trace. The model's exact event integration is exact for these assumed service durations, not an execution trace of a real machine.

## Checkpoints, faults and useful work

A requested running-time checkpoint interval is rounded up to the next complete work-step boundary. The job then pauses for a full checkpoint write and atomic commit delay. Only a completed commit is restart-valid. A fault loses subsequent completed steps plus the fraction of the interrupted step. Repair/relaunch time and reading the last committed checkpoint are separate pauses. An interrupted write or read retains the bytes already transferred in the resource counters. The earlier committed state survives.

This restart interpretation follows SCR's requirement for completed valid checkpoints and restart from the most recent available valid checkpoint. SCR supports more sophisticated tiers, redundancy and asynchronous operation than modeled here. [LLNL SCR 3.1.0, *Integrate SCR*, “Restart with SCR”](https://scr.readthedocs.io/en/latest/users/integration.html).

The deterministic work ledger is:

```
executed work-equivalents
  = checkpointed steps + volatile completed steps + in-flight fraction + lost work-equivalents
retained useful steps = checkpointed steps + volatile completed steps
```

Executed arithmetic includes replayed work. Retained useful steps exclude an unfinished step; volatile completed steps can still be lost in a later fault. Checkpointed steps are the durable subset. Do not multiply these results by an additional reliability, checkpoint-efficiency or lost-work factor. “Useful” here means completed and still retained under the declared workload criterion; it does not measure model quality, convergence or scientific value.

Commissioning requires all five synthetic gates. Null means a gate never opens. A fault scheduled before dispatch is explicitly ignored because there is no running job. Simultaneous completion is processed before a fault, so a checkpoint committed at that exact time survives. Repeated faults during a repair wait extend the union of waits; a fault during restore aborts that read and starts a new repair/restore cycle. Faults are prescribed job stops, not a probabilistic radiation, hardware lifetime or availability forecast. Feed/cooling failures, checkpoint corruption and failed repair are outside scope.
