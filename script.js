let cardData = [
    { name: "極致洗髮精", img: "https://picsum.photos/300/400?random=11", desc: "【深層淨化】\n適合各種髮質使用，\n洗後清爽無負擔。" },
    { name: "炫光護髮膜", img: "https://picsum.photos/300/400?random=22", desc: "【瞬間光澤】\n鎖住水分與色澤，\n打造絲緞般觸感。" }
];

const carousel = document.getElementById('carousel');
const adminPanel = document.getElementById('adminPanel');
const overlay = document.getElementById('overlay');
const openDrawer = document.getElementById('openDrawer');
const closeDrawer = document.getElementById('closeDrawer');
const addBtn = document.getElementById('addBtn');

function togglePanel(isOpen) {
    if (isOpen) {
        adminPanel.classList.add('active');
        overlay.style.display = 'block';
    } else {
        adminPanel.classList.remove('active');
        overlay.style.display = 'none';
    }
}

openDrawer.onclick = () => togglePanel(true);
closeDrawer.onclick = () => togglePanel(false);
overlay.onclick = () => togglePanel(false);

let isDragging = false;
let startX = 0;
let currentRotation = 0;
let tempRotation = 0;
let lastMoveDistance = 0;

function renderCards() {
    carousel.innerHTML = "";
    const total = cardData.length;
    const angleStep = 360 / total;
    const radius = Math.max(280, total * 60);

    cardData.forEach((item, i) => {
        const cardHtml = `
            <div class="card" id="card-${i}" style="transform: rotateY(${i * angleStep}deg) translateZ(${radius}px)">
                <div class="card-inner" onclick="handleCardClick(event, this)">
                    <div class="front">
                        <img src="${item.img}">
                        <div class="title-tag">${item.name}</div>
                    </div>
                    <div class="back">
                        <strong style="font-size:1.2em;">${item.name}</strong>
                        <hr style="border:0; border-top:1px solid #333; margin:10px 0;">
                        <p style="font-size:13px; line-height:1.6; color:#ccc;">${item.desc}</p>
                    </div>
                </div>
            </div>`;
        carousel.insertAdjacentHTML('beforeend', cardHtml);
    });
}

function handleStart(e) {
    isDragging = true;
    lastMoveDistance = 0;
    startX = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
    carousel.style.transition = 'none';
}

function handleMove(e) {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();
    const x = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
    const moveX = x - startX;
    lastMoveDistance = Math.abs(moveX);
    tempRotation = currentRotation + moveX * 0.3;
    carousel.style.transform = `rotateY(${tempRotation}deg)`;
}

function handleEnd() {
    if (!isDragging) return;
    isDragging = false;
    currentRotation = tempRotation;
    carousel.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
}

function handleCardClick(e, element) {
    if (lastMoveDistance > 10) return;
    element.classList.toggle('is-flipped');
}

function searchCard() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const index = cardData.findIndex(item => item.name.toLowerCase().includes(keyword));
    if (index !== -1) {
        currentRotation = -(index * (360 / cardData.length));
        carousel.style.transform = `rotateY(${currentRotation}deg)`;
        document.querySelectorAll('.card-inner').forEach(c => {
            c.style.animation = "none";
            c.parentElement.classList.remove('highlight');
        });
        setTimeout(() => {
            const hit = document.getElementById(`card-${index}`);
            hit.classList.add('highlight');
        }, 800);
    }
}

addBtn.onclick = () => {
    const name = document.getElementById('cardName').value;
    const img = document.getElementById('cardImg').value || `https://picsum.photos/300/400?random=${Math.random()}`;
    const desc = document.getElementById('cardBack').value;
    if (!name || !desc) return alert("請輸入完整產品資訊");
    cardData.push({ name, img, desc });
    renderCards();
    togglePanel(false);
    document.getElementById('cardName').value = "";
    document.getElementById('cardBack').value = "";
    setTimeout(() => {
        currentRotation = -((cardData.length - 1) * (360 / cardData.length));
        carousel.style.transform = `rotateY(${currentRotation}deg)`;
    }, 400);
};

window.addEventListener('touchstart', handleStart, { passive: false });
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleEnd, { passive: false });
window.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);

renderCards();