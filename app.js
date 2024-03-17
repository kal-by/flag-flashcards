import countryData from "./countryData";
const version = import.meta.env.VITE_REACT_APP_VERSION;

let settings = {};

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
let countries;
let current;
const correct = [];
const incorrect = [];

// html elements
// nav and settings
const howToModal = document.getElementById("howToModal");
const howToBtn = document.getElementById("howToBtn");
const settingsModal = document.getElementById("settingsModal");
const scoreText = document.getElementById("scoreText");
const settingsBtn = document.getElementById("settingsBtn");
const regionSettings = document.getElementById("regionSettings");
const settingsMessage = document.getElementById("settingsMessage");
const resetBtn = document.getElementById("resetBtn");
const repeatBtn = document.getElementById("repeatBtn");
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

const initialize = () => {
  localStorage.clear();
  settings.version = version;
  settings.regions = allRegions.slice(0);
  saveSettings();
};

const saveSettings = () => {
  localStorage.setItem("settings", JSON.stringify(settings));
};

const loadSettings = () => {
  const lsSettings = JSON.parse(localStorage.getItem("settings"));
  if (
    lsSettings &&
    lsSettings.version == version &&
    lsSettings.regions.length > 0
  ) {
    settings = lsSettings;
  } else {
    initialize();
  }
};

const buildSettingsModal = () => {
  updateScore();
  for (const region of allRegions) {
    const regionCb = document.createElement("input");
    regionCb.type = "checkbox";
    regionCb.name = region;
    regionCb.value = region;
    regionCb.checked = settings.regions.includes(region);
    regionCb.addEventListener("change", () => {
      if (regionCb.checked) {
        settings.regions.push(region);
        hideSettingsMessage();
      } else {
        settings.regions.splice(settings.regions.indexOf(region), 1);
      }
      saveSettings();
    });
    const regionLabel = document.createElement("label");
    regionLabel.setAttribute("for", region);
    regionLabel.innerHTML = region;
    regionLabel.addEventListener("click", () => {
      regionCb.click();
    });
    regionSettings.appendChild(regionCb);
    regionSettings.appendChild(regionLabel);
    regionSettings.appendChild(document.createElement("br"));
  }
};

const showSettingsMessage = (message, type) => {
  if (settingsMessage.classList.contains("success")) {
    settingsMessage.classList.remove("success");
  } else if (settingsMessage.classList.contains("danger")) {
    settingsMessage.classList.remove("danger");
  }
  settingsMessage.innerHTML = message;
  settingsMessage.classList.add(type);
};

const hideSettingsMessage = () => {
  settingsMessage.innerHTML = "";
  settingsMessage.classList.remove("success");
  settingsMessage.classList.remove("danger");
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
    hideSettingsMessage();
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

const buildDeck = (repeatIncorrect = false) => {
  if (!repeatIncorrect) {
    countries = allCountries.filter((country) =>
      settings.regions.includes(country.region)
    );
  }
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
  if (settings.regions.length == 0) {
    showSettingsMessage("Please select at least one region to reset", "danger");
    return;
  }
  correct.length = 0;
  incorrect.length = 0;
  deck.replaceChildren();
  buildDeck();
  updateScore();
  toggleShowSettings({ target: settingsBtn });
};

const repeat = () => {
  if (correct.length + incorrect.length == 0) {
    showSettingsMessage("No incorrect flags to repeat yet", "success");
    return;
  }
  if (incorrect.length == 0) {
    showSettingsMessage("No incorrect flags to repeat - good job!", "success");
    return;
  }
  countries = incorrect.slice(0);
  correct.length = 0;
  incorrect.length = 0;
  deck.replaceChildren();
  buildDeck(true);
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

correctBtn.addEventListener("click", getNextCard);
incorrectBtn.addEventListener("click", getNextCard);

// start
loadSettings();
buildSettingsModal();
buildDeck();
