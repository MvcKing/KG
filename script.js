let cardData = [
    { name: "保濕洗髮精", img: "https://picsum.photos/300/400?random=101", desc: "【專業洗護系列】\n適合乾性及受損髮質。\n內含玻尿酸萃取，\n深層補水並鎖住養分。" },
    { name: "結構護髮素", img: "https://picsum.photos/300/400?random=102", desc: "【瞬間修復】\n針對頻繁染燙設計。\n自動填補髮絲空洞，\n還原秀髮彈性與光澤。" },
    { name: "頭皮淨化液", img: "https://picsum.photos/300/400?random=103", desc: "【深層清潔】\n溫和去角質，\n舒緩頭皮壓力。\n讓頭皮深呼吸。" }
];

const carousel = document.getElementById('carousel');
const addBtn = document.getElementById('addBtn');

let isDragging = false;
let startX = 0;
let currentRotation = 0;
let tempRotation = 0;
let lastMoveDistance = 0;

// 1. 渲染函數
function renderCards() {
    carousel.innerHTML = "";
    const total = cardData.length;
    const angleStep = 360 / total;
    const radius = Math.max(320, total * 65);

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
                        <p style="font-size:13px; text-align: left;">${item.desc}</p>
                    </div>
                </div>
            </div>
        `;
        carousel.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// 2. 互動處理
function handleStart(e) {
    isDragging = true;
    lastMoveDistance = 0;
    // 獲取起始點座標 (相容觸控與滑鼠)
    startX = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
    carousel.style.transition = 'none'; 
}

function handleMove(e) {
    if (!isDragging) return;
    
    // 強力攔截行為：防止手機網頁跟著動
    if (e.cancelable) e.preventDefault();

    const x = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
    const moveX = x - startX;
    lastMoveDistance = Math.abs(moveX);
    
    // 0.3 為旋轉靈敏度
    tempRotation = currentRotation + moveX * 0.3; 
    carousel.style.transform = `rotateY(${tempRotation}deg)`;
}

function handleEnd() {
    if (!isDragging) return;
    isDragging = false;
    currentRotation = tempRotation;
    carousel.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
}

// 3. 翻面判斷
function handleCardClick(e, element) {
    // 如果移動距離超過 10px，視為在旋轉，不觸發翻面
    if (lastMoveDistance > 10) return;
    element.classList.toggle('is-flipped');
}

// 4. 搜尋功能
function searchCard() {
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!keyword) return;

    const index = cardData.findIndex(item => item.name.toLowerCase().includes(keyword));

    if (index !== -1) {
        const angleStep = 360 / cardData.length;
        currentRotation = -(index * angleStep);
        carousel.style.transition = 'transform 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        carousel.style.transform = `rotateY(${currentRotation}deg)`;

        // 視覺發光標註
        document.querySelectorAll('.card').forEach(c => c.classList.remove('highlight'));
        setTimeout(() => {
            document.getElementById(`card-${index}`).classList.add('highlight');
        }, 1000);
    } else {
        alert("找不到此名稱的髮妝品！");
    }
}

// 5. 新增功能
addBtn.addEventListener('click', () => {
    const name = document.getElementById('cardName').value;
    const img = document.getElementById('cardImg').value;
    const desc = document.getElementById('cardBack').value;

    if (!name || !desc) {
        alert("請填寫產品名稱與背面詳情！");
        return;
    }

    const finalImg = img || `https://picsum.photos/300/400?random=${Math.floor(Math.random()*200)}`;
    cardData.push({ name, img: finalImg, desc });
    
    renderCards();
    
    // 清空欄位
    document.getElementById('cardName').value = "";
    document.getElementById('cardImg').value = "";
    document.getElementById('cardBack').value = "";
    
    // 自動對準新卡片
    setTimeout(() => {
        const angleStep = 360 / cardData.length;
        currentRotation = -((cardData.length - 1) * angleStep);
        carousel.style.transform = `rotateY(${currentRotation}deg)`;
    }, 400);
});

// 6. 事件綁定：明確禁用 passive 模式
window.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);

window.addEventListener('touchstart', handleStart, { passive: false });
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleEnd, { passive: false });

// 初始化渲染
renderCards();