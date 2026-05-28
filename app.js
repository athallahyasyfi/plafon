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
    
    const scrollSpyCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };
    
    // Using an observer to track which section is currently covering the screen
    const scrollSpyOptions = {
        threshold: 0.3,
        rootMargin: '-20% 0px -60% 0px'
    };
    
    const scrollSpyObserver = new IntersectionObserver(scrollSpyCallback, scrollSpyOptions);
    
    sections.forEach(section => {
        scrollSpyObserver.observe(section);
    });

    /* ==========================================================================
       5. WHATSAPP LINK CUSTOMIZER (DETERMINE VISITOR TIME) - DISABLED
       ========================================================================== */
    /* 
    // Untuk mengaktifkan WhatsApp otomatis berdasar waktu, uncomment kode di bawah ini 
    // dan ganti nomor telepon 6281234567890 dengan nomor WhatsApp bisnis Anda.
    
    const ctaWhatsapp = document.getElementById('btn-cta-whatsapp');
    const navConsultButton = document.getElementById('btn-konsultasi-nav');
    const heroCtaButton = document.getElementById('btn-hero-cta');
    const mobileCtaButton = document.querySelector('.btn-mobile-cta');
    
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 11) return 'Pagi';
        if (hour < 15) return 'Siang';
        if (hour < 18) return 'Sore';
        return 'Malam';
    };
    
    const customizeLinks = () => {
        const greeting = getGreeting();
        const waBase = "https://wa.me/YOUR_PHONE_NUMBER?text="; // Ganti YOUR_PHONE_NUMBER
        
        const mainMessage = encodeURIComponent(`Halo Bunga Mayang Plafon, Selamat ${greeting}. Saya melihat portfolio di website Anda dan ingin berkonsultasi mengenai rencana pemasangan plafon premium.`);
        const navMessage = encodeURIComponent(`Halo Bunga Mayang Plafon, Selamat ${greeting}. Saya ingin berkonsultasi mengenai pengerjaan plafon interior untuk hunian.`);
        
        if (ctaWhatsapp) ctaWhatsapp.setAttribute('href', waBase + mainMessage);
        if (heroCtaButton) heroCtaButton.setAttribute('href', waBase + mainMessage);
        if (navConsultButton) navConsultButton.setAttribute('href', waBase + navMessage);
        if (mobileCtaButton) mobileCtaButton.setAttribute('href', waBase + navMessage);
    };
    
    customizeLinks();
    */
});
