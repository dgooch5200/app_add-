# UNRIVAL — Fixture Film

A looping, ~2.5-minute brand film showing how **UNRIVAL** (Chauvet Professional's
NFC fixture-configuration app) sets up a Chauvet lighting fixture. Built with
[Three.js](https://threejs.org/) (WebGL) and [GSAP](https://gsap.com/) — pure
static front-end, no build step.

## Run locally

Any static file server works. From this folder:

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>. (Open it through a server, not `file://` —
ES-module imports and `fetch()` for the 3D assets require `http`.)

## Deploy (GitHub Pages)

Deployment is automated by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):
every push to `main` publishes the site.

**One-time setup** in the GitHub repo:

1. **Settings → Pages → Build and deployment → Source: _GitHub Actions_.**
   (The workflow also attempts to enable this automatically on its first run.)
2. Push to `main` — the **Deploy to GitHub Pages** workflow runs and publishes.

The live URL appears in the workflow run summary, and afterwards under
**Settings → Pages**. For this repo it will be:

```
https://dgooch5200.github.io/app_add-/
```

All asset paths are relative, so the site works correctly under that
`/app_add-/` sub-path.

## What ships vs. what doesn't

The deployed site is only `index.html`, `css/`, `js/`, and `assets/`
(minus the unused hi-res model set). Heavy **source-only** files — the `.mvr`
and `.gdtf` 3D source, reference PDF/photos, raw `screenshots_*/`, and the
`videos/` transcripts — are excluded via [`.gitignore`](.gitignore) and never
deployed.

## Tech notes

- Three.js and GSAP load from the jsDelivr CDN via an import map — nothing to
  install.
- The hero fixture is the real **Maverick Storm 1 Flex** geometry (medium-res
  GLB set under `assets/storm1flex/`).
- Phone and fixture-LCD screens are canvas recreations of the real app UI,
  driven seek-safely from the GSAP master timeline so the film scrubs cleanly.
