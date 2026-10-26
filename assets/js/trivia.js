// ===================================================================
//  Trivia, tips and fun facts used all over the site.
//  funFact(topic) gives a little card with a "Another one" button;
//  simTips(...) picks tips that match what you're doing in the simulator.
// ===================================================================

const TRIVIA = {
  general: [
    "A ball thrown at 30° and one thrown at 60°, at the same speed, land in exactly the same spot (if there's no air).",
    "At the very top of its path, a ball is still moving: sideways, at exactly its starting horizontal speed.",
    "A dropped ball and a ball thrown sideways from the same height hit the ground at the same moment.",
    "Every projectile without air follows a parabola, the same curve you get by slicing a cone.",
    "Galileo found the parabola by rolling balls off tables and marking where they landed.",
    "A cricket ball bowled at 150 km/h takes under half a second to reach the batter.",
    "The fastest recorded tennis serve was about 263 km/h.",
    "Astronauts on the ISS are falling all the time. They just move sideways fast enough to keep missing the Earth.",
    "The world record javelin throw is 98.48 m, by Jan Železný in 1996.",
    "A shot putter's best angle is around 37°, not 45°, because the shot is released from shoulder height.",
    "Long jumpers take off at about 20°: they can't run fast AND jump steeply at the same time.",
    "Water from a hose is a stream of projectiles: each drop follows its own parabola.",
  ],
  air: [
    "Air pushes back harder the faster you go: double the speed and the drag is about four times as big.",
    "A golf ball's dimples help it fly about twice as far as a smooth ball would.",
    "A skydiver stops speeding up at about 200 km/h: drag grows until it matches gravity.",
    "A raindrop falls at only about 9 m/s, because air resistance stops it speeding up.",
    "A feather and a hammer fall together on the Moon, where there's no air at all.",
    "With air, the farthest angle is usually below 45°. Real cannon crews knew this long before the maths.",
    "Baseballs fly a little farther in Denver, a mile above sea level, where the air is thinner.",
  ],
  space: [
    "The Moon's gravity is about one-sixth of Earth's, so jumps there go six times higher.",
    "On Jupiter you'd weigh about 2.5 times as much as on Earth.",
    "Mars has air, but it's about 1% as thick as Earth's.",
    "To orbit just above the Earth you'd need to go about 7.9 km every second.",
    "Alan Shepard hit golf balls on the Moon in 1971. His best shot went about 36 m (40 yards).",
  ],
  relative: [
    "Sitting still in your chair, you're moving at about 1,600 km/h as the Earth spins (near the equator).",
    "Pilots land into the wind, because a headwind lowers their speed over the ground.",
    "A plane with a strong tailwind can cross the Atlantic about an hour faster.",
    "Swimmers caught in a rip current are told to swim across it, not against it: exactly the river-crossing trick.",
    "If you run in the rain, more drops hit your front, but you spend less time in the rain.",
    "In a train moving at steady speed, a ball you throw straight up lands back in your hand.",
    "Two cars at 60 km/h passing each other see the other car rush by at 120 km/h.",
  ],
  measure: [
    "A human hair is about 0.07 mm thick: a good screw gauge can measure it.",
    "The vernier was invented in 1631, and callipers today still use the same trick.",
    "An A4 sheet of paper is about 0.1 mm thick: one vernier least count.",
    "Since 1983 the metre has been defined by how far light travels in 1/299,792,458 of a second.",
    "Always read a measuring cylinder with your eye level with the liquid, or you'll get it wrong.",
    "Spherometers were first made to check the curve of telescope and spectacle lenses.",
  ],
  quiz: [
    "Stuck on a numbers question? Estimate first, then pick the closest answer.",
    "The hint button costs half the XP, but it's better than guessing.",
    "Adaptive mode gets harder when you're on a streak, and easier if you slip.",
    "Quizzes are best in small bites. Five a day beats fifty once a week.",
    "Your weakest topic is recommended at the top. Practise it to level up fastest.",
  ],
  games: [
    "Change one thing at a time. If it falls short, a little more speed beats a big change.",
    "Without air there are two angles that hit the same target: a low one and a high one.",
    "You can type exact numbers in the boxes for tiny adjustments.",
    "Your last shots stay on the graph as faint lines. Use them to home in.",
    "A first-shot hit earns three stars. Think before you fire!",
  ],
};

// a small card with a fact and a button for another
function funFact(topic, label = "Did you know?") {
  const list = TRIVIA[topic] || TRIVIA.general;
  const i = Math.floor(Math.random() * list.length);
  return `<div class="ff" data-ff="${topic}" data-i="${i}"><span class="ff-ic" aria-hidden="true">💡</span>
    <span class="ff-body"><b>${label}</b> <span class="ff-t">${list[i]}</span></span>
    <button class="ff-next" title="Another one" aria-label="Another fact">↻</button></div>`;
}
// one click handler for every fun-fact card on the site
function bindFunFacts(root) {
  root.addEventListener("click", (e) => {
    const b = e.target.closest(".ff-next"); if (!b) return;
    const card = b.closest(".ff"), list = TRIVIA[card.dataset.ff] || TRIVIA.general;
    const i = (+card.dataset.i + 1 + Math.floor(Math.random() * (list.length - 1))) % list.length;
    card.dataset.i = i;
    const t = card.querySelector(".ff-t");
    t.classList.remove("ff-in"); void t.offsetWidth; t.textContent = list[i]; t.classList.add("ff-in");
  });
}

// Tips that match the current throw. Returns an array of short strings, most relevant first.
function simTips(S, p, tr) {
  const out = [], a = p.angle, s = tr.s;
  const ideal = !p.drag && !p.incline && !p.height;
  if (ideal && Math.abs(a - 45) < 0.6) out.push("45° is the farthest angle in an ideal world. Try 30° and then 60°: they land in exactly the same spot.");
  if (ideal && (Math.abs(a - 30) < 0.6 || Math.abs(a - 60) < 0.6)) out.push(`Now try ${Math.abs(a - 30) < 0.6 ? "60°" : "30°"}. Same range, very different height and time in the air!`);
  if (ideal && a > 0 && a < 90 && Math.abs(a - 45) > 0.6) out.push(`The angle that pairs with ${a.toFixed(0)}° is ${(90 - a).toFixed(0)}°. Both land ${s.range.toFixed(1)} m away.`);
  if (a >= 89.5) out.push("Straight up! It comes back down to your hand, taking just as long to fall as to rise.");
  if (a <= 0 && p.height > 0) out.push("Thrown flat off a height: the time in the air only depends on the height, not the speed.");
  if (p.height > 0 && !p.drag) out.push("From a height, the best angle drops below 45°. Press Farthest angle to find it.");
  if (p.drag) out.push("With air on, the way down is steeper than the way up. Look at the shape of the path.");
  if (p.drag && !S.show.vacuum) out.push("Tick 'Also draw the no-air path' in Air & wind to see how much the air costs you.");
  if (p.wind) {
    const along = Math.cos(S.windDir * RAD);
    out.push(along < -0.3 ? "A headwind hurts high throws most: they spend longer in the air. Try a lower angle." :
      along > 0.3 ? "A tailwind helps high throws most: aim a bit higher than you normally would." :
      "A crosswind pushes the ball sideways. Switch to 3D to see it drift.");
  }
  if (S.planet === "Moon") out.push("No air on the Moon: every object, heavy or light, flies exactly the same.");
  if (S.planet === "Jupiter") out.push("Jupiter's gravity is 2.5 times Earth's. The same throw goes less than half as far.");
  if (S.planet === "Mars") out.push("Mars gravity is 38% of Earth's. Throws go about 2.6 times farther.");
  if (p.incline > 0) out.push("Uphill, the best angle is higher than 45°: 45° plus half the slope.");
  if (p.incline < 0) out.push("Downhill, the best angle is lower than 45°: 45° minus half the slope.");
  if (p.bounce) out.push("Each bounce loses some energy. Bounciness 0.6 keeps 60% of the speed.");
  if (S.azimuth) out.push("You're aiming sideways. Switch to 3D and drag to look around.");
  if (p.speed > 60 && p.drag) out.push("This is fast: drag grows with speed squared, so air matters a lot here.");
  if (!out.length) out.push("Press Pin path, change one thing, then launch again to compare the two throws.");
  return out.concat(TRIVIA.general.slice().sort(() => Math.random() - 0.5));
}
