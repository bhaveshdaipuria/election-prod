let currentData = [];
let currentYear = 2020;

// Add CSS styles
function addStyles() {
  const style = document.createElement("style");
  style.textContent = `
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background-color: #f5f5f5;
                }

                .election-widget {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin: 0 auto;
                    overflow: hidden;
                }

                .header {
                    padding: 20px;
                    border-bottom: 1px solid #e5e5e5;
                }

                .title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 15px;
                }

                .year-tabs {
                    display: flex;
                    gap: 10px;
                }

                .year-tab {
                    padding: 8px 16px;
                    border-radius: 20px;
                    border: 1px solid #ddd;
                    background: white;
                    color: #666;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .year-tab.active {
                    background: #ff6b35;
                    color: white;
                    border-color: #ff6b35;
                }

                .year-tab:hover:not(.active) {
                    background: #f8f9fa;
                    border-color: #ccc;
                }

                .table-container {
                    background: #fdf6f3;
                }

                .table-header {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr;
                    padding: 15px 20px;
                    background: #f5e6df;
                    font-weight: 600;
                    color: #333;
                    font-size: 14px;
                    border-bottom: 1px solid #e5d5c8;
                }

                .results-list {
                    max-height: 400px;
                    overflow-y: auto;
                }

                .party-row {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr;
                    padding: 12px 20px;
                    border-bottom: 1px solid #f0e0d3;
                    align-items: center;
                    transition: background-color 0.2s ease;
                }

                .party-row:hover {
                    background: #f9f0eb;
                }

                .party-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .party-logo {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 10px;
                }

                .party-name {
                    font-weight: 500;
                    color: #333;
                    font-size: 14px;
                }

                .seats-won, .position {
                    font-weight: 600;
                    color: #333;
                    text-align: center;
                    font-size: 14px;
                }

                .loading {
                    padding: 40px;
                    text-align: center;
                    color: #666;
                }

                .no-data {
                    padding: 40px;
                    text-align: center;
                    color: #666;
                    font-style: italic;
                }

                .results-list::-webkit-scrollbar {
                    width: 6px;
                }

                .results-list::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }

                .results-list::-webkit-scrollbar-thumb {
                    background: #ccc;
                    border-radius: 3px;
                }

                .results-list::-webkit-scrollbar-thumb:hover {
                    background: #bbb;
                }
            `;
  document.head.appendChild(style);
}

// Create the main widget structure
function createWidget() {
  const container = document.getElementById("electionWidget");

  // Create main widget div
  const widget = document.createElement("div");
  widget.className = "election-widget";

  // Create header
  const header = document.createElement("div");
  header.className = "header";

  const title = document.createElement("h2");
  title.className = "title";
  title.textContent = "जीत हार";

  const yearTabs = document.createElement("div");
  yearTabs.className = "year-tabs";
  yearTabs.id = "yearTabs";

  header.appendChild(title);
  header.appendChild(yearTabs);

  // Create table container
  const tableContainer = document.createElement("div");
  tableContainer.className = "table-container";

  const tableHeader = document.createElement("div");
  tableHeader.className = "table-header";

  const partyHeader = document.createElement("div");
  partyHeader.textContent = "पार्टी";

  const positionHeader = document.createElement("div");
  positionHeader.textContent = "आगे";
  positionHeader.style.textAlign = "center";

  const seatsHeader = document.createElement("div");
  seatsHeader.textContent = "जीते";
  seatsHeader.style.textAlign = "center";

  tableHeader.appendChild(partyHeader);
  tableHeader.appendChild(positionHeader);
  tableHeader.appendChild(seatsHeader);

  const resultsList = document.createElement("div");
  resultsList.className = "results-list";
  resultsList.id = "resultsList";

  const loading = document.createElement("div");
  loading.className = "loading";
  loading.textContent = "Loading...";
  resultsList.appendChild(loading);

  tableContainer.appendChild(tableHeader);
  tableContainer.appendChild(resultsList);

  widget.appendChild(header);
  widget.appendChild(tableContainer);

  container.appendChild(widget);
}

function getPartyInitials(partyName) {
  const initials = partyName
    .split(" ")
    .map((word) => word.charAt(0))
    .join("");
  return initials.length > 2 ? initials.substring(0, 2) : initials;
}

function createYearTabs() {
  const yearTabs = document.getElementById("yearTabs");
  const years = [...new Set(currentData.map((item) => item.year))].sort(
    (a, b) => b - a
  );

  yearTabs.innerHTML = "";

  years.forEach((year) => {
    const tab = document.createElement("div");
    tab.className = `year-tab ${year === currentYear ? "active" : ""}`;
    tab.textContent = year;
    tab.addEventListener("click", () => {
      currentYear = year;
      updateActiveTab();
      displayResults(year);
    });
    yearTabs.appendChild(tab);
  });
}

function updateActiveTab() {
  document.querySelectorAll(".year-tab").forEach((tab) => {
    tab.classList.remove("active");
    if (parseInt(tab.textContent) === currentYear) {
      tab.classList.add("active");
    }
  });
}

function displayResults(year) {
  const resultsList = document.getElementById("resultsList");
  const yearData = currentData.find((item) => item.year === year);

  if (!yearData) {
    resultsList.innerHTML = "";
    const noData = document.createElement("div");
    noData.className = "no-data";
    noData.textContent = "No data available for this year";
    resultsList.appendChild(noData);
    return;
  }

  // Sort parties by seats won (descending)
  const sortedParties = [...yearData.parties].sort(
    (a, b) => b.seatsWon - a.seatsWon
  );

  resultsList.innerHTML = "";

  sortedParties.forEach((partyData, index) => {
    const row = document.createElement("div");
    row.className = "party-row";

    // Party info column
    const partyInfo = document.createElement("div");
    partyInfo.className = "party-info";

    const logo = document.createElement("div");
    logo.className = "party-logo";
    //   logo.style.backgroundColor = partyData.party.color_code || "#666";

    if (partyData.party.party_logo) {
      logo.style.backgroundImage = `url(${partyData.party.party_logo})`;
      logo.style.backgroundSize = "contain";
      logo.style.backgroundRepeat = "no-repeat";
      logo.style.backgroundPosition = "center";
      logo.style.backgroundColor = "transparent"; // Optional: clear background color
    } else {
      logo.style.backgroundImage = "none";
      logo.style.backgroundColor = partyData.party.color_code || "#666";
    }

    logo.textContent = getPartyInitials(partyData.party.party);

    const partyName = document.createElement("div");
    partyName.className = "party-name";
    partyName.textContent = partyData.party.party;

    partyInfo.appendChild(logo);
    partyInfo.appendChild(partyName);

    // Position column
    const position = document.createElement("div");
    position.className = "position";
    position.textContent =
      yearData.status === "completed" ? "0" : partyData.seatsWon;

    // Seats won column
    const seatsWon = document.createElement("div");
    seatsWon.className = "seats-won";
    seatsWon.textContent =
      yearData.status !== "completed" ? "0" : partyData.seatsWon;

    row.appendChild(partyInfo);
    row.appendChild(position);
    row.appendChild(seatsWon);

    resultsList.appendChild(row);
  });
}

function setupWidget() {
  createYearTabs();
  displayResults(currentYear);
}

async function fetchElectionData() {
  try {
    const params = new URLSearchParams(document.location.search);
    const stateName = params.get("state") || "Bihar";
    // This would be your actual API endpoint
    const response = await fetch(
      `https://election.prabhatkhabar.com/elections/state-elections?state=${stateName}`
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching election data:", error);
    return null;
  }
}

// Initialize the widget
async function init() {
  addStyles();
  createWidget();
  currentData = await fetchElectionData();
  setupWidget();
}

// Start the application
init();
