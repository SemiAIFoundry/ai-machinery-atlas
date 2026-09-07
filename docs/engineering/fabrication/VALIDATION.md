# Model validation

Validated 2026-09-07 with Node's TypeScript stripping and TypeScript strict checking.

The 14 Node tests pass. They independently check dimensional conversion and default accounting; complete-die wafer geometry and population conservation; oxide and deposited-film boundaries; latent-state versus material-volume changes; target/mask/stop etch budgets; failed-mask propagation; persistent specimen identity; unchanged inspection geometry; interval boundary decisions; uncertainty/physical-state separation; conditional yield denominators; separate interface evidence; qualification and supply gates; bounded numerical extremes; and strict, pure evaluation.

Default expected output is 744.1797472709371 packages per illustrative lot: 597 grid-fit dies per wafer × four wafers × exp(-0.12) gives 2,117.966002880572 expected screened dies. Eight already-accepted HBM stacks per package limit starts to 800. Conditional assembly survival is 0.9302246840886714.

Halving tolerance scale or increasing uncertainty scale to three retains the central 81-die cohort and holds the remaining 516 dies per wafer for review. The accepted expectation becomes 133.65571585523472 packages per lot. Neither control changes geometry. Exhausting the resist mask or leaving a thick target uncleared produces zero eligible dies. Interface registration failure or missing scoped qualification separately prevents accepted output despite positive screened-die inventory.

All nine distinct linked lesson IDs were checked against the atlas lesson-to-lab catalog. Source IDs resolve through the included source ledger. The eight reproducible examples contain complete validated inputs. Markdown links to local bundle files are portable.

These checks validate software behavior and explicit educational assumptions. Real wafer measurements, device function, process recipes, material qualification and field reliability remain outside this model's claims.
