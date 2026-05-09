let cardData = [
    { name: "保濕洗髮精", img: "https://picsum.photos/300/400?random=101", desc: "【專業洗護】\n深層補水，\n還原髮絲彈性。" },
    { name: "結構護髮素", img: "https://picsum.photos/300/400?random=102", desc: "【修復受損】\n自動填補空洞，\n鎖住色彩分子。" },
    { name: "頭皮淨化液", img: "https://picsum.photos/300/400?random=103", desc: "【溫和去角質】\n舒緩頭皮壓力，\n清爽不油膩。" }
];

const carousel = document.getElementById('carousel');
const adminPanel = document.getElementById('adminPanel');
const openDrawer = document.getElementById('openDrawer');
const closeDrawer = document.getElementById('closeDrawer');
const addBtn = document.getElementById('addBtn');

// 面板控制
openDrawer.onclick = () => adminPanel.classList.add('active');
closeDrawer.onclick = () => adminPanel.classList.remove('active');

let isDragging = false;
let startX = 0;
let currentRotation = 0;
let tempRotation = 0;
let lastMoveDistance = 0;

function renderCards() {
    carousel.innerHTML = "";
    const total = cardData.length;
    const angleStep = 360 / total;
    const radius = Math.max(300, total * 60);

    cardData.forEach((item, i) => {
        const cardHtml = `
            <div class="card" id="card-${i}" style="transform: rotateY(${i * angleStep}deg) translateZ(${radius}px)">
                <div class="card-inner" onclick="handleCardClick(event, this)">
                    <div class="front">
                        <img src="${item.img}">
                        <div class="title-tag">${item.name}</div>
                    </div>
                    <div class="back">
                        <strong>${item.name}</strong><hr style="margin:8px 0; border:0; border-top:1px solid #444;">
                        <p style="font-size:12px; text-align:left;">${item.desc}</p>
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
        document.querySelectorAll('.card').forEach(c => c.classList.remove('highlight'));
        setTimeout(() => document.getElementById(`card-${index}`).classList.add('highlight'), 800);
    }
}

addBtn.onclick = () => {
    const name = document.getElementById('cardName').value;
    const img = document.getElementById('cardImg').value || `https://picsum.photos/300/400?random=${Math.random()}`;
    const desc = document.getElementById('cardBack').value;

    if (!name || !desc) return alert("請填寫內容");

    cardData.push({ name, img, desc });
    renderCards();
    adminPanel.classList.remove('active'); // 新增後自動收起
    
    // 清空
    document.getElementById('cardName').value = "";
    document.getElementById('cardBack').value = "";
    
    // 轉向新卡片
    setTimeout(() => {
        currentRotation = -((cardData.length - 1) * (360 / cardData.length));
        carousel.style.transform = `rotateY(${currentRotation}deg)`;
    }, 400);
};

// 事件綁定
window.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);
window.addEventListener('touchstart', handleStart, { passive: false });
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleEnd, { passive: false });

renderCards();