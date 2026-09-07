# A computation carried into a physical resource map

The exact contract is unsigned four-bit addition with a fifth carry bit. A registered wrapper captures inputs at one rising edge and the sum at the next. Pipeline fill is unspecified. The browser shows actual synthesis, FPGA placement, routing and timing artifacts, alongside an executable model of the mapped LUT/register netlist.

Run `python3 reproduce.py` from this directory with **Yosys 0.68**, **nextpnr-ice40 0.11.1**, **Icarus Verilog 13.0** and **IceStorm 1.1** available on PATH, including `yosys-config`, `vvp` and `icepack`. The tested native macOS packages were obtained from Homebrew. Versions, logs, device, seed, frequency constraint and SHA-256 artifact identities are retained. A different tool/device database version can change placement and timing; reproduce arithmetic independently and compare the recorded versions before expecting byte identity.

The flow performs:

1. A Yosys SAT proof of the combinational ripple-adder contract for every input.
2. iCE40 synthesis of the registered wrapper and export of the mapped netlist.
3. Placement and routing for HX1K/TQ144, seed 7, a 100 MHz internal clock target, and automatically assigned IO pins.
4. Independent Icarus simulation of all 256 input pairs against both RTL and the mapped primitive netlist.
5. Bitstream generation and extraction of a compact, source-traceable browser artifact.

This is a **bounded FPGA realization example**. It is not ASIC tapeout, a PDK-based transistor layout, external interface timing signoff, board qualification or measured device behavior. The bitstream has no declared board wiring and is retained as a tool artifact, not offered as a board programming recipe. Public iCE40 primitive models remain installed tool dependencies under their own notices; the example does not change those licenses.

The seven CRG boundaries provide an interpretive framework: intent, representation, architecture, design, physical build, system and evidence. This example supplies scoped evidence across the first four and a configured FPGA resource artifact. Fabrication, package qualification and system/application evidence are separate obligations. It does not constitute empirical proof of the framework's broader claims.

Primary documentation: [Yosys SAT](https://yosyshq.readthedocs.io/projects/yosys/en/v0.68/cmd/index_formal.html#sat-solve-a-sat-problem-in-the-circuit), [Yosys iCE40 synthesis](https://yosyshq.readthedocs.io/projects/yosys/en/v0.68/cmd/index_techlibs_ice40.html#synth-ice40-synthesis-for-ice40-fpgas), [nextpnr iCE40 constraints](https://github.com/YosysHQ/nextpnr/blob/main/docs/ice40.md), [Icarus Verilog](https://steveicarus.github.io/iverilog/), [Project IceStorm](https://prjicestorm.readthedocs.io/).
