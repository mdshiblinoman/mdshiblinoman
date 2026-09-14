const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.querySelector('span').textContent = isOpen ? '−' : '+';
});

navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.querySelector('span').textContent = '+';
    });
});

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
document.querySelector('#year').textContent = new Date().getFullYear();

const projectDialog = document.querySelector('#project-dialog');
const projectDialogClose = document.querySelector('.project-dialog-close');
const projectDialogCategory = document.querySelector('#project-dialog-category');
const projectDialogTitle = document.querySelector('#project-dialog-title');
const projectDialogDescription = document.querySelector('#project-dialog-description');
const projectDialogDetails = document.querySelector('#project-dialog-details');
const projectDialogLink = document.querySelector('#project-dialog-link');

const openProjectDialog = (card) => {
    projectDialogCategory.textContent = card.querySelector('.project-card-type').textContent;
    projectDialogTitle.textContent = card.querySelector('h4').textContent;
    projectDialogDescription.textContent = card.querySelector('p').textContent;
    projectDialogDetails.textContent = card.dataset.details;
    projectDialogLink.href = card.dataset.github;
    projectDialog.showModal();
};

projectDialogClose.addEventListener('click', () => projectDialog.close());
projectDialog.addEventListener('click', (event) => {
    if (event.target === projectDialog) {
        projectDialog.close();
    }
});

document.querySelectorAll('.project-carousel').forEach((carousel) => {
    const track = carousel.querySelector('.project-card-track');
    const cards = Array.from(track.querySelectorAll('.project-card'));
    const previousButton = carousel.querySelector('.carousel-prev');
    const nextButton = carousel.querySelector('.carousel-next');
    let activeIndex = 0;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let activePointerId = null;
    let didDrag = false;
    let isAnimating = false;

    const updateStack = () => {
        cards.forEach((card, index) => {
            const offset = (index - activeIndex + cards.length) % cards.length;

            card.classList.toggle('is-active', offset === 0);
            card.classList.toggle('is-next', offset === 1);
            card.classList.toggle('is-after', offset === 2);
            card.classList.toggle('is-prev', offset > 2);
            card.setAttribute('aria-hidden', String(offset !== 0));
            card.tabIndex = offset === 0 ? 0 : -1;
        });
    };

    const showCard = (direction = 1) => {
        activeIndex = (activeIndex + direction + cards.length) % cards.length;
        updateStack();
    };

    const getActiveCard = () => cards[activeIndex];

    const resetActiveCard = () => {
        const activeCard = getActiveCard();
        activeCard.classList.remove('is-dragging');
        activeCard.style.transform = '';
        activeCard.style.opacity = '';
    };

    const swipeActiveCard = (step, exitDirection = step) => {
        const activeCard = getActiveCard();
        isAnimating = true;
        activeCard.classList.remove('is-dragging');
        activeCard.classList.add('is-exiting');
        activeCard.style.transform = `translateX(${exitDirection * 120}%) rotate(${exitDirection * 16}deg)`;
        activeCard.style.opacity = '0';

        window.setTimeout(() => {
            activeCard.classList.remove('is-exiting');
            activeCard.style.transform = '';
            activeCard.style.opacity = '';
            showCard(step);
            isAnimating = false;
        }, 280);
    };

    const finishDrag = () => {
        const threshold = Math.min(130, track.offsetWidth * .28);

        if (Math.abs(currentX) > threshold) {
            swipeActiveCard(currentX < 0 ? 1 : -1, currentX < 0 ? -1 : 1);
            return;
        }

        resetActiveCard();

        if (!didDrag) {
            openProjectDialog(getActiveCard());
        }
    };

    previousButton.addEventListener('click', () => {
        if (!isAnimating) {
            swipeActiveCard(-1, 1);
        }
    });

    nextButton.addEventListener('click', () => {
        if (!isAnimating) {
            swipeActiveCard(1, -1);
        }
    });

    cards.forEach((card) => {
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openProjectDialog(card);
            }
        });
    });

    track.addEventListener('pointerdown', (event) => {
        const activeCard = getActiveCard();

        if (isAnimating || !event.target.closest('.project-card.is-active')) {
            return;
        }

        activePointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;
        currentX = 0;
        didDrag = false;
        activeCard.classList.add('is-dragging');
        activeCard.setPointerCapture(activePointerId);
    });

    track.addEventListener('pointermove', (event) => {
        if (activePointerId !== event.pointerId || isAnimating) {
            return;
        }

        const activeCard = getActiveCard();
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        if (Math.abs(deltaX) < 5 && Math.abs(deltaY) < 5) {
            return;
        }

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            event.preventDefault();
            didDrag = true;
            currentX = deltaX;
            activeCard.style.transform = `translateX(${deltaX}px) rotate(${deltaX / 18}deg)`;
            activeCard.style.opacity = String(Math.max(.35, 1 - Math.abs(deltaX) / 420));
        }
    });

    track.addEventListener('pointerup', (event) => {
        if (activePointerId !== event.pointerId) {
            return;
        }

        getActiveCard().releasePointerCapture(activePointerId);
        activePointerId = null;
        finishDrag();
    });

    track.addEventListener('pointercancel', (event) => {
        if (activePointerId !== event.pointerId) {
            return;
        }

        activePointerId = null;
        resetActiveCard();
    });

    updateStack();
});
