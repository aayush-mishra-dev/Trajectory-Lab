// ===================================================================
//  History: how we came to understand flying objects, and how we
//  learned to measure precisely. Filterable timeline with "try it" links.
// ===================================================================

const HIST_CATS = {
  Motion: { color: "#1D4ED8", soft: "#E6EDFD" },
  Measurement: { color: "#0D9488", soft: "#CCFBF1" },
  Space: { color: "#7C3AED", soft: "#EDE9FE" },
  Sport: { color: "#EA580C", soft: "#FFEDD5" },
  Units: { color: "#DB2777", soft: "#FCE7F3" },
};

const HISTORY = [
  { year: -350, label: "About 350 BC", cat: "Motion", who: "Aristotle", title: "Something must keep pushing",
    short: "Aristotle taught that a thrown stone keeps moving only while something pushes it, and that the air itself carried it along.",
    long: "For Aristotle, the natural state of things was rest. A thrown object needed a mover, so he suggested the air rushing in behind it kept pushing. The idea made little sense even to some ancient readers, but it shaped thinking about motion for nearly two thousand years." },
  { year: 530, label: "About 530", cat: "Motion", who: "John Philoponus", title: "The thrower gives it a force",
    short: "Philoponus argued that the thrower puts an 'impressed force' into the object, which slowly runs out. No pushing air needed.",
    long: "Writing in Alexandria, Philoponus pointed out that if air could keep a stone moving, you could throw things just by stirring the air. His impressed-force idea was an early step towards the modern idea of momentum." },
  { year: 1350, label: "About 1350", cat: "Motion", who: "Jean Buridan", title: "Impetus",
    short: "Buridan's impetus grew with an object's speed and amount of matter, and would last forever if nothing resisted it.",
    long: "Buridan's impetus was close to our idea of momentum. Saying it would never run out without resistance hinted at inertia, which Galileo and Newton later made precise." },
  { year: 1537, label: "1537", cat: "Motion", who: "Niccolò Tartaglia", title: "Maths meets cannon fire",
    short: "In Nova Scientia, Tartaglia applied mathematics to gunnery and argued that 45° gives the longest range.",
    long: "Tartaglia still drew cannonball paths as straight lines joined by curves, but he was one of the first to treat projectiles mathematically. His 45° claim is exactly right when air resistance is ignored.", try: "galileo" },
  { year: 1631, label: "1631", cat: "Measurement", who: "Pierre Vernier", title: "The vernier scale",
    short: "Vernier described a sliding second scale that lets you read between the marks of a main scale.",
    long: "Vernier's idea was to make the sliding scale's divisions slightly smaller than the main ones. Wherever two lines line up tells you the fraction of a division, so a millimetre scale can be read to a tenth of a millimetre.", tool: "vernier" },
  { year: 1638, label: "1638", cat: "Motion", who: "Galileo Galilei", title: "The path is a parabola",
    short: "In Two New Sciences, Galileo showed that steady sideways motion plus steadily accelerating fall gives a parabola.",
    long: "Galileo's big insight was to treat horizontal and vertical motion separately. Sideways the ball keeps a steady speed; downwards it speeds up evenly. Put together, the path is a parabola, and the longest throw is at 45°: the exact physics this simulator uses when air is off.", try: "galileo" },
  { year: 1632, label: "1632", cat: "Motion", who: "Galileo Galilei", title: "Galileo's ship: motion is relative",
    short: "Galileo argued that in a smoothly moving ship's cabin, nothing you do can tell you the ship is moving.",
    long: "In his Dialogue Concerning the Two Chief World Systems, Galileo described butterflies, fish and dripping water behaving exactly the same in a calm, steadily moving ship. Motion only means something compared with something else. You can see the same idea in the Relative motion section, with a boat on a river and a walk in the rain.", rel: true },
  { year: 1640, label: "About 1640", cat: "Measurement", who: "William Gascoigne", title: "The first screw micrometer",
    short: "Gascoigne put a fine screw in his telescope's eyepiece to measure the sizes of the Moon and planets.",
    long: "Turning a screw a known number of times moves its tip a precise distance. Gascoigne used this to move pointers in his telescope, measuring tiny angles in the sky. The same principle is inside every screw gauge.", tool: "screw" },
  { year: 1687, label: "1687", cat: "Motion", who: "Isaac Newton", title: "Laws of motion and gravity",
    short: "Newton's Principia explained projectiles and planets with the same laws: inertia, F = ma, and universal gravitation.",
    long: "With Newton, a thrown ball and the orbiting Moon became the same kind of problem. Every simulation of projectile motion, including this one, applies his second law step by step." },
  { year: 1728, label: "1728", cat: "Space", who: "Isaac Newton", title: "Newton's cannonball",
    short: "Newton imagined a mountain-top cannon: fire fast enough and the ball falls around the Earth forever. An orbit.",
    long: "Published after his death in A Treatise of the System of the World, the thought experiment shows that an orbit is just a projectile that never lands, because the ground curves away as fast as it falls.", try: "cannon" },
  { year: 1742, label: "1742", cat: "Motion", who: "Benjamin Robins", title: "Air matters, a lot",
    short: "Robins' New Principles of Gunnery used his ballistic pendulum to measure bullet speeds and showed air resistance hugely shortens real ranges.",
    long: "Robins fired musket balls into a heavy swinging pendulum; how far it swung revealed the ball's speed. Comparing with real ranges proved that the parabola badly overestimates fast shots, because air drag is enormous.", try: "pingpong" },
  { year: 1745, label: "1745", cat: "Motion", who: "Leonhard Euler", title: "The maths of moving through air",
    short: "Euler translated Robins' book into German and added his own mathematical analysis of motion with air resistance.",
    long: "Euler's commentary was longer than the original book. Equations like his can't usually be solved neatly, which is why we now solve them step by step on computers." },
  { year: 1795, label: "1795", cat: "Units", who: "French Academy of Sciences", title: "The metric system",
    short: "France adopted the metre and the gram, linking units together in powers of ten.",
    long: "Before this, every region had its own feet, pounds and gallons. The metre was defined from the size of the Earth, and every other unit was built from it in steps of ten, which makes conversions as simple as moving a decimal point." },
  { year: 1810, label: "1810", cat: "Measurement", who: "Robert-Aglaé Cauchoix", title: "The first spherometer",
    short: "The French optician Cauchoix made the first known spherometer, for checking the curves of lenses.",
    long: "Lens makers needed to know exactly how curved their surfaces were. A spherometer measures the tiny height of a curved surface between three legs, which gives the radius of curvature.", tool: "sphero" },
  { year: 1848, label: "1848", cat: "Measurement", who: "Jean-Laurent Palmer", title: "The hand-held micrometer",
    short: "Palmer patented a calliper micrometer in France: the ancestor of the modern hand-held screw gauge.",
    long: "Palmer's design put the screw, sleeve and thimble into a small hand tool. Its scale markings on the barrel made it quick to read, and it is still recognisable in every micrometer made today.", tool: "screw" },
  { year: 1852, label: "1852", cat: "Sport", who: "Gustav Magnus", title: "Why spinning balls curve",
    short: "Magnus explained how a spinning ball drags air around it and gets pushed sideways: the Magnus effect.",
    long: "It's why curveballs bend, topspin tennis shots dip and golf balls with backspin float. This simulator doesn't include spin yet, so its balls fly in a single vertical plane unless you aim sideways or add a crosswind." },
  { year: 1867, label: "1867", cat: "Measurement", who: "Brown & Sharpe", title: "Precision goes mass-market",
    short: "At the Paris Exposition, Joseph Brown and Lucien Sharpe saw Palmer's micrometer and took the idea to the USA.",
    long: "They began making micrometers in Providence, Rhode Island. Cheap, accurate measuring tools helped make interchangeable parts, and modern manufacturing, possible." },
  { year: 1960, label: "1960", cat: "Units", who: "General Conference on Weights and Measures", title: "The SI is born",
    short: "The International System of Units (SI) set seven base units used by scientists everywhere: metre, kilogram, second, ampere, kelvin, mole and candela.",
    long: "Having one shared system means a measurement made in India means exactly the same thing in Japan or Brazil. Every physical quantity, like speed in m/s or force in newtons, is built from these base units, which is what dimensional analysis checks." },
  { year: 1957, label: "1957", cat: "Space", who: "Soviet space programme", title: "Sputnik 1",
    short: "The first artificial satellite: Newton's cannonball made real, falling around the Earth at about 8 km/s.",
    long: "Sputnik 1 orbited the Earth roughly every 96 minutes. Like any orbit, it was in free fall the whole time, just moving sideways fast enough to keep missing the ground." },
  { year: 1968, label: "1968", cat: "Sport", who: "Bob Beamon", title: "A leap in thin air",
    short: "Beamon long-jumped 8.90 m at the Mexico City Olympics, 2,240 m above sea level, where the air is thinner.",
    long: "Thinner air means less drag, which helped a little, though most of the jump was pure athletic brilliance. The record stood for almost 23 years." },
  { year: 1971.1, label: "1971", cat: "Space", who: "Alan Shepard", title: "Golf on the Moon",
    short: "On Apollo 14, Alan Shepard hit golf balls on the Moon, where low gravity and no air let them fly far.",
    long: "Wearing a stiff spacesuit, he swung one-handed. Even so, with gravity one-sixth of Earth's and no air at all, a ball on the Moon goes about six times as far as the same shot on Earth.", try: "moon" },
  { year: 1971.6, label: "1971", cat: "Space", who: "David Scott", title: "Hammer and feather",
    short: "On Apollo 15, David Scott dropped a hammer and a feather on the Moon. With no air, they landed together.",
    long: "It was a live TV demonstration of what Galileo had argued: without air resistance, everything falls with the same acceleration, whatever its mass.", try: "apollo" },
  { year: 2019, label: "2019", cat: "Units", who: "General Conference on Weights and Measures", title: "Units from nature's constants",
    short: "The kilogram stopped being a metal cylinder in Paris. All SI units are now defined by fixed constants of nature, like the speed of light and Planck's constant.",
    long: "A metal block can lose atoms or gather dust, but constants of nature never change. Since 2019, anyone with the right equipment can realise the kilogram, metre or second anywhere in the universe." },
  { year: 2100, label: "Today", cat: "Motion", who: "", title: "Computers do the stepping",
    short: "Sports analysts, engineers and space agencies simulate flight by taking thousands of tiny time steps, just like this app.",
    long: "Most real trajectories, with drag, wind and spin, have no neat formula. Methods like Runge–Kutta, which this app uses, update velocity and position over and over in tiny steps to trace the path." },
];

// More moments (added in v7)
HISTORY.push(
  { year: -213, label: "About 213 BC", cat: "Motion", who: "Archimedes", title: "Catapults at Syracuse",
    short: "During the Roman siege of Syracuse, Archimedes' machines were said to hurl stones of different sizes at ships near and far.",
    long: "Ancient writers describe engines that could be set for short or long range, so the attackers were never safe at any distance. Choosing how hard and at what angle to throw is exactly what projectile motion is about, worked out by trial and skill long before anyone had the equations." },
  { year: 499, label: "499", cat: "Motion", who: "Aryabhata", title: "The boat and the moving shore",
    short: "In the Aryabhatiya, Aryabhata explained the daily motion of the stars with a boat: someone moving forward sees the still bank moving backwards.",
    long: "He used this picture of relative motion to argue that the Earth spins, so the fixed stars only appear to sweep westward across the sky. It's the same idea as the boat in the Relative motion section: what you see depends on how you yourself are moving.", rel: true },
  { year: 1590, label: "About 1590", cat: "Motion", who: "Galileo Galilei", title: "Falling bodies at Pisa",
    short: "In his early work On Motion, Galileo challenged Aristotle's claim that heavier things fall faster in proportion to their weight.",
    long: "The famous story of dropping balls from the Leaning Tower may never have happened exactly as told, but Galileo did argue, and later showed with careful experiments, that air resistance, not weight, is what makes falling objects differ.", try: "apollo" },
  { year: 1604, label: "About 1604", cat: "Motion", who: "Galileo Galilei", title: "Rolling balls down a ramp",
    short: "Galileo slowed falling down by rolling balls along gentle slopes and found that distance grows with the square of the time.",
    long: "Timing with a water clock, he found that in equal times a ball covers distances in the ratio 1 : 3 : 5 : 7. Add them up and you get 1, 4, 9, 16: distance ∝ t². Today we write it as s = ½at²." },
  { year: 1609, label: "1609", cat: "Space", who: "Johannes Kepler", title: "Planets move in ellipses",
    short: "In Astronomia Nova, Kepler showed that Mars moves on an ellipse, speeding up when it is closer to the Sun.",
    long: "Kepler worked from years of precise observations by Tycho Brahe. His laws described how planets move; Newton later explained why, using the same gravity that bends a thrown ball's path." },
  { year: 1656, label: "1656", cat: "Measurement", who: "Christiaan Huygens", title: "The pendulum clock",
    short: "Huygens built the first pendulum clock, accurate to about a minute a day instead of a quarter of an hour.",
    long: "Good experiments on motion need good time measurement. Galileo had noticed that a pendulum keeps a steady beat; Huygens turned that into a working clock, and for nearly three centuries pendulum clocks were the most accurate timekeepers in the world." },
  { year: 1673, label: "1673", cat: "Motion", who: "Christiaan Huygens", title: "The maths of going in circles",
    short: "Huygens published the rule for the push needed to keep something moving in a circle: it grows with v² and shrinks with the radius.",
    long: "Today we write the centripetal acceleration as a = v²/r, the rule behind every circular motion. Newton used the same idea to link the Moon's orbit to falling apples." },
  { year: 1798, label: "1798", cat: "Space", who: "Henry Cavendish", title: "Weighing the Earth",
    short: "With a delicate torsion balance, Cavendish measured the tiny pull between lead balls in his lab.",
    long: "From that pull he worked out the density of the Earth, which lets us find the gravitational constant G. It's why we can say g = 9.81 m/s² comes from the Earth's mass and size." },
  { year: 1799, label: "1799", cat: "Units", who: "French Republic", title: "A metre you could hold",
    short: "Platinum bars for the metre and the kilogram were placed in the Archives in Paris as the official standards.",
    long: "The 'Mètre des Archives' was made to match one ten-millionth of the distance from the North Pole to the equator, as measured by a seven-year survey. For the first time, a unit was meant to belong to everyone, not to a king." },
  { year: 1889, label: "1889", cat: "Units", who: "International Bureau of Weights and Measures", title: "The kilogram in a vault",
    short: "A cylinder of platinum–iridium near Paris became the International Prototype of the Kilogram, the mass every scale was traced back to.",
    long: "Copies were sent around the world and checked against it every few decades. Over a century, the copies and the original drifted apart by tens of micrograms: one reason the kilogram was redefined in 2019." },
  { year: 1905, label: "1905", cat: "Motion", who: "Albert Einstein", title: "Relativity",
    short: "Einstein's special relativity started from Galileo's idea that steady motion can't be detected from inside, and added that light's speed is the same for everyone.",
    long: "At everyday speeds, velocities simply add and subtract, exactly as with the boat and the rain in the Relative motion section. Only near the speed of light does that rule need correcting, and then time and length themselves change.", rel: true },
  { year: 1926, label: "1926", cat: "Space", who: "Robert Goddard", title: "The first liquid-fuelled rocket",
    short: "Goddard's rocket rose about 12 metres and flew for 2.5 seconds in a Massachusetts field.",
    long: "A tiny flight, but the start of modern rocketry. Once a rocket's engine stops, it is just a projectile: everything after burnout follows the same physics as a thrown ball." },
  { year: 1967, label: "1967", cat: "Units", who: "General Conference on Weights and Measures", title: "A second from atoms",
    short: "The second was redefined using the caesium atom: 9,192,631,770 ticks of its natural vibration.",
    long: "Before this the second came from the Earth's rotation, which wobbles. Atomic clocks are so steady that the best ones would lose less than a second over the age of the universe, and GPS depends on them." },
  { year: 1977, label: "1977", cat: "Space", who: "NASA", title: "Voyager's gravity slingshots",
    short: "The two Voyager probes launched and used close passes of Jupiter and Saturn to gain speed on their way out of the Solar System.",
    long: "A gravity assist is relative motion on a grand scale: relative to the planet, the probe swings round and leaves at the same speed, but the planet itself is moving, so relative to the Sun the probe speeds up." },
  { year: 1983, label: "1983", cat: "Units", who: "General Conference on Weights and Measures", title: "A metre from light",
    short: "The metre became the distance light travels in a vacuum in 1/299,792,458 of a second.",
    long: "This fixed the speed of light at exactly 299,792,458 m/s. Instead of a metal bar, the metre now comes from time, which we can measure better than anything else." },
  { year: 2001, label: "2001", cat: "Sport", who: "Hawk-Eye", title: "Ball tracking on TV",
    short: "Cameras around a cricket ground tracked the ball and predicted its path, first shown on television in 2001.",
    long: "Several high-speed cameras find the ball's position in each frame, then software fits a trajectory and extends it. Tennis, cricket and football now use the same idea to decide close calls." },
);

const FACTS = [
  "Without air, a ball thrown at 30° and one at 60° (same speed) land in exactly the same spot.",
  "At the top of its path, a ball isn't stopped: it's still moving sideways at its horizontal speed.",
  "A ping-pong ball thrown hard loses most of its speed to air within a few metres.",
  "On the Moon, the same throw goes about six times farther than on Earth.",
  "A vernier calliper with 20 divisions can read to 0.05 mm: about the thickness of a human hair.",
  "A screw gauge with 0.5 mm pitch and 50 divisions reads to 0.01 mm.",
  "Orbits are just very fast projectiles that keep missing the ground.",
  "To cross a river fastest, point straight across, even though the current carries you downstream.",
  "Rain falling straight down seems to slant towards you as soon as you start walking.",
  "Since 2019 the kilogram is defined by Planck's constant, not by a metal cylinder in Paris.",
  "In equal times, a ball rolling from rest covers distances in the ratio 1 : 3 : 5 : 7, which Galileo found with a water clock.",
  "Aryabhata used a boat on a river to explain why the stars seem to move: around 1,500 years ago.",
  "A caesium atomic clock ticks 9,192,631,770 times every second.",
];

function initHistory(app, el) {
  TRIVIA.hist = FACTS;
  let filter = "All", query = "";
  const open = new Set(), closedEras = new Set();
  const ERAS = [[-1e9, 1500, "Ancient & medieval ideas", "🏛️"], [1500, 1700, "The scientific revolution", "🔭"],
                [1700, 1900, "The age of precision", "📏"], [1900, 1e9, "The modern era", "🚀"]];

  el.innerHTML = `
    <div class="page-intro"><div><div class="page-title">History</div>
      <div class="card-sub">From Aristotle's pushing air to units defined by nature's constants: how we learned to predict a flight, and to measure precisely.</div></div>
      <div class="score-chip hs-count" id="hs-count"></div></div>
    ${funFact("hist")}
    <div class="hs-tools">
      <div class="pills" id="hs-filter"></div>
      <div class="hs-right">
        <input type="search" id="hs-q" placeholder="Search people or ideas" aria-label="Search history">
        <button class="btn small" id="hs-all"></button>
      </div>
    </div>
    <div id="hs-list"></div>`;
  const $ = (q) => el.querySelector(q);

  const matches = (h) => (filter === "All" || h.cat === filter) &&
    (!query || `${h.title} ${h.who} ${h.short} ${h.label}`.toLowerCase().includes(query));

  function render() {
    const items = HISTORY.filter(matches).sort((a, b) => a.year - b.year);
    $("#hs-filter").innerHTML = ["All", ...Object.keys(HIST_CATS)].map((c) =>
      `<button data-cat="${c}" class="${filter === c ? "on" : ""}" ${c !== "All" ? `style="--tc:${HIST_CATS[c].color}"` : ""}>${c}${c !== "All" ? ` · ${HISTORY.filter((h) => h.cat === c).length}` : ""}</button>`).join("");
    $("#hs-count").textContent = `${items.length} moment${items.length === 1 ? "" : "s"}`;
    const allOpen = items.length && items.every((h) => open.has(HISTORY.indexOf(h)));
    $("#hs-all").textContent = allOpen ? "Collapse all" : "Expand all";
    if (!items.length) { $("#hs-list").innerHTML = `<div class="note">Nothing matches that. Try another word or category.</div>`; return; }
    $("#hs-list").innerHTML = ERAS.map(([a, b, name, icon]) => {
      const list = items.filter((h) => h.year >= a && h.year < b);
      if (!list.length) return "";
      const span = `${list[0].label} – ${list[list.length - 1].label}`;
      return `<details class="era-group" data-era="${name}" ${closedEras.has(name) ? "" : "open"}>
        <summary><span class="era-ic">${icon}</span><span><b>${name}</b><small>${list.length} moment${list.length === 1 ? "" : "s"} · ${span}</small></span></summary>
        <div class="timeline">${list.map((h, i) => {
          const c = HIST_CATS[h.cat], id = HISTORY.indexOf(h);
          return `<details class="t-item" data-id="${id}" style="--tc:${c.color};--ts:${c.soft};animation-delay:${Math.min(i, 10) * 30}ms" ${open.has(id) ? "open" : ""}>
            <summary class="t-head"><span class="t-dot"></span><span class="t-year">${h.label}</span>
              <span class="t-main"><span class="t-title">${h.title}</span><span class="t-meta">${h.who ? `${h.who} · ` : ""}<span class="t-cat">${h.cat}</span></span></span></summary>
            <div class="t-body">
              <p class="t-lead">${h.short}</p>
              <p class="t-long">${h.long}</p>
              <div class="t-actions">
                ${h.try ? `<button class="btn small tint" data-try="${h.try}">${ICON.play}Try it</button>` : ""}
                ${h.rel ? `<button class="btn small tint" data-rel>Open relative motion</button>` : ""}
                ${h.tool ? `<button class="btn small tint" data-tool="${h.tool}">Open the ${TOOLS[h.tool].name.toLowerCase()}</button>` : ""}
              </div>
            </div></details>`; }).join("")}</div></details>`;
    }).join("");
  }

  // remember which entries and eras are open, so filtering doesn't fold everything up
  el.addEventListener("toggle", (e) => {
    const d = e.target;
    if (d.classList?.contains("t-item")) { const id = +d.dataset.id; d.open ? open.add(id) : open.delete(id); $("#hs-all").textContent = HISTORY.filter(matches).every((h) => open.has(HISTORY.indexOf(h))) ? "Collapse all" : "Expand all"; }
    if (d.classList?.contains("era-group")) d.open ? closedEras.delete(d.dataset.era) : closedEras.add(d.dataset.era);
  }, true);
  $("#hs-q").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
  el.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.cat) { filter = b.dataset.cat; return render(); }
    if (b.id === "hs-all") {
      const items = HISTORY.filter(matches), allOpen = items.every((h) => open.has(HISTORY.indexOf(h)));
      items.forEach((h) => allOpen ? open.delete(HISTORY.indexOf(h)) : open.add(HISTORY.indexOf(h)));
      if (!allOpen) closedEras.clear();
      return render();
    }
    if (b.dataset.try) return app.tryPreset(b.dataset.try);
    if (b.hasAttribute("data-rel")) return app.go("relative");
    if (b.dataset.tool) return app.openTool(b.dataset.tool);
  });
  render();
  return {};
}
