const GAS_URL = "https://script.google.com/macros/s/AKfycbxGWU6PQskSbaPTj0jNbmCwlmRlUYbzOwtO7eqVfsXKJrWlGkG-fA_Tqz6TRlBDmkUI/exec";

let cardData = [];
let isDragging = false, startX = 0, currentRotation = 0, tempRotation = 0, lastMoveDistance = 0;

// --- 初始化資料 ---
async function fetchCards() {
    try {
        const res = await fetch(GAS_URL);
        cardData = await res.json();
        renderCards();
    } catch (err) { console.error("Fetch Error:", err); }
}

function renderCards() {
    const carousel = document.getElementById('carousel');
    carousel.innerHTML = "";
    if (cardData.length === 0) return;
    
    const angleStep = 360 / cardData.length;
    const radius = Math.max(260, cardData.length * 42);

    cardData.forEach((item, i) => {
        const cardHtml = `
            <div class="card" style="transform: rotateY(${i * angleStep}deg) translateZ(${radius}px)">
                <div class="card-inner" onclick="handleCardClick(event, this)">
                    <div class="front">
                        <img src="${item.img}" loading="lazy">
                        <div class="info-tag">
                            <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</span>
                            <span style="color:#00f2ff; font-weight:bold;">$${item.price}</span>
                        </div>
                    </div>
                    <div class="back">
                        <div class="edit-icon-btn" onclick="stopAndEdit(event, ${i})">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </div>
                        <strong style="color:#00f2ff; display:block; margin-bottom:8px;">${item.name}</strong>
                        <p>${item.desc || '暫無產品介紹'}</p>
                    </div>
                </div>
            </div>`;
        carousel.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// --- 互動修正：防止冒泡 ---
function stopAndEdit(e, index) {
    e.stopPropagation(); // 防止觸發卡片翻轉
    openEditMode(index);
}

// --- 圖片上傳 (優化手機拍照相容) ---
function previewImage(input) {
    const file = input.files[0];
    if (file) {
        document.getElementById('uploadStatus').innerText = "讀取中...";
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target.result;
            document.getElementById('imgPreview').src = result;
            document.getElementById('cardImgBase64').value = result;
            document.getElementById('previewWrapper').style.display = 'block';
            document.getElementById('uploadPlaceholder').style.display = 'none';
            document.getElementById('uploadStatus').innerText = "點擊拍照或選取";
        };
        reader.readAsDataURL(file);
    }
}

// --- 面板控制 ---
function toggleAdmin(isOpen) {
    document.getElementById('adminPanel').classList.toggle('active', isOpen);
    document.getElementById('overlay').style.display = isOpen ? 'block' : 'none';
}

function toggleSidebar(isOpen) {
    document.getElementById('sidebar').classList.toggle('open', isOpen);
    document.getElementById('overlay').style.display = isOpen ? 'block' : 'none';
}

function closeAllPanels() {
    toggleSidebar(false);
    toggleAdmin(false);
}

function openEditMode(index) {
    const item = cardData[index];
    document.getElementById('panelTitle').innerText = "編輯產品資訊";
    document.getElementById('editIndex').value = index;
    document.getElementById('cardName').value = item.name;
    document.getElementById('cardPrice').value = item.price;
    document.getElementById('cardBack').value = item.desc;
    document.getElementById('imgPreview').src = item.img;
    document.getElementById('cardImgBase64').value = item.img;
    document.getElementById('previewWrapper').style.display = 'block';
    document.getElementById('uploadPlaceholder').style.display = 'none';
    document.getElementById('deleteBtn').style.display = 'block';
    toggleAdmin(true);
}

function openAddMode() {
    document.getElementById('panelTitle').innerText = "新增產品資訊";
    document.getElementById('editIndex').value = "-1";
    document.getElementById('cardName').value = "";
    document.getElementById('cardPrice').value = "";
    document.getElementById('cardBack').value = "";
    document.getElementById('imgPreview').src = "";
    document.getElementById('cardImgBase64').value = "";
    document.getElementById('previewWrapper').style.display = 'none';
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('deleteBtn').style.display = 'none';
    toggleAdmin(true);
}

// --- 資料存取 (核心邏輯) ---
async function saveCard() {
    const index = parseInt(document.getElementById('editIndex').value);
    const name = document.getElementById('cardName').value.trim();
    const price = document.getElementById('cardPrice').value.trim();
    const desc = document.getElementById('cardBack').value.trim();
    const img = document.getElementById('cardImgBase64').value;

    if (!name || !price || !img) return alert("請填寫必填欄位並上傳圖片");

    const btn = document.getElementById('saveBtn');
    btn.innerText = "儲存中..."; btn.disabled = true;

    try {
        await fetch(GAS_URL, {
            method: "POST",
            mode: 'no-cors',
            body: JSON.stringify({ action: "save", index, name, price, img, desc })
        });
        setTimeout(() => { location.reload(); }, 1200);
    } catch (err) { alert("儲存異常"); btn.disabled = false; }
}

async function deleteCard() {
    if (!confirm("確定要徹底刪除此產品嗎？")) return;
    const index = parseInt(document.getElementById('editIndex').value);
    
    document.getElementById('deleteBtn').innerText = "刪除中...";
    try {
        await fetch(GAS_URL, {
            method: "POST",
            mode: 'no-cors',
            body: JSON.stringify({ action: "delete", index })
        });
        setTimeout(() => { location.reload(); }, 1200);
    } catch (err) { alert("刪除異常"); }
}

// --- 互動邏輯 (修正版) ---
const carousel = document.getElementById('carousel');
function handleStart(e) {
    if (document.getElementById('adminPanel').classList.contains('active')) return;
    isDragging = true;
    startX = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
    carousel.style.transition = 'none';
    lastMoveDistance = 0;
}
function handleMove(e) {
    if (!isDragging) return;
    const x = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
    const dist = x - startX;
    lastMoveDistance = Math.abs(dist);
    tempRotation = currentRotation + dist * 0.3;
    carousel.style.transform = `rotateY(${tempRotation}deg)`;
}
function handleEnd() {
    if (!isDragging) return;
    isDragging = false;
    currentRotation = tempRotation;
    carousel.style.transition = 'transform 0.7s cubic-bezier(0.2, 0.8, 0.3, 1)';
}
function handleCardClick(e, el) {
    if (lastMoveDistance < 6) el.classList.toggle('is-flipped');
}

// --- 註冊事件 ---
window.addEventListener('touchstart', handleStart, {passive: true});
window.addEventListener('touchmove', handleMove, {passive: true});
window.addEventListener('touchend', handleEnd);
window.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);

function searchCard() {
    const key = document.getElementById('searchInput').value.trim().toLowerCase();
    const idx = cardData.findIndex(d => d.name.toLowerCase().includes(key));
    if (idx !== -1) {
        currentRotation = -(idx * (360 / cardData.length));
        carousel.style.transform = `rotateY(${currentRotation}deg)`;
    }
}

fetchCards();