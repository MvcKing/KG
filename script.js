// 已更新為您的新 GAS 連結
const GAS_URL = "https://script.google.com/macros/s/AKfycbxGWU6PQskSbaPTj0jNbmCwlmRlUYbzOwtO7eqVfsXKJrWlGkG-fA_Tqz6TRlBDmkUI/exec";

let cardData = [];
let isDragging = false, startX = 0, currentRotation = 0, tempRotation = 0, lastMoveDistance = 0;
const carousel = document.getElementById('carousel');
const adminPanel = document.getElementById('adminPanel');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

// 圖片處理
function previewImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('imgPreview').src = e.target.result;
            document.getElementById('previewWrapper').style.display = 'block';
            document.getElementById('uploadPlaceholder').style.display = 'none';
            document.getElementById('cardImgBase64').value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// 資料讀取
async function fetchCards() {
    try {
        const res = await fetch(GAS_URL);
        cardData = await res.json();
        renderCards();
    } catch (err) { console.error("Fetch Error"); }
}

// 資料儲存
async function saveCard() {
    const index = parseInt(document.getElementById('editIndex').value);
    const name = document.getElementById('cardName').value.trim();
    const price = document.getElementById('cardPrice').value.trim();
    const desc = document.getElementById('cardBack').value.trim();
    const imgData = document.getElementById('cardImgBase64').value;

    if (!name || !price || !imgData) return alert("資訊不完整");

    const btn = document.getElementById('saveBtn');
    btn.innerText = "上傳中..."; btn.disabled = true;

    try {
        await fetch(GAS_URL, { method: "POST", body: JSON.stringify({ action: "save", index, name, price, img: imgData, desc }) });
        await fetchCards();
        toggleAdmin(false);
    } catch (err) { alert("儲存失敗"); }
    finally { btn.innerText = "確認儲存"; btn.disabled = false; }
}

// 渲染卡片
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
                        <div style="font-weight:bold;">$${item.price}</div>
                        <p style="font-size:12px; color:#ccc; overflow-y:auto; margin-top:5px; white-space:pre-wrap;">${item.desc}</p>
                    </div>
                </div>
            </div>`;
        carousel.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// 介面與事件
function toggleAdmin(isOpen) { adminPanel.classList.toggle('active', isOpen); overlay.style.display = isOpen ? 'block' : 'none'; }
function toggleSidebar(isOpen) { sidebar.classList.toggle('open', isOpen); overlay.style.display = isOpen ? 'block' : 'none'; }
function closeAllPanels() { toggleSidebar(false); toggleAdmin(false); }

function openEditMode(index) {
    const item = cardData[index];
    document.getElementById('panelTitle').innerText = "編輯產品";
    document.getElementById('editIndex').value = index;
    document.getElementById('cardName').value = item.name;
    document.getElementById('cardPrice').value = item.price;
    document.getElementById('cardBack').value = item.desc;
    document.getElementById('cardImgBase64').value = item.img;
    document.getElementById('imgPreview').src = item.img;
    document.getElementById('previewWrapper').style.display = 'block';
    document.getElementById('uploadPlaceholder').style.display = 'none';
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
    toggleAdmin(true);
}

function handleStart(e) { 
    if (adminPanel.classList.contains('active')) return;
    isDragging = true; lastMoveDistance = 0; 
    startX = e.type.includes('touch') ? e.touches[0].pageX : e.pageX; 
    carousel.style.transition = 'none'; 
}
function handleMove(e) { 
    if (!isDragging) return; 
    const x = e.type.includes('touch') ? e.touches[0].pageX : e.pageX; 
    const dist = x - startX; lastMoveDistance = Math.abs(dist); 
    tempRotation = currentRotation + dist * 0.3; 
    carousel.style.transform = `rotateY(${tempRotation}deg)`; 
}
function handleEnd() { 
    if (!isDragging) return; isDragging = false; 
    currentRotation = tempRotation; carousel.style.transition = 'transform 0.8s'; 
}
function handleCardClick(e, el) { if (lastMoveDistance < 5) el.classList.toggle('is-flipped'); }

function startVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition(); rec.lang = 'zh-TW';
    rec.onstart = () => document.getElementById('voiceBtn').classList.add('recording');
    rec.onresult = (e) => { document.getElementById('searchInput').value = e.results[0][0].transcript; searchCard(); };
    rec.onend = () => document.getElementById('voiceBtn').classList.remove('recording');
    rec.start();
}

function searchCard() {
    const key = document.getElementById('searchInput').value.trim().toLowerCase();
    const idx = cardData.findIndex(d => d.name.toLowerCase().includes(key));
    if (idx !== -1) {
        currentRotation = -(idx * (360 / cardData.length));
        carousel.style.transform = `rotateY(${currentRotation}deg)`;
    }
}

window.addEventListener('touchstart', handleStart, {passive:false});
window.addEventListener('touchmove', handleMove, {passive:false});
window.addEventListener('touchend', handleEnd);
window.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);

fetchCards();