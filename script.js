let cardData = [
    { name: "保濕洗髮精", img: "https://picsum.photos/300/400?random=1", desc: "【專業洗護系列】\n適合乾性及受損髮質。\n內含玻尿酸萃取，\n深層補水並鎖住養分。" },
    { name: "結構護髮素", img: "https://picsum.photos/300/400?random=2", desc: "【瞬間修復】\n針對頻繁染燙設計。\n自動填補髮絲空洞，\n還原秀髮彈性與光澤。" },
    { name: "頭皮淨化液", img: "https://picsum.photos/300/400?random=3", desc: "【深層清潔】\n溫和去角質，\n舒緩頭皮壓力。\n讓頭皮深呼吸。" }
];

const carousel = document.getElementById('carousel');
const addBtn = document.getElementById('addBtn');

let isDragging = false;
let startX = 0;
let currentRotation = 0;
let tempRotation = 0;
let lastMoveDistance = 0;

// 渲染與計算
function renderCards() {
    carousel.innerHTML = "";
    const total = cardData.length;
    const angleStep = 360 / total;
    const radius = Math.max(320, total * 60);

    cardData.forEach((item, i) => {
        const cardHtml = `
            <div class="card" id="card-${i}" style="transform: rotateY(${i * angleStep}deg) translateZ(${radius}px)">
                <div class="card-inner" onclick="handleCardClick(event, this)">
                    <div class="front">
                        <img src="${item.img}" alt="${item.name}">
                        <div class="title-tag">${item.name}</div>
                    </div>
                    <div class="back">
                        <strong>${item.name}</strong>
                        <hr style="margin:10px 0; border:0; border-top:1px solid #444;">
                        <p style="font-size:13px;">${item.desc}</p>
                    </div>
                </div>
            </div>
        `;
        carousel.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// 核心互動處理
function handleStart(e) {
    isDragging = true;
    lastMoveDistance = 0;
    startX = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
    carousel.style.transition = 'none';
}

function handleMove(e) {
    if (!isDragging) return;
    
    // 徹底攔截手機預設捲動
    if (e.cancelable) e.preventDefault();

    const x = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
    const moveX = x - startX;
    lastMoveDistance = Math.abs(moveX);
    
    tempRotation = currentRotation + moveX * 0.3; // 靈敏度調整
    carousel.style.transform = `rotateY(${tempRotation}deg)`;
}

function handleEnd() {
    if (!isDragging) return;
    isDragging = false;
    currentRotation = tempRotation;
    carousel.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
}

// 點擊判斷
function handleCardClick(e, element) {
    // 只有在位移極小時（點擊）才觸發翻面
    if (lastMoveDistance > 10) return;
    element.classList.toggle('is-flipped');
}

// 搜尋功能
function searchCard() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const index = cardData.findIndex(item => item.name.toLowerCase().includes(keyword));

    if (index !== -1) {
        const angleStep = 360 / cardData.length;
        currentRotation = -(index * angleStep);
        carousel.style.transition = 'transform 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        carousel.style.transform = `rotateY(${currentRotation}deg)`;

        document.querySelectorAll('.card').forEach(c => c.classList.remove('highlight'));
        setTimeout(() => {
            document.getElementById(`card-${index}`).classList.add('highlight');
        }, 800);
    } else {
        alert("找不到此產品名稱！");
    }
}

// 新增功能
addBtn.addEventListener('click', () => {
    const name = document.getElementById('cardName').value;
    const img = document.getElementById('cardImg').value;
    const desc = document.getElementById('cardBack').value;

    if (!name || !desc) {
        alert("請填寫產品名稱與詳情！");
        return;
    }

    const finalImg = img || `https://picsum.photos/300/400?random=${Math.floor(Math.random()*100)}`;
    cardData.push({ name, img: finalImg, desc });
    
    renderCards();
    
    // 清空並跳轉
    document.getElementById('cardName').value = "";
    document.getElementById('cardImg').value = "";
    document.getElementById('cardBack').value = "";
    
    // 自動轉向新卡片
    setTimeout(() => {
        currentRotation = -((cardData.length - 1) * (360 / cardData.length));
        carousel.style.transform = `rotateY(${currentRotation}deg)`;
    }, 300);
});

// 事件綁定 (滑鼠)
window.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);

// 事件綁定 (觸控 - 加入 passive: false 才能 preventDefault)
window.addEventListener('touchstart', handleStart, { passive: false });
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleEnd);

// 初始化
renderCards();