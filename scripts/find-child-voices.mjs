// Looks through ElevenLabs' shared voice library for voices that sound like children, for the
// Spelling Bee's small spellers, and writes a page listing them with a play button for each
// preview (previews are public: listening costs nothing).
//
//   ELEVENLABS_API_KEY=... node scripts/find-child-voices.mjs <out.html>
//
// Pick one for the small boy and one for the girls, then record their letters:
//   node scripts/make-bee-letters.mjs --set <name> --voice <voice_id> --owner <public_owner_id>
import { writeFileSync } from 'node:fs';

const key = process.env.ELEVENLABS_API_KEY;
if (!key) { console.error('ELEVENLABS_API_KEY is not set.'); process.exit(1); }
const out = process.argv[2] || 'child-voices.html';
const TERMS = ['child', 'kid', 'little boy', 'little girl', 'young boy', 'young girl', 'children', 'cartoon kid'];
const seen = new Map();
for (const term of TERMS) {
  const u = new URL('https://api.elevenlabs.io/v1/shared-voices');
  u.searchParams.set('page_size', '60');
  u.searchParams.set('search', term);
  u.searchParams.set('language', 'en');
  const r = await fetch(u, { headers: { 'xi-api-key': key } });
  if (!r.ok) { console.error('search failed', term, r.status, (await r.text().catch(() => '')).slice(0, 160)); continue; }
  const { voices = [] } = await r.json();
  for (const v of voices) {
    const words = `${v.name} ${v.description || ''} ${v.descriptive || ''} ${v.use_case || ''}`.toLowerCase();
    if (!/\b(child|children|kid|kids|boy|girl|little|young|teen|cartoon)\b/.test(words)) continue;
    if (!seen.has(v.voice_id)) seen.set(v.voice_id, { ...v, term });
  }
}
const list = [...seen.values()].sort((a, b) => (a.gender || '').localeCompare(b.gender || '') || (b.cloned_by_count || 0) - (a.cloned_by_count || 0));
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
writeFileSync(out, `<!doctype html><meta charset="utf-8"><title>Child voices</title>
<style>body{font-family:system-ui,sans-serif;margin:1rem;max-width:60rem}li{margin:.6rem 0;padding:.5rem;border-bottom:1px solid #ddd}code{background:#f3f3f3;padding:0 .3rem}audio{vertical-align:middle;height:2rem}</style>
<h1>ElevenLabs voices that may sound like children (${list.length})</h1><ol>
${list.map((v) => `<li><b>${esc(v.name)}</b> &middot; ${esc(v.gender)} &middot; ${esc(v.age)} &middot; ${esc(v.accent)}<br>${esc(v.description)}<br>
<audio controls preload="none" src="${esc(v.preview_url)}"></audio><br>voice <code>${esc(v.voice_id)}</code> owner <code>${esc(v.public_owner_id)}</code></li>`).join('\n')}
</ol>`);
for (const v of list) console.log(`${v.gender || '?'}\t${v.age || '?'}\t${v.name}\tvoice ${v.voice_id}\towner ${v.public_owner_id}`);
console.log(`\n${list.length} voices; listen at ${out}`);
