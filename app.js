document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. STICKY GLASSMORPHISM NAVBAR ON SCROLL
       ========================================================================== */
    const header = document.querySelector('.header');
    
    const handleScroll = () => {
        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    
    // Initial check in case page is refreshed while scrolled
    handleScroll();
    window.addEventListener('scroll', handleScroll);

    /* ==========================================================================
       2. MOBILE MENU INTERACTION
       ========================================================================== */
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    const body = document.body;

    const toggleMobileMenu = () => {
        mobileToggle.classList.toggle('active');
        mobileMenuOverlay.classList.toggle('active');
        body.classList.toggle('overflow-hidden');
        
        // Custom styling helper for body overflow via JS
        if (body.classList.contains('overflow-hidden')) {
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = '';
        }
    };

    const closeMobileMenu = () => {
        mobileToggle.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        body.classList.remove('overflow-hidden');
        body.style.overflow = '';
    };

    mobileToggle.addEventListener('click', toggleMobileMenu);

    // Close menu when clicking on any mobile nav links
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    /* ==========================================================================
       3. INTERSECTION OBSERVER FOR REVEAL ANIMATIONS
       ========================================================================== */
    const revealElements = document.querySelectorAll('.reveal-element');
    
    const revealOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
    };
    
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Stop observing after element has been revealed
                observer.unobserve(entry.target);
            }
        });
    };
    
    const revealObserver = new IntersectionObserver(revealCallback, revealOptions);
    
    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

    /* ==========================================================================
       4. SCROLLSPY (ACTIVE NAV LINK ON SCROLL)
       ========================================================================== */
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    // Helper: highlight the nav link that matches a given href
    const setActiveLink = (href) => {
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === href) {
                link.classList.add('active');
            }
        });
    };

    // Scroll-based scrollspy: finds section whose top is nearest above 35% of viewport
    const runScrollSpy = () => {
        if (!sections.length) return;
        const scrollMid = window.scrollY + window.innerHeight * 0.35;
        let current = '';
        sections.forEach(section => {
            if (section.offsetTop <= scrollMid) {
                current = section.getAttribute('id');
            }
        });
        if (current) setActiveLink('#' + current);
    };

    // On load: use URL hash to set active state (handles cross-page navigation to #sections)
    const hash = window.location.hash;
    if (hash && document.querySelector(hash)) {
        setActiveLink(hash);
    } else {
        runScrollSpy();
    }

    window.addEventListener('scroll', runScrollSpy, { passive: true });

    /* ==========================================================================
       5. DYNAMIC BRANCHES & SETTINGS LOADER
       ========================================================================== */
    const branchesList = document.getElementById('branches-list');
    
    // Load Global Settings for Footer / CTAs
    fetch('/content/settings.json')
        .then(res => res.json())
        .then(settings => {
            // Update WhatsApp CTAs
            const waBase = "https://wa.me/" + settings.contact_whatsapp.replace(/[^0-9]/g, '') + "?text=";
            const defaultMsg = encodeURIComponent("Halo Bunga Mayang Plafon, saya ingin berkonsultasi mengenai rencana pemasangan plafon premium.");
            
            const ctaWhatsapp = document.getElementById('btn-cta-whatsapp');
            const navConsultButton = document.getElementById('btn-konsultasi-nav');
            const heroCtaButton = document.getElementById('btn-hero-cta');
            const mobileCtaButton = document.querySelector('.btn-mobile-cta');
            
            if (ctaWhatsapp) ctaWhatsapp.setAttribute('href', waBase + defaultMsg);
            if (heroCtaButton) heroCtaButton.setAttribute('href', waBase + defaultMsg);
            if (navConsultButton) navConsultButton.setAttribute('href', waBase + defaultMsg);
            if (mobileCtaButton) mobileCtaButton.setAttribute('href', waBase + defaultMsg);
            
            // Update Footer info
            const footerContacts = document.querySelector('.footer-contacts');
            if (footerContacts) {
                const waLink = footerContacts.querySelector('li:nth-child(1) .contact-value');
                if (waLink) {
                    waLink.textContent = settings.contact_whatsapp;
                    waLink.setAttribute('href', "https://wa.me/" + settings.contact_whatsapp.replace(/[^0-9]/g, ''));
                }
                const emailLink = footerContacts.querySelector('li:nth-child(2) .contact-value');
                if (emailLink) {
                    emailLink.textContent = settings.contact_email;
                    if (emailLink.tagName === 'A') {
                        emailLink.setAttribute('href', "mailto:" + settings.contact_email);
                    }
                }
            }
        })
        .catch(err => console.warn('Could not load global settings:', err));

    // Load Branches dynamically on homepage
    if (branchesList) {
        fetch('/assets/data/branches.json')
            .then(res => res.json())
            .then(branches => {
                branchesList.innerHTML = '';
                branches.forEach(branch => {
                    const card = document.createElement('div');
                    card.className = 'branch-card reveal-element';
                    
                    const waNum = branch.whatsapp_number.replace(/[^0-9]/g, '');
                    const waText = encodeURIComponent(branch.whatsapp_text || '');
                    
                    // We check if the current page is inside a subdirectory to adjust the link paths
                    const pathPrefix = window.location.pathname.includes('/branches/') || window.location.pathname.includes('/products/') || window.location.pathname.includes('/projects/') ? '../../' : '';
                    
                    card.innerHTML = `
                        <div class="branch-image-wrapper">
                            <img src="${branch.photo}" alt="${branch.name}" class="branch-image" loading="lazy">
                        </div>
                        <div class="branch-card-content">
                            <h3 class="branch-name">${branch.name}</h3>
                            <p class="branch-address">${branch.address}</p>
                            <div class="branch-actions">
                                <a href="https://wa.me/${waNum}?text=${waText}" class="btn btn-wa-card" target="_blank" rel="noopener noreferrer">
                                    <svg class="wa-card-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                        <path d="M12.012 2.25c-5.38 0-9.756 4.376-9.756 9.756 0 1.723.447 3.34 1.229 4.757L2.25 21.75l5.122-1.343c1.378.75 2.946 1.18 4.64 1.18 5.38 0 9.756-4.376 9.756-9.756 0-5.38-4.376-9.756-9.756-9.756zm0 1.5c4.562 0 8.256 3.694 8.256 8.256 0 4.562-3.694 8.256-8.256 8.256-1.543 0-2.983-.427-4.223-1.168l-.303-.18-3.05.8 1.4-2.932-.198-.314a8.214 8.214 0 0 1-1.138-4.206c0-4.562 3.694-8.256 8.256-8.256zm-3.414 4.887c-.126.002-.27.02-.41.082-.416.18-.737.5-.904.908-.255.617-.116 1.455.334 2.256.452.802 1.258 1.95 2.502 2.82.916.638 1.797 1.096 2.55 1.343.328.107.618.156.883.136.333-.024.717-.23 1-.508.318-.314.476-.713.504-.977.027-.263-.035-.494-.1-.58-.066-.088-.246-.178-.518-.313-.274-.136-1.616-.798-1.748-.846-.13-.048-.282-.047-.4.075-.122.12-.472.593-.578.71-.106.12-.212.13-.484-.006-.273-.136-1.15-.425-2.193-1.353-.81-.722-1.358-1.616-1.517-1.888-.16-.273-.017-.42.12-.556.122-.122.272-.317.41-.476.136-.16.18-.273.272-.455.09-.182.046-.34-.022-.477-.068-.137-.58-1.4-.794-1.92-.208-.507-.447-.487-.61-.497z" />
                                    </svg> WA
                                </a>
                                <a href="${branch.maps_link}" class="btn btn-maps-card" target="_blank" rel="noopener noreferrer">Map</a>
                                <a href="${pathPrefix}branches/${branch.slug}/" class="btn btn-details-card">Detail</a>
                            </div>
                        </div>
                    `;
                    branchesList.appendChild(card);
                    
                    // Observe new elements for scroll animations
                    if (window.IntersectionObserver) {
                        const obs = new IntersectionObserver((entries, observer) => {
                            entries.forEach(entry => {
                                if (entry.isIntersecting) {
                                    entry.target.classList.add('revealed');
                                    observer.unobserve(entry.target);
                                }
                            });
                        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
                        obs.observe(card);
                    } else {
                        card.classList.add('revealed');
                    }
                });
            })
            .catch(err => console.error('Error loading branches list:', err));
    }
});
