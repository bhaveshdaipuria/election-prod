(function () {
  "use strict";

  // Default configuration
  const DEFAULT_CONFIG = {
    containerId: "election-results-widget",
    title: "चुनाव परिणाम",
    apiEndpoint: null,
    state: null,
    years: [],
    defaultYear: null,
    loadingText: "डेटा लोड हो रहा है...",
    errorPrefix: "त्रुटि: ",
    retryText: "पुनः प्रयास करें",
    totalSeatsText: "कुल सीटें: ",
    seatsText: "सीटें",
    majorityText: "बहुमत",
    othersText: "अन्य",
  };

  // CSS Styles - Your original design
  const CSS_STYLES = `
            .election-widget * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            .election-widget {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background-color: #f5f3f0;
            }

            .election-widget .loading {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 200px;
                font-size: 18px;
                color: #4a5568;
            }

            .election-widget .error {
                background-color: #fed7d7;
                color: #c53030;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                text-align: center;
            }

            .election-widget .error button {
                margin-top: 10px;
                padding: 8px 16px;
                background-color: #c53030;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
            }

            .election-widget .container {
                margin: 0 auto;
                padding: 15px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }

            .election-widget .header {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 10px;
            }

            .election-widget .title {
                font-size: 32px;
                font-weight: 600;
                color: #2d3748;
            }

            .election-widget .year-tabs {
                display: flex;
                gap: 10px;
            }

            .election-widget .year-tab {
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                border: none;
                background: none;
            }

            .election-widget .year-tab.active {
                background-color: #ff8c42;
                color: white;
            }

            .election-widget .year-tab:not(.active) {
                background-color: transparent;
                color: #718096;
            }

            .election-widget .year-tab:hover:not(.active) {
                background-color: #e2e8f0;
            }

            .election-widget .year-tab:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .election-widget .total-seats {
                margin-bottom: 10px;
                font-size: 18px;
                color: #4a5568;
            }

            .election-widget .main-results {
                margin-bottom: 40px;
                position: relative;
            }

            .election-widget .results-labels {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                margin-bottom: 15px;
                padding: 0 20px;
            }

            .election-widget .party-result {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
            }

            .election-widget .party-result-name {
                font-size: 18px;
                font-weight: 600;
                color: #2d3748;
            }

            .election-widget .party-result-seats {
                font-size: 28px;
                font-weight: 700;
                color: #2d3748;
            }

            .election-widget .progress-bar-container {
                position: relative;
            }

            .election-widget .progress-bar {
                height: 16px;
                background-color: #e2e8f0;
                border-radius: 8px;
                overflow: hidden;
                position: relative;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12), inset 0 1px 3px rgba(0, 0, 0, 0.08);
                display: flex;
            }

            .election-widget .party-segment {
                transition: width 0.8s ease;
                height: 100%;
            }

            .election-widget .party-segment:first-child {
                border-radius: 8px 0 0 8px;
            }

            .election-widget .party-segment:last-child {
                border-radius: 0 8px 8px 0;
            }

            .election-widget .majority-divider {
                position: absolute;
                top: -8px;
                height: 32px;
                width: 2px;
                background-color: #2d3748;
                left: 50%;
                transform: translateX(-50%);
            }

            .election-widget .party-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-top: 30px;
            }

            .election-widget .party-card {
                background: white;
                border: 2px solid #e2e8f0;
                border-radius: 16px;
                padding: 5px;
                display: flex;
                align-items: center;
                gap: 15px;
                transition: all 0.3s ease;
                cursor: pointer;
            }

            .election-widget .party-card:hover {
                border-color: #cbd5e0;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .election-widget .party-icon {
                width: 38px;
                height: 38px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: white;
                font-size: 12px;
                background-size: cover;
                background-position: center;
                overflow: hidden;
            }

            .election-widget .party-icon img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 50%;
            }

            .election-widget .party-info {
                flex-grow: 1;
            }

            .election-widget .party-name {
                font-size: 16px;
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 4px;
            }

            .election-widget .party-seats {
                font-size: 24px;
                font-weight: 700;
                color: #1a202c;
            }

            @media (max-width: 768px) {
                .election-widget .container {
                    padding: 20px;
                }

                .election-widget .title {
                    font-size: 24px;
                }

                .election-widget .header {
                    flex-direction: column;
                    gap: 15px;
                    text-align: center;
                }

                .election-widget .results-labels {
                    flex-direction: column;
                    gap: 15px;
                    text-align: center;
                }

                .election-widget .party-cards {
                    grid-template-columns: 1fr;
                }
            }
        `;

  // Cache for API responses
  let apiCache = {};

  // Utility functions
  function getConfig(container) {
    const config = { ...DEFAULT_CONFIG };

    if (container.dataset.apiEndpoint)
      config.apiEndpoint = container.dataset.apiEndpoint;
    if (container.dataset.state) config.state = container.dataset.state;
    if (container.dataset.years)
      config.years = container.dataset.years.split(",").map((y) => y.trim());
    if (container.dataset.title) config.title = container.dataset.title;
    if (container.dataset.loadingText)
      config.loadingText = container.dataset.loadingText;

    // Set default year to first available year
    if (!config.defaultYear && config.years.length > 0) {
      config.defaultYear = config.years[0];
    }

    // Validate required config
    if (!config.apiEndpoint) {
      throw new Error(
        "API endpoint is required. Set data-api-endpoint attribute.",
      );
    }
    if (!config.state) {
      throw new Error("State is required. Set data-state attribute.");
    }
    if (config.years.length === 0) {
      throw new Error("Years are required. Set data-years attribute.");
    }

    return config;
  }

  function processElectionData(data, config) {
    const totalSeats = data.totalSeats || 243;
    const halfWayMark = data.halfWayMark || Math.ceil(totalSeats / 2);

    // Process and sort parties by seats
    const parties = (data.parties || [])
      .map((item) => ({
        name: item.party.party,
        seats: item.seatsWon || 0,
        color: item.party.color_code || "#666666",
        logo: item.party.party_logo || null,
        icon: item.party.party.substring(0, 3).toUpperCase(),
      }))
      .sort((a, b) => b.seats - a.seats);

    // Get top 4 parties and calculate others
    const top4Parties = parties.slice(0, 4);
    const otherParties = parties.slice(4);
    const othersSeats = otherParties.reduce((sum, p) => sum + p.seats, 0);

    // Create display parties (top 4 + others if there are remaining parties)
    const displayParties = [...top4Parties];
    if (otherParties.length > 0 && othersSeats > 0) {
      displayParties.push({
        name: config.othersText,
        seats: othersSeats,
        color: "#94a3b8",
        logo: null,
        icon: "अन्य",
      });
    }

    // Get top 2 for progress bar
    const top2Parties = parties.slice(0, 2);

    return {
      totalSeats,
      halfWayMark,
      top2Parties,
      displayParties,
      allParties: parties,
    };
  }

  async function fetchElectionData(apiEndpoint, state, year) {
    const cacheKey = `${state}-${year}`;

    if (apiCache[cacheKey]) {
      return apiCache[cacheKey];
    }

    try {
      const url = new URL(apiEndpoint);
      url.searchParams.append("state", state);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Find data for the specific year
      let yearData = null;
      if (Array.isArray(data)) {
        yearData = data.find(
          (item) => item.year.toString() === year.toString(),
        );
      } else if (data.year && data.year.toString() === year.toString()) {
        yearData = data;
      }

      if (!yearData) {
        throw new Error(`No data found for year ${year}`);
      }

      apiCache[cacheKey] = yearData;
      return yearData;
    } catch (error) {
      console.error("Error fetching election data:", error);
      throw error;
    }
  }

  // Widget Class
  class ElectionWidget {
    constructor(containerId) {
      this.containerId = containerId;
      this.container = document.getElementById(containerId);

      if (!this.container) {
        console.error(`Element with id "${containerId}" not found`);
        return;
      }

      try {
        this.config = getConfig(this.container);
        this.currentYear = this.config.defaultYear;
        this.currentData = null;
        this.isLoading = false;

        this.init();
      } catch (error) {
        this.showError(error.message);
        return;
      }
    }

    async init() {
      this.injectStyles();
      this.showLoading();

      try {
        await this.loadData(this.currentYear);
        this.render();
        this.bindEvents();
        this.animateProgressBars();
      } catch (error) {
        this.showError(error.message);
      }
    }

    injectStyles() {
      if (!document.getElementById("election-widget-styles")) {
        const styleElement = document.createElement("style");
        styleElement.id = "election-widget-styles";
        styleElement.textContent = CSS_STYLES;
        document.head.appendChild(styleElement);
      }
    }

    showLoading() {
      this.container.className = "election-widget";
      this.container.innerHTML = `<div class="container"><div class="loading">${this.config.loadingText}</div></div>`;
    }

    showError(message) {
      this.container.className = "election-widget";
      this.container.innerHTML = `
                    <div class="container">
                        <div class="error">
                            ${this.config.errorPrefix}${message}
                            <br><button onclick="location.reload()">${this.config.retryText}</button>
                        </div>
                    </div>
                `;
    }

    async loadData(year) {
      this.isLoading = true;

      try {
        const rawData = await fetchElectionData(
          this.config.apiEndpoint,
          this.config.state,
          year,
        );
        this.currentData = processElectionData(rawData, this.config);
        this.currentYear = year;
      } catch (error) {
        throw new Error(`डेटा लोड करने में समस्या: ${error.message}`);
      } finally {
        this.isLoading = false;
      }
    }

    render() {
      if (!this.currentData) return;

      this.container.className = "election-widget";
      this.container.innerHTML = this.generateHTML();
    }

    generateHTML() {
      const data = this.currentData;

      // Calculate percentages for progress bar segments (top 2 parties)
      let segments = [];
      data.top2Parties.forEach((party) => {
        if (party.seats > 0) {
          const percentage = (party.seats / data.totalSeats) * 100;
          segments.push({
            name: party.name,
            seats: party.seats,
            percentage: percentage,
            color: party.color,
          });
        }
      });

      return `
                    <div class="container">
                        <div class="header">
                            <h1 class="title">${this.config.title}</h1>
                            <div class="year-tabs">
                                ${this.config.years
                                  .map(
                                    (year) => `
                                    <button class="year-tab ${year === this.currentYear ? "active" : ""}" 
                                            data-year="${year}" 
                                            ${this.isLoading ? "disabled" : ""}>${year}</button>
                                `,
                                  )
                                  .join("")}
                            </div>
                        </div>

                        <div class="total-seats">${this.config.totalSeatsText}${data.totalSeats}</div>

                        <div class="main-results">
                            <div class="results-labels">
                                    <div class="party-result">
                                        <div class="party-result-name">${segments[0].name}</div>
                                        <div class="party-result-seats">${segments[0].seats}</div>
                                    </div>
                                
                                <div class="party-result">
                                    <div class="party-result-name">${this.config.majorityText}</div>
                                    <div class="party-result-seats">${data.halfWayMark}</div>
                                </div>
                                    <div class="party-result">
                                        <div class="party-result-name">${segments[1].name}</div>
                                        <div class="party-result-seats">${segments[1].seats}</div>
                                    </div>
                            </div>

                            <div class="progress-bar-container">
                                <div class="progress-bar">
                                    ${segments
                                      .map(
                                        (segment, index) => `
                                        <div class="party-segment" 
					     style="width: ${segment.percentage}%; background-color: ${segment.color}; ${index === 1 ? "margin-left: auto;" : ""}">
                                        </div>
                                    `,
                                      )
                                      .join("")}
                                </div>
                                <div class="majority-divider"></div>
                            </div>
                        </div>

                        <div class="party-cards">
                            ${data.displayParties
                              .map(
                                (party) => `
                                <div class="party-card" data-party="${party.name}">
                                    <div class="party-icon" style="background-color: ${party.color}">
                                        ${
                                          party.logo
                                            ? `<img src="${party.logo}" alt="${party.name}" onerror="this.style.display='none'; this.parentNode.textContent='${party.icon}';">`
                                            : party.icon
                                        }
                                    </div>
                                    <div class="party-info">
                                        <div class="party-name">${party.name}</div>
                                        <div class="party-seats">${party.seats}</div>
                                    </div>
                                </div>
                            `,
                              )
                              .join("")}
                        </div>
                    </div>
                `;
    }

    bindEvents() {
      if (!this.container) return;

      // Year tab switching
      const yearTabs = this.container.querySelectorAll(".year-tab");
      yearTabs.forEach((tab) => {
        tab.addEventListener("click", async (e) => {
          const year = e.target.dataset.year;
          if (year !== this.currentYear && !this.isLoading) {
            this.showLoading();
            try {
              await this.loadData(year);
              this.render();
              this.bindEvents();
              this.animateProgressBars();
            } catch (error) {
              this.showError(error.message);
            }
          }
        });
      });

      // Party card interactions
      const partyCards = this.container.querySelectorAll(".party-card");
      partyCards.forEach((card) => {
        card.addEventListener("click", () => {
          const partyName = card.querySelector(".party-name").textContent;
          const partySeats = card.querySelector(".party-seats").textContent;
          alert(`${partyName}: ${partySeats} ${this.config.seatsText}`);
        });

        card.addEventListener("mouseenter", () => {
          card.style.transform = "translateY(-4px)";
        });

        card.addEventListener("mouseleave", () => {
          card.style.transform = "translateY(0px)";
        });
      });
    }

    animateProgressBars() {
      if (!this.container) return;

      const segments = this.container.querySelectorAll(".party-segment");

      segments.forEach((segment) => {
        const finalWidth = segment.style.width;
        segment.style.width = "0%";

        setTimeout(() => {
          segment.style.width = finalWidth;
        }, 300);
      });
    }

    // Public methods
    async refresh() {
      const cacheKey = `${this.config.state}-${this.currentYear}`;
      delete apiCache[cacheKey];

      this.showLoading();
      try {
        await this.loadData(this.currentYear);
        this.render();
        this.bindEvents();
        this.animateProgressBars();
      } catch (error) {
        this.showError(error.message);
      }
    }

    async setYear(year) {
      if (this.config.years.includes(year.toString()) && !this.isLoading) {
        this.showLoading();
        try {
          await this.loadData(year);
          this.render();
          this.bindEvents();
          this.animateProgressBars();
        } catch (error) {
          this.showError(error.message);
        }
      }
    }
  }

  // Auto-initialize when DOM is ready
  function initWidget() {
    const containers = document.querySelectorAll("[data-api-endpoint]");
    containers.forEach((container) => {
      if (!container.dataset.initialized) {
        try {
          new ElectionWidget(container.id || `election-widget-${Date.now()}`);
          container.dataset.initialized = "true";
        } catch (error) {
          console.error("Failed to initialize election widget:", error);
        }
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWidget);
  } else {
    initWidget();
  }

  // Export for manual use
  window.ElectionWidget = ElectionWidget;
  window.initElectionWidget = function (containerId) {
    return new ElectionWidget(containerId);
  };
})();
