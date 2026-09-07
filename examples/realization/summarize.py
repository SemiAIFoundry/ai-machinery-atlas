#!/usr/bin/env python3
"""Extract a small viewer artifact from actual synthesis/place-route outputs."""
from pathlib import Path
import hashlib, json, re
root=Path(__file__).resolve().parent
out=root/'artifacts'
mapped=json.loads((out/'mapped.json').read_text())['modules']['atlas_adder']
routed=json.loads((out/'routed.json').read_text())['modules']['top']
timing=json.loads((out/'timing.json').read_text())
formal=(out/'formal.log').read_text()
rtl=(out/'rtl-simulation.log').read_text()
simulation=(out/'mapped-simulation.log').read_text()
assert 'SAT proof finished - no model found: SUCCESS!' in formal
assert 'PASS: 256 exhaustive input pairs' in rtl and 'PASS: 256 exhaustive input pairs' in simulation
assert 'Program finished normally.' in (out/'place-route.log').read_text()
cells=[]
for name,c in routed['cells'].items():
    bel=c['attributes'].get('NEXTPNR_BEL','')
    m=re.match(r'X(\d+)/Y(\d+)/(.+)',bel)
    assert m, ('Missing placement',name)
    cells.append(dict(name=name,type=c['type'],bel=bel,x=int(m[1]),y=int(m[2]),site=m[3],
        parameters=c['parameters'],connections=c['connections'],directions=c['port_directions']))
nets=[]
for name,n in routed['netnames'].items():
    route=n.get('attributes',{}).get('ROUTING','').strip()
    if route:
        wires=route.split(';')[::3]
        locations=[]
        for w in wires:
            m=re.match(r'X(\d+)/Y(\d+)/(.+)',w)
            if m:locations.append(dict(x=int(m[1]),y=int(m[2]),wire=m[3]))
        nets.append(dict(name=name,bits=n['bits'],locations=locations,route=route))
files=['adder.v','exhaustive-tb.v','prove.ys','synthesize.ys','artifacts/mapped.json','artifacts/mapped.v',
 'artifacts/routed.json','artifacts/timing.json','artifacts/formal.log','artifacts/rtl-simulation.log',
 'artifacts/mapped-simulation.log','artifacts/adder.asc','artifacts/adder.bin']
data=dict(version='atlas-realization-1',target='Lattice iCE40HX1K · TQ144',seed=7,constraintMHz=100,
 contract='Unsigned four-bit a + b produces five-bit q. Rising edge n captures the sum of the input sample at n−1; power-on fill is unspecified.',
 proof=dict(method='Yosys SAT over all combinational input values',passed=True),
 simulation=dict(method='Icarus Verilog: RTL and mapped iCE40 primitive netlist',inputPairs=256,passed=True),
 cells=cells,nets=nets,timing=timing,
 mapped=dict(ports=mapped['ports'],cells=[dict(name=name,type=c['type'],parameters=c['parameters'],connections=c['connections']) for name,c in mapped['cells'].items() if c['type']!='$scopeinfo']),
 source=(root/'adder.v').read_text(),
 tools={key:(out/name).read_text().splitlines()[0] for key,name in [('yosys','yosys-version.log'),('nextpnr','nextpnr-version.log'),('iverilog','iverilog-version.log')]},
 files=[dict(path=p,sha256=hashlib.sha256((root/p).read_bytes()).hexdigest(),bytes=(root/p).stat().st_size) for p in files],
 scope=['Actual FPGA resource mapping and routing from public tools, not an ASIC standard-cell layout or a transistor process model.',
 'IO pins are automatically assigned. There is no board wiring contract, external IO timing constraint or hardware measurement.',
 'The reported internal clock timing uses the nextpnr device model for this device and routing seed. It is not measured frequency or full timing signoff.',
 'Functional proof and netlist simulation do not establish manufacturing yield, field reliability, broad CRG claims or AGI capability.'])
target=root.parent.parent/'public/realization-data'
target.mkdir(parents=True,exist_ok=True)
(target/'adder.json').write_text(json.dumps(data,indent=2)+'\n')
print('Extracted',len(cells),'placed cells,',len(nets),'routed nets and the verified five-bit arithmetic contract.')
