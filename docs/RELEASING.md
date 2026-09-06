# Releasing AI Machinery Atlas

This guide describes how to turn the portable source package into a reviewable GitHub release and static deployment. The release repository is [SemiAIFoundry/ai-machinery-atlas](https://github.com/SemiAIFoundry/ai-machinery-atlas).

## 1. Review the source

Confirm the package contains the application source, dependency lockfile, tests, build configuration, MIT license, third-party notices, and documentation. Exclude dependency folders, caches, local paths, credentials, private Sites metadata, and unrelated workspace files.

Review the version in `package.json`, `CHANGELOG.md`, and `CITATION.cff`. Keep the citation URL pointed at the canonical atlas. Keep the verified repository URL synchronized across the README, package metadata, and citation metadata.

Check changed scientific claims and product specifications against their linked primary sources. Preserve the distinction between conceptual geometry, configuration-specific values, and unresolved frontier questions.

## 2. Validate a clean checkout

Use Node.js 22.13 or later and run:

```sh
npm ci
npm test
npm run preview
```

Automated checks cover curriculum and scene consistency, numerical invariants, TypeScript, and portable asset references. Record the commands and actual outcomes in the release notes. Do not describe automated checks as browser UI QA.

Before calling a deployment browser-verified, manually inspect a served production build at both `/` and a representative subdirectory such as `/ai-atlas/`. Check:

- The entry page, JavaScript, CSS, fonts, and static companion files load without blocked requests.
- A fragment link such as `#hbm-stack` selects the expected lesson, including on a fresh page load.
- Component selection, field-guide tabs, search, guided paths, knowledge checks, and numerical labs work.
- Scenes can be navigated and reset, with readable content when WebGL is unavailable or constrained.
- The film opens and its controls, generated narration, and full-screen behavior work under the deployment’s content security policy.
- Keyboard navigation, narrow layouts, and the motion controls remain usable.

Record the browser and device used, any limitations, and whether optional WebMCP registration was exercised. If no browser check was performed, state that clearly.

## 3. Prepare release artifacts

Create two separate archives:

1. A **source archive**, including the lockfile, documentation, licenses, and test sources, but excluding `node_modules/`, `dist/`, private hosting configuration, and caches.
2. A **static-site archive**, containing the built `dist/` files and the notices needed for the bundled assets. Its entry point should be `index.html` at the archive root.

Use versioned names such as `ai-machinery-atlas-v1.0.0-source.zip` and `ai-machinery-atlas-v1.0.0-static.zip`. Produce SHA-256 checksums for the final archives and verify them after copying. Include the exact source commit once the release repository exists.

Review the unpacked source archive in a clean directory: the documented install, test, and build commands should work without access to the original workspace. Verify that no private project IDs, credentials, or absolute local paths have been exported.

## 4. Publish to GitHub

Create or select the repository under the verified account. Choose the intended visibility and confirm that all bundled materials are suitable for that audience. Push the reviewed source, tag the release version, and create a release with the two archives, checksums, and concise validation notes.

Use a draft release while the package is still being reviewed. Publishing a release is a separate action from creating the archives. Do not label a release as published until the repository, tag, and downloadable artifacts are accessible at their actual URLs.

## 5. Deploy the static site

The build uses Vite’s relative base `./`. Upload the contents of `dist/` to an HTTP or HTTPS static host, preserving file names and paths. Serve a subdirectory entry with a trailing slash and appropriate JavaScript, CSS, font, and HTML content types. Lesson navigation uses fragments, so no per-lesson server rewrite is needed.

For GitHub Pages, select the repository’s supported Pages publication method and publish the generated static files. Verify the resulting project URL instead of assuming a domain or path.

For SemiAIFoundry, the canonical atlas location is `https://semiaifoundry.com/ai-atlas/`. Its host may apply a route-specific content security policy to support the React scene controls and embedded film. Validate that policy without broadening unrelated pages’ permissions.

Keep the previous deployment or release artifact available until the new deployment is confirmed. Update external links only after the new destination is live.
