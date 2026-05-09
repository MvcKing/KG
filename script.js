const GAS_URL = "https://script.google.com/macros/s/AKfycbxGWU6PQskSbaPTj0jNbmCwlmRlUYbzOwtO7eqVfsXKJrWlGkG-fA_Tqz6TRlBDmkUI/exec";

let cardData = [];
let isDragging = false, startX = 0, currentRotation = 0, tempRotation = 0, lastMoveDistance = 0;

// --- 初始化與渲染 ---
async function fetchCards() {
    try {
        const res = await fetch(GAS_URL);
        cardData = await res.json();
        renderCards();
    } catch (err) { console.log("Fetch failed"); }
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
                <div class="card-inner" onclick="handleCardClick(event, this)">
                    <div class="front">
                        <img src="${item.img}" loading="lazy">
                        <div class="info-tag">
                            <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</span>
                            <span style="color:var(--primary);">$${item.price}</span>
                        </div>
                    </div>
                    <div class="back">
                        <div class="btn-edit-neon" onclick="event.stopPropagation(); openEditMode(${i})">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </div>
                        <strong style="color:var(--primary);">${item.name}</strong>
                        <p>${item.desc || '無描述'}</p>
                    </div>
                </div>
            </div>`;
        carousel.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// --- 表單功能 ---
function previewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('imgPreview').src = e.target.result;
            document.getElementById('cardImgBase64').value = e.target.result;
            document.getElementById('previewWrapper').style.display = 'block';
            document.getElementById('uploadPlaceholder').style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function openEditMode(index) {
    const item = cardData[index];
    document.getElementById('panelTitle').innerText = "編輯產品";
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
    document.getElementById('panelTitle').innerText = "新增產品";
    document.getElementById('editIndex').value = "-1";
    document.getElementById('cardName').value = "";
    document.getElementById('cardPrice').value = "";
    document.getElementById('cardBack').value = "";
    document.getElementById('imgPreview').src = "";
    document.getElementById('previewWrapper').style.display = 'none';
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('deleteBtn').style.display = 'none';
    toggleAdmin(true);
}

// --- 資料傳送 ---
async function saveCard() {
    const index = parseInt(document.getElementById('editIndex').value);
    const name = document.getElementById('cardName').value;
    const price = document.getElementById('cardPrice').value;
    const desc = document.getElementById('cardBack').value;
    const img = document.getElementById('cardImgBase64').value;

    if (!name || !img) return alert("名稱與圖片為必填");
    
    document.getElementById('saveBtn').innerText = "傳送中...";
    await fetch(GAS_URL, {
        method: "POST", mode: 'no-cors',
        body: JSON.stringify({ action: "save", index, name, price, img, desc })
    });
    location.reload();
}

async function deleteCard() {
    if (!confirm("確定刪除？")) return;
    const index = parseInt(document.getElementById('editIndex').value);
    await fetch(GAS_URL, {
        method: "POST", mode: 'no-cors',
        body: JSON.stringify({ action: "delete", index })
    });
    location.reload();
}

// --- 控制與動畫 ---
function toggleAdmin(isOpen) { 
    document.getElementById('adminPanel').classList.toggle('active', isOpen);
    document.getElementById('overlay').style.display = isOpen ? 'block' : 'none';
}
function toggleSidebar(isOpen) {
    document.getElementById('sidebar').classList.toggle('open', isOpen);
    document.getElementById('overlay').style.display = isOpen ? 'block' : 'none';
}
function closeAllPanels() { toggleAdmin(false); toggleSidebar(false); }

function handleCardClick(e, el) { if (lastMoveDistance < 5) el.classList.toggle('is-flipped'); }

// --- 滑鼠/觸控旋轉 (略, 與前版本一致確保功能穩定) ---
const scene = document.querySelector('.scene');
window.addEventListener('touchstart', e => { if(e.target.closest('.panel')) return; isDragging = true; startX = e.touches[0].pageX; carousel.style.transition='none'; lastMoveDistance=0; });
window.addEventListener('touchmove', e => { if(!isDragging) return; const dist = e.touches[0].pageX - startX; lastMoveDistance = Math.abs(dist); tempRotation = currentRotation + dist * 0.3; carousel.style.transform = `rotateY(${tempRotation}deg)`; });
window.addEventListener('touchend', () => { isDragging = false; currentRotation = tempRotation; carousel.style.transition='transform 0.7s'; });

function searchCard() {
    const key = document.getElementById('searchInput').value.trim().toLowerCase();
    const idx = cardData.findIndex(d => d.name.toLowerCase().includes(key));
    if (idx !== -1) { currentRotation = -(idx * (360 / cardData.length)); carousel.style.transform = `rotateY(${currentRotation}deg)`; }
}

fetchCards();