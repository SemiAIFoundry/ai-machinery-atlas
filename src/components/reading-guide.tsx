import { records, chapters, journeys } from '@/lib/atlas';

export default function ReadingGuide() {
  return <div className="about-body">
    <p>Explore {records.length} lessons, {chapters.length} branches and {journeys.length} learning paths across matter, chip design and fabrication, packaging and memory, processing architectures, infrastructure, software, and intelligence. The CRG bridge connects computation intent, physical realization and verification evidence.</p>

    <h3>Start with a lesson</h3>
    <p>Choose a <strong>Learning path</strong> for a connected journey, search for a component, or browse a branch. On phones, use <strong>Contents</strong> or <strong>Browse lessons</strong> to change topics. Open <strong>Explore 3D</strong> to inspect a model, then <strong>Back to lesson</strong> to continue reading. <strong>Menu</strong> opens the other atlas destinations. On larger screens, the model and field guide sit alongside one another.</p>

    <h3>Read the field guide</h3>
    <p>Use <strong>Learn</strong> for mechanisms, prerequisites and knowledge checks; <strong>Science</strong> for equations, units, assumptions and tradeoffs; <strong>Specs</strong> for configuration-specific values; and the field guide’s <strong>Connections</strong> tab for interfaces and related lessons.</p>

    <h3>Inspect the machinery</h3>
    <p>In the model workspace, <strong>Anatomy</strong> shows constituent parts, <strong>Process</strong> follows successive steps with their inputs, outputs and measurements, and <strong>Connections</strong> maps production, integration and functional relationships. Select a component, drag to orbit, and use <strong>Explode</strong>, <strong>Isolate</strong> or the translucent cutaway to inspect it. <strong>Process</strong> offers cross-sections and spatial inspection where a specific material transformation is represented, with sequence maps for the other routes. Enable <strong>Eco</strong> to reduce rendering work.</p>

    <h3>Follow a connected investigation</h3>
    <p>Open <strong>Investigations</strong> to connect a switching event to arithmetic, two wafer streams to a powered accelerator system, or a small attention calculation to an evaluated result. Change the shared conditions, record a prediction, explain the result and attempt a transfer question. Your first saved attempt is retained separately from practice. Export a learning file to keep written work; share a scenario link to send just the inputs.</p>

    <h3>Test an idea and follow the evidence</h3>
    <p>Open <strong>Labs</strong> to vary assumptions and explore numerical consequences—including HBM stack construction, inference memory placement and a token’s memory, compute and communication path. Follow the memory lessons into TC-NCF, MR-MUF, hybrid bonding, HBF read tiers and hall constraints. <strong>Evidence</strong> retains source dates, scope and claim status; <strong>Compare</strong>, <strong>Global</strong> and <strong>Historical breakthroughs</strong> provide wider context. Each lesson links to its sources.</p>

    <p>Geometry is explanatory and dimensions may be exaggerated. Models and labs state their assumptions; they do not establish private model architecture or an AGI timetable.</p>
    <p>Interaction design inspired by <a href="https://github.com/ashemag/human-atlas" target="_blank" rel="noreferrer">ashemag’s Human Atlas</a>. The component geometry and AI curriculum were created for this atlas.</p>
    <p>Published by <a href="https://semiaifoundry.com/">Semi AI Foundry, LLC</a>. <a href="https://github.com/SemiAIFoundry/ai-machinery-atlas">Source code</a> · <a href="https://github.com/SemiAIFoundry/ai-machinery-atlas/releases/tag/v1.2.0">v1.2.0 downloads</a> · <a href={`${import.meta.env.BASE_URL}ascent.html`} target="_blank" rel="noreferrer">Watch The Ascent ↗</a>.</p>
    <p className="license-use-note">Software and original content: academic, public-interest research, personal and hobby use permitted with attribution. <a href={`${import.meta.env.BASE_URL}licenses.html`}>Commercial use requires a separate written license.</a></p>
    <details><summary>Edition &amp; reproducibility</summary><p>Edition {__ATLAS_BUILD__.edition} · {__ATLAS_BUILD__.dirty?'working preview':'committed source'}. Models use explicit versions so exported work can be checked against the calculation that produced it.</p><dl><dt>Source revision</dt><dd>{__ATLAS_BUILD__.commit?.slice(0,12)||'source archive'}</dd><dt>Content fingerprint</dt><dd style={{overflowWrap:'anywhere'}}>{__ATLAS_BUILD__.contentSha256}</dd></dl><a href={`${import.meta.env.BASE_URL}build-info.json`}>Download build identity</a></details>
    <p className="meta-explanation">v1.2.0 · September 2026. Learning progress stays in this browser’s local storage.</p>
  </div>;
}
