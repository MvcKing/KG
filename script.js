// 1. 初始資料 (髮妝品範例)
let cardData = [
    { name: "保濕洗髮精", img: "https://picsum.photos/300/400?random=11", desc: "適合乾性髮質，\n內含膠原蛋白成分，\n能有效深層滋潤髮芯。" },
    { name: "護色髮膜", img: "https://picsum.photos/300/400?random=12", desc: "專為染後秀髮設計，\n鎖住色彩分子，\n延長色澤飽和度。" },
    { name: "頭皮舒緩液", img: "https://picsum.photos/300/400?random=13", desc: "含薄荷萃取，\n清涼止癢，\n調理頭皮油脂分泌。" },
    { name: "結構護髮素", img: "https://picsum.photos/300/400?random=14", desc: "強韌髮絲結構，\n防止斷裂，\n修復受損毛鱗片。" },
    { name: "蓬鬆噴霧", img: "https://picsum.photos/300/400?random=15", desc: "細軟髮救星，\n打造空氣感造型，\n整天維持不塌陷。" }
];

const carousel = document.getElementById('carousel');
const addBtn = document.getElementById('addBtn');

// 互動變數
let isDragging = false;
let startX = 0;
let currentRotation = 0; // 最終儲存的角度
let tempRotation = 0;    // 拖拽過程的角度
let dragDistance = 0;    // 用於判斷點擊還是拖拽

// 2. 渲染卡片函數
function renderCards() {
    carousel.innerHTML = "";
    const total = cardData.length;
    const angleStep = 360 / total;
    const radius = Math.max(350, total * 60); // 動態半徑避免重疊

    cardData.forEach((item, i) => {
        const cardHtml = `
            <div class="card" id="card-${i}" style="transform: rotateY(${i * angleStep}deg) translateZ(${radius}px)">
                <div class="card-inner" onclick="handleCardClick(event, this)">
                    <div class="front">
                        <img src="${item.img}" alt="${item.name}">
                        <div class="title-tag">${item.name}</div>
                    </div>
                    <div class="back">
                        <strong>${item.name}</strong><hr style="margin:8px 0; border:0; border-top:1px solid #444;">
                        <p style="text-align: left;">${item.desc}</p>
                    </div>
                </div>
            </div>
        `;
        carousel.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// 3. 核心互動邏輯 (相容滑鼠與觸控)
function handleStart(e) {
    isDragging = true;
    dragDistance = 0;
    startX = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
    carousel.style.transition = 'none'; // 關閉動畫實現「跟手」
}

function handleMove(e) {
    if (!isDragging) return;
    
    const x = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
    const moveX = x - startX;
    dragDistance = Math.abs(moveX); // 紀錄位移距離
    
    // 旋轉靈敏度 0.25
    tempRotation = currentRotation + moveX * 0.25;
    carousel.style.transform = `rotateY(${tempRotation}deg)`;
}

function handleEnd() {
    if (!isDragging) return;
    isDragging = false;
    currentRotation = tempRotation; // 存入正式角度
    carousel.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)'; // 放開後平滑感
}

// 4. 防止旋轉時誤觸翻面
function handleCardClick(e, element) {
    // 如果移動距離大於 5 像素，判定為「旋轉」而非「點擊」，不執行翻面
    if (dragDistance > 5) return;
    element.classList.toggle('is-flipped');
}

// 5. 搜尋定位
function searchCard() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const index = cardData.findIndex(item => item.name.toLowerCase().includes(keyword));

    if (index !== -1) {
        const total = cardData.length;
        const angleStep = 360 / total;
        
        // 重點：計算該卡片對應的正中心旋轉角度
        currentRotation = -(index * angleStep);
        carousel.style.transition = 'transform 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)'; // 酷炫的回彈定位效果
        carousel.style.transform = `rotateY(${currentRotation}deg)`;

        // 搜尋發光視覺回饋
        document.querySelectorAll('.card').forEach(c => c.classList.remove('highlight'));
        setTimeout(() => {
            document.getElementById(`card-${index}`).classList.add('highlight');
        }, 800);
    } else {
        alert("找不到相關髮妝品名稱！");
    }
}

// 6. 新增卡片功能
addBtn.addEventListener('click', () => {
    const name = document.getElementById('cardName').value;
    const img = document.getElementById('cardImg').value;
    const desc = document.getElementById('cardBack').value;

    if (!name || !desc) {
        alert("請輸入卡片名稱與背面資訊！");
        return;
    }

    // 若沒貼圖則隨機給圖
    const finalImg = img || `https://picsum.photos/300/400?random=${Math.floor(Math.random()*100)}`;

    cardData.push({ name, img: finalImg, desc });
    renderCards();
    
    // 清空表單
    document.getElementById('cardName').value = "";
    document.getElementById('cardImg').value = "";
    document.getElementById('cardBack').value = "";
    
    // 新增後自動定位到最新卡片
    setTimeout(() => {
        searchCardByExactName(name);
    }, 300);
});

// 內部小助手：精確名稱定位
function searchCardByExactName(name) {
    const index = cardData.findIndex(item => item.name === name);
    if (index !== -1) {
        currentRotation = -(index * (360 / cardData.length));
        carousel.style.transform = `rotateY(${currentRotation}deg)`;
    }
}

// 7. 事件監聽綁定
// 滑鼠
window.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);

// 手機觸控
window.addEventListener('touchstart', handleStart, { passive: false });
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleEnd);

// 初始化渲染
renderCards();