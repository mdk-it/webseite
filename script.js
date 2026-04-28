// Mobile Menu Toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// Close menu when a link is clicked
const navLinks = document.querySelectorAll('.nav-menu a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// ============================================
// Adaptive Qualität - Reduziert Qualität bei wenig RAM
// ============================================

class AdaptiveQuality {
    constructor() {
        this.deviceTier = this.detectDeviceTier();
        this.init();
    }

    detectDeviceTier() {
        const memory = navigator.deviceMemory || 4;
        const cores = navigator.hardwareConcurrency || 4;
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const connection = navigator.connection || {};
        const effectiveType = connection.effectiveType;
        
        if (isMobile && memory < 4) return 'low';
        if (isMobile) return 'medium';
        if (memory >= 8 && cores >= 4 && effectiveType === '4g') return 'high';
        if (memory >= 4) return 'medium';
        return 'low';
    }

    init() {
        console.log(`[Adaptive] Gerätetier: ${this.deviceTier} (RAM: ${navigator.deviceMemory || 'unbekannt'}GB)`);
        this.applyQualityToImages();
    }

    applyQualityToImages() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            if (img.dataset.adaptive === 'true') return;
            img.dataset.adaptive = 'true';
            
            // Bei niedrigem Tier: Async Decoding für schnelleres Laden
            if (this.deviceTier === 'low') {
                img.decoding = 'async';
                img.loading = 'lazy';
            } else if (this.deviceTier === 'medium') {
                img.decoding = 'async';
            }
        });
    }
}

// ============================================
// Multi-Thread Bildverarbeitung mit Web Workers
// ============================================

class ParallelProcessor {
    constructor() {
        this.workers = [];
        this.maxWorkers = navigator.hardwareConcurrency || 4;
        this.initWorkers();
    }

    initWorkers() {
        for (let i = 0; i < this.maxWorkers; i++) {
            try {
                const worker = new Worker('image-worker.js');
                this.workers.push({ worker, busy: false });
            } catch (e) {
                console.warn('Worker nicht verfügbar:', e);
            }
        }
        console.log(`[Parallel] ${this.workers.length} Worker-Threads aktiv`);
    }

    processImage(imageElement, options = {}) {
        return new Promise((resolve, reject) => {
            const freeWorker = this.workers.find(w => !w.busy);
            
            if (!freeWorker) {
                this.processSync(imageElement, options).then(resolve).catch(reject);
                return;
            }

            freeWorker.busy = true;
            
            const worker = freeWorker.worker;
            const handler = (e) => {
                if (e.data.type === 'result') {
                    worker.removeEventListener('message', handler);
                    freeWorker.busy = false;
                    resolve(e.data.data);
                }
            };

            worker.addEventListener('message', handler);
            worker.addEventListener('error', (e) => {
                freeWorker.busy = false;
                reject(e);
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = imageElement.naturalWidth || imageElement.width;
            canvas.height = imageElement.naturalHeight || imageElement.height;
            ctx.drawImage(imageElement, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            worker.postMessage({
                type: options.type || 'optimize',
                imageData: imageData.data,
                width: canvas.width,
                height: canvas.height
            });
        });
    }

    processSync(imageElement, options) {
        return new Promise((resolve) => {
            imageElement.decoding = 'async';
            resolve(true);
        });
    }
}

// Parallele Bildverarbeitung initialisieren
let processor = null;

document.addEventListener('DOMContentLoaded', () => {
    if (window.Worker) {
        processor = new ParallelProcessor();
        console.log('[Parallel] Multi-Thread Verarbeitung aktiv');
    }
    // Adaptive Qualität initialisieren
    new AdaptiveQuality();
});

// Bilder parallel vorladen
function preloadImagesParallel() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    const imageSources = Array.from(images).map(img => img.src);
    
    const loadPromises = imageSources.map(src => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(src);
            img.onerror = () => resolve(src);
            img.src = src;
        });
    });
    
    return Promise.all(loadPromises);
}

// ============================================
// Form Handling
// ============================================

const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Get form data
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const message = document.getElementById('message').value;

    // Simple validation
    if (!name || !email || !message) {
        alert('Bitte füllen Sie alle erforderlichen Felder aus.');
        return;
    }

    // In a real application, you would send this data to a server
    // For now, we'll just show a success message
    alert(`Vielen Dank, ${name}! Wir werden uns bald bei Ihnen melden.`);

    // Reset form
    contactForm.reset();
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        
        if (targetId === '#home') {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            return;
        }

        const target = document.querySelector(targetId);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add scroll animation effect to dienste cards , desto größer die erste zahl der rootMargin desto schneller laden die Bilder
// wenn treshold negativ ist, werden die Bilder früher geladen, wenn sie in den Viewport kommen
const observerOptions = {
    threshold: 0.0,
    rootMargin: '400px 0px 0px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe service rows and steps transition kürzer machen
const cards = document.querySelectorAll('.service-row, .step');
cards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    observer.observe(card);
});
// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const nav = document.querySelector('.navbar');
    if (!nav.contains(event.target)) {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    }
});
