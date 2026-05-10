const GAS_URL = "https://script.google.com/macros/s/AKfycbxGWU6PQskSbaPTj0jNbmCwlmRlUYbzOwtO7eqVfsXKJrWlGkG-fA_Tqz6TRlBDmkUI/exec";

let cardData = [];
let isDragging = false, startX = 0, currentRotation = 0, tempRotation = 0, lastMoveDistance = 0;

// --- 初始化 ---
window.onload = () => {
    if (/Line/i.test(navigator.userAgent)) {
        document.getElementById('line-guide').style.display = 'flex';
    }
    fetchCards();
    initInteraction();
};

// --- 語音辨識：優化清空內容功能 ---
function startSpeechRecognition(targetId, btnId, clearContent) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("您的瀏覽器不支援語音辨識");

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-TW';
    const btn = document.getElementById(btnId);
    const targetInput = document.getElementById(targetId);

    recognition.onstart = () => {
        btn.classList.add('mic-active');
        // 如果是搜尋列(clearContent為true)，則開始錄音時先清空文字
        if (clearContent) targetInput.value = "";
    };

    recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        // 搜尋列直接賦值，面板規格則累加
        if (clearContent) {
            targetInput.value = text;
            searchCard(); // 自動觸位搜尋
        } else {
            targetInput.value += text;
        }
    };

    recognition.onend = () => {
        btn.classList.remove('mic-active');
    };

    recognition.onerror = () => { btn.classList.remove('mic-active'); };
    recognition.start();
}

// --- 圖片壓縮處理 ---
function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height, max = 800;
                if (w > h && w > max) { h *= max / w; w = max; }
                else if (h > max) { w *= max / h; h = max; }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const compressed = canvas.toDataURL('image/jpeg', 0.7);
                document.getElementById('imgPreview').src = compressed;
                document.getElementById('cardImgBase64').value = compressed;
                document.getElementById('previewWrapper').style.display = 'block';
                document.getElementById('uploadPlaceholder').style.display = 'none';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// --- 旋轉邏輯 (電腦版支援) ---
function initInteraction() {
    const scene = document.getElementById('scene');
    const carousel = document.getElementById('carousel');

    const start = (e) => {
        if (e.target.closest('.panel') || e.target.closest('.header') || e.target.closest('.sidebar')) return;
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

// --- 資料渲染 ---
async function fetchCards() {
    try {
        const res = await fetch(GAS_URL);
        cardData = await res.json();
        renderCards();
    } catch (e) { console.error("資料載入失敗"); }
}

function renderCards() {
    const carousel = document.getElementById('carousel');
    carousel.innerHTML = "";
    if (cardData.length === 0) return;
    const angle = 360 / cardData.length;
    const radius = Math.max(260, cardData.length * 40);

    cardData.forEach((item, i) => {
        const html = `
            <div class="card" style="transform: rotateY(${i * angle}deg) translateZ(${radius}px)">
                <div class="card-inner" onclick="if(lastMoveDistance < 5) this.classList.toggle('is-flipped')">
                    <div class="front">
                        <img src="${item.img}" loading="lazy">
                        <div class="info-tag">
                            <span style="font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;">${item.name}</span>
                            <span class="info-price">$${item.price}</span>
                        </div>
                    </div>
                    <div class="back">
                        <div class="btn-edit-neon" onclick="event.stopPropagation(); openEditMode(${i})">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        </div>
                        <strong style="color:var(--primary); font-size:16px;">${item.name}</strong>
                        <p style="margin-top:10px; overflow-y:auto; height:180px; font-size:13px; color:#ccc;">${item.desc || ''}</p>
                    </div>
                </div>
            </div>`;
        carousel.insertAdjacentHTML('beforeend', html);
    });
}

// --- 面板與側邊欄控制 ---
function toggleAdmin(isOpen) {
    document.getElementById('adminPanel').classList.toggle('active', isOpen);
    document.getElementById('overlay').style.display = isOpen ? 'block' : 'none';
}
function toggleSidebar(isOpen) {
    document.getElementById('sidebar').classList.toggle('open', isOpen);
    document.getElementById('overlay').style.display = isOpen ? 'block' : 'none';
}
function closeAllPanels() { toggleAdmin(false); toggleSidebar(false); }

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
    const name = document.getElementById('cardName').value, img = document.getElementById('cardImgBase64').value;
    if (!name || !img) return alert("名稱與圖片不可為空");
    document.getElementById('saveBtn').innerText = "儲存中...";
    await fetch(GAS_URL, { method: "POST", mode: 'no-cors', body: JSON.stringify({
        action: "save",
        index: parseInt(document.getElementById('editIndex').value),
        name, price: document.getElementById('cardPrice').value, img, desc: document.getElementById('cardBack').value
    })});
    location.reload();
}

async function deleteCard() {
    if (!confirm("確定刪除?")) return;
    await fetch(GAS_URL, { method: "POST", mode: 'no-cors', body: JSON.stringify({
        action: "delete", index: parseInt(document.getElementById('editIndex').value)
    })});
    location.reload();
}

function searchCard() {
    const key = document.getElementById('searchInput').value.trim().toLowerCase();
    const idx = cardData.findIndex(d => d.name.toLowerCase().includes(key));
    if (idx !== -1) {
        currentRotation = -(idx * (360 / cardData.length));
        document.getElementById('carousel').style.transform = `rotateY(${currentRotation}deg)`;
    }
}