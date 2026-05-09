// 1. 初始資料 (預設兩筆產品)
let cardData = [
    { name: "極致洗髮精", price: "880", img: "https://picsum.photos/300/400?random=11", desc: "【深層淨化】\n適合各種髮質使用。" },
    { name: "炫光護髮膜", price: "1280", img: "https://picsum.photos/300/400?random=22", desc: "【瞬間光澤】\n鎖住水分與色澤。" }
];

const carousel = document.getElementById('carousel');
const sidebar = document.getElementById('sidebar');
const adminPanel = document.getElementById('adminPanel');
const overlay = document.getElementById('overlay');

// 2. UI 開關邏輯
function toggleSidebar(isOpen) {
    sidebar.classList.toggle('open', isOpen);
    overlay.style.display = isOpen ? 'block' : 'none';
}

function toggleAdmin(isOpen) {
    adminPanel.classList.toggle('active', isOpen);
    overlay.style.display = isOpen ? 'block' : 'none';
}

// 點擊背景遮罩關閉所有開啟的面板
overlay.onclick = () => {
    toggleSidebar(false);
    toggleAdmin(false);
};

// 3. 渲染卡片核心
function renderCards() {
    carousel.innerHTML = "";
    const total = cardData.length;
    const angleStep = 360 / total;
    const radius = Math.max(300, total * 50); // 根據卡片數量動態調整旋轉半徑

    cardData.forEach((item, i) => {
        const cardHtml = `
            <div class="card" id="card-${i}" style="transform: rotateY(${i * angleStep}deg) translateZ(${radius}px)">
                <div class="card-inner" onclick="handleCardClick(event, this)">
                    <div class="front">
                        <img src="${item.img}" alt="product">
                        <div class="info-tag">
                            <div class="info-name">${item.name}</div>
                            <div class="info-price">$${item.price}</div>
                        </div>
                    </div>
                    <div class="back">
                        <strong style="color:#00f2ff; font-size:18px;">${item.name}</strong>
                        <div style="font-size:18px; color:#00f2ff; margin-bottom:10px;">$${item.price}</div>
                        <hr style="border:0; border-top:1px solid #333; margin:10px 0;">
                        <p style="font-size:14px; color:#ccc; line-height:1.6; white-space:pre-wrap;">${item.desc}</p>
                    </div>
                </div>
            </div>`;
        carousel.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// 4. 旋轉互動處理
let isDragging = false, startX = 0, currentRotation = 0, tempRotation = 0, lastMoveDistance = 0;

function handleStart(e) {
    if (sidebar.classList.contains('open') || adminPanel.classList.contains('active')) return;
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
    if (lastMoveDistance > 10) return; // 滑動超過 10 像素視為旋轉，不翻面
    element.classList.toggle('is-flipped');
}

// 5. 功能按鈕：搜尋與新增
window.searchCard = function() {
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
    const index = cardData.findIndex(item => item.name.toLowerCase().includes(keyword));
    if (index !== -1) {
        currentRotation = -(index * (360 / cardData.length));
        carousel.style.transform = `rotateY(${currentRotation}deg)`;
    }
};

document.getElementById('addBtn').onclick = () => {
    const name = document.getElementById('cardName').value.trim();
    const price = document.getElementById('cardPrice').value.trim();
    const desc = document.getElementById('cardBack').value.trim();
    const imgInput = document.getElementById('cardImg').value.trim();
    const img = imgInput || `https://picsum.photos/300/400?random=${Math.random()}`;

    if (!name || !price || !desc) return alert("請完整輸入產品名稱、價格與描述");

    cardData.push({ name, price, img, desc });
    renderCards();
    toggleAdmin(false);
    
    // 清空輸入欄位
    document.getElementById('cardName').value = "";
    document.getElementById('cardPrice').value = "";
    document.getElementById('cardBack').value = "";
    document.getElementById('cardImg').value = "";
};

// 6. 全域事件掛載
window.addEventListener('touchstart', handleStart, { passive: false });
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleEnd, { passive: false });
window.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);

// 初始化渲染
renderCards();