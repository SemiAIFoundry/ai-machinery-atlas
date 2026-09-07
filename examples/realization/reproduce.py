#!/usr/bin/env python3
"""Rebuild the declared FPGA example. Run from this directory with tools on PATH."""
from pathlib import Path
import hashlib, json, re, shutil, subprocess

HERE = Path(__file__).resolve().parent
OUT = HERE / 'artifacts'
OUT.mkdir(exist_ok=True)

def run(args, log):
    with (OUT / log).open('w') as stream:
        subprocess.run(args, cwd=HERE, stdout=stream, stderr=subprocess.STDOUT, check=True)

for executable in ['yosys', 'nextpnr-ice40', 'iverilog', 'vvp', 'icepack']:
    if not shutil.which(executable):
        raise SystemExit('Missing tool: ' + executable + '. See README.md.')
run(['yosys', '-V'], 'yosys-version.log')
run(['nextpnr-ice40', '--version'], 'nextpnr-version.log')
run(['iverilog', '-V'], 'iverilog-version.log')
run(['yosys', '-Q', '-T', '-s', 'prove.ys'], 'formal.log')
run(['yosys', '-Q', '-T', '-s', 'synthesize.ys'], 'synthesis.log')
run(['nextpnr-ice40', '--hx1k', '--package', 'tq144', '--json', 'artifacts/mapped.json',
     '--write', 'artifacts/routed.json', '--asc', 'artifacts/adder.asc', '--report', 'artifacts/timing.json',
     '--seed', '7', '--freq', '100', '--pcf-allow-unconstrained'], 'place-route.log')
# Ask Yosys for its installed share directory, preserving the library's own license.
share = subprocess.check_output(['yosys-config', '--datdir'], text=True).strip()
run(['iverilog', '-g2012', '-s', 'testbench', '-o', 'artifacts/rtl-sim', 'adder.v', 'exhaustive-tb.v'], 'rtl-compile.log')
run(['vvp', 'artifacts/rtl-sim'], 'rtl-simulation.log')
run(['iverilog', '-g2012', '-s', 'testbench', '-o', 'artifacts/mapped-sim', 'artifacts/mapped.v',
     str(Path(share) / 'ice40/cells_sim.v'), 'exhaustive-tb.v'], 'mapped-compile.log')
run(['vvp', 'artifacts/mapped-sim'], 'mapped-simulation.log')
subprocess.run(['icepack', 'artifacts/adder.asc', 'artifacts/adder.bin'], cwd=HERE, check=True)
subprocess.run(['python3', 'summarize.py'], cwd=HERE, check=True)
