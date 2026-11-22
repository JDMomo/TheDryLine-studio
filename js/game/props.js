/* Room props. Template character -> prop type (see G.defineRoom). The clipping booth (K, booth, clip) is no longer placed in any run; its code stays here unused.
   I plinth (a token or trinket to take; kiosk wares are plinths with a price)   C trunk (lost trunk, opens when the room is clear)
   R ticket (ticket machine)   S plinth with a price (kiosk ware)   K booth (clipping booth)   M post (signal post)
   H standpipe   D door (doorway)   G gate (region gate, hub)   ? sign   X crack (cracked barrier).   Spawned by other props: clip (a clipping booth choice). */
(() => {
'use strict';
const G = window.G, C = G.C, U = G.util, fx = G.fx, art = G.art;

const priceOf = d => Math.round(d.price * G.run.mods.shopCost);
const useName = p => G.input.name('interact', p);
const goodName = d => d.item ? G.itemDefs[d.item].name : d.trinket ? G.trinketDefs[d.trinket].name : d.scrip ? 'Purse of scrip' : '';
const goodDesc = d => d.item ? G.CLASSES[G.itemDefs[d.item].cls].name + ' token. ' + G.itemDefs[d.item].desc : d.trinket ? 'Trinket. ' + G.trinketDefs[d.trinket].desc : d.scrip ? d.scrip + ' scrip.' : '';
// Material card of a plinth's good: { tags, line } (chips and the interactions line, see G.materials), or null.
const goodMat = d => { const def = d.item ? G.itemDefs[d.item] : d.trinket ? G.trinketDefs[d.trinket] : null; return def && def.mat ? { tags: def.mat, line: def.inter } : null; };
const goodColor = d => d.item ? G.itemDefs[d.item].color : d.trinket ? G.trinketDefs[d.trinket].color : d.scrip ? '#fff3c4' : '#888';
const hasGood = d => !!(d.item || d.trinket || d.scrip);
function drawGood(ctx, d, x, y, s) {
  if (d.item) G.items.icon(ctx, d.item, x, y, s); else if (d.trinket) G.trinkets.icon(ctx, d.trinket, x, y, s);
  else if (d.scrip) { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#fff3c4'; ctx.fillRect(-7 * s, -7 * s, 14 * s, 14 * s); ctx.fillStyle = '#7a531c'; ctx.fillRect(-3 * s, -3 * s, 6 * s, 6 * s); ctx.restore(); }
}
function pay(cost) {
  if (G.run.shards < cost) { fx.say('Not enough scrip', 'This costs ' + cost + '.', 1.6); return false; }
  G.run.shards -= cost; return true;
}
// Remove every other prop of the same group (the choices nobody took).
function closeGroup(pr) { if (pr.data.group) for (const o of G.rooms.current.props) if (o !== pr && o.data.group === pr.data.group) o.gone = true; }
function stand(ctx, x, y) { ctx.fillStyle = '#22322e'; ctx.fillRect(x - 16, y - 14, 32, 14); ctx.fillStyle = '#3f6b5a'; ctx.fillRect(x - 19, y - 17, 38, 4); }
const TICKET_PRICES = [30, 45];           // the machine can be used twice: the first roll costs 30 scrip, the second 45
const ticketCost = () => TICKET_PRICES[Math.min(G.run.tickets, TICKET_PRICES.length - 1)];
// One line shown the first time a kind of prop is approached (it stops after the player has stood at one for a few seconds).
const TEACH = {
  plinth: 'A plinth holds a token. Use/enter takes it; with the party full, it swaps with your selected token.',
  kiosk: 'The kiosk sells trinkets for scrip. The price is on each ware.',
  trunk: 'A lost trunk opens when the room is clear.',
  ticket: 'The ticket machine shows three tickets for scrip. Keep one; the rest go void. A second roll costs more.',
  booth: 'A clipping booth trades one health pip for a new token of a cut you choose.',
  clip: 'Each cut has a shape and colour. The same shape shows on a Warden\'s fare slot.',
  post: 'A signal post teaches a move. It lasts the whole run.',
  standpipe: 'A standpipe mends the whole party, once per run.',
  door: 'Doorways lead to side rooms. Every side room has a way back.',
  gate: 'Every gate is open. Each line ends at a Warden.',
  board: 'The station board is also your map. Use it here, or press Map anywhere on the line.',
  lever: 'Levers open their paired mechanical gate for a few seconds.',
  plate: 'A pressure plate holds its paired gate open while someone stands on it.',
  rail_cart: 'Rail carts carry anything grounded on their deck. Ride with them or step off.'
};
// Layout of the lock chart board (pr.x centre, pr.y bottom edge): panel, and per region the name box and the three cut boxes. Used by draw and by boxes().
const BOARD_W = 150, BOARD_ROW = 15;
function boardLayout(pr, ctx) {
  const rows = Object.values(G.regionDefs).sort((a, b) => a.gate - b.gate), h = 26 + rows.length * BOARD_ROW + 6, top = pr.y - h, x0 = pr.x - BOARD_W / 2;
  const out = { x0, x1: x0 + BOARD_W, y0: top, y1: pr.y, rows: [] };
  rows.forEach((r, i) => {
    const ry = top + 34 + i * BOARD_ROW; ctx.font = '500 10px ' + C.FONT; const w = ctx.measureText(r.name).width;
    out.rows.push({ region: r, y: ry, name: { x0: x0 + 8, x1: x0 + 8 + w, y0: ry - 6, y1: ry + 6 },
      cuts: [0, 1, 2].map(k => { const cx = x0 + BOARD_W - 52 + k * 17; return { cx, x0: cx - 6, x1: cx + 6, y0: ry - 6, y1: ry + 6 }; }) });
  });
  return out;
}
const teachKey = pr => pr.type === 'plinth' && pr.data.price ? 'kiosk' : pr.type;
const PROP_SPRITE_SIZE = {
  trunk: [52, 56],
  ticket: [58, 82],
  sign: [34, 72],
  post: [38, 80],
  lamp_decor: [40, 78],
  crate_decor: [62, 110],
  banner_decor: [44, 116],
  furnace_decor: [70, 118]
};

/* Each type: draw(pr, ctx); optional update(pr, dt), interact(pr, player), prompt(pr, player) -> [title, line, hint] or null.
   A prop can only be used while it has a prompt; Use/enter follows the player's Up binding. */
const TYPES = {
  plinth: {     // data: { item | trinket, price, locked, group }
    interact(pr, p) {
      const d = pr.data;
      if (!hasGood(d)) return;
      if (d.locked && !G.rooms.current.cleared) return fx.say('Guarded', 'Clear the room first.', 1.6);
      if (d.item && G.game.partyItems().includes(d.item)) return fx.say(G.itemDefs[d.item].name, 'The party already carries one.', 1.8);   // never a second copy
      if (d.price && !pay(priceOf(d))) return;
      fx.spark(pr.x, pr.y - 50, 14, goodColor(d), 200, 0.5, 0);
      if (d.scrip) { G.run.shards += d.scrip; fx.say('+' + d.scrip + ' scrip', 'A purse of scrip.', 1.8); fx.floatText(pr.x, pr.y - 70, '+' + d.scrip + ' scrip', '#fff3c4'); d.scrip = 0; }
      else if (d.trinket) { fx.say(goodName(d), goodDesc(d)); G.game.addTrinket(d.trinket); d.trinket = null; }
      else {
        const took = d.item, old = G.game.takeItem(p, took);   // a full party swaps: the old token stays on the plinth
        d.item = old;
        fx.say(G.itemDefs[took].name, old ? 'Swapped for ' + G.itemDefs[old].name + ', which stays on the plinth.' : goodDesc({ item: took }));
      }
      d.price = 0; closeGroup(pr);
      if (d.group && String(d.group).startsWith('ticket') && !hasGood(d)) pr.gone = true;      // the ticket stand clears, so the machine can come back

    },
    prompt(pr, p) {
      const d = pr.data;
      if (!hasGood(d)) return null;
      const swap = d.item && G.game.freeSlots() === 0, sel = G.players[0] && G.players[0].items[G.players[0].sel];
      const hint = d.locked && !G.rooms.current.cleared ? 'Guarded until the room is clear'
        : d.price ? useName(p) + ' to buy for ' + priceOf(d) + ' scrip' + (G.run.shards < priceOf(d) ? ' (you have ' + Math.floor(G.run.shards) + ')' : '') + (swap ? ', swaps your selected token' : '')
        : swap ? useName(p) + ' to swap with your selected token' + (sel ? ' (' + G.itemDefs[sel].name + ')' : '') : useName(p) + ' to take';
      return [goodName(d), goodDesc(d), hint, goodMat(d)];
    },
    draw(pr, ctx) {
      const d = pr.data, x = pr.x, y = pr.y;
      stand(ctx, x, y);
      if (d.price) { ctx.fillStyle = '#7a531c'; ctx.fillRect(x - 22, y - 74, 44, 5); ctx.fillRect(x - 21, y - 74, 2, 60); ctx.fillRect(x + 19, y - 74, 2, 60); }
      if (!hasGood(d)) return;
      const fy = y - 42 + Math.sin(G.time * 2.2 + x) * 3;
      ctx.globalAlpha = 0.18; ctx.fillStyle = goodColor(d); ctx.beginPath(); ctx.arc(x, fy, 22, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1;
      drawGood(ctx, d, x, fy, 1.25);
      // the price tag gives way to the prompt (which names the price) while a player stands at the ware: the two used to overprint
      if (d.price && !G.players.some(p => !p.down && pr.near(p))) art.label(ctx, String(priceOf(d)), x, y - 84, 13, '#fff3c4', 'center', C.FONT, 600);
      if (d.locked && !G.rooms.current.cleared) { ctx.strokeStyle = '#9aa89f'; ctx.lineWidth = 2; ctx.strokeRect(x - 20, fy - 20, 40, 40); }
    }
  },
  trunk: {      // data: { item }
    update(pr) {
      const d = pr.data;
      if (!G.rooms.current.cleared) return;
      fx.spark(pr.x, pr.y - 20, 20, '#f4e6b8', 260, 0.5); fx.jolt(0.04, 4);
      pr.gone = true;                                  // the trunk gives way to a plinth holding what it carried
      if (hasGood(d)) G.rooms.current.props.push(G.props.make('plinth', pr.x, pr.y, Object.assign({}, d)));
    },
    prompt() { const n = G.rooms.current.enemies.filter(e => !e.dead && e.hp > 0).length; return ['Lost trunk', 'Something rattles inside.', n ? 'Opens when the room is clear: ' + n + ' left' : 'Opens when the room is clear']; },
    draw(pr, ctx) {
      const x = pr.x, y = pr.y;
      ctx.fillStyle = '#5a4630'; ctx.fillRect(x - 17, y - 20, 34, 20); ctx.fillStyle = '#b8482f'; ctx.fillRect(x - 17, y - 12, 34, 3); ctx.fillRect(x - 3, y - 15, 6, 8);
      ctx.fillStyle = '#8a6c46'; ctx.fillRect(x - 18, y - 26, 36, 8);
    }
  },
  ticket: {     // data: { choices: [3 loot], next: [3 loot] | null, used, wait }. Two uses per run: 30 scrip, then 45.
    update(pr) {
      const d = pr.data;
      if (!d.wait) return;
      if (G.rooms.current.props.filter(o => o.data.group === d.wait).length < 3) { d.wait = null; if (d.used) pr.gone = true; }   // a ticket was taken: the stand clears
    },
    interact(pr) {
      const d = pr.data;
      if (d.used || d.wait || !pay(ticketCost())) return;
      G.run.tickets++; G.run.stats.tickets = (G.run.stats.tickets || 0) + 1; fx.jolt(0.05, 5); fx.ring(pr.x, pr.y - 40, 10, 260, '#f4e6b8', 0.5);
      d.wait = 'ticket' + pr.x + '_' + G.run.tickets;
      d.choices.forEach((o, i) => G.rooms.current.props.push(G.props.make('plinth', pr.x + (i - 1) * 58, pr.y, Object.assign({}, o, { group: d.wait }))));
      if (d.next && d.next.length) { d.choices = d.next; d.next = null; } else d.used = true;
      fx.say('The machine prints three tickets', 'Take one. The others are void.' + (d.used ? '' : ' It can print once more.'), 2.6);
    },
    prompt(pr, p) {
      if (pr.data.used || pr.data.wait) return null;
      const c = ticketCost();
      return ['Ticket machine', 'Shows three tickets, tokens first. You keep one; the rest are void.' + (pr.data.next ? ' Two rolls per run.' : ' Last roll.'), useName(p) + ' to pay ' + c + ' scrip' + (G.run.shards < c ? ' (you have ' + Math.floor(G.run.shards) + ')' : '')];
    },
    draw(pr, ctx) {
      if (pr.data.wait) return;                       // the tickets stand where the machine is
      const x = pr.x, y = pr.y;
      ctx.fillStyle = '#22322e'; ctx.fillRect(x - 14, y - 52, 28, 52); ctx.fillStyle = '#3f6b5a'; ctx.fillRect(x - 18, y - 56, 36, 5);
      ctx.fillStyle = '#f4e6b8'; ctx.fillRect(x - 8, y - 44, 16, 10); ctx.fillStyle = '#0a1110'; ctx.fillRect(x - 6, y - 24, 12, 3);
      ctx.fillStyle = '#f4e6b8'; ctx.fillRect(x - 4, y - 21 + Math.sin(G.time * 3) * 1.5, 8, 6);
    }
  },
  booth: {      // data: { used }. Up: pick a cut; your selected token becomes a random token of that cut for one health pip.
    interact(pr, p) {
      if (pr.data.used) return;
      if (!p.items.length) return fx.say('Clipping booth', 'Carry a token to have it clipped.', 2);
      if (p.maxHp <= 1) return fx.say('Clipping booth', 'You have no health pip to give.', 2);
      if (!p.items[p.sel]) p.sel = 0;
      pr.data.used = true;
      Object.keys(G.CLASSES).forEach((cls, i) => G.rooms.current.props.push(G.props.make('clip', pr.x + (i - 1.5) * 50, pr.y, { cls, group: 'clip' + pr.x, stock: pr.data.stock || [] })));
      fx.say('Choose a cut', G.itemDefs[p.items[p.sel]].name + ' will be reclipped. It costs one health pip for the run.', 3.4);
    },
    prompt(pr, p) { return pr.data.used ? null : ['Clipping booth', 'Swap your selected token for a random one of a cut you choose.', useName(p) + ' to step in. Costs one max health pip for the run']; },
    draw(pr, ctx) {
      const x = pr.x, y = pr.y;
      ctx.fillStyle = '#1d2a2c'; ctx.fillRect(x - 20, y - 70, 40, 70); ctx.fillStyle = '#3f6b5a'; ctx.fillRect(x - 24, y - 74, 48, 6);
      ctx.fillStyle = pr.data.used ? '#2a3036' : '#f4e6b8'; ctx.fillRect(x - 12, y - 60, 24, 14);
      ctx.fillStyle = '#0a1110'; ctx.fillRect(x - 10, y - 38, 20, 38);
    }
  },
  clip: {       // data: { cls, group }
    interact(pr, p) {
      const cls = pr.data.cls, id = p.items[p.sel];
      if (!id) return fx.say('Nothing to clip', 'The selected slot is empty.', 1.6);
      const options = G.game.spareTokens(cls, pr.data.stock);
      if (options.length) {
        const neu = G.run.rng.pick(options);
        G.run.graph.claimed.push(neu);                                // now placed: nothing else offers it
        p.items[p.sel] = neu; G.game.addMaxPips(-1); G.run.stats.clipped = (G.run.stats.clipped || 0) + 1; closeGroup(pr); pr.gone = true;
        fx.say(G.itemDefs[neu].name, G.itemDefs[id].name + ' was clipped. One health pip is gone for the run.', 3);
        return;
      }
      // No token of this cut is left that is not held, void, or already placed or offered in this run: a trinket (or scrip) instead,
      // for the same pip, and the token stays where it is. Never a second copy of a token.
      const t = G.trinkets.roll(G.run.rng, G.run.graph.claimed);
      G.game.addMaxPips(-1); G.run.stats.clipped = (G.run.stats.clipped || 0) + 1; closeGroup(pr); pr.gone = true;
      if (t) { G.run.graph.claimed.push(t); G.game.addTrinket(t); fx.say(G.trinketDefs[t].name, 'No spare ' + G.CLASSES[cls].name + ' token is left, so the booth gave a trinket. One health pip is gone for the run.', 3.4); }
      else { G.run.shards += 60; fx.say('+60 scrip', 'No spare ' + G.CLASSES[cls].name + ' token is left, so the booth paid scrip. One health pip is gone for the run.', 3.4); }
    },
    prompt(pr, p) {
      const c = G.CLASSES[pr.data.cls], id = p && p.items[p.sel], spare = G.game.spareTokens(pr.data.cls, pr.data.stock).length > 0;
      return [c.name + ' cut', spare ? (id ? G.itemDefs[id].name : 'Your selected token') + ' becomes a random ' + c.name + ' token.' : 'No spare ' + c.name + ' token is left. The booth would give a trinket or scrip instead.', useName(p) + ' to clip. Costs one max health pip for the run'];
    },
    draw(pr, ctx) {
      const c = G.CLASSES[pr.data.cls], x = pr.x, y = pr.y;
      stand(ctx, x, y); ctx.save(); ctx.translate(x, y - 38 + Math.sin(G.time * 2.2 + x) * 3); ctx.fillStyle = c.color; art.cutShape(ctx, c.shape, 11); ctx.restore();
    }
  },
  post: {       // signal post, data: { abil }. Touching it grants the ability to the whole party.
    update(pr) {
      if (G.run.abil[pr.data.abil]) return;
      for (const p of G.players) if (!p.down && Math.abs(p.x - pr.x) < 22 && Math.abs(p.cy - (pr.y - 34)) < 36) {
        const a = G.abilityDefs[pr.data.abil];
        G.run.abil[pr.data.abil] = true; fx.say(a.name + ' unlocked', a.how, 4.5);
        fx.ring(pr.x, pr.y - 34, 10, 260, '#f4e6b8', 0.5); fx.spark(pr.x, pr.y - 34, 26, '#f4e6b8', 300, 0.7, 0); fx.jolt(0.06, 5);
        break;
      }
    },
    draw(pr, ctx) {
      const got = G.run.abil[pr.data.abil], a = G.abilityDefs[pr.data.abil], bob = got ? 0 : Math.sin(G.time * 2 + pr.x) * 4;
      ctx.fillStyle = '#3a4a44'; ctx.fillRect(pr.x - 2, pr.y - 22, 4, 22);
      ctx.save(); ctx.translate(pr.x, pr.y - 34 + bob);
      if (!got) { ctx.globalAlpha = 0.25 + 0.1 * Math.sin(G.time * 3); ctx.fillStyle = '#f4e6b8'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.rotate(Math.PI / 4); ctx.strokeStyle = got ? '#3a4a44' : '#f4e6b8'; ctx.lineWidth = 2.5; ctx.strokeRect(-9, -9, 18, 18);
      if (!got) { ctx.fillStyle = '#fff3c4'; ctx.fillRect(-4, -4, 8, 8); }
      ctx.restore();
      if (!got && a) art.label(ctx, a.name, pr.x, pr.y - 68, 13, '#e9e2cf');
    }
  },
  standpipe: {  // data: { used }. A full heal for the party, once per run.
    interact(pr) {
      if (pr.data.used) return;
      if (G.players.every(p => !p.down && p.hp >= p.maxHp)) return fx.say('Standpipe', 'Everyone is mended already. Save it.', 2);
      pr.data.used = true;
      for (const p of G.players) { if (p.down) p.revive(p.maxHp); else p.hp = p.maxHp; }
      fx.ring(pr.x, pr.y - 24, 10, 260, '#fff3c4', 0.5); fx.say('Mended', 'The standpipe runs dry.', 2);
    },
    prompt(pr, p) { return pr.data.used ? null : ['Standpipe', 'Mends the whole party fully. One use per run.', useName(p) + ' to drink']; },
    draw(pr, ctx) {
      const x = pr.x, y = pr.y;
      ctx.fillStyle = '#22322e'; ctx.fillRect(x - 22, y - 12, 44, 12); ctx.fillStyle = '#3f6b5a'; ctx.fillRect(x - 25, y - 15, 50, 4);
      ctx.fillStyle = '#5a4630'; ctx.fillRect(x - 3, y - 46, 6, 34); ctx.fillRect(x - 3, y - 46, 16, 5);
      if (!pr.data.used) { ctx.fillStyle = '#fff3c4'; ctx.globalAlpha = 0.7; for (let i = 0; i < 3; i++) { const k = (G.time * 1.2 + i / 3) % 1; ctx.fillRect(x + 10, y - 40 + k * 26, 2, 5); } ctx.globalAlpha = 1; }
    }
  },
  door: {       // data: { to: nodeId, entry, label, tag }
    interact(pr) { G.rooms.go(pr.data.to, pr.data.entry); },
    prompt(pr, p) {
      const need = (pr.data.needs || []).filter(a => G.abilityDefs[a]);
      if (!need.length) return [pr.data.label || 'Doorway', '', useName(p) + ' to enter'];
      // a guarded room: say which move the plinth needs, and whether the party has it yet (and where it is found)
      const missing = need.filter(a => !G.run.abil[a]), names = need.map(a => G.abilityDefs[a].name).join(' and ');
      const where = missing.map(a => { const r = Object.values(G.regionDefs).find(x => x.ability === a); return G.abilityDefs[a].name + (r ? ' is found in ' + r.name : ''); }).join('; ');
      return [pr.data.label || 'Doorway', 'The plinth here needs ' + names + (missing.length ? '. Not found yet: ' + where + '.' : '. You have it.'), useName(p) + ' to enter'];
    },
    draw(pr, ctx) {
      const x = pr.x, y = pr.y;
      ctx.fillStyle = '#020505'; ctx.beginPath(); ctx.moveTo(x - 17, y); ctx.lineTo(x - 17, y - 40); ctx.quadraticCurveTo(x, y - 62, x + 17, y - 40); ctx.lineTo(x + 17, y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#3f6b5a'; ctx.lineWidth = 3; ctx.stroke();
      if (pr.data.tag) art.label(ctx, pr.data.tag, x, y - 70, 12, '#9aa89f');
    }
  },
  gate: {       // hub gate into a region, data: { region }. Shows the region's Warden sigil, dimmed once beaten. The Terminus also shows what the Long Clock will borrow.
    interact(pr) {
      // A home-area gate stands at its route's mouth: taking it is the same as walking out through that portal.
      const rg = G.run.graph.regions[pr.data.region];
      if (rg.mouth) return G.rooms.go(rg.mouth.node, rg.mouth.entry);
      const id = rg.first, def = G.roomDefs[G.run.graph.nodes[id].def];
      G.rooms.go(id, { side: def.route ? def.route[0] : 'left' });
    },
    prompt(pr, p) {
      const r = G.regionDefs[pr.data.region], b = G.bossDefs[r.boss];
      const chart = (G.run.graph.chart || {})[r.id], bor = r.id === 'final' ? G.game.borrows() : null;
      const fresh = !['r1','r2','r3','r4'].some(id=>G.run.beaten[id]);
      const recommend = fresh && r.id==='r1' ? ' Recommended first route: broad footing, fewer aerial threats. ' : '';
      const hubDef = G.rooms.current && G.rooms.current.def, way = hubDef && (hubDef.portals || []).find(q => q.id === r.id), hint = way && way.hint ? ' ' + way.hint : '';
      return [r.name, recommend + (b ? b.name : 'Unknown') + (G.run.beaten[r.id] ? ' has fallen.' : ' waits down the line.') + (chart ? ' Slots: ' + chart.map(c => G.CLASSES[c].name).join(', ') + '.' : '')
        + (bor ? (bor.length ? ' It borrows from each Warden still alive: ' + bor.map(x => x.text + ' (' + x.warden + ')').join('; ') + '.' : ' Every Warden has fallen: it borrows nothing.') : '') + hint, useName(p) + ' to take this route'];
    },
    // the borrow lines above the Terminus gate label ("Borrows: a, b, c", wrapped), shown before the party commits to the fight
    borrowLines(pr, ctx) {
      if (pr.data.region !== 'final') return [];
      const bor = G.game.borrows(), text = bor.length ? 'Borrows: ' + bor.map(x => x.short).join(', ') : 'Borrows nothing';
      return G.props.wrap(ctx, text, 10.5, 150, 500);
    },
    boxes(pr, ctx) {
      const x = pr.x, y = pr.y, r = G.regionDefs[pr.data.region], out = [{ x0: x - 28, x1: x + 28, y0: y - 94, y1: y, kind: 'body' }, { x0: x - 10, x1: x + 10, y0: y - 114, y1: y - 94, kind: 'body' }];
      ctx.font = '500 12.5px ' + C.FONT; const w = ctx.measureText(r.name).width;
      out.push({ x0: x - w / 2, x1: x + w / 2, y0: y - 134, y1: y - 118, kind: 'label', text: r.name });
      const ls = TYPES.gate.borrowLines(pr, ctx);
      ls.forEach((t, k) => { ctx.font = '500 10.5px ' + C.FONT; const lw = ctx.measureText(t).width, ly = y - 143 - (ls.length - 1 - k) * 13; out.push({ x0: x - lw / 2, x1: x + lw / 2, y0: ly - 7, y1: ly + 7, kind: 'label', text: t }); });
      return out;
    },
    draw(pr, ctx) {
      const x = pr.x, y = pr.y, r = G.regionDefs[pr.data.region], pal = art.palette(pr.data.region), done = G.run.beaten[pr.data.region];
      ctx.fillStyle = pal.sky1; ctx.beginPath(); ctx.moveTo(x - 26, y); ctx.lineTo(x - 26, y - 58); ctx.quadraticCurveTo(x, y - 92, x + 26, y - 58); ctx.lineTo(x + 26, y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = done ? '#5c6a63' : pal.accent; ctx.lineWidth = 4; ctx.stroke();
      ctx.save(); ctx.translate(x, y - 104); ctx.rotate(Math.PI / 4); ctx.fillStyle = done ? '#2a2f2d' : pal.accent; ctx.fillRect(-7, -7, 14, 14);
      ctx.fillStyle = done ? '#5c6a63' : pal.sky0; ctx.fillRect(-3, -3, 6, 6); ctx.restore();
      art.label(ctx, r.name, x, y - 126, 12.5, done ? '#9aa89f' : '#e9e2cf');
      const fresh=!['r1','r2','r3','r4'].some(id=>G.run.beaten[id]);
      if(fresh&&r.id==='r1'){
        ctx.save();ctx.globalAlpha=.55+.25*Math.sin(G.time*3);ctx.strokeStyle=pal.accent;ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(x-17,y+6);ctx.lineTo(x,y+12);ctx.lineTo(x+17,y+6);ctx.stroke();ctx.restore();
      }
      const ls = TYPES.gate.borrowLines(pr, ctx);
      ls.forEach((t, k) => art.label(ctx, t, x, y - 143 - (ls.length - 1 - k) * 13, 10.5, '#e9a23b'));
    }
  },
  board: {      // The Junction's physical Route Board: lock chart at a glance; interact opens the full map/journal.
    interact() { G.state='map'; if(G.map&&G.map.open)G.map.open(); },
    prompt(pr,p) {
      const n=['r1','r2','r3','r4'].filter(id=>G.run.beaten[id]).length;
      return ['Route Board', n+'/4 Warden orders released', useName(p)+' to inspect the route'];   // short: it stands above the board and must stay clear of the Timetable plate
    },
    boxes(pr, ctx) {
      const L = boardLayout(pr, ctx), out = [{ x0: L.x0, x1: L.x1, y0: L.y0, y1: L.y1, kind: 'body' }];
      for (const r of L.rows) { out.push(Object.assign({ kind: 'label', text: r.region.name }, r.name)); for (const c of r.cuts) out.push(Object.assign({ kind: 'label', text: 'cut' }, c)); }
      return out;
    },
    draw(pr, ctx) {
      const L = boardLayout(pr, ctx), x = pr.x;
      ctx.fillStyle = '#5a4630'; ctx.fillRect(x - 54, 32, 3, L.y0 - 32); ctx.fillRect(x + 51, 32, 3, L.y0 - 32);              // hanging cords
      ctx.fillStyle = '#8a6c46'; ctx.fillRect(L.x0, L.y0, L.x1 - L.x0, L.y1 - L.y0); ctx.fillStyle = '#1d1a14'; ctx.fillRect(L.x0 + 3, L.y0 + 3, L.x1 - L.x0 - 6, L.y1 - L.y0 - 6);
      art.label(ctx, 'Route Board', x, L.y0 + 9, 10.5, '#f4e6b8', 'center', C.FONT, 700);
      art.label(ctx, 'Lock chart', x, L.y0 + 20, 8.5, '#9aa89f', 'center', C.FONT, 600);
      for (const r of L.rows) {
        const chart = (G.run.graph.chart || {})[r.region.id] || [], pal = art.palette(r.region.id), gone = G.run.beaten[r.region.id];
        art.label(ctx, r.region.name, r.name.x0, r.y, 10, gone ? '#6d6a5c' : pal.accent, 'left');
        chart.forEach((cut, k) => { if (!r.cuts[k]) return; ctx.save(); ctx.translate(r.cuts[k].cx, r.y); ctx.fillStyle = gone ? '#4a4a40' : G.CLASSES[cut].color; art.cutShape(ctx, G.CLASSES[cut].shape, 5); ctx.restore(); });
      }
    }
  },
  crack: {      // cracked barrier (template marker X): a wall three tiles tall on the marker's tile. Only a heavy cut breaks it.
    rect: pr => ({ x0: pr.x - C.T / 2, x1: pr.x + C.T / 2, y0: pr.y - 3 * C.T, y1: pr.y }),
    update(pr) {
      if (pr.gone || pr.data.broken) return;
      const t = G.tiles, r1 = Math.round(pr.y / C.T) - 1;
      if (!pr.bl) pr.bl = { c: Math.floor(pr.x / C.T), r0: r1 - 2, r1, on: true };
      if (!t.blockers.includes(pr.bl)) t.blockers.push(pr.bl);        // blockers are reset whenever a room is entered: put it back
      if (pr.data.clink > 0) pr.data.clink -= 1 / 120;
    },
    // a heavy cut lands on it (called by combat.melee); a plain slash only rings off it
    hit(pr, heavy) {
      if (!heavy) { if (!(pr.data.clink > 0)) { pr.data.clink = 1.2; fx.spark(pr.x, pr.y - 48, 6, '#c9c1ae', 180, 0.25); fx.floatText(pr.x, pr.y - 110, 'Cracked: needs a heavy cut', '#c9c1ae'); G.tips.fire('crack'); } return; }
      const t = G.tiles, j = t.blockers.indexOf(pr.bl);
      if (j >= 0) t.blockers.splice(j, 1);
      pr.gone = true; pr.data.broken = true; G.run.stats.cracks = (G.run.stats.cracks || 0) + 1;
      fx.jolt(0.1, 12); fx.spark(pr.x, pr.y - 48, 40, '#b9ad94', 420, 0.7); fx.dust(pr.x, pr.y, 16); fx.ring(pr.x, pr.y - 48, 10, 320, '#fff3c4', 0.35);
    },
    prompt(pr, p) { return ['Cracked barrier', 'Solid stone, but it is split through. Only a heavy cut breaks it.', G.run.abil.heavy ? 'Hold ' + G.input.name('attack', p) + ', then release' : 'Heavy Cut is found in Ticket Hall']; },
    draw(pr, ctx) {
      const x = pr.x, y = pr.y, w = C.T, h = 3 * C.T;
      ctx.fillStyle = '#4a4a46'; ctx.fillRect(x - w / 2, y - h, w, h);
      ctx.fillStyle = '#5d5c55'; ctx.fillRect(x - w / 2 + 2, y - h + 2, w - 4, 10); ctx.fillRect(x - w / 2 + 2, y - 46, w - 4, 10); ctx.fillRect(x - w / 2 + 2, y - 22, w - 4, 10);
      ctx.strokeStyle = '#14120f'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath();
      ctx.moveTo(x - 3, y - h); ctx.lineTo(x + 5, y - h + 24); ctx.lineTo(x - 6, y - h + 44); ctx.lineTo(x + 4, y - h + 66); ctx.lineTo(x - 2, y); ctx.stroke();
      ctx.strokeStyle = '#d9c9a0'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.55 + 0.25 * Math.sin(G.time * 3); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.strokeStyle = '#14120f'; ctx.lineWidth = 3; ctx.strokeRect(x - w / 2, y - h, w, h);
    }
  },
  lever: {
    interact(pr) {
      const room=G.rooms.current, ch=pr.data.channel||'main', st=(room.mech||(room.mech={}))[ch]||((room.mech[ch]={timer:0}));
      st.timer=4.5; pr.data.thrownAt=G.time; fx.jolt(0.035,3); fx.spark(pr.x,pr.y-24,6,'#f4e6b8',90,0.25); fx.floatText(pr.x,pr.y-58,'Gate open: 4.5 s','#f4e6b8');
    },
    prompt(pr,p) {
      const st=G.rooms.current.mech&&G.rooms.current.mech[pr.data.channel||'main'], t=st&&st.timer||0;
      return ['Timed lever', t>0?'The paired gate is open for '+t.toFixed(1)+' s.':'Throws power to the paired mechanical gate.', useName(p)+' to throw'];
    },
    draw(pr,ctx) {
      const x=pr.x,y=pr.y, on=G.time-(pr.data.thrownAt||-9)<0.35;
      ctx.fillStyle='#27332f';ctx.fillRect(x-13,y-10,26,10);ctx.strokeStyle='#14120f';ctx.lineWidth=3;ctx.strokeRect(x-13,y-10,26,10);
      ctx.strokeStyle=on?'#f4e6b8':'#a58d60';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y-9);ctx.lineTo(x+(on?10:-8),y-34);ctx.stroke();
      ctx.fillStyle='#f4e6b8';ctx.beginPath();ctx.arc(x+(on?10:-8),y-34,4,0,6.283);ctx.fill();
    }
  },
  plate: {
    update(pr) {
      pr.data.active=G.players.some(p=>!p.down&&p.onGround&&Math.abs(p.x-pr.x)<18&&Math.abs(p.y-pr.y)<12);
    },
    prompt(pr) { return ['Pressure plate', pr.data.active?'Held down — paired gate open.':'Weight holds the paired gate open.', 'Stand here while someone passes']; },
    draw(pr,ctx) {
      const x=pr.x,y=pr.y,a=!!pr.data.active;
      ctx.fillStyle='#1c2523';ctx.fillRect(x-15,y-5,30,5);ctx.fillStyle=a?'#f4e6b8':'#817451';ctx.fillRect(x-13,y-(a?4:8),26,4);ctx.strokeStyle='#14120f';ctx.lineWidth=2;ctx.strokeRect(x-15,y-5,30,5);
    }
  },
  mech_gate: {
    update(pr) {
      const room=G.rooms.current,ch=pr.data.channel||'main', st=room.mech&&room.mech[ch];
      const plates=room.props.filter(o=>o.type==='plate'&&!o.gone&&(o.data.channel||'main')===ch);
      const plate=plates.some(o=>G.players.some(p=>!p.down&&p.onGround&&Math.abs(p.x-o.x)<18&&Math.abs(p.y-o.y)<12));
      for(const o of plates)o.data.active=G.players.some(p=>!p.down&&p.onGround&&Math.abs(p.x-o.x)<18&&Math.abs(p.y-o.y)<12);
      const open=!!(plate||(st&&st.timer>0)||G.props.channelOpen(ch));
      const r1=Math.round(pr.y/C.T)-1;
      if(!pr.bl) pr.bl={c:Math.floor(pr.x/C.T),r0:r1-2,r1,on:!open,mech:true};
      if(!G.tiles.blockers.includes(pr.bl))G.tiles.blockers.push(pr.bl);
      pr.bl.on=!open;pr.data.open=open;pr.data.plate=plate;
    },
    // Home-area gates on a 'beaten:<region>' channel say what opens them while they are shut.
    prompt(pr) {
      const m=/^beaten:(\w+)$/.exec(pr.data.channel||''); if(!m||pr.data.open) return null;
      const r=G.regionDefs[m[1]], b=r&&G.bossDefs[r.boss];
      return ['Freight gate','Locked under '+(b?b.name:'a Warden')+'\'s order. It opens when '+(r?r.name:'that line')+' goes quiet.',''];
    },
    draw(pr,ctx) {
      const x=pr.x,y=pr.y,h=3*C.T,open=!!pr.data.open;
      ctx.save();ctx.translate(x,y);
      ctx.fillStyle='#28322f';ctx.strokeStyle='#14120f';ctx.lineWidth=3;
      ctx.fillRect(-C.T/2,-h-8,C.T,10);ctx.strokeRect(-C.T/2,-h-8,C.T,10);
      const lift=open?h-18:0;
      for(let i=-10;i<=10;i+=10){ctx.fillStyle='#776f58';ctx.fillRect(i-2,-h+lift,4,h-lift);ctx.strokeRect(i-2,-h+lift,4,h-lift);}
      ctx.fillStyle=open?'#f4e6b8':'#7e4c39';ctx.beginPath();ctx.arc(0,-h-3,4,0,6.283);ctx.fill();ctx.restore();
    }
  },
  rail_cart: {
    update(pr,dt) {
      const d=pr.data;
      if(d.home===undefined){d.home=pr.x;d.dir=1;d.speed=82;}
      const span=(d.span||3)*C.T, old=pr.x;
      pr.x+=d.dir*d.speed*dt;
      if(pr.x<d.home-span){pr.x=d.home-span;d.dir=1;}
      else if(pr.x>d.home+span){pr.x=d.home+span;d.dir=-1;}
      const dx=pr.x-old;
      const bodies=G.players.concat(G.rooms.current.enemies||[]);
      for(const o of bodies) if(o&&!o.dead&&o.onGround&&Math.abs(o.x-old)<27&&Math.abs(o.y-pr.y)<10){
        const nx=o.x+dx,c0=Math.floor((nx-o.w/2)/C.T),c1=Math.floor((nx+o.w/2)/C.T),r0=Math.floor((o.y-o.h)/C.T),r1=Math.floor((o.y-1)/C.T);
        let blocked=false;for(let c=c0;c<=c1&&!blocked;c++)for(let r=r0;r<=r1;r++)if(G.tiles.solid(c,r)){blocked=true;break;}
        if(!blocked)o.x=nx;
      }
    },
    prompt(pr){return ['Rail cart','A short maintenance trolley runs this stretch automatically.','Stand on the deck to ride'];},
    draw(pr,ctx){
      const x=pr.x,y=pr.y;
      ctx.save();ctx.translate(x,y);
      ctx.fillStyle='#75513d';ctx.strokeStyle='#211a16';ctx.lineWidth=3;ctx.fillRect(-24,-16,48,10);ctx.strokeRect(-24,-16,48,10);
      ctx.fillStyle='#8f8263';ctx.fillRect(-20,-20,40,5);
      for(const wx of [-16,16]){ctx.fillStyle='#303735';ctx.beginPath();ctx.arc(wx,-4,7,0,6.283);ctx.fill();ctx.stroke();ctx.strokeStyle='#a58d60';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(wx-5,-4);ctx.lineTo(wx+5,-4);ctx.moveTo(wx,-9);ctx.lineTo(wx,1);ctx.stroke();}
      ctx.strokeStyle='#a58d60';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-8,-20);ctx.lineTo(0,-32);ctx.lineTo(8,-20);ctx.stroke();
      ctx.restore();
    }
  },
  lamp_decor: {
    prompt(){ return null; },
    boxes(){ return []; },
    draw(pr,ctx){
      const x=pr.x,y=pr.y;
      ctx.save();ctx.globalAlpha=.9;
      ctx.fillStyle='#5c5038';ctx.fillRect(x-3,y-52,6,52);
      ctx.fillStyle='#d6c184';ctx.globalAlpha=.55+.1*Math.sin(G.time*2+pr.x*.01);
      ctx.beginPath();ctx.ellipse(x,y-55,11,18,0,0,6.283);ctx.fill();
      ctx.globalAlpha=1;ctx.strokeStyle='#191816';ctx.lineWidth=2;ctx.stroke();
      ctx.restore();
    }
  },
  guide: {
    interact(pr,p) {
      const beaten=['r1','r2','r3','r4'].filter(r=>G.run.beaten[r]).length;
      const lines=[
        ['Station Keeper','Slashes alone will not break a Warden. The dock at Wreck Quay has a lost trunk: clear the room and take the token inside.'],
        ['Station Keeper','One line has gone quiet. Listen to the Junction long enough and you can hear the relays settling.'],
        ['Station Keeper','Two Wardens released. The old board is beginning to look like a route home instead of a timetable.'],
        ['Station Keeper','Only one local order remains. The Terminus will still borrow whatever you leave running.'],
        ['Station Keeper','All four local orders are clear. Take the cancellation to the Long Clock and finish what the railway could not.']
      ];
      const x=lines[Math.min(4,beaten)];
      G.fx.say(x[0],x[1],5,'guide');
      pr.data.spoken=(pr.data.spoken||0)+1;
    },
    prompt(pr,p) {
      const n=['r1','r2','r3','r4'].filter(r=>G.run.beaten[r]).length;
      const state=n===0?'Keeper of the abandoned Junction':n===4?'Waiting for the final cancellation':n+' local order'+(n===1?'':'s')+' released';
      return ['Station Keeper',state,(G.input&&G.input.name?G.input.name('interact',p):'Up')+' to talk'];
    },
    draw(pr,ctx) {
      const x=pr.x,y=pr.y,bob=Math.sin(G.time*1.8)*0.5,img=G.sprites&&G.sprites.portrait_guide;
      ctx.save();ctx.translate(x,y);
      // The canonical sheet only defines the Guide as a portrait, so the Keeper works from a service window.
      // This uses the owner's actual watercolor face instead of inventing a non-canonical full-body design.
      ctx.globalAlpha=.72;ctx.fillStyle='#273632';ctx.fillRect(-43,-82,86,62);
      ctx.strokeStyle='#7b6545';ctx.lineWidth=4;ctx.strokeRect(-43,-82,86,62);
      if(img&&img.naturalWidth){
        ctx.save();ctx.beginPath();ctx.rect(-37,-77+bob,74,55);ctx.clip();
        ctx.globalAlpha=.96;ctx.drawImage(img,-38,-89+bob,76,76);ctx.restore();
      } else {
        // Fallback keeps dialogue usable if the portrait asset fails.
        ctx.globalAlpha=.9;ctx.fillStyle='#586b65';ctx.beginPath();ctx.arc(0,-50+bob,19,0,6.283);ctx.fill();
        ctx.fillStyle='#d9c17d';ctx.beginPath();ctx.arc(7,-53+bob,3,0,6.283);ctx.fill();
      }
      // Counter in front makes the crop intentional and gives the Junction a railway-service silhouette.
      ctx.globalAlpha=.94;ctx.fillStyle='#66513a';ctx.fillRect(-52,-25,104,25);
      ctx.fillStyle='#8a704e';ctx.fillRect(-55,-29,110,7);
      ctx.strokeStyle='#2a211a';ctx.lineWidth=3;ctx.strokeRect(-52,-25,104,25);
      ctx.fillStyle='#c0a568';ctx.globalAlpha=.75;ctx.fillRect(-17,-19,34,3);
      ctx.globalAlpha=1;ctx.restore();
    }
  },
  crate_decor: {
    prompt(){ return null; },
    boxes(){ return []; },
    draw(pr,ctx){
      const x=pr.x,y=pr.y;ctx.save();ctx.globalAlpha=.92;
      ctx.fillStyle='#6f5038';ctx.fillRect(x-24,y-39,46,39);
      ctx.strokeStyle='#2c211b';ctx.lineWidth=3;ctx.strokeRect(x-24,y-39,46,39);
      ctx.fillStyle='#765c43';ctx.beginPath();ctx.ellipse(x+15,y-49,17,26,0,0,6.283);ctx.fill();ctx.stroke();
      ctx.restore();
    }
  },
  banner_decor: {
    prompt(){ return null; },
    boxes(){ return []; },
    draw(pr,ctx){
      const x=pr.x,y=pr.y;ctx.save();ctx.globalAlpha=.88;
      ctx.strokeStyle='#3a2d21';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-112);ctx.stroke();
      ctx.fillStyle='#a75c39';ctx.beginPath();ctx.moveTo(x+3,y-103);ctx.lineTo(x+37,y-96);ctx.lineTo(x+33,y-39);ctx.lineTo(x+19,y-48);ctx.lineTo(x+4,y-42);ctx.closePath();ctx.fill();
      ctx.restore();
    }
  },
  furnace_decor: {
    prompt(){ return null; },
    boxes(){ return []; },
    draw(pr,ctx){
      const x=pr.x,y=pr.y;ctx.save();ctx.globalAlpha=.9;
      ctx.fillStyle='#504b40';ctx.beginPath();ctx.roundRect(x-23,y-72,46,67,15);ctx.fill();
      ctx.strokeStyle='#1b1814';ctx.lineWidth=3;ctx.stroke();
      ctx.fillStyle='#d57a36';ctx.beginPath();ctx.roundRect(x-12,y-48,24,30,7);ctx.fill();
      ctx.fillStyle='#f0ba63';ctx.globalAlpha=.7+.2*Math.sin(G.time*4);ctx.fillRect(x-7,y-43,14,20);
      ctx.globalAlpha=.85;ctx.fillStyle='#6b6250';ctx.fillRect(x-5,y-91,10,20);
      ctx.restore();
    }
  },
  // Loop-back shortcut hatch, data: { region, side: 'home' | 'deep' }. The deep end (worldgen places it in the region's last main room)
  // unbolts both ends and drops the party into the Junction; the home end (a template fixture) is bolted until then.
  shortcut: {
    interact(pr) {
      const rid = pr.data.region, sc = G.run.graph.shortcuts && G.run.graph.shortcuts[rid], reg = G.regionDefs[rid];
      if (!sc || !reg) return;
      const opened = G.run.shortcuts || (G.run.shortcuts = {});
      if (pr.data.side === 'deep') {
        if (!opened[rid]) { opened[rid] = true; fx.say('Shortcut unbolted', 'The hatch drops straight into the Junction. It stays open from both sides now.', 3); }
        G.rooms.go(G.run.graph.hub, { at: { x: sc.home.x, y: sc.home.y, face: 1 } });
      } else {
        if (!opened[rid]) return fx.say('Bolted hatch', 'Bolted from the far side. The bolt is somewhere deep in ' + reg.name + '.', 2.4);
        G.rooms.go(sc.deep, { at: { x: sc.x, y: sc.y, face: -1 } });
      }
    },
    prompt(pr, p) {
      const rid = pr.data.region, reg = G.regionDefs[rid] || { name: '?' }, open = G.run.shortcuts && G.run.shortcuts[rid];
      if (pr.data.side === 'deep') return ['Junction hatch', open ? 'A shortcut back to the Junction.' : 'The bolt is on this side. Unbolt it to open a way straight back to the Junction.', useName(p) + (open ? ' to drop through' : ' to unbolt')];
      return [reg.name + ' hatch', open ? 'Unbolted. It drops deep into ' + reg.name + ', near the Warden.' : 'Bolted from the far side.', open ? useName(p) + ' to go through' : 'Opens from inside ' + reg.name];
    },
    draw(pr, ctx) {
      const x = pr.x, y = pr.y, open = !!(G.run.shortcuts && G.run.shortcuts[pr.data.region]), pal = art.palette(pr.data.region);
      ctx.save();
      ctx.fillStyle = '#1d2422'; ctx.fillRect(x - 18, y - 52, 36, 52);
      ctx.fillStyle = open ? '#0a0f0e' : '#59503e'; ctx.fillRect(x - 14, y - 48, 28, 48);
      ctx.strokeStyle = '#14120f'; ctx.lineWidth = 3; ctx.strokeRect(x - 18, y - 52, 36, 52);
      ctx.strokeStyle = pal.accent; ctx.lineWidth = 2; ctx.strokeRect(x - 14, y - 48, 28, 48);
      if (!open) { ctx.fillStyle = '#a58d60'; ctx.fillRect(x - 16, y - 30, 32, 6); ctx.strokeStyle = '#14120f'; ctx.lineWidth = 2; ctx.strokeRect(x - 16, y - 30, 32, 6); }
      else { ctx.globalAlpha = .35 + .15 * Math.sin(G.time * 2.5); ctx.fillStyle = pal.accent; ctx.fillRect(x - 10, y - 44, 20, 40); ctx.globalAlpha = 1; }
      ctx.restore();
      art.label(ctx, (G.regionDefs[pr.data.region] || { name: '' }).name, x, y - 62, 10.5, open ? pal.accent : '#9aa89f');
    }
  },
  // A Signal Reef lamp on a short post (decor, Junction's Signal Mast and Signal Stair). Lamps pulse in sequence from the bottom up, so a
  // chain of them reads as a path climbing toward the roof hatch.
  signal_lamp: {
    prompt() { return null; },
    boxes() { return []; },
    draw(pr, ctx) {
      const x = pr.x, y = pr.y, k = 0.5 + 0.5 * Math.sin(G.time * 3 + y / 60);
      ctx.save();
      ctx.fillStyle = '#2b2636'; ctx.fillRect(x - 1.5, y - 26, 3, 26);
      ctx.globalAlpha = 0.18 + 0.22 * k; ctx.fillStyle = '#c8bce0'; ctx.beginPath(); ctx.arc(x, y - 30, 16 + 6 * k, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 0.85; ctx.fillStyle = '#e4dcf6'; ctx.beginPath(); ctx.arc(x, y - 30, 4.5, 0, 6.283); ctx.fill();
      ctx.strokeStyle = '#14120f'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }
  },
  // A small scrip stash (home-area secrets), data: { scrip, name }. Taken once per run.
  cache: {
    interact(pr) {
      const d = pr.data; if (d.taken) return;
      if (d.need && !(G.run.abil && G.run.abil[d.need])) {
        const names = { dash:'Dash', wall:'Wall Grip', double:'Double Jump', heavy:'Heavy Cut' };
        fx.say(d.name || 'Drill reward', d.hint || ('Practice station: unlock ' + (names[d.need] || d.need) + ' first.'), 2.0);
        return;
      }
      d.taken = true; G.run.shards += d.scrip || 0;
      fx.spark(pr.x, pr.y - 20, 16, '#fff3c4', 220, 0.5); fx.floatText(pr.x, pr.y - 60, '+' + (d.scrip || 0) + ' scrip', '#fff3c4');
      fx.say(d.name || 'Stash', 'Someone hid ' + (d.scrip || 0) + ' scrip here and never came back for it.', 2.2);
    },
    prompt(pr, p) {
      if (pr.data.taken) return null;
      if (pr.data.need && !(G.run.abil && G.run.abil[pr.data.need])) {
        const names = { dash:'Dash', wall:'Wall Grip', double:'Double Jump', heavy:'Heavy Cut' };
        return [pr.data.name || 'Drill reward', pr.data.hint || ('Practice station for ' + (names[pr.data.need] || pr.data.need) + '.'), 'Unlock ' + (names[pr.data.need] || pr.data.need) + ' to claim'];
      }
      return [pr.data.name || 'Stash', pr.data.hint || 'A forgotten tin box.', useName(p) + ' to open'];
    },
    draw(pr, ctx) {
      const x = pr.x, y = pr.y, d = pr.data;
      ctx.fillStyle = d.taken ? '#3a3a34' : '#6f6a52'; ctx.fillRect(x - 12, y - 14, 24, 14);
      ctx.fillStyle = d.taken ? '#2a2a26' : '#8f8663'; ctx.fillRect(x - 13, y - (d.taken ? 14 : 18), 26, 5);
      ctx.strokeStyle = '#14120f'; ctx.lineWidth = 2; ctx.strokeRect(x - 12, y - 14, 24, 14);
      if (!d.taken) { ctx.fillStyle = '#fff3c4'; ctx.globalAlpha = .5 + .3 * Math.sin(G.time * 3 + x); ctx.fillRect(x - 2, y - 11, 4, 4); ctx.globalAlpha = 1; }
    }
  },
  sign: {       // data: { text }
    prompt(pr) { return pr.data.text ? ['', pr.data.text, ''] : null; },
    draw(pr, ctx) { const x = pr.x, y = pr.y; ctx.fillStyle = '#5a4630'; ctx.fillRect(x - 2, y - 26, 4, 26); ctx.fillStyle = '#8a6c46'; ctx.fillRect(x - 15, y - 40, 30, 16); ctx.fillStyle = '#5a4630'; ctx.fillRect(x - 10, y - 35, 20, 2); ctx.fillRect(x - 10, y - 30, 14, 2); }
  }
};

G.props = {
  // Mechanism channels that open by run state rather than a lever or plate: 'beaten:<region>' (that Warden has fallen),
  // 'shortcut:<region>' (that loop-back hatch is unbolted). Used by mech_gate.
  channelOpen(ch) {
    const m = /^(beaten|shortcut):(\w+)$/.exec(ch || ''); if (!m || !G.run) return false;
    return m[1] === 'beaten' ? !!G.run.beaten[m[2]] : !!(G.run.shortcuts && G.run.shortcuts[m[2]]);
  },
  teachT: {},       // seconds each first-time tip has been on screen this session
  tip(pr) { const k = teachKey(pr); return G.meta.taught[k] ? '' : TEACH[k] || ''; },
  TYPES,            // content may add a prop type here: G.props.TYPES.<name> = { draw, update, interact, prompt }
  make(type, x, y, data = {}) {
    const t = TYPES[type];
    return {
      type, x, y, data, gone: false,
      near(p) { return Math.abs(p.x - x) < 28 && Math.abs(p.y - y) < 50; },
      update(dt) {
        if (t.update) t.update(this, dt);
        const k = teachKey(this), tt = G.props.teachT;
        if (TEACH[k] && !G.meta.taught[k]) for (const p of G.players)
          if (!p.down && p.onGround && this.near(p) && this.prompt(p)) { tt[k] = (tt[k] || 0) + dt; if (tt[k] > 3) { G.meta.taught[k] = true; G.game.saveMeta(); } break; }
      },
      interact(p) { if (t.interact) t.interact(this, p); },
      prompt(p) { return t.prompt ? t.prompt(this, p) : null; },
      draw(ctx) {
        const sz=PROP_SPRITE_SIZE[type], opt={x,y,prop:this};
        if(sz){opt.w=sz[0];opt.h=sz[1];}
        art.draw('prop_' + type, ctx, opt) || t.draw(this, ctx);
      }
    };
  },
  // Screen boxes a prop covers: [{ x0, y0, x1, y1, kind: 'body' | 'label', text? }] (props without their own boxes() get a generic body box).
  // Used by the hub_layout check: no prop's box may overlap a gate or another prop's label.
  boxes(pr, ctx) { const t = TYPES[pr.type]; return t && t.boxes ? t.boxes(pr, ctx) : [{ x0: pr.x - 22, x1: pr.x + 22, y0: pr.y - 60, y1: pr.y, kind: 'body' }]; },
  // Word-wrap text to at most maxW pixels at the given font size (ctx.font is set here). Returns the lines.
  wrap(ctx, text, size, maxW, weight = 500) {
    ctx.font = weight + ' ' + size + 'px ' + C.FONT;
    const out = [];
    for (const para of String(text).split('\n')) {
      let cur = '';
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const t = cur ? cur + ' ' + word : word;
        if (cur && ctx.measureText(t).width > maxW) { out.push(cur); cur = word; } else cur = t;
      }
      if (cur) out.push(cur);
    }
    return out;
  },
  PROMPT_W: 340,     // widest line of a prompt, px
  // Where the prompt panel of a prop goes: lines wrapped to PROMPT_W, the whole panel clamped inside the screen (world coordinates).
  layoutPrompt(ctx, pr, lines) {
    const [title, line, hint, mat] = lines, tip = G.props.tip(pr), maxW = G.props.PROMPT_W, PAD = 10, GAP = 4;
    const rows = [];
    for (const [text, size, kind, weight] of [[tip, 12, 'tip', 500], [title, 15, 'title', 600], [line, 12.5, 'line', 500], [mat && mat.line, 12, 'mat', 500], [hint, 12.5, 'hint', 500]]) {
      if (text) for (const t of G.props.wrap(ctx, text, size, maxW, weight)) rows.push({ t, size, kind, weight });
      if (kind === 'line' && mat) rows.push({ t: '', size: 14, kind: 'chips', tags: mat.tags, weight: 500, cw: G.materials.chipsWidth(ctx, mat.tags) });   // the material chips sit under the description
    }
    if (!rows.length) return null;
    let w = 0, h = PAD * 2 - GAP;
    for (const r of rows) { ctx.font = r.weight + ' ' + r.size + 'px ' + C.FONT; w = Math.max(w, r.cw || ctx.measureText(r.t).width); r.h = r.size + GAP; h += r.h; }
    w += PAD * 2;
    const M = 8, camX = G.cam.x, camY = G.cam.y, topMin = camY + 96;       // below the HUD rows at the top of the screen
    const x0 = U.clamp(pr.x - w / 2, camX + M, camX + C.W - M - w);
    let y0 = pr.y - (pr.type === 'gate' ? 168 : 100) - h / 2, top = topMin;
    if (pr.type === 'board') {                                              // above the board's own panel, never over its rows or its neighbours
      const body = G.props.boxes(pr, ctx).find(b => b.kind === 'body'); if (body) { y0 = body.y0 - h - 6; top = camY + 56; }
    }
    y0 = U.clamp(y0, top, camY + C.H - M - h);
    if (y0 < camY + M) y0 = camY + M;
    let y = y0 + PAD;
    for (const r of rows) { r.y = y + r.size / 2; y += r.h; }
    return { x0, y0, x1: x0 + w, y1: y0 + h, rows };
  },
  // The label shown above a prop when a player stands at it: a panel, wrapped and kept on screen.
  drawPrompt(ctx, pr, lines) {
    const L = G.props.layoutPrompt(ctx, pr, lines);
    G.props.lastPrompt = L;
    if (!L) return;
    ctx.fillStyle = 'rgba(6,11,11,0.78)'; ctx.fillRect(L.x0, L.y0, L.x1 - L.x0, L.y1 - L.y0);
    const cx = (L.x0 + L.x1) / 2, titleCol = pr.data.item ? G.itemDefs[pr.data.item].color : '#e9a23b';
    for (const r of L.rows) if (r.kind === 'chips') G.materials.drawChips(ctx, r.tags, cx, r.y, 'center');
      else art.label(ctx, r.t, cx, r.y, r.size, r.kind === 'tip' ? '#9fd3c7' : r.kind === 'mat' ? '#c9d6cf' : r.kind === 'title' ? titleCol : r.kind === 'line' ? '#e9e2cf' : '#9aa89f', 'center', C.FONT, r.weight);
  }
};
})();
