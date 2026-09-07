# Observation to controlled action

The experience fits a two-parameter dynamics model from twelve identified calibration transitions, then uses that learned model in a separate closed-loop episode. Its purpose is to expose the distinction between prediction error, action selection and task outcome.

The nominal calibration plant is `x[t+1] = x[t] + 0.2 v[t]`, `v[t+1] = 0.9 v[t] + 0.2 u[t]`. Least squares recovers the two velocity parameters. The episode lasts sixty 0.2-second samples, starts at rest and targets position 2 m. Its actual retention, gain and one impulse can change without rewriting the calibration corpus. No episode ground truth is used to refit the controller.

The predictive controller enumerates all `3^H` sequences of actions −1, 0 and +1 for horizons one through five. It penalizes position error and action effort, adds a terminal position/velocity penalty, checks predicted position against [−0.5, 3] m, applies the first selected action and replans. A proportional/velocity-feedback baseline and a fixed open-loop sequence use the same episode conditions. A fitted dynamics model does not imply a learned neural policy or reinforcement learning.

The sensor reports true position plus seeded uniform bounded noise, optionally delayed. Velocity is estimated from successive observations and one model-based velocity transition; delayed state is deliberately not extrapolated to current time. This makes stale-state consequences observable. The dynamics, observation, proposal, applied command and next state are separate trace fields.

One candidate sequence costs one **authored** millisecond. This is an explicit scheduling assumption, not measured JavaScript time or a hardware benchmark. A missed deadline holds the previous applied action. No feasible plan produces zero action. Neither response guarantees that the object stops or remains within its physical constraint.

## Outcome and evidence

A passing episode must finish within 0.1 m of the goal, at speed at most 0.1 m/s, and never leave the position interval. RMS position error uses sixty next-state samples. The default planner and feedback baseline both pass; the simpler feedback baseline has lower action-squared effort in this particular fixture. A four-sample delay violates the constraint. A five-step horizon with the default 100 ms assumed deadline misses all sixty deadlines and holds zero action.

Eight automated checks cover independent parameter fitting, a physical transition, exhaustive candidate costs, sensor timestamps, actual loop outcomes, failure mechanisms, calibration/episode separation and portable-record validation. `validation.json` records the exact implementation identity and computed fixtures. No human learner observation or physical robot trial is claimed.

The source anchors are MIT's [system identification notes](https://underactuated.mit.edu/sysid.html) (problem formulation and equation versus simulation error) and [trajectory optimization notes](https://underactuated.mit.edu/trajopt.html) (finite-horizon control and receding-horizon execution). The scalar plant, corpus, action search and all numeric settings are original authored teaching fixtures; they do not reproduce a source's robot or experimental result.

## Records

`ai-atlas.closed-loop.v1` stores explicitly saved input records. Inputs, model version and source-content identity are validated before restoration. The previous raw record is retained before replacing the saved slot. Invalid or incompatible text remains inspectable and exportable. Importing or restoring does not mark any lesson complete. This experience saves reproducible inputs, not a claim that a past episode was independently observed.
