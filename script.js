// 請替換成你的 GAS 部署網址
const GAS_URL = "https://script.google.com/macros/s/AKfycbytaQHNZdm5N7mInOkkzGE_IAR1NHj5wqJuZ4ciQVSyay2CJJcCEwL4ubR0RaRl9vri/exec"; 

let cardData = [];
const carousel = document.getElementById('carousel');
const adminPanel = document.getElementById('adminPanel');
const overlay = document.getElementById('overlay');

// 1. 從 Google Sheets 讀取資料
async function fetchCards() {
    try {
        const response = await fetch(GAS_URL);
        cardData = await response.json();
        renderCards();
    } catch (err) {
        console.error("讀取資料失敗:", err);
    }
}

// 2. 儲存或更新到 Google Sheets
async function saveCard() {
    const index = parseInt(document.getElementById('editIndex').value);
    const name = document.getElementById('cardName').value.trim();
    const price = document.getElementById('cardPrice').value.trim();
    const desc = document.getElementById('cardBack').value.trim(); // 此欄位已改為產品資訊
    const imgUrl = document.getElementById('cardImg').value.trim();
    const img = imgUrl || `https://picsum.photos/300/400?random=${Math.random()}`;

    if (!name || !price || !desc) return alert("請完整填寫產品資訊");

    const payload = { action: "save", index, name, price, img, desc };

    // 顯示讀取中狀態 (可選)
    document.getElementById('saveBtn').innerText = "儲存中...";

    try {
        await fetch(GAS_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });
        await fetchCards(); // 重新整理資料
        toggleAdmin(false);
    } catch (err) {
        alert("儲存失敗，請檢查網路連線");
    } finally {
        document.getElementById('saveBtn').innerText = "儲存資訊";
    }
}

// --- 以下為 UI 渲染與互動邏輯 (保持不變) ---

function renderCards() {
    carousel.innerHTML = "";
    if (cardData.length === 0) return;
    
    const total = cardData.length;
    const angleStep = 360 / total;
    const radius = Math.max(300, total * 45);

    cardData.forEach((item, i) => {
        const editIcon = `<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;

        const cardHtml = `
            <div class="card" style="transform: rotateY(${i * angleStep}deg) translateZ(${radius}px)">
                <div class="card-inner" onclick="handleCardClick(event, this)">
                    <div class="front">
                        <img src="${item.img}" alt="p">
                        <div class="info-tag">
                            <div class="info-name">${item.name}</div>
                            <div class="info-price">$${item.price}</div>
                        </div>
                    </div>
                    <div class="back">
                        <button class="btn-edit" onclick="event.stopPropagation(); openEditMode(${i})">
                            ${editIcon}
                        </button>
                        <strong style="color:#00f2ff; font-size:16px;">${item.name}</strong>
                        <div style="font-size:16px; color:#00f2ff; margin-bottom:10px;">$${item.price}</div>
                        <div style="color:#888; font-size:12px; margin-bottom:5px;">產品資訊：</div>
                        <p style="font-size:13px; color:#ccc; line-height:1.5; white-space:pre-wrap; margin:0;">${item.desc}</p>
                    </div>
                </div>
            </div>`;
        carousel.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// 介面開啟模式
function openEditMode(index) {
    const item = cardData[index];
    document.getElementById('panelTitle').innerText = "編輯產品資訊";
    document.getElementById('editIndex').value = index;
    document.getElementById('cardName').value = item.name;
    document.getElementById('cardPrice').value = item.price;
    document.getElementById('cardImg').value = item.img;
    document.getElementById('cardBack').value = item.desc;
    toggleAdmin(true);
}

function openAddMode() {
    document.getElementById('panelTitle').innerText = "新增產品資訊";
    document.getElementById('editIndex').value = "-1";
    document.getElementById('cardName').value = "";
    document.getElementById('cardPrice').value = "";
    document.getElementById('cardImg').value = "";
    document.getElementById('cardBack').value = "";
    toggleAdmin(true);
}

// UI 基礎控制
function toggleAdmin(isOpen) {
    adminPanel.classList.toggle('active', isOpen);
    overlay.style.display = isOpen ? 'block' : 'none';
}
function toggleSidebar(isOpen) {
    document.getElementById('sidebar').classList.toggle('open', isOpen);
    overlay.style.display = isOpen ? 'block' : 'none';
}
overlay.onclick = () => { toggleAdmin(false); toggleSidebar(false); };

// 旋轉邏輯
let isDragging = false, startX = 0, currentRotation = 0, tempRotation = 0, lastMoveDistance = 0;
function handleStart(e) {
    if (adminPanel.classList.contains('active')) return;
    isDragging = true; lastMoveDistance = 0;
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
    isDragging = false; currentRotation = tempRotation;
    carousel.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
}
function handleCardClick(e, element) {
    if (lastMoveDistance > 10) return;
    element.classList.toggle('is-flipped');
}

window.searchCard = function() {
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
    const index = cardData.findIndex(item => item.name.toLowerCase().includes(keyword));
    if (index !== -1) {
        currentRotation = -(index * (360 / cardData.length));
        carousel.style.transform = `rotateY(${currentRotation}deg)`;
    }
};

window.addEventListener('touchstart', handleStart, { passive: false });
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleEnd, { passive: false });
window.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);

// 初始化：載入遠端資料
fetchCards();