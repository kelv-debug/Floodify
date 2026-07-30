// ======================================================
// Floodify - MapLibre Version
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

  // ======================================================
  // HTML ELEMENTS
  // ======================================================

  // Landing Page
  const landingPage = document.getElementById("landing-page");
  const dashboard = document.getElementById("dashboard");

  const enterButton = document.getElementById("enter-map");
  const returnButton = document.getElementById("return-button");

  // Navigation
  const guideLink = document.getElementById("nav-guide");
  const aboutLink = document.getElementById("nav-about");

  // Guide Modal
  const guideModal = document.getElementById("guide-modal");
  const closeGuideButton = document.getElementById("close-guide-modal");

  // About Modal
  const aboutModal = document.getElementById("about-modal");
  const closeAboutButton = document.getElementById("close-about-modal");

  // Sidebar
  const provinceSelect = document.getElementById("province-select");

  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");

  const button2D = document.getElementById("btn-2d");
  const button3D = document.getElementById("btn-3d");

  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebar-overlay");

  // Information Card
  const currentProvince = document.getElementById("current-province");

  // ======================================================
  // MAP VARIABLES
  // ======================================================

  let map;
  let provinceBounds = {};
  let userMarker = null;

  // PMTiles
  const protocol = new pmtiles.Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);

  const floodSource = "flood-source";
  const floodLayer = "flood-layer";

  // ======================================================
  // SEARCH DATA
  // ======================================================

  let provinceList = [];

  // ======================================================
  // FUNCTIONS
  // ======================================================


  // ======================================================
  // LANDING PAGE SCROLL
  // ======================================================

  function initializeLandingPage() {

    const topPanel = document.querySelector(".top-panel");
    const intro = document.querySelector(".Floodify-Intro");

    if (!topPanel || !intro) return;

    const observer = new IntersectionObserver((entries) => {

      entries.forEach(entry => {

        if (entry.isIntersecting) {
          topPanel.classList.remove("visible");
        } else {
          topPanel.classList.add("visible");
        }

      });

    });

    observer.observe(intro);

  }


  // ======================================================
  // GUIDE MODAL
  // ======================================================

  function initializeGuideModal() {

    if (!guideLink || !guideModal || !closeGuideButton) return;

    guideLink.addEventListener("click", (e) => {

      e.preventDefault();

      guideModal.classList.add("active");

    });

    closeGuideButton.addEventListener("click", () => {

      guideModal.classList.remove("active");

    });

    guideModal.addEventListener("click", (e) => {

      if (e.target === guideModal) {

        guideModal.classList.remove("active");

      }

    });

  }


  // ======================================================
  // ABOUT MODAL
  // ======================================================

  function initializeAboutModal() {

    if (!aboutLink || !aboutModal || !closeAboutButton) return;

    aboutLink.addEventListener("click", (e) => {

      e.preventDefault();

      aboutModal.classList.add("active");

    });

    closeAboutButton.addEventListener("click", () => {

      aboutModal.classList.remove("active");

    });

    aboutModal.addEventListener("click", (e) => {

      if (e.target === aboutModal) {

        aboutModal.classList.remove("active");

      }

    });

  }


  // ======================================================
  // LANDING PAGE BUTTONS
  // ======================================================

  function initializeLandingButtons() {

    enterButton.addEventListener("click", () => {

      landingPage.classList.add("hidden");

      dashboard.classList.remove("hidden");

      initializeMap();

    });

    returnButton.addEventListener("click", () => {

      dashboard.classList.add("hidden");

      landingPage.classList.remove("hidden");

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    });

  }


  // ======================================================
  // INITIALIZE MAP
  // ======================================================

  async function initializeMap() {

    // Prevent creating the map twice
    if (map) {

      map.resize();
      return;

    }

    map = new maplibregl.Map({

      container: "map",

      style: "https://tiles.openfreemap.org/styles/liberty",

      center: [121.0437, 14.6760],

      zoom: 8,

      pitch: 0,

      bearing: 0

    });

    map.addControl(

      new maplibregl.NavigationControl(),

      "top-right"

    );

    map.addControl(

      new maplibregl.ScaleControl()

    );

    map.on("error", (e) => {

      console.error("MapLibre Error:", e);

    });

    map.on("load", async () => {

      map.resize();

      await loadProvinceBounds();

      populateProvinceDropdown();

      provinceSelect.value = "Bulacan";

      loadProvince("Bulacan");

      setActiveView("2d");

      initializeLocation();

      setupControls();

    });

  }


  // ======================================================
  // LOAD PROVINCE BOUNDS
  // ======================================================

  async function loadProvinceBounds() {

    const response = await fetch("data/provinceBounds.json");

    provinceBounds = await response.json();

  }


  // ======================================================
  // LOAD PROVINCE
  // ======================================================

  function loadProvince(province) {

    if (!map) return;

    console.log("Loading:", province);

    // Update Province Information Card
    if (currentProvince) {
      currentProvince.textContent = province;
    }

    // Remove previous layer
    if (map.getLayer(floodLayer)) {
      map.removeLayer(floodLayer);
    }

    // Remove previous source
    if (map.getSource(floodSource)) {
      map.removeSource(floodSource);
    }

    const fileName = province.toLowerCase().trim();

    map.addSource(floodSource, {

      type: "vector",

      url: `pmtiles://tiles/${fileName}.pmtiles?v=${Date.now()}`

    });

    map.addLayer({

      id: floodLayer,

      type: "fill",

      source: floodSource,

      "source-layer": "flood",

      paint: {

        "fill-color": [

          "match",

          ["get", "Var"],

          1, "#FFD54F",

          2, "#FB8C00",

          3, "#E53935",

          "#9E9E9E"

        ],

        "fill-opacity": 0.55,

        "fill-outline-color": "rgba(0,0,0,0)"

      }

    });

    zoomToProvince(province);

    const locationName = document.getElementById("location-name");

    if (locationName) {

      locationName.innerHTML = `
        <span class="location-label">Viewing Province</span><br>
        <strong>${province}</strong>
    `;

    }

  }


  // ======================================================
  // ZOOM TO PROVINCE
  // ======================================================

  function zoomToProvince(province) {

    const bounds = provinceBounds[province.toLowerCase()];

    if (!bounds) {

      console.warn("No bounds found:", province);

      return;

    }

    map.fitBounds(bounds, {

      padding: 40,

      duration: 1000,

      maxZoom: 14

    });

  }


  // ======================================================
  // CURRENT LOCATION
  // ======================================================

  function initializeLocation() {

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(

      (position) => {

        const lng = position.coords.longitude;
        const lat = position.coords.latitude;

        if (!userMarker) {

          userMarker = new maplibregl.Marker({

            color: "#d43b3b"

          })
            .setLngLat([lng, lat])
            .addTo(map);

        } else {

          userMarker.setLngLat([lng, lat]);

        }

        updateLocationCard(lat, lng);

      },

      (error) => {

        console.error(error);

      }

    );

  }


  // ======================================================
  // UPDATE LOCATION CARD
  // ======================================================

  function updateLocationCard(lat, lng) {

    const status = document.querySelector(".location-status");

    const locationName = document.getElementById("location-name");

    status.className = "location-status safe";

    status.innerHTML = `

        <span class="status-dot"></span>

        GPS Location Detected

    `;

    locationName.innerHTML = `

        <span class="location-label">Viewing Province</span><br>
        <strong>${provinceSelect.value || "Bulacan"}</strong>

    `;

  }


  // ======================================================
  // MAP CONTROLS
  // ======================================================

  function setupControls() {

    provinceSelect.addEventListener("change", () => {

      searchInput.value = provinceSelect.value;

      loadProvince(provinceSelect.value);

    });

    // 2D VIEW
    button2D.addEventListener("click", () => {

      map.easeTo({

        pitch: 0,
        bearing: 0,
        duration: 800

      });

      setActiveView("2d");

    });


    // 3D VIEW
    button3D.addEventListener("click", () => {

      map.easeTo({

        pitch: 60,
        bearing: -20,
        duration: 800

      });

      setActiveView("3d");

    });

  }


  // ======================================================
  // UPDATE VIEW BUTTONS
  // ======================================================

  function setActiveView(view) {

    button2D.classList.remove("active");
    button3D.classList.remove("active");

    if (view === "2d") {

      button2D.classList.add("active");

    } else {

      button3D.classList.add("active");

    }

  }


  // ======================================================
  // SEARCH PROVINCES
  // ======================================================

  function initializeSearch() {

    searchInput.addEventListener("input", () => {

      const keyword = searchInput.value.trim().toLowerCase();

      searchResults.innerHTML = "";

      if (keyword === "") {

        searchResults.style.display = "none";
        return;

      }

      const matches = provinceList.filter(province =>
        province.toLowerCase().includes(keyword)
      );

      if (matches.length === 0) {

        searchResults.style.display = "none";
        return;

      }

      matches.forEach(province => {

        const item = document.createElement("div");

        item.className = "search-item";

        item.innerHTML = `
                <i class="fa-solid fa-location-dot"></i>
                ${province}
            `;

        item.addEventListener("click", () => {

          provinceSelect.value = province;

          loadProvince(province);

          searchInput.value = province;

          searchResults.style.display = "none";

        });

        searchResults.appendChild(item);

      });

      searchResults.style.display = "block";

    });

  }


  // ======================================================
  // CLOSE SEARCH DROPDOWN
  // ======================================================

  document.addEventListener("click", (e) => {

    if (!e.target.closest(".search-wrapper") &&
      !e.target.closest("#search-results")) {

      searchResults.style.display = "none";

    }

  });


  // ======================================================
  // POPULATE SEARCH DATA
  // ======================================================

  function populateProvinceDropdown() {

    provinceList = [...provinceSelect.options]

      .filter(option => option.value !== "")

      .map(option => option.value);

  }


  // ======================================================
  // INITIALIZE APP
  // ======================================================

  initializeLandingPage();
  initializeGuideModal();
  initializeAboutModal();
  initializeLandingButtons();
  initializeSearch();


  // ============================================
  // MOBILE SIDEBAR
  // ============================================


  const mobileMenuIcon = document.getElementById("mobile-menu-icon");

  if (mobileMenuBtn) {

    mobileMenuBtn.addEventListener("click", () => {

      const isOpen = sidebar.classList.toggle("open");

      sidebarOverlay.classList.toggle("active", isOpen);

      if (isOpen) {

        mobileMenuIcon.classList.remove("fa-bars");
        mobileMenuIcon.classList.add("fa-xmark");

      } else {

        mobileMenuIcon.classList.remove("fa-xmark");
        mobileMenuIcon.classList.add("fa-bars");

      }

    });

  }

  sidebarOverlay.addEventListener("click", () => {

    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");

    mobileMenuIcon.classList.remove("fa-xmark");
    mobileMenuIcon.classList.add("fa-bars");

  });

});