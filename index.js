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

const openProjectRepository = (card) => {
    window.open(card.dataset.github, '_blank', 'noopener,noreferrer');
};

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
            openProjectRepository(getActiveCard());
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
                openProjectRepository(card);
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

const problemTabs = document.querySelectorAll('.platform-tab');
const problemSearch = document.querySelector('#problem-search');
const problemDifficulty = document.querySelector('#problem-difficulty');
const problemTopic = document.querySelector('#problem-topic');
const problemCards = Array.from(document.querySelectorAll('.problem-card'));
const platformCards = document.querySelectorAll('.platform-card');
const problemEmpty = document.querySelector('.problem-empty');
const problemDialog = document.querySelector('#problem-dialog');
const problemDialogClose = document.querySelector('.problem-dialog-close');
const problemDialogPlatform = document.querySelector('#problem-dialog-platform');
const problemDialogTitle = document.querySelector('#problem-dialog-title');
const problemDialogId = document.querySelector('#problem-dialog-id');
const problemDialogDifficulty = document.querySelector('#problem-dialog-difficulty');
const problemDialogTopic = document.querySelector('#problem-dialog-topic');
const problemDialogApproach = document.querySelector('#problem-dialog-approach');
const problemDialogConcepts = document.querySelector('#problem-dialog-concepts');
const problemDialogProblem = document.querySelector('#problem-dialog-problem');
const problemDialogSolution = document.querySelector('#problem-dialog-solution');
let activeProblemPlatform = 'All';

const filterProblems = () => {
    const searchValue = problemSearch.value.trim().toLowerCase();
    const difficultyValue = problemDifficulty.value;
    const topicValue = problemTopic.value;
    let visibleCount = 0;

    platformCards.forEach((card) => {
        card.classList.toggle('is-active', card.dataset.platformCard === activeProblemPlatform);
    });

    problemCards.forEach((card) => {
        const searchableText = [
            card.dataset.platform,
            card.dataset.difficulty,
            card.dataset.topic,
            card.dataset.id,
            card.querySelector('h3').textContent,
        ].join(' ').toLowerCase();

        const matchesPlatform = activeProblemPlatform === 'All' || card.dataset.platform === activeProblemPlatform;
        const matchesDifficulty = difficultyValue === 'All' || card.dataset.difficulty === difficultyValue;
        const matchesTopic = topicValue === 'All' || card.dataset.topic.includes(topicValue);
        const matchesSearch = !searchValue || searchableText.includes(searchValue);
        const isVisible = matchesPlatform && matchesDifficulty && matchesTopic && matchesSearch;

        card.classList.toggle('is-hidden', !isVisible);
        if (isVisible) {
            visibleCount += 1;
        }
    });

    problemEmpty.hidden = visibleCount > 0;
};

const openProblemDialog = (card) => {
    const solutionLink = card.dataset.solutionLink.trim();

    problemDialogPlatform.textContent = card.dataset.platform;
    problemDialogTitle.textContent = card.querySelector('h3').textContent;
    problemDialogId.textContent = card.dataset.id;
    problemDialogDifficulty.textContent = card.dataset.difficulty;
    problemDialogTopic.textContent = card.dataset.topic;
    problemDialogApproach.textContent = card.dataset.approach;
    problemDialogConcepts.textContent = card.dataset.concepts;
    problemDialogProblem.href = card.dataset.problemLink;
    problemDialogSolution.href = solutionLink || '#';
    problemDialogSolution.hidden = !solutionLink;
    problemDialog.showModal();
};

problemTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
        activeProblemPlatform = tab.dataset.platform;
        problemTabs.forEach((item) => item.classList.toggle('is-active', item === tab));
        filterProblems();
    });
});

platformCards.forEach((card) => {
    card.addEventListener('click', (event) => {
        if (event.target.closest('a')) {
            return;
        }

        activeProblemPlatform = card.dataset.platformCard;
        problemTabs.forEach((tab) => {
            tab.classList.toggle('is-active', tab.dataset.platform === activeProblemPlatform);
        });
        filterProblems();
    });
});

[problemSearch, problemDifficulty, problemTopic].forEach((control) => {
    control.addEventListener('input', filterProblems);
    control.addEventListener('change', filterProblems);
});

problemCards.forEach((card) => {
    card.addEventListener('click', () => openProblemDialog(card));
    card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openProblemDialog(card);
        }
    });
});

problemDialogClose.addEventListener('click', () => problemDialog.close());
problemDialog.addEventListener('click', (event) => {
    if (event.target === problemDialog) {
        problemDialog.close();
    }
});

filterProblems();
