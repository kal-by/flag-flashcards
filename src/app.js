const ccs = require("country-codes-list");

const allRegions = [
  "Africa",
  "Arab States",
  "Asia & Pacific",
  "Asia",
  "Atlantic Ocean",
  "Australia",
  "Caribbean Sea",
  "Caribbean",
  "Europe",
  "Indian Ocean",
  "North America",
  "Pacific Ocean",
  "South Atlantic Ocean",
  "South Pacific Ocean",
  "South/Latin America",
  "Unknown",
];
let regions;
const allCountries = ccs.all();
let countries;
let current;
const correct = [];
const incorrect = [];

// html elements
// nav and settings
const howToModal = document.getElementById("howToModal");
const howToBtn = document.getElementById("howToBtn");
const settingsModal = document.getElementById("settingsModal");
const regionSettings = document.getElementById("regionSettings");
const scoreText = document.getElementById("scoreText");
const settingsBtn = document.getElementById("settingsBtn");
const resetBtn = document.getElementById("resetBtn");
// cards and controls
const deck = document.getElementById("deck");
const correctScore = document.getElementById("correctScore");
const incorrectScore = document.getElementById("incorrectScore");
const correctBtn = document.getElementById("correctBtn");
const incorrectBtn = document.getElementById("incorrectBtn");

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

const getRegions = () => {
  regions = [];
  for (const cb of document.querySelectorAll(":checked")) {
    regions.push(cb.value);
  }
};

const buildSettings = () => {
  updateScore();
  for (const region of allRegions) {
    const regionCb = document.createElement("input");
    regionCb.type = "checkbox";
    regionCb.name = region;
    regionCb.value = region;
    regionCb.checked = true;
    const regionLabel = document.createElement("label");
    regionLabel.setAttribute("for", region);
    regionLabel.innerHTML = region;
    regionSettings.appendChild(regionCb);
    regionSettings.appendChild(regionLabel);
    regionSettings.appendChild(document.createElement("br"));
  }
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
  }
};

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
  const countryCallingCode = document.createElement("h2");
  countryCallingCode.innerText = `(${country.countryCallingCode})`;
  backDisplay.appendChild(countryNameEn);
  backDisplay.appendChild(countryNameLocal);
  backDisplay.appendChild(countryCallingCode);

  card.appendChild(front);
  card.appendChild(back);
  back.appendChild(backDisplay);

  card.addEventListener("click", flipCard(front, back));

  return card;
};

const buildDeck = () => {
  getRegions();
  countries = allCountries.filter((country) =>
    regions.includes(country.region)
  );
  shuffle(countries);
  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
    delete country.prev;
    delete country.next;
    if (i > 0) {
      country.prev = countries[i - 1];
      if (i < countries.length) {
        countries[i - 1].next = country;
      }
    }
    const card = buildCard(country, countries.length - i);
    country.card = card;
    deck.appendChild(card);
  }

  current = countries[0];
  toggleHidden(current.card);
};

const getNextCard = (e) => {
  let left = true;
  if (e.srcElement == correctBtn) {
    correct.push(current);
  } else if (e.srcElement == incorrectBtn) {
    incorrect.push(current);
    left = false;
  }

  if (current.next) {
    current.next.card.style.visibility = "visible";
    if (left) {
      slideCardLeft(current.card);
    } else {
      slideCardRight(current.card);
    }
    current = current.next;
  } else {
    if (left) {
      slideCardLeft(current.card);
    } else {
      slideCardRight(current.card);
    }
    toggleShowSettings({ target: settingsBtn });
  }
  updateScore();
};

const updateScore = () => {
  correctScore.innerHTML = `${correct.length}`;
  incorrectScore.innerHTML = `${incorrect.length}`;
  const percentScore =
    correct.length + incorrect.length > 0
      ? ((correct.length / (correct.length + incorrect.length)) * 100).toFixed(
          2
        )
      : 0;
  const score = `${correct.length}/${
    correct.length + incorrect.length
  } (${percentScore}%)`;
  scoreText.innerHTML = `<h2>Score: ${score}</h2>`;
};

const reset = () => {
  correct.length = 0;
  incorrect.length = 0;
  deck.replaceChildren();
  buildDeck();
  updateScore();
  toggleShowSettings({ target: settingsBtn });
};

// add event listeners
howToBtn.addEventListener("click", toggleShowHowTo);
howToModal.addEventListener("click", toggleShowHowTo);
settingsBtn.addEventListener("click", toggleShowSettings);
settingsModal.addEventListener("click", toggleShowSettings);
resetBtn.addEventListener("click", reset);
correctBtn.addEventListener("click", getNextCard);
incorrectBtn.addEventListener("click", getNextCard);

// start
buildSettings();
buildDeck();
