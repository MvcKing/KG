const GAS_URL = "https://script.google.com/macros/s/AKfycbxC48rN5uvE2RRuWYz99DKXO-flHV8yHTf6Xpfz3io86jUd0zbqvfKzHrJPiWCmsHQK/exec";

let cardData = [];
let isDragging = false, startX = 0, currentRotation = 0, tempRotation = 0, lastMoveDistance = 0;
const carousel = document.getElementById('carousel');
const adminPanel = document.getElementById('adminPanel');

// --- 圖片處理優化 (確保 Base64 穩定上傳) ---
function previewImage(input) {
    const file = input.files[0];
    const statusText = document.getElementById('uploadStatus');
    if (file) {
        statusText.innerText = "讀取中...";
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target.result;
            document.getElementById('imgPreview').src = data;
            document.getElementById('cardImgBase64').value = data;
            document.getElementById('previewWrapper').style.display = 'block';
            document.getElementById('uploadPlaceholder').style.display = 'none';
            statusText.innerText = "點擊開啟檔案或相機";
        };
        reader.readAsDataURL(file);
    }
}

// --- 資料存取核心 ---
async function fetchCards() {
    try {
        const res = await fetch(GAS_URL);
        cardData = await res.json();
        renderCards();
    } catch (err) { console.error("Fetch Error"); }
}

async function saveCard() {
    const index = parseInt(document.getElementById('editIndex').value);
    const name = document.getElementById('cardName').value.trim();
    const price = document.getElementById('cardPrice').value.trim();
    const desc = document.getElementById('cardBack').value.trim();
    
    // 嚴格獲取預覽圖資料
    const previewImg = document.getElementById('imgPreview');
    const imgData = (previewImg.src && previewImg.src.startsWith('data:image')) ? previewImg.src : "";

    if (!name || !price || !imgData) return alert("資訊填寫不完整 (包含圖片)");

    const btn = document.getElementById('saveBtn');
    btn.innerText = "傳送中..."; btn.disabled = true;

    try {
        await fetch(GAS_URL, { 
            method: "POST", 
            mode: 'no-cors', // 解決 GAS 跨域問題
            body: JSON.stringify({ action: "save", index, name, price, img: imgData, desc }) 
        });
        setTimeout(async () => {
            await fetchCards();
            toggleAdmin(false);
            btn.innerText = "確認儲存"; btn.disabled = false;
        }, 1500);
    } catch (err) { alert("儲存失敗"); btn.disabled = false; }
}

async function deleteCard() {
    const index = parseInt(document.getElementById('editIndex').value);
    if (index === -1) return;
    if (!confirm("確定要刪除此產品嗎？")) return;

    const btn = document.getElementById('deleteBtn');
    btn.innerText = "刪除中..."; btn.disabled = true;

    try {
        await fetch(GAS_URL, { 
            method: "POST", 
            mode: 'no-cors',
            body: JSON.stringify({ action: "delete", index }) 
        });
        setTimeout(async () => {
            await fetchCards();
            toggleAdmin(false);
            btn.innerText = "刪除此產品"; btn.disabled = false;
        }, 1500);
    } catch (err) { alert("刪除失敗"); btn.disabled = false; }
}

// --- 介面渲染與操控 ---
function renderCards() {
    carousel.innerHTML = "";
    if (cardData.length === 0) return;
    const angleStep = 360 / cardData.length;
    const radius = Math.max(280, cardData.length * 45);

    cardData.forEach((item, i) => {
        const cardHtml = `
            <div class="card" style="transform: rotateY(${i * angleStep}deg) translateZ(${radius}px)">
                <div class="card-inner" onclick="handleCardClick(event, this)">
                    <div class="front">
                        <img src="${item.img}" loading="lazy">
                        <div class="info-tag">
                            <div class="info-name">${item.name}</div>
                            <div class="info-price">$${item.price}</div>
                        </div>
                    </div>
                    <div class="back">
                        <button class="btn-edit" onclick="event.stopPropagation(); openEditMode(${i})">
                            <svg viewBox="0 0 24 24" width="18" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        </button>
                        <strong style="color:#00f2ff;">${item.name}</strong>
                        <div>$${item.price}</div>
                        <p style="font-size:12px; color:#ccc; overflow-y:auto; margin-top:5px; white-space:pre-wrap;">${item.desc}</p>
                    </div>
                </div>
            </div>`;
        carousel.insertAdjacentHTML('beforeend', cardHtml);
    });
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

function toggleAdmin(isOpen) { adminPanel.classList.toggle('active', isOpen); document.getElementById('overlay').style.display = isOpen ? 'block' : 'none'; }
function toggleSidebar(isOpen) { document.getElementById('sidebar').classList.toggle('open', isOpen); document.getElementById('overlay').style.display = isOpen ? 'block' : 'none'; }
function closeAllPanels() { toggleSidebar(false); toggleAdmin(false); }

// --- 互動邏輯 ---
function handleStart(e) { if (adminPanel.classList.contains('active')) return; isDragging = true; lastMoveDistance = 0; startX = e.type.includes('touch') ? e.touches[0].pageX : e.pageX; carousel.style.transition = 'none'; }
function handleMove(e) { if (!isDragging) return; const x = e.type.includes('touch') ? e.touches[0].pageX : e.pageX; const dist = x - startX; lastMoveDistance = Math.abs(dist); tempRotation = currentRotation + dist * 0.3; carousel.style.transform = `rotateY(${tempRotation}deg)`; }
function handleEnd() { if (!isDragging) return; isDragging = false; currentRotation = tempRotation; carousel.style.transition = 'transform 0.8s'; }
function handleCardClick(e, el) { if (lastMoveDistance < 5) el.classList.toggle('is-flipped'); }

function searchCard() {
    const key = document.getElementById('searchInput').value.trim().toLowerCase();
    const idx = cardData.findIndex(d => d.name.toLowerCase().includes(key));
    if (idx !== -1) { currentRotation = -(idx * (360 / cardData.length)); carousel.style.transform = `rotateY(${currentRotation}deg)`; }
}

window.addEventListener('touchstart', handleStart, {passive:false});
window.addEventListener('touchmove', handleMove, {passive:false});
window.addEventListener('touchend', handleEnd);
window.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);

fetchCards();