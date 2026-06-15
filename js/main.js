// Global Interaction Helpers for MCA Ace Landing Pages

// 1. Accordion Toggle
function toggleAccordion(btn) {
    const item = btn.closest('.accordion-item');
    if (!item) return;

    const isActive = item.classList.contains('accordion-active');
    
    // Optional: Collapse all other accordions in the same container
    const container = item.closest('.accordion-container') || item.parentElement;
    if (container) {
        container.querySelectorAll('.accordion-item').forEach(i => {
            if (i !== item) {
                i.classList.remove('accordion-active');
                const content = i.querySelector('.accordion-content');
                if (content) content.style.maxHeight = null;
            }
        });
    }

    const content = item.querySelector('.accordion-content');
    if (isActive) {
        item.classList.remove('accordion-active');
        if (content) content.style.maxHeight = null;
    } else {
        item.classList.add('accordion-active');
        if (content) content.style.maxHeight = content.scrollHeight + "px";
    }
}

// 2. Micro-interactions for buttons
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scaling on click to all action buttons
    const applyClickScaling = () => {
        document.querySelectorAll('button, .btn-scale').forEach(btn => {
            if (btn.dataset.hasScaling) return;
            btn.dataset.hasScaling = "true";
            
            btn.addEventListener('mousedown', () => {
                btn.classList.add('scale-95');
                btn.style.transition = "transform 0.1s ease";
            });
            
            const removeScale = () => {
                btn.classList.remove('scale-95');
            };
            
            btn.addEventListener('mouseup', removeScale);
            btn.addEventListener('mouseleave', removeScale);
            btn.addEventListener('touchend', removeScale);
        });
    };

    applyClickScaling();

    // Re-apply on dynamic DOM inserts (like when web components render)
    const observer = new MutationObserver(applyClickScaling);
    observer.observe(document.body, { childList: true, subtree: true });

    // 3. Navbar scroll background adjustment
    const navbar = document.querySelector('custom-navbar nav');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                navbar.classList.add('shadow-md', 'backdrop-blur-md', 'bg-surface/90', 'dark:bg-[#080e1d]/90');
            } else {
                navbar.classList.remove('shadow-md', 'backdrop-blur-md', 'bg-surface/90', 'dark:bg-[#080e1d]/90');
            }
        });
    }

    // 4. Scroll Spy navigation active highlights
    const setupScrollSpy = () => {
        const sections = [
            { id: 'courses', hrefs: ['index.html', '#courses'] },
            { id: 'demo', hrefs: ['index.html#demo', '#demo'] },
            { id: 'success', hrefs: ['index.html#success', '#success'] }
        ];

        const onScroll = () => {
            let activeId = '';
            const scrollPos = window.scrollY + 220; // offset navbar + padding

            // Check if we are near the top of the page
            if (window.scrollY < 100) {
                activeId = 'courses';
            } else {
                sections.forEach(sec => {
                    const el = document.getElementById(sec.id);
                    if (el) {
                        const top = el.offsetTop;
                        const height = el.offsetHeight;
                        if (scrollPos >= top && scrollPos < top + height) {
                            activeId = sec.id;
                        }
                    }
                });
            }

            if (!activeId) return;

            const customNav = document.querySelector('custom-navbar');
            if (customNav) {
                customNav.querySelectorAll('.nav-link').forEach(link => {
                    const href = link.getAttribute('href');
                    const targetSec = sections.find(sec => sec.hrefs.includes(href));
                    if (targetSec && targetSec.id === activeId) {
                        link.classList.add('nav-link-active', 'text-primary', 'dark:text-[#b5c4ff]');
                    } else {
                        link.classList.remove('nav-link-active', 'text-primary', 'dark:text-[#b5c4ff]');
                    }
                });
            }
        };

        window.addEventListener('scroll', onScroll);
        // Run once initially to set the correct state
        setTimeout(onScroll, 200);
    };

    setupScrollSpy();
});

// Export functions to global scope
window.toggleAccordion = toggleAccordion;
