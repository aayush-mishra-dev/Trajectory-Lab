// ===================================================================
//  Quiz & Games: the quiz and the target challenges in one place
// ===================================================================

function initPlay(app, el) {
  let tab = app.store.get("play-tab", "quiz");
  el.innerHTML = `
    <div class="page-intro"><div><div class="page-title">Quiz & Games</div>
      <div class="card-sub">Test yourself with a quiz that adapts to you, or land shots on targets across 50 levels.</div></div></div>
    <div class="subnav">
      <button data-sub="quiz"><b>🧠 Quiz</b><small>Personal, adaptive questions</small></button>
      <button data-sub="games"><b>🎯 Target challenges</b><small>${LEVELS.length} levels · earn stars</small></button>
    </div>
    <div id="play-quiz"></div><div id="play-games"></div>`;
  const parts = {};
  function show() {
    el.querySelectorAll(".subnav button").forEach((b) => b.classList.toggle("on", b.dataset.sub === tab));
    el.querySelector("#play-quiz").hidden = tab !== "quiz";
    el.querySelector("#play-games").hidden = tab !== "games";
    if (!parts[tab]) parts[tab] = tab === "quiz" ? initQuiz(app, el.querySelector("#play-quiz")) : initChallenges(app, el.querySelector("#play-games"));
    parts[tab].show?.();
  }
  el.querySelector(".subnav").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    tab = b.dataset.sub; app.store.set("play-tab", tab); show();
  });
  show();
  return { show };
}
