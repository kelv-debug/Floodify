/* =========================================================
   FLOODIFY - LANDING PAGE SCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    // --- DOM Elements ---
    const landingPage = document.getElementById("Landing-Page");
    const mapPage = document.getElementById("Map-Page");
    const returnBtn = document.getElementById("return-button");
    const header = document.querySelector("header");
    const outline = document.querySelector(".philippines-outline");
    const heroContent = document.querySelector(".hero-content");
    const exploreBtn = document.querySelector(".explore-btn");
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    // Modal Elements
    const overlay = document.getElementById("infoOverlay");
    const modalContent = document.getElementById("modalContent");
    const guideBtn = document.getElementById("guideBtn");
    const aboutBtn = document.getElementById("aboutBtn");
    const contactBtn = document.getElementById("contactBtn");
    const closeModal = document.getElementById("closeModal");

    // --- Navbar Scroll Effect ---
    if (header) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 40) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }
        });
    }

    // --- Hero Fade-In ---
    if (heroContent) {
        window.addEventListener("load", () => {
            heroContent.classList.add("show");
        });
        // Fallback if load already fired
        if (document.readyState === "complete") {
            heroContent.classList.add("show");
        }
    }

    // --- Parallax Background Effect ---
    if (outline) {
        window.addEventListener("mousemove", (e) => {
            const x = (e.clientX / window.innerWidth - 0.5);
            const y = (e.clientY / window.innerHeight - 0.5);
            outline.style.transform = `translateY(-50%) translate(${x * 25}px, ${y * 25}px)`;
        });
    }

    // --- Explore Map Button & Page Switch ---
    if (exploreBtn) {
        exploreBtn.addEventListener("click", (e) => {
            e.preventDefault();

            // Ripple animation effect
            const ripple = document.createElement("span");
            ripple.classList.add("ripple");
            const rect = exploreBtn.getBoundingClientRect();
            ripple.style.left = (e.clientX - rect.left) + "px";
            ripple.style.top = (e.clientY - rect.top) + "px";
            exploreBtn.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 700);

            // Switch to map view
            if (landingPage && mapPage) {
                landingPage.classList.add("hidden");
                mapPage.classList.remove("hidden");

                requestAnimationFrame(() => {
                    if (typeof window.initializeMap === "function") {
                        window.initializeMap();
                    }
                });
            }
        });
    }

    // --- Return to Landing Button ---
    if (returnBtn) {
        returnBtn.addEventListener("click", () => {
            if (landingPage && mapPage) {
                mapPage.classList.add("hidden");
                landingPage.classList.remove("hidden");

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            }
        });
    }

    // --- Scroll Reveal Animations ---
    const reveals = document.querySelectorAll(".reveal");
    if (reveals.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("active");
                }
            });
        }, { threshold: 0.18 });

        reveals.forEach(section => observer.observe(section));
    }

    // --- Modal Dialog Handlers ---
    function openModal(html) {
        if (!overlay || !modalContent) return;
        modalContent.innerHTML = html;
        overlay.classList.add("active");
        document.body.style.overflow = "hidden";
        document.body.classList.add("modal-open");
    }

    function closeInfoModal() {
        if (!overlay) return;
        overlay.classList.remove("active");
        document.body.style.overflow = "";
        document.body.classList.remove("modal-open");
    }

    if (closeModal) {
        closeModal.addEventListener("click", closeInfoModal);
    }

    if (overlay) {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                closeInfoModal();
            }
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeInfoModal();
        }
    });

    // Guide Modal
    if (guideBtn) {
        guideBtn.addEventListener("click", (e) => {
            e.preventDefault();
            openModal(`
                <span>Quick Start Guide</span>
                <h2>How to Use Floodify</h2>
                <p>
                    Getting started with Floodify is simple. Follow these three steps to
                    explore flood hazard information across the Philippines.
                </p>
                <br>
                <h3>① Access the Interactive Map</h3>
                <p>
                    Click the <strong>Explore Map</strong> button on the landing page to
                    launch Floodify's interactive flood hazard map.
                </p>
                <br>
                <h3>② Navigate Using the Sidebar</h3>
                <p>Once inside the map page, use the sidebar to:</p>
                <ul>
                    <li>🔍 Search for a place</li>
                    <li>📍 Select a barangay from the dropdown</li>
                    <li>🗺️ Switch between 2D and 3D views</li>
                    <li>📡 Check your GPS detection status</li>
                    <li>🛟 View built-in safety reminders</li>
                </ul>
                <br>
                <h3>③ Understand the Map Legend</h3>
                <p>The legend located at the bottom-right corner helps you interpret flood hazard levels:</p>
                <ul>
                    <li>🟨 <strong>Yellow</strong> – Low Flood Hazard</li>
                    <li>🟧 <strong>Orange</strong> – Moderate Flood Hazard</li>
                    <li>🟥 <strong>Red</strong> – High Flood Hazard</li>
                </ul>
            `);
        });
    }

    // About Us Modal
    if (aboutBtn) {
        aboutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            openModal(`
                <span>About Floodify</span>
                <h2>Meet the Team Behind Floodify</h2>
                <p>
                    <strong>Floodify</strong> is an Interactive Flood Hazard Visualization Platform
                    developed by Grade 12 ICT students from
                    <strong>Immaculate Conception Polytechnic – Meycauayan Branch</strong>
                    as part of their academic capstone project.
                </p>
                <p>
                    The platform was created with a simple goal: to make flood hazard
                    information more accessible, understandable, and interactive.
                    By integrating Project NOAH's historical flood hazard data with an
                    intuitive mapping interface, Floodify helps users explore flood-prone
                    areas and promotes greater awareness and preparedness.
                </p>
                <hr>
                <h3>Lead Developer</h3>
                <p><strong>Kelvin Mark L. Vargas</strong></p>
                <h3>Assistant Developer</h3>
                <p><strong>Abraham S. Baguioro</strong></p>
            `);
        });
    }

    // Contact Us Modal
    if (contactBtn) {
        contactBtn.addEventListener("click", (e) => {
            e.preventDefault();
            openModal(`
                <span>Contact Us</span>
                <h2>Get in Touch</h2>
                <p>
                    We'd love to hear from you! If you have questions, suggestions,
                    feedback, or encounter any issues while using Floodify, feel free
                    to contact our team through the email address below.
                </p>
                <hr>
                <h3>Email Address</h3>
                <p>
                    <a href="mailto:floodify697@gmail.com" class="modal-email">
                        <i class="fa-solid fa-envelope"></i>
                        floodify697@gmail.com
                    </a>
                </p>
                <p style="margin-top:25px; opacity:.75;">
                    We appreciate your feedback and will respond as soon as possible.
                </p>
            `);
        });
    }

    // --- Mobile Menu Toggle ---
    if (menuToggle && navLinks) {
        document.querySelectorAll(".nav-links a").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("active");
                document.body.classList.remove("nav-open");
                const icon = menuToggle.querySelector("i");
                if (icon) {
                    icon.classList.remove("fa-xmark");
                    icon.classList.add("fa-bars");
                }
            });
        });

        menuToggle.addEventListener("click", () => {
            navLinks.classList.toggle("active");
            const isOpen = navLinks.classList.contains("active");
            document.body.classList.toggle("nav-open", isOpen);
            const icon = menuToggle.querySelector("i");
            if (icon) {
                if (isOpen) {
                    icon.classList.replace("fa-bars", "fa-xmark");
                } else {
                    icon.classList.replace("fa-xmark", "fa-bars");
                }
            }
        });
    }
});