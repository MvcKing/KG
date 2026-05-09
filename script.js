const GAS_URL = "https://script.google.com/macros/s/AKfycbxGWU6PQskSbaPTj0jNbmCwlmRlUYbzOwtO7eqVfsXKJrWlGkG-fA_Tqz6TRlBDmkUI/exec";

let cardData = [];
let isDragging = false, startX = 0, currentRotation = 0, tempRotation = 0, lastMoveDistance = 0;

// --- 1. 初始化與偵測 ---
window.onload = () => {
    if (/Line/i.test(navigator.userAgent)) {
        document.getElementById('line-guide').style.display = 'flex';
    }
    fetchCards();
    initRotation();
};

// --- 2. 麥克風變色語音邏輯 ---
function startSpeechRecognition(targetId, btnId) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("瀏覽器不支援語音輸入");

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-TW';
    const btn = document.getElementById(btnId);

    recognition.onstart = () => {
        btn.classList.add('mic-active'); // 圖標變紅並開始呼吸動畫
    };

    recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        document.getElementById(targetId).value += text;
        if (targetId === 'searchInput') searchCard();
    };

    recognition.onend = () => {
        btn.classList.remove('mic-active'); // 錄音結束回復原色
    };

    recognition.onerror = () => { btn.classList.remove('mic-active'); };
    recognition.start();
}

// --- 3. 圖片壓縮處理 ---
function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                const max = 800;
                if (w > h && w > max) { h *= max / w; w = max; }
                else if (h > max) { w *= max / h; h = max; }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const compressedData = canvas.toDataURL('image/jpeg', 0.7);
                document.getElementById('imgPreview').src = compressedData;
                document.getElementById('cardImgBase64').value = compressedData;
                document.getElementById('previewWrapper').style.display = 'block';
                document.getElementById('uploadPlaceholder').style.display = 'none';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// --- 4. 旋轉核心 (電腦+手機) ---
function initRotation() {
    const scene = document.getElementById('scene');
    const carousel = document.getElementById('carousel');

    const start = (e) => {
        if (e.target.closest('.panel') || e.target.closest('.header')) return;
        isDragging = true;
        startX = e.pageX || e.touches[0].pageX;
        carousel.style.transition = 'none';
        lastMoveDistance = 0;
    };
    const move = (e) => {
        if (!isDragging) return;
        const x = e.pageX || e.touches[0].pageX;
        const dist = x - startX;
        lastMoveDistance = Math.abs(dist);
        tempRotation = currentRotation + dist * 0.3;
        carousel.style.transform = `rotateY(${tempRotation}deg)`;
    };
    const end = () => {
        if (!isDragging) return;
        isDragging = false;
        currentRotation = tempRotation;
        carousel.style.transition = 'transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)';
    };

    scene.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    scene.addEventListener('touchstart', start);
    window.addEventListener('touchmove', move);
    window.addEventListener('touchend', end);
}

// --- 5. 渲染與資料 ---
async function fetchCards() {
    try {
        const res = await fetch(GAS_URL);
        cardData = await res.json();
        renderCards();
    } catch (e) { console.error("資料獲取失敗"); }
}

function renderCards() {
    const carousel = document.getElementById('carousel');
    carousel.innerHTML = "";
    if (cardData.length === 0) return;

    const angle = 360 / cardData.length;
    const radius = Math.max(260, cardData.length * 40);

    cardData.forEach((item, i) => {
        const cardHtml = `
            <div class="card" style="transform: rotateY(${i * angle}deg) translateZ(${radius}px)">
                <div class="card-inner" onclick="if(lastMoveDistance < 5) this.classList.toggle('is-flipped')">
                    <div class="front">
                        <img src="${item.img}" loading="lazy">
                        <div class="info-tag">
                            <span class="info-name">${item.name}</span>
                            <span class="info-price">$${item.price}</span>
                        </div>
                    </div>
                    <div class="back">
                        <div class="btn-edit-neon" onclick="event.stopPropagation(); openEditMode(${i})">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        </div>
                        <strong style="color:var(--primary); font-size:16px;">${item.name}</strong>
                        <p style="margin-top:10px; overflow-y:auto; height:180px; font-size:13px; color:#ccc;">${item.desc || '尚無描述'}</p>
                    </div>
                </div>
            </div>`;
        carousel.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// --- 6. UI 控制與儲存 ---
function toggleAdmin(isOpen) {
    document.getElementById('adminPanel').classList.toggle('active', isOpen);
    document.getElementById('overlay').style.display = isOpen ? 'block' : 'none';
}

function openEditMode(i) {
    const d = cardData[i];
    document.getElementById('panelTitle').innerText = "編輯產品";
    document.getElementById('editIndex').value = i;
    document.getElementById('cardName').value = d.name;
    document.getElementById('cardPrice').value = d.price;
    document.getElementById('cardBack').value = d.desc;
    document.getElementById('imgPreview').src = d.img;
    document.getElementById('cardImgBase64').value = d.img;
    document.getElementById('previewWrapper').style.display = 'block';
    document.getElementById('uploadPlaceholder').style.display = 'none';
    document.getElementById('deleteBtn').style.display = 'block';
    toggleAdmin(true);
}

function openAddMode() {
    document.getElementById('panelTitle').innerText = "新增產品";
    document.getElementById('editIndex').value = "-1";
    document.getElementById('cardName').value = "";
    document.getElementById('cardPrice').value = "";
    document.getElementById('cardBack').value = "";
    document.getElementById('cardImgBase64').value = "";
    document.getElementById('previewWrapper').style.display = 'none';
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('deleteBtn').style.display = 'none';
    toggleAdmin(true);
}

async function saveCard() {
    const name = document.getElementById('cardName').value;
    const img = document.getElementById('cardImgBase64').value;
    if (!name || !img) return alert("產品名稱與圖片為必填！");

    const btn = document.getElementById('saveBtn');
    btn.innerText = "同步數據中...";
    btn.disabled = true;

    await fetch(GAS_URL, { method: "POST", mode: 'no-cors', body: JSON.stringify({
        action: "save",
        index: parseInt(document.getElementById('editIndex').value),
        name, price: document.getElementById('cardPrice').value, img, desc: document.getElementById('cardBack').value
    })});
    location.reload();
}

async function deleteCard() {
    if (!confirm("確定要移除此產品嗎？")) return;
    await fetch(GAS_URL, { method: "POST", mode: 'no-cors', body: JSON.stringify({
        action: "delete", index: parseInt(document.getElementById('editIndex').value)
    })});
    location.reload();
}

function toggleSidebar(isOpen) {
    document.getElementById('sidebar').classList.toggle('open', isOpen);
    document.getElementById('overlay').style.display = isOpen ? 'block' : 'none';
}
function closeAllPanels() { toggleAdmin(false); toggleSidebar(false); }

function searchCard() {
    const key = document.getElementById('searchInput').value.trim().toLowerCase();
    const idx = cardData.findIndex(d => d.name.toLowerCase().includes(key));
    if (idx !== -1) {
        currentRotation = -(idx * (360 / cardData.length));
        document.getElementById('carousel').style.transform = `rotateY(${currentRotation}deg)`;
    }
}