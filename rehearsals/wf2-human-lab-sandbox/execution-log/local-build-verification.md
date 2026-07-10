# WF2 Local Build Verification

## Commands Run

- `npm --prefix "rehearsals/wf2-human-lab-sandbox/landing-project" install`
- `npm --prefix "rehearsals/wf2-human-lab-sandbox/landing-project" run build`
- `npm --prefix "rehearsals/wf2-human-lab-sandbox/landing-project" run start -- -H 127.0.0.1 -p 3022`
- `curl -I "http://127.0.0.1:3022/"`

## Result

- Install completed.
- Build completed successfully with Next.js 15.5.19.
- Build copied `0` image files because no declared media assets resolved.
- Local runtime verification returned `HTTP/1.1 200 OK`.

## Notes

- `npm` emitted a non-fatal warning: `Unknown env config "devdir"`.
- `npm install` emitted a non-fatal tar warning for a package-local `.claude/settings.local.json`.
- `next start` must be bound to `127.0.0.1` in this sandbox; the default host path failed on a blocked network-interface lookup.
