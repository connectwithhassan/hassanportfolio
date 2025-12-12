document.addEventListener('DOMContentLoaded', () => {

    gsap.registerPlugin(Observer);

    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".nav-links a");

    let currentIndex = 0;
    let isAnimating = false;

    // --- INITIAL SETUP ---
    gsap.set(sections, { zIndex: 0, autoAlpha: 0 });
    gsap.set(sections[0], { zIndex: 1, autoAlpha: 1 });
    updateNav(0);
    animateSectionContent(0);

    // --- MAIN NAVIGATION FUNCTION ---
    function gotoSection(index, direction) {
        // Validation calls
        if (isAnimating) return;
        if (index < 0 || index >= sections.length) return;
        if (index === currentIndex) return;

        isAnimating = true;
        updateNav(index);

        const currentSection = sections[currentIndex];
        const nextSection = sections[index];

        // Z-Index Management for Overlap
        gsap.set(nextSection, { zIndex: 2, autoAlpha: 1 });
        gsap.set(currentSection, { zIndex: 1 });

        // Reset content of next section so it can animate in
        resetSectionContent(index);

        // Core transitions
        const tl = gsap.timeline({
            defaults: { duration: 0.8, ease: "power3.inOut" },
            onComplete: () => {
                isAnimating = false;
                gsap.set(currentSection, { zIndex: 0, autoAlpha: 0 });
                currentIndex = index;
            }
        });

        if (direction === 1) { // Down / Next
            tl.fromTo(nextSection, { yPercent: 10, opacity: 0 }, { yPercent: 0, opacity: 1 })
                .to(currentSection, { yPercent: -10, opacity: 0 }, "<");
        } else { // Up / Prev
            tl.fromTo(nextSection, { yPercent: -10, opacity: 0 }, { yPercent: 0, opacity: 1 })
                .to(currentSection, { yPercent: 10, opacity: 0 }, "<");
        }

        // Trigger Content Animation after section transition starts
        gsap.delayedCall(0.3, () => animateSectionContent(index));
    }

    // --- OBSERVER (HANDLE SCROLL/TOUCH) ---
    Observer.create({
        type: "wheel,touch,pointer",
        wheelSpeed: -1,
        onDown: () => !isAnimating && gotoSection(currentIndex - 1, -1),
        onUp: () => !isAnimating && gotoSection(currentIndex + 1, 1),
        tolerance: 10,
        preventDefault: true,
        // CRITICAL FIX: Ignore interactive elements so clicks work!
        ignore: ".skills-grid, .projects-grid, nav *, a, .btn, button"
    });

    // --- DESKTOP CLICK LISTENERS ---
    navLinks.forEach((link, i) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const direction = i > currentIndex ? 1 : -1;
            gotoSection(i, direction);
        });
    });

    // --- HANDLE INTERNAL BUTTONS (Like "Check out my work") ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Check if this is a section link (matches one of our nav items or section IDs)
            const targetId = this.getAttribute('href').substring(1);
            const targetIndex = Array.from(sections).findIndex(section => section.id === targetId);

            if (targetIndex !== -1 && targetIndex !== currentIndex) {
                e.preventDefault();
                // Close mobile menu if open (just in case button is inside menu later)
                // isMenuOpen check handled inside toggle logic but we can ignore here or strictly close
                const direction = targetIndex > currentIndex ? 1 : -1;
                gotoSection(targetIndex, direction);
            }
        });
    });

    // --- MOBILE PROJECT SLIDER ARROWS ---
    const projectContainer = document.querySelector('.projects-grid');
    const prevBtn = document.querySelector('.prev-project');
    const nextBtn = document.querySelector('.next-project');

    if (projectContainer && prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            projectContainer.scrollBy({ left: -projectContainer.offsetWidth, behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            projectContainer.scrollBy({ left: projectContainer.offsetWidth, behavior: 'smooth' });
        });
    }

    // --- MOBILE PREFS & ANIMATION ---
    let mm = gsap.matchMedia();

    mm.add("(max-width: 768px)", () => {
        const hamburger = document.querySelector(".hamburger");
        const navMenu = document.querySelector(".nav-links");
        const navItems = document.querySelectorAll(".nav-links a");
        const icon = hamburger.querySelector("i");

        let isMenuOpen = false;

        // Setup GSAP Timeline for Mobile Menu
        const menuTl = gsap.timeline({ paused: true, reversed: true });

        // Force initial state every time we enter mobile view to avoid conflicts
        gsap.set(navMenu, { yPercent: -100, display: "flex" });
        gsap.set(navItems, { opacity: 0, y: 50 });

        menuTl.to(navMenu, {
            yPercent: 0,
            duration: 0.6,
            ease: "power4.inOut"
        })
            .to(navItems, {
                y: 0,
                opacity: 1,
                stagger: 0.1,
                duration: 0.4,
                ease: "power2.out"
            }, "-=0.2");

        // Toggle Logic
        const toggleMenu = () => {
            isMenuOpen = !isMenuOpen;
            if (isMenuOpen) {
                menuTl.play();
                icon.classList.remove("fa-bars");
                icon.classList.add("fa-times");
            } else {
                menuTl.reverse();
                icon.classList.remove("fa-times");
                icon.classList.add("fa-bars");
            }
        };

        // Close logic specific to mobile (reverses animation)
        const closeMenu = () => {
            if (isMenuOpen) {
                toggleMenu(); // Reuse logic to close
            }
        };

        hamburger.addEventListener("click", toggleMenu);
        navLinks.forEach(link => link.addEventListener("click", closeMenu));

        return () => {
            // Cleanup on resize to Desktop
            hamburger.removeEventListener("click", toggleMenu);
            navLinks.forEach(link => link.removeEventListener("click", closeMenu));
            gsap.set(navMenu, { clearProps: "all" });
            gsap.set(navItems, { clearProps: "all" });
        };
    });

    // --- ANIMATION HELPERS ---
    function resetSectionContent(index) {
        if (index === 0) {
            // Reset Text
            gsap.set(".hero-text > *", { y: 20, autoAlpha: 0 });
            // Reset Image
            gsap.set(".hero-image", { scale: 0.8, autoAlpha: 0, rotation: -5 });
        }
        if (index === 1) gsap.set(".skill-card", { y: 30, autoAlpha: 0 });
        if (index === 2) gsap.set(".project-card", { y: 30, autoAlpha: 0 });
        if (index === 3) {
            gsap.set(".contact > *:not(.social-links)", { y: 20, autoAlpha: 0 });
            gsap.set(".social-links a", { y: 20, autoAlpha: 0, scale: 0.5 });
        }
    }

    function animateSectionContent(index) {
        if (index === 0) {
            // ... (hero animation) ...
            gsap.to(".hero-text > *", {
                y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1, ease: "power2.out"
            });
            gsap.to(".hero-image", {
                scale: 1, autoAlpha: 1, rotation: 0, duration: 0.8, ease: "back.out(1.7)", delay: 0.2
            });
        } else if (index === 1) {
            // ...
            gsap.to(".skill-card", {
                y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.05, ease: "back.out(1.5)"
            });
        } else if (index === 2) {
            // ...
            gsap.to(".project-card", {
                y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1, ease: "power2.out"
            });
        } else if (index === 3) {
            gsap.to(".contact > *:not(.social-links)", {
                y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1, ease: "power2.out"
            });
            gsap.to(".social-links a", {
                y: 0, autoAlpha: 1, scale: 1, duration: 0.4, stagger: 0.1, ease: "back.out(2)", delay: 0.4
            });
        }
    }

    function updateNav(index) {
        navLinks.forEach(link => link.classList.remove("active"));
        if (navLinks[index]) navLinks[index].classList.add("active");
    }

    // --- FIX: Stop Propagation for internal scrollers ---
    // This allows native scroll in .projects-grid / .skills-grid without Observer stealing it
    const scrollers = document.querySelectorAll(".projects-grid, .skills-grid");
    scrollers.forEach(el => {
        el.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
        el.addEventListener("touchmove", (e) => e.stopPropagation(), { passive: true });
        el.addEventListener("wheel", (e) => e.stopPropagation(), { passive: true });
    });

});
