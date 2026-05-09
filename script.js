let cardData = [
    { name: "黑鑽逆時洗髮精", price: "980", img: "https://picsum.photos/300/400?random=1", desc: "【極致修護】\n蘊含珍稀黑鑽精萃，\n深層修復受損髮質，\n重現亮澤。" },
    { name: "藍寶石持色露", price: "850", img: "https://picsum.photos/300/400?random=2", desc: "【專為染後設計】\n中和枯黃色調，\n維持髮色鮮艷度，\n長效保濕。" },
    { name: "鈦金結構護髮膜", price: "1500", img: "https://picsum.photos/300/400?random=3", desc: "【結構重建】\n強韌髮芯纖維，\n預防斷裂，\n讓秀髮更有彈性。" },
    { name: "極光豐盈噴霧", price: "720", img: "https://picsum.photos/300/400?random=4", desc: "【無重力蓬鬆】\n提升髮根撐力，\n質地清爽不黏膩，\n適合細軟髮。" },
    { name: "金萃魔油", price: "1280", img: "https://picsum.photos/300/400?random=5", desc: "【高效撫平】\n瞬間解決毛躁，\n抗高溫保護，\n散發頂級芳香。" }
];

const carousel = document.getElementById('carousel');
const sidebar = document.getElementById('sidebar');
const adminPanel = document.getElementById('adminPanel');
const overlay = document.getElementById('overlay');

function toggleSidebar(isOpen) {
    sidebar.classList.toggle('open', isOpen);
    overlay.style.display = isOpen ? 'block' : 'none';
}

function toggleAdmin(isOpen) {
    adminPanel.classList.toggle('active', isOpen);
    overlay.style.display = isOpen ? 'block' : 'none';
}

overlay.onclick = () => { toggleSidebar(false); toggleAdmin(false); };

function openAddMode() {
    document.getElementById('panelTitle').innerText = "新增產品資訊";
    document.getElementById('editIndex').value = "-1";
    document.getElementById('cardName').value = "";
    document.getElementById('cardPrice').value = "";
    document.getElementById('cardImg').value = "";
    document.getElementById('cardBack').value = "";
    toggleAdmin(true);
}

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

function renderCards() {
    carousel.innerHTML = "";
    const total = cardData.length;
    const angleStep = 360 / total;
    const radius = Math.max(300, total * 40);

    cardData.forEach((item, i) => {
        // 這是畫筆(Edit)的 SVG 圖示代碼
        const editIcon = `<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;

        const cardHtml = `
            <div class="card" id="card-${i}" style="transform: rotateY(${i * angleStep}deg) translateZ(${radius}px)">
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
                        <p style="font-size:13px; color:#ccc; line-height:1.5; white-space:pre-wrap; margin:0;">${item.desc}</p>
                    </div>
                </div>
            </div>`;
        carousel.insertAdjacentHTML('beforeend', cardHtml);
    });
}

function saveCard() {
    const index = parseInt(document.getElementById('editIndex').value);
    const name = document.getElementById('cardName').value.trim();
    const price = document.getElementById('cardPrice').value.trim();
    const desc = document.getElementById('cardBack').value.trim();
    const imgUrl = document.getElementById('cardImg').value.trim();
    const img = imgUrl || `https://picsum.photos/300/400?random=${Math.random()}`;

    if (!name || !price || !desc) return alert("請完整填寫產品資訊");

    const newData = { name, price, img, desc };
    if (index === -1) {
        cardData.push(newData);
    } else {
        cardData[index] = newData;
    }
    renderCards();
    toggleAdmin(false);
}

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

renderCards();