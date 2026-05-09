const GAS_URL = "https://script.google.com/macros/s/AKfycbxGWU6PQskSbaPTj0jNbmCwlmRlUYbzOwtO7eqVfsXKJrWlGkG-fA_Tqz6TRlBDmkUI/exec";

let cardData = [];
const carousel = document.getElementById('carousel');
const adminPanel = document.getElementById('adminPanel');
const overlay = document.getElementById('overlay');
const searchInput = document.getElementById('searchInput');

// --- 圖片上傳、預覽與 Base64 轉檔 ---
function previewImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64String = e.target.result;
            document.getElementById('imgPreview').src = base64String;
            document.getElementById('previewWrapper').style.display = 'block';
            document.getElementById('uploadStatus').innerText = "已載入圖片檔案";
            document.getElementById('cardImgBase64').value = base64String;
        };
        reader.readAsDataURL(file);
    }
}

// --- LINE 偵測與引導 ---
function handleLineInApp() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    if (ua.indexOf("Line") > -1) {
        if (ua.indexOf("Android") > -1) {
            window.location.href = "intent://" + window.location.href.replace(/^https?:\/\//, "") + "#Intent;scheme=http;package=com.android.chrome;end";
            setTimeout(() => { document.getElementById('line-guide').style.display = 'block'; }, 2000);
        } else {
            document.getElementById('line-guide').style.display = 'block';
        }
    }
}

// --- GAS 資料存取 ---
async function fetchCards() {
    try {
        const res = await fetch(GAS_URL);
        cardData = await res.json();
        renderCards();
    } catch (err) { console.error("資料載入失敗"); }
}

async function saveCard() {
    const index = parseInt(document.getElementById('editIndex').value);
    const name = document.getElementById('cardName').value.trim();
    const price = document.getElementById('cardPrice').value.trim();
    const desc = document.getElementById('cardBack').value.trim();
    const imgData = document.getElementById('cardImgBase64').value; // 這裡存的是 Base64

    if (!name || !price) return alert("請填寫產品名稱與價格");
    if (!imgData) return alert("請上傳產品圖片");

    const btn = document.getElementById('saveBtn');
    btn.innerText = "資料上傳中...";
    btn.disabled = true;

    try {
        await fetch(GAS_URL, { 
            method: "POST", 
            body: JSON.stringify({ action: "save", index, name, price, img: imgData, desc }) 
        });
        await fetchCards();
        toggleAdmin(false);
    } catch (err) { 
        alert("儲存失敗，可能原因：圖片過大超出 Google Sheets 儲存格上限"); 
    } finally { 
        btn.innerText = "儲存資訊"; 
        btn.disabled = false;
    }
}

// --- 介面操作 ---
function renderCards() {
    carousel.innerHTML = "";
    const total = cardData.length;
    if (total === 0) return;
    const angleStep = 360 / total;
    const radius = Math.max(280, total * 40);

    cardData.forEach((item, i) => {
        const cardHtml = `
            <div class="card" style="transform: rotateY(${i * angleStep}deg) translateZ(${radius}px)">
                <div class="card-inner" onclick="handleCardClick(event, this)">
                    <div class="front">
                        <img src="${item.img}" loading="lazy">
                        <div class="info-tag"><div class="info-name">${item.name}</div><div class="info-price">$${item.price}</div></div>
                    </div>
                    <div class="back">
                        <button style="position:absolute; top:10px; right:10px; background:none; border:1px solid #333; border-radius:50%; color:#888;" onclick="event.stopPropagation(); openEditMode(${i})">⚙️</button>
                        <strong style="color:#00f2ff; font-size:16px;">${item.name}</strong>
                        <div style="font-weight:bold;">$${item.price}</div>
                        <p style="font-size:12px; color:#ccc; white-space:pre-wrap; overflow-y:auto; margin:0;">${item.desc}</p>
                    </div>
                </div>
            </div>`;
        carousel.insertAdjacentHTML('beforeend', cardHtml);
    });
}

function openEditMode(index) {
    const item = cardData[index];
    document.getElementById('editIndex').value = index;
    document.getElementById('cardName').value = item.name;
    document.getElementById('cardPrice').value = item.price;
    document.getElementById('cardBack').value = item.desc;
    document.getElementById('cardImgBase64').value = item.img;
    document.getElementById('imgPreview').src = item.img;
    document.getElementById('previewWrapper').style.display = 'block';
    toggleAdmin(true);
}

function openAddMode() {
    document.getElementById('editIndex').value = "-1";
    document.getElementById('cardName').value = "";
    document.getElementById('cardPrice').value = "";
    document.getElementById('cardBack').value = "";
    document.getElementById('cardImgBase64').value = "";
    document.getElementById('previewWrapper').style.display = 'none';
    document.getElementById('uploadStatus').innerText = "📷 點擊上傳圖片";
    toggleAdmin(true);
}

// 語音搜尋與滑動邏輯
function startVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("請切換瀏覽器以使用語音搜尋");
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-TW';
    recognition.onstart = () => document.getElementById('voiceBtn').classList.add('recording');
    recognition.onresult = (e) => { searchInput.value = e.results[0][0].transcript.replace(/[。\.]$/,""); searchCard(); };
    recognition.onend = () => document.getElementById('voiceBtn').classList.remove('recording');
    recognition.start();
}

function searchCard() {
    const key = searchInput.value.trim().toLowerCase();
    const idx = cardData.findIndex(d => d.name.toLowerCase().includes(key));
    if (idx !== -1) {
        currentRotation = -(idx * (360 / cardData.length));
        carousel.style.transform = `rotateY(${currentRotation}deg)`;
    }
}

let isDragging = false, startX = 0, currentRotation = 0, tempRotation = 0, lastMoveDistance = 0;
function handleStart(e) { if (adminPanel.classList.contains('active')) return; isDragging = true; startX = e.type.includes('touch') ? e.touches[0].pageX : e.pageX; carousel.style.transition = 'none'; }
function handleMove(e) { if (!isDragging) return; const x = e.type.includes('touch') ? e.touches[0].pageX : e.pageX; const dist = x - startX; lastMoveDistance = Math.abs(dist); tempRotation = currentRotation + dist * 0.3; carousel.style.transform = `rotateY(${tempRotation}deg)`; }
function handleEnd() { if (!isDragging) return; isDragging = false; currentRotation = tempRotation; carousel.style.transition = 'transform 0.8s'; }
function handleCardClick(e, el) { if (lastMoveDistance > 10) return; el.classList.toggle('is-flipped'); }

function toggleAdmin(isOpen) { adminPanel.classList.toggle('active', isOpen); overlay.style.display = isOpen ? 'block' : 'none'; }
function toggleSidebar(isOpen) { document.getElementById('sidebar').classList.toggle('open', isOpen); overlay.style.display = isOpen ? 'block' : 'none'; }
overlay.onclick = () => { toggleAdmin(false); toggleSidebar(false); };

window.addEventListener('touchstart', handleStart, {passive:false});
window.addEventListener('touchmove', handleMove, {passive:false});
window.addEventListener('touchend', handleEnd);
window.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);

handleLineInApp();
fetchCards();