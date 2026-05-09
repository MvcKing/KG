const GAS_URL = "https://script.google.com/macros/s/AKfycbxGWU6PQskSbaPTj0jNbmCwlmRlUYbzOwtO7eqVfsXKJrWlGkG-fA_Tqz6TRlBDmkUI/exec";

let cardData = [];
let isDragging = false;
let startX = 0;
let currentRotation = 0;
let tempRotation = 0;
let lastMoveDistance = 0;

// --- 初始化 ---
window.onload = () => {
    if (/Line/i.test(navigator.userAgent)) {
        document.getElementById('line-guide').style.display = 'flex';
    }
    fetchCards();
    setupInteraction(); // 啟動滑動監聽
};

// --- 旋轉互動邏輯 (電腦 + 手機) ---
function setupInteraction() {
    const scene = document.getElementById('scene');
    const carousel = document.getElementById('carousel');

    const handleStart = (e) => {
        if (e.target.closest('.panel') || e.target.closest('.header') || e.target.closest('.sidebar')) return;
        isDragging = true;
        startX = e.pageX || e.touches[0].pageX;
        carousel.style.transition = 'none';
        lastMoveDistance = 0;
    };

    const handleMove = (e) => {
        if (!isDragging) return;
        const x = e.pageX || e.touches[0].pageX;
        const dist = x - startX;
        lastMoveDistance = Math.abs(dist);
        tempRotation = currentRotation + dist * 0.3;
        carousel.style.transform = `rotateY(${tempRotation}deg)`;
    };

    const handleEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        currentRotation = tempRotation;
        carousel.style.transition = 'transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)';
    };

    // 電腦版
    scene.addEventListener('mousedown', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    // 手機版
    scene.addEventListener('touchstart', handleStart);
    window.addEventListener('touchmove', handleMove);
    scene.addEventListener('touchend', handleEnd);
}

// --- 圖片處理：自動壓縮 ---
function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const max_size = 800; // 限制最大長邊為 800px

                if (width > height) {
                    if (width > max_size) { height *= max_size / width; width = max_size; }
                } else {
                    if (height > max_size) { width *= max_size / height; height = max_size; }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // 轉為 JPEG 並設定品質 0.7 (大幅縮小容量)
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                
                document.getElementById('imgPreview').src = compressedBase64;
                document.getElementById('cardImgBase64').value = compressedBase64;
                document.getElementById('previewWrapper').style.display = 'block';
                document.getElementById('uploadPlaceholder').style.display = 'none';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// --- 語音辨識整合 ---
function startSpeechRecognition(targetId) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("您的瀏覽器不支援語音功能，請切換至 Chrome/Safari");
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-TW';
    recognition.onresult = (e) => {
        const resultText = e.results[0][0].transcript;
        document.getElementById(targetId).value += resultText;
        if (targetId === 'searchInput') searchCard();
    };
    recognition.start();
}

// --- 資料傳輸與渲染 ---
async function fetchCards() {
    try {
        const res = await fetch(GAS_URL);
        cardData = await res.json();
        renderCards();
    } catch (err) { console.error("無法載入資料"); }
}

function renderCards() {
    const carousel = document.getElementById('carousel');
    carousel.innerHTML = "";
    if (cardData.length === 0) return;

    const angleStep = 360 / cardData.length;
    const radius = Math.max(260, cardData.length * 40);

    cardData.forEach((item, i) => {
        const cardHtml = `
            <div class="card" style="transform: rotateY(${i * angleStep}deg) translateZ(${radius}px)">
                <div class="card-inner" onclick="if(lastMoveDistance < 5) this.classList.toggle('is-flipped')">
                    <div class="front">
                        <img src="${item.img}" loading="lazy">
                        <div class="info-tag">
                            <span style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.name}</span>
                            <span style="color:var(--primary);">$${item.price}</span>
                        </div>
                    </div>
                    <div class="back">
                        <div class="btn-edit-neon" onclick="event.stopPropagation(); openEditMode(${i})">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        </div>
                        <strong style="color:var(--primary); padding:10px; display:block;">${item.name}</strong>
                        <p style="padding:0 15px; font-size:13px; color:#ccc; overflow-y:auto; height:180px;">${item.desc || '無描述'}</p>
                    </div>
                </div>
            </div>`;
        carousel.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// --- 面板控制 ---
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
    if (!name || !img) return alert("請填寫產品名稱並上傳圖片");

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.innerText = "正在儲存並同步...";
    saveBtn.disabled = true;

    await fetch(GAS_URL, { method: "POST", mode: 'no-cors', body: JSON.stringify({
        action: "save",
        index: parseInt(document.getElementById('editIndex').value),
        name, price: document.getElementById('cardPrice').value, img, desc: document.getElementById('cardBack').value
    })});
    location.reload();
}

async function deleteCard() {
    if (!confirm("確定要刪除這項產品嗎？")) return;
    await fetch(GAS_URL, { method: "POST", mode: 'no-cors', body: JSON.stringify({
        action: "delete", index: parseInt(document.getElementById('editIndex').value)
    })});
    location.reload();
}

// --- 側邊欄與搜尋 ---
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