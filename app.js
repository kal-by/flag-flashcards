import countryData from "./countryData";

// constants
const version = import.meta.env.VITE_REACT_APP_VERSION;
const allRegions = [
  "Africa",
  "Antarctica",
  "Asia",
  "Europe",
  "North America",
  "Oceania",
  "South America",
];
const allCountries = countryData;

// game state variables
let state = {};
let countries;
let remaining = [];
let correct = [];
let incorrect = [];

// html elements
const howToModal = document.getElementById("howToModal");
const howToBtn = document.getElementById("howToBtn");
const settingsModal = document.getElementById("settingsModal");
const settingsBtn = document.getElementById("settingsBtn");
const regionSettings = document.getElementById("regionSettings");
const regionCheckboxes = [];
const resetBtn = document.getElementById("resetBtn");
const repeatBtn = document.getElementById("repeatBtn");
const toast = document.getElementById("toast");
const deck = document.getElementById("deck");
const correctBtn = document.getElementById("correctBtn");
const incorrectBtn = document.getElementById("incorrectBtn");
const correctScore = document.getElementsByClassName("correctScore");
const flagCount = document.getElementsByClassName("flagCount");
const incorrectScore = document.getElementsByClassName("incorrectScore");
const percentScore = document.getElementById("percentScore");

// helpers
const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

const getFlagStyle = (cc) => {
  return `url("img/${cc}.svg")`;
};

const toggleHidden = (element) => {
  element.classList.toggle("hidden");
};

const flipCard = (front, back) => {
  return () => {
    front.classList.toggle("flipped");
    back.classList.toggle("flipped");
  };
};

const slideCardLeft = (card) => {
  card.classList.toggle("slide-left");
};

const slideCardRight = (card) => {
  card.classList.toggle("slide-right");
};

// dynamic interface elements (other than deck)
const buildSettingsModal = () => {
  for (const region of allRegions) {
    const regionCb = document.createElement("input");
    regionCb.type = "checkbox";
    regionCb.name = region;
    regionCb.value = region;
    regionCheckboxes.push(regionCb);
    const regionLabel = document.createElement("label");
    const regionCount = allCountries.filter((country) => {
      return country.region == region;
    }).length;
    regionLabel.setAttribute("for", region);
    regionLabel.innerHTML = `${region} (${regionCount} flags)`;
    regionLabel.addEventListener("click", () => {
      regionCb.click();
    });
    regionSettings.appendChild(regionCb);
    regionSettings.appendChild(regionLabel);
    regionSettings.appendChild(document.createElement("br"));
  }
};

// state handling
const initializeState = () => {
  localStorage.clear();
  state.version = version;
  state.settings = {};
  state.settings.regions = allRegions.slice(0);
  for (const regionCb of regionCheckboxes) {
    regionCb.checked = true;
  }
  countries = allCountries.filter((country) =>
    state.settings.regions.includes(country.region)
  );
  shuffle(countries);
  localStorage.setItem("state", JSON.stringify(state));
};

const loadState = () => {
  const lsState = JSON.parse(localStorage.getItem("state"));
  if (
    lsState &&
    lsState.version == version &&
    lsState.settings.regions.length > 0
  ) {
    state = lsState;
    for (const regionCb of regionCheckboxes) {
      regionCb.checked = state.settings.regions.includes(regionCb.value);
    }
  } else {
    initializeState();
  }
};

const saveState = () => {
  state.game = {
    countries: countries,
    remaining: remaining,
    correct: correct,
    incorrect: incorrect,
  };
  state.settings.regions = [];
  for (const regionCb of regionCheckboxes) {
    if (regionCb.checked) {
      state.settings.regions.push(regionCb.value);
    }
  }
  localStorage.setItem("state", JSON.stringify(state));
};

// modal/toast handling
const showToast = (message, type) => {
  if (toast.style.animationPlayState == "running") {
    return;
  }
  toast.innerHTML = message;
  toast.classList.add(type);
  toast.classList.add("show");
  toast.style.animationPlayState = "running";
};

const clearToast = () => {
  toast.classList.remove("show", "success", "danger");
  toast.innerHTML = "";
  toast.style.animationPlayState = "paused";
};

const toggleShowHowTo = (e) => {
  if (e.target == howToBtn || e.target == howToModal) {
    toggleHidden(howToModal);
  }
};

const toggleShowSettings = (e) => {
  // don't allow settings modal to close if game is over
  if (
    !settingsModal.classList.contains("hidden") &&
    correct.length + incorrect.length == countries.length
  ) {
    return;
  }
  if (e.target == settingsBtn || e.target == settingsModal) {
    toggleHidden(settingsModal);
    for (const regionCb of regionCheckboxes) {
      regionCb.checked = state.settings.regions.includes(regionCb.value);
    }
  }
};

// main game/deck elements
const buildCard = (country, zIndex) => {
  const card = document.createElement("div");
  card.classList.add("card");
  card.style.zIndex = zIndex;
  toggleHidden(card);

  const front = document.createElement("div");
  front.classList.add("cardFront");
  front.style.backgroundImage = getFlagStyle(country.countryCode.toLowerCase());

  const back = document.createElement("div");
  back.classList.add("cardBack");

  const backDisplay = document.createElement("div");
  backDisplay.classList.add("cardDisplay");
  backDisplay.classList.add("vcentered");
  const countryNameEn = document.createElement("h1");
  countryNameEn.innerText = `${country.countryNameEn}`;
  const countryNameLocal = document.createElement("h2");
  countryNameLocal.innerText = `${country.countryNameLocal}`;
  const countryCallingCode = document.createElement("h3");
  countryCallingCode.innerText = `.${country.countryCode.toLowerCase()}, ${
    country.countryCallingCode
  }`;
  backDisplay.appendChild(countryNameEn);
  backDisplay.appendChild(countryNameLocal);
  backDisplay.appendChild(countryCallingCode);

  card.appendChild(front);
  card.appendChild(back);
  back.appendChild(backDisplay);

  card.addEventListener("click", flipCard(front, back));

  return card;
};

const buildDeck = (pageLoad = false, repeatIncorrect = false) => {
  if (pageLoad && state.game && state.game.remaining.length > 0) {
    // load from previous state
    countries = state.game.countries;
    remaining = state.game.remaining;
    correct = state.game.correct;
    incorrect = state.game.incorrect;
  } else if (!repeatIncorrect) {
    // create a fresh game from settings
    countries = allCountries.filter((country) =>
      state.settings.regions.includes(country.region)
    );
    shuffle(countries);
    remaining = countries.slice(0);
  } else {
    // create a game from previous mistakes
    countries = incorrect.slice(0);
    correct.length = 0;
    incorrect.length = 0;
    shuffle(countries);
    remaining = countries.slice(0);
  }

  for (let i = 0; i < remaining.length; i++) {
    const country = remaining[i];
    const card = buildCard(country, remaining.length - i);
    country.card = card;
    deck.appendChild(card);
  }

  toggleHidden(remaining[0].card);
  saveState();
};

const getNextCard = (e) => {
  const current = remaining[0];
  let left = true;
  if (e.srcElement == correctBtn) {
    correct.push(current);
  } else if (e.srcElement == incorrectBtn) {
    incorrect.push(current);
    left = false;
  }

  if (remaining.length > 1) {
    remaining[1].card.style.visibility = "visible";
  } else {
    toggleShowSettings({ target: settingsBtn });
  }

  if (left) {
    slideCardLeft(current.card);
  } else {
    slideCardRight(current.card);
  }

  remaining.shift();
  updateScore();
  saveState();
};

const updateScore = () => {
  for (const score of correctScore) {
    score.innerHTML = `${correct.length}`;
  }
  for (const count of flagCount) {
    count.innerHTML = `${Math.min(
      correct.length + incorrect.length,
      countries.length
    )}/${countries.length}`;
  }
  for (const score of incorrectScore) {
    score.innerHTML = `${incorrect.length}`;
  }

  const percent =
    correct.length + incorrect.length > 0
      ? ((correct.length / (correct.length + incorrect.length)) * 100).toFixed(
          2
        )
      : 0;
  percentScore.innerHTML = `${percent}%`;
};

// reset handling
const reset = () => {
  const checkedRegions = regionCheckboxes.filter((cb) => cb.checked);
  if (checkedRegions.length == 0) {
    showToast("Please select at least one region to reset", "danger");
    return;
  }
  correct.length = 0;
  incorrect.length = 0;
  deck.replaceChildren();
  saveState();
  buildDeck();
  updateScore();
  toggleShowSettings({ target: settingsBtn });
};

const repeat = () => {
  if (correct.length + incorrect.length == 0) {
    showToast("No incorrect flags to repeat yet", "success");
    return;
  }
  if (incorrect.length == 0) {
    showToast("No incorrect flags to repeat - good job!", "success");
    return;
  }
  deck.replaceChildren();
  buildDeck(false, true);
  updateScore();
  toggleShowSettings({ target: settingsBtn });
};

// add event listeners
howToBtn.addEventListener("click", toggleShowHowTo);
howToModal.addEventListener("click", toggleShowHowTo);
settingsBtn.addEventListener("click", toggleShowSettings);
settingsModal.addEventListener("click", toggleShowSettings);
resetBtn.addEventListener("click", reset);
repeatBtn.addEventListener("click", repeat);
toast.addEventListener("animationend", clearToast);
correctBtn.addEventListener("click", getNextCard);
incorrectBtn.addEventListener("click", getNextCard);

// dynmically build remaining interface
buildSettingsModal();

// start game
loadState();
buildDeck(true, false);
updateScore();
