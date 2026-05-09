// 初始髮妝品資料
let cardData = [
    { name: "保濕洗髮精", img: "https://picsum.photos/300/400?random=11", desc: "適合乾性髮質，\n內含膠原蛋白成分，\n能有效深層滋潤髮芯。" },
    { name: "護色髮膜", img: "https://picsum.photos/300/400?random=12", desc: "專為染後秀髮設計，\n鎖住色彩分子，\n延長色澤飽和度。" },
    { name: "頭皮舒緩液", img: "https://picsum.photos/300/400?random=13", desc: "含薄荷萃取，\n清涼止癢，\n調理頭皮油脂分泌。" }
];

const carousel = document.getElementById('carousel');
const addBtn = document.getElementById('addBtn');

// 渲染卡片函數
function renderCards() {
    carousel.innerHTML = "";
    const total = cardData.length;
    const angleStep = 360 / total;
    const radius = Math.max(300, total * 50); // 動態計算半徑，避免擠在一起

    cardData.forEach((item, i) => {
        const cardHtml = `
            <div class="card" id="card-${i}" style="transform: rotateY(${i * angleStep}deg) translateZ(${radius}px)">
                <div class="card-inner" onclick="this.classList.toggle('is-flipped')">
                    <div class="front">
                        <img src="${item.img}" alt="">
                        <div class="title-tag">${item.name}</div>
                    </div>
                    <div class="back">
                        <strong>${item.name}</strong><hr style="margin:8px 0; border:0; border-top:1px solid #444;">
                        ${item.desc}
                    </div>
                </div>
            </div>
        `;
        carousel.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// 新增卡片功能
addBtn.addEventListener('click', () => {
    const name = document.getElementById('cardName').value;
    const img = document.getElementById('cardImg').value || "https://picsum.photos/300/400?random=" + Math.random();
    const desc = document.getElementById('cardBack').value;

    if (!name || !desc) {
        alert("請填寫名稱與背面資訊");
        return;
    }

    cardData.push({ name, img, desc });
    renderCards();
    
    // 清空欄位
    document.getElementById('cardName').value = "";
    document.getElementById('cardBack').value = "";
});

// 搜尋定位功能
function searchCard() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const index = cardData.findIndex(item => item.name.toLowerCase().includes(keyword));

    if (index !== -1) {
        const total = cardData.length;
        const angleStep = 360 / total;
        const targetRotation = -(index * angleStep); // 計算需要轉動的角度

        // 旋轉輪播到該卡片位置
        carousel.style.transform = `rotateY(${targetRotation}deg)`;

        // 移除所有發光效果並在目標卡片加上
        document.querySelectorAll('.card').forEach(c => c.classList.remove('highlight'));
        setTimeout(() => {
            document.getElementById(`card-${index}`).classList.add('highlight');
        }, 800);
    } else {
        alert("找不到相關髮妝品！");
    }
}

// 支援左右滑動旋轉
let currentY = 0;
window.addEventListener('mousedown', (e) => {
    let startX = e.pageX;
    const onMouseMove = (ev) => {
        let moveX = ev.pageX - startX;
        carousel.style.transform = `rotateY(${currentY + moveX * 0.2}deg)`;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', (ev) => {
        currentY += (ev.pageX - startX) * 0.2;
        window.removeEventListener('mousemove', onMouseMove);
    }, { once: true });
});

// 初始化
renderCards();