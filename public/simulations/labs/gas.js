// Helpers for test-tube experiments that give off a gas: a cork and
// delivery tube leading into lime water, and heating a tube held in a
// wooden holder over a Bunsen burner.
import * as THREE from 'three';
import * as C from '../lab-engine/chem.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// Fit a cork and delivery tube in generator tube `gen`, dipping into `lime`
export function fitDeliveryTube(lab, gen, lime) {
  const span = lime.home.x - gen.home.x;
  const d = C.deliveryTube(span, 15);
  d.group.position.set(0, 15.2, 0);
  gen.group.add(d.group);
  gen.delivery = d;
  gen.limeTube = lime;
  return d;
}
export function removeDeliveryTube(gen) {
  if (gen.delivery) { gen.delivery.group.removeFromParent(); gen.delivery = null; gen.limeTube = null; }
}
// Carry the cork and delivery tube to the tubes and fit it
export async function demoFit(lab, gen, lime) {
  await lab.touch(gen.group.localToWorld(V3(0, 17, 0)), null, { pose: 'pinch', lift: 0 });
  fitDeliveryTube(lab, gen, lime);
  lab.sfx('tick');
  await lab.touch(lime.group.localToWorld(V3(0, 16, 0)), null, { pose: 'pinch', lift: 0 });
}
// Lime water state per tube: CO₂ absorbed turns it milky (CaCO₃), a large
// excess clears it again (soluble Ca(HCO₃)₂)
export function limeWaterGoal(co2) {
  const milky = co2 < 14 ? Math.min(1, co2 / 6) : Math.max(0.15, 1 - (co2 - 14) / 20);
  return { color: 0xf4f7f6, opacity: 0.22, turbid: milky * 0.95, pptColor: 0xfdfdfb, ppt: 0, obs: milky > 0.5 ? (co2 > 14 ? 'Milkiness disappears with excess CO₂' : 'Lime water turns milky') : 'Lime water is clear', inf: milky > 0.5 ? 'CO₂ gas is evolved' : '' };
}

// Heat tube t (held in a wooden holder) over the burner for `secs` seconds
export async function heatTube(lab, api, t, secs, { burnerKey = 'burner', holderKey = 'holder' } = {}) {
  const burner = lab.items[burnerKey], holder = lab.items[holderKey];
  const fl = burner.app.flame;
  if (!fl.on) {
    await lab.touch(burner.app.knob, () => { fl.on = true; lab.sfx('click'); }, { pose: 'pinch' });
  }
  const g = t.group, rack = g.parent, home = g.position.clone();
  const R = lab.handR();
  // clamp the holder near the mouth of the tube
  await lab.touch(holder.group.localToWorld(V3(-6, 1, 0)), null, { pose: 'grab' });
  const hg = holder.group, hHome = hg.position.clone(), hRot = hg.rotation.clone();
  lab.scene.attach(g);
  const top = burner.app.topWorld();
  const heatPos = top.clone().add(V3(-2, 5, 0));
  const q0 = g.quaternion.clone(), q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.5)); // tilted, mouth away from people
  const s0 = g.position.clone();
  await lab.tween(1.2, (e) => {
    g.position.lerpVectors(s0, heatPos, e); g.position.y += Math.sin(Math.PI * e) * 10;
    g.quaternion.slerpQuaternions(q0, q1, e);
    hg.position.copy(g.localToWorld(V3(0, 11, 0))).add(V3(-0.5, 0, 0)); hg.rotation.set(0, Math.PI / 2, 0);
    R.goal.copy(hg.localToWorld(V3(-6, 1, 0)));
  });
  t.heat = 1;
  // gentle to-and-fro in the flame so it heats evenly
  await lab.tween(secs, (e, k) => {
    g.position.x = heatPos.x + Math.sin(k * Math.PI * 6) * 0.8;
    hg.position.copy(g.localToWorld(V3(0, 11, 0))).add(V3(-0.5, 0, 0));
    R.goal.copy(hg.localToWorld(V3(-6, 1, 0)));
    api.react(lab, t);
  });
  t.heldAt = { g, rack, home, hg, hHome, hRot };
  return t.heldAt;
}
// Put the heated tube back in the rack and the holder down; burner off
export async function returnTube(lab, t, { burnerKey = 'burner' } = {}) {
  const h = t.heldAt;
  if (!h) return;
  const { g, rack, home, hg, hHome, hRot } = h;
  const R = lab.handR();
  const s0 = g.position.clone(), q0 = g.quaternion.clone();
  const back = rack.localToWorld(home.clone());
  await lab.tween(1.2, (e) => {
    g.position.lerpVectors(s0, back, e); g.position.y += Math.sin(Math.PI * e) * 10;
    g.quaternion.slerpQuaternions(q0, new THREE.Quaternion(), e);
    hg.position.copy(g.localToWorld(V3(0, 11, 0))).add(V3(-0.5, 0, 0));
    R.goal.copy(hg.localToWorld(V3(-6, 1, 0)));
  });
  rack.attach(g); g.position.copy(home); g.rotation.set(0, 0, 0);
  hg.position.copy(hHome); hg.rotation.copy(hRot);
  t.heat = 0.4; // still warm
  t.heldAt = null;
  const fl = lab.items[burnerKey].app.flame;
  await lab.touch(lab.items[burnerKey].app.knob, () => { fl.on = false; lab.sfx('click'); }, { pose: 'pinch' });
}
