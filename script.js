const GAS_URL = "https://script.google.com/macros/s/AKfycbxwrP_8z_NfbhTSvcAZThMjoZYGLYxSOFVUikDYWxLo9l0y9DnmNk_J48YOydSIkNIW/exec";

let cardData = [];
const carousel = document.getElementById('carousel');
const adminPanel = document.getElementById('adminPanel');
const overlay = document.getElementById('overlay');
const searchInput = document.getElementById('searchInput');

// --- 1. 資料處理 ---
async function fetchCards() {
    try {
        const response = await fetch(GAS_URL);
        cardData = await response.json();
        renderCards();
    } catch (err) { console.error("載入失敗", err); }
}

async function saveCard() {
    const index = parseInt(document.getElementById('editIndex').value);
    const name = document.getElementById('cardName').value.trim();
    const price = document.getElementById('cardPrice').value.trim();
    const desc = document.getElementById('cardBack').value.trim();
    const imgUrl = document.getElementById('cardImg').value.trim();
    const img = imgUrl || `https://picsum.photos/300/400?random=${Math.random()}`;

    if (!name || !price || !desc) return alert("資訊不完整");

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.innerText = "儲存中...";
    try {
        await fetch(GAS_URL, {
            method: "POST",
            body: JSON.stringify({ action: "save", index, name, price, img, desc })
        });
        await fetchCards();
        toggleAdmin(false);
    } catch (err) { alert("儲存失敗"); }
    finally { saveBtn.innerText = "儲存資訊"; }
}

// --- 2. 語音搜尋與鍵盤監聽 ---
function startVoiceSearch() {
    if (navigator.vibrate) navigator.vibrate(50); // 手機點擊震動回饋

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("瀏覽器不支援語音辨識");

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-TW';
    const voiceBtn = document.getElementById('voiceBtn');

    recognition.onstart = () => {
        voiceBtn.classList.add('recording'); // 立即變紅並發光
        searchInput.placeholder = "正在聆聽...";
    };

    recognition.onresult = (e) => {
        const text = e.results[0][0].transcript.replace(/[。\.]$/, "");
        searchInput.value = text;
        searchCard();
    };

    recognition.onerror = () => { voiceBtn.classList.remove('recording'); };
    recognition.onend = () => { 
        voiceBtn.classList.remove('recording'); 
        searchInput.placeholder = "搜尋產品...";
    };

    recognition.start();
}

searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchCard(); });

function searchCard() {
    document.activeElement.blur(); 
    searchInput.blur();
    const keyword = searchInput.value.trim().toLowerCase();
    if (!keyword) return;

    const index = cardData.findIndex(item => item.name.toLowerCase().includes(keyword));
    if (index !== -1) {
        currentRotation = -(index * (360 / cardData.length));
        carousel.style.transform = `rotateY(${currentRotation}deg)`;
    }
}

// --- 3. UI 渲染 ---
function renderCards() {
    carousel.innerHTML = "";
    const total = cardData.length;
    if (total === 0) return;
    const angleStep = 360 / total;
    const radius = Math.max(300, total * 45);

    cardData.forEach((item, i) => {
        const cardHtml = `
            <div class="card" style="transform: rotateY(${i * angleStep}deg) translateZ(${radius}px)">
                <div class="card-inner" onclick="handleCardClick(event, this)">
                    <div class="front">
                        <img src="${item.img}" alt="p">
                        <div class="info-tag"><div class="info-name">${item.name}</div><div class="info-price">$${item.price}</div></div>
                    </div>
                    <div class="back">
                        <button class="btn-edit" onclick="event.stopPropagation(); openEditMode(${i})">
                            <svg viewBox="0 0 24 24" width="16" fill="#888"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        </button>
                        <strong style="color:#00f2ff;">${item.name}</strong>
                        <div style="color:#00f2ff; margin-bottom:10px;">$${item.price}</div>
                        <p style="font-size:13px; color:#ccc; white-space:pre-wrap; margin:0;">${item.desc}</p>
                    </div>
                </div>
            </div>`;
        carousel.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// --- 4. 旋轉與互動 ---
let isDragging = false, startX = 0, currentRotation = 0, tempRotation = 0, lastMoveDistance = 0;
function handleStart(e) { if (adminPanel.classList.contains('active')) return; isDragging = true; lastMoveDistance = 0; startX = e.type.includes('touch') ? e.touches[0].pageX : e.pageX; carousel.style.transition = 'none'; }
function handleMove(e) { if (!isDragging) return; if (e.cancelable) e.preventDefault(); const x = e.type.includes('touch') ? e.touches[0].pageX : e.pageX; const moveX = x - startX; lastMoveDistance = Math.abs(moveX); tempRotation = currentRotation + moveX * 0.3; carousel.style.transform = `rotateY(${tempRotation}deg)`; }
function handleEnd() { if (!isDragging) return; isDragging = false; currentRotation = tempRotation; carousel.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)'; }
function handleCardClick(e, element) { if (lastMoveDistance > 10) return; element.classList.toggle('is-flipped'); }

function openEditMode(index) {
    const item = cardData[index];
    document.getElementById('panelTitle').innerText = "編輯產品資訊";
    document.getElementById('editIndex').value = index;
    document.getElementById('cardName').value = item.name;
    document.getElementById('cardPrice').value = item.price;
    document.getElementById('cardImg').value = item.img;
    document.getElementById('cardBack').value = item.desc;
    toggleAdmin(true);
}

function openAddMode() {
    document.getElementById('panelTitle').innerText = "新增產品資訊";
    document.getElementById('editIndex').value = "-1";
    document.getElementById('cardName').value = "";
    document.getElementById('cardPrice').value = "";
    document.getElementById('cardImg').value = "";
    document.getElementById('cardBack').value = "";
    toggleAdmin(true);
}

function toggleAdmin(isOpen) { adminPanel.classList.toggle('active', isOpen); overlay.style.display = isOpen ? 'block' : 'none'; }
function toggleSidebar(isOpen) { document.getElementById('sidebar').classList.toggle('open', isOpen); overlay.style.display = isOpen ? 'block' : 'none'; }
overlay.onclick = () => { toggleAdmin(false); toggleSidebar(false); };

window.addEventListener('touchstart', handleStart, { passive: false });
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleEnd, { passive: false });
window.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);

fetchCards();