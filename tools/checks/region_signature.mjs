// Region identity guard: every campaign region uses its signature family in at least three main rooms,
// and every named mechanic in the brief appears in at least one main room. This catches accidental flattening
// of authored rooms back into generic stone/platform layouts.
export default async ({ page }) => {
  const r = await page.evaluate(() => {
    const sig = {
      r1: { mud:'m', cart:'Q', crumble:'c' },
      r2: { spring:'j', vent:'v', oneWay:'=' },
      r3: { salt:'s', conveyor:['<','>'] },
      r4: { tar:'t', plate:'A', timedGate:['Y','Z'] }
    };
    const out = {};
    for (const [region, kinds] of Object.entries(sig)) {
      const defs = Object.values(G.roomDefs).filter(d => d && d.region === region && d.kind === 'main');
      const rows = defs.map(d => ({ id:d.id, text:(d.grid || []).join(''), marks:(d.marks||[]).map(m=>m.ch).join('') }));
      const hits = {};
      let signatureRooms = 0;
      for (const [name, chars0] of Object.entries(kinds)) {
        const chars = Array.isArray(chars0) ? chars0 : [chars0];
        hits[name] = rows.filter(q => chars.some(ch => q.text.includes(ch) || q.marks.includes(ch))).map(q => q.id);
      }
      for (const q of rows) if (Object.values(kinds).some(chars0 => (Array.isArray(chars0)?chars0:[chars0]).some(ch => q.text.includes(ch) || q.marks.includes(ch)))) signatureRooms++;
      out[region] = { mains:rows.length, signatureRooms, hits };
    }
    return { out, errors:G.errors.slice() };
  });
  const bad = [];
  for (const [region, q] of Object.entries(r.out)) {
    if (q.signatureRooms < 3) bad.push(region + ' signature appears in only ' + q.signatureRooms + ' main rooms');
    for (const [name, rooms] of Object.entries(q.hits)) if (!rooms.length) bad.push(region + ' missing ' + name);
  }
  if (r.errors.length) bad.push('G.errors: ' + r.errors.join(' | '));
  if (bad.length) throw new Error(bad.join('; '));
  return Object.entries(r.out).map(([k,v]) => k + ':' + v.signatureRooms + '/' + v.mains).join(' ') + ' signature main rooms';
};
