const GAS_URL = "https://script.google.com/macros/s/AKfycbxGWU6PQskSbaPTj0jNbmCwlmRlUYbzOwtO7eqVfsXKJrWlGkG-fA_Tqz6TRlBDmkUI/exec";

let cardData = [];
let isDragging = false, startX = 0, currentRotation = 0, tempRotation = 0, lastMoveDistance = 0;

window.onload = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isLine = /Line/i.test(navigator.userAgent);
    if (isMobile && isLine) {
        document.getElementById('line-guide').style.display = 'flex';
    }
    fetchCards();
    setupRotation();
};

// --- 語音辨識：修復變色邏輯與清除功能 ---
function startSpeechRecognition(targetId, btnId, clearFirst) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("您的裝置不支援語音辨識");

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-TW';
    const btn = document.getElementById(btnId);
    const input = document.getElementById(targetId);

    recognition.onstart = () => {
        // 加入紅色激活狀態類名
        btn.classList.add('active-red');
        if (clearFirst) input.value = ""; 
    };

    recognition.onresult = (e) => {
        const result = e.results[0][0].transcript;
        input.value = result;
        if (clearFirst) searchCard(); 
    };

    recognition.onend = () => {
        // 移除紅色狀態，恢復原色
        btn.classList.remove('active-red');
    };
    
    recognition.onerror = () => {
        btn.classList.remove('active-red');
    };

    recognition.start();
}

function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // 優化：將最大邊長縮減至 600px，確保 Base64 字串長度符合 GAS 穩定接收範圍
                let w = img.width, h = img.height, max = 600; 
                if (w > h && w > max) { h *= max / w; w = max; }
                else if (h > max) { w *= max / h; h = max; }
                
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                
                // 優化：調低品質至 0.6，體積會小非常多，但手機瀏覽視覺效果依然清晰
                const base64 = canvas.toDataURL('image/jpeg', 0.6);
                
                document.getElementById('imgPreview').src = base64;
                document.getElementById('cardImgBase64').value = base64;
                document.getElementById('previewWrapper').style.display = 'block';
                document.getElementById('uploadPlaceholder').style.display = 'none';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// --- 3D 旋轉 ---
function setupRotation() {
    const stage = document.getElementById('mainStage');
    const carousel = document.getElementById('carousel3d');

    const start = (e) => {
        if (e.target.closest('.admin-panel') || e.target.closest('.top-nav') || e.target.closest('.side-menu')) return;
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

    stage.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    stage.addEventListener('touchstart', start, {passive: true});
    window.addEventListener('touchmove', move, {passive: true});
    window.addEventListener('touchend', end);
}

async function fetchCards() {
    try {
        const res = await fetch(GAS_URL);
        cardData = await res.json();
        renderCards();
    } catch (e) { console.error("Fetch Error"); }
}

function renderCards() {
    const carousel = document.getElementById('carousel3d');
    carousel.innerHTML = "";
    if (cardData.length === 0) return;
    const angle = 360 / cardData.length;
    const radius = Math.max(260, cardData.length * 45);

    cardData.forEach((item, i) => {
        const html = `
            <div class="card-item" style="transform: rotateY(${i * angle}deg) translateZ(${radius}px)">
                <div class="card-wrapper" onclick="if(lastMoveDistance < 5) this.classList.toggle('is-flipped')">
                    <div class="card-front">
                        <img src="${item.img}" loading="lazy">
                        <div class="card-info-tag">
                            <span style="font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; color:#fff;">${item.name}</span>
                            <span class="tag-price">$${item.price}</span>
                        </div>
                    </div>
                    <div class="card-back">
                        <div class="edit-trigger" onclick="event.stopPropagation(); openEditMode(${i})">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        </div>
                        <strong style="color:var(--neon); font-size:16px;">${item.name}</strong>
                        <p style="margin-top:10px; overflow-y:auto; height:180px; font-size:13px; color:#ccc;">${item.desc || ''}</p>
                    </div>
                </div>
            </div>`;
        carousel.insertAdjacentHTML('beforeend', html);
    });
}

function toggleAdmin(isOpen) {
    document.getElementById('adminPanel').classList.toggle('active', isOpen);
    document.getElementById('globalOverlay').style.display = isOpen ? 'block' : 'none';
}
function toggleSidebar(isOpen) {
    document.getElementById('sideMenu').classList.toggle('open', isOpen);
    document.getElementById('globalOverlay').style.display = isOpen ? 'block' : 'none';
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
    const name = document.getElementById('cardName').value.trim();
    let img = document.getElementById('cardImgBase64').value;
    const price = document.getElementById('cardPrice').value;
    const desc = document.getElementById('cardBack').value;

    // 現在只需確保有「產品名稱」即可建立，其餘皆為選填
    if (!name) {
        alert("請至少輸入「產品名稱」以便識別。");
        return;
    }

    // 若未上傳圖片，給予一個預設的 Placeholder 圖片或空字串，防止系統潰散
    if (!img) {
        img = "https://via.placeholder.com/300x400?text=No+Image"; 
    }

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.innerText = "同步處理中...";
    saveBtn.disabled = true; // 防止重複點擊

    try {
        await fetch(GAS_URL, { 
            method: "POST", 
            mode: 'no-cors', 
            body: JSON.stringify({
                action: "save", 
                index: parseInt(document.getElementById('editIndex').value),
                name: name, 
                price: price || "0", // 若沒填價格預設為 0
                img: img, 
                desc: desc || ""      // 若沒填描述預設為空
            })
        });
        
        // 成功後延遲重新整理
        setTimeout(() => {
            location.reload();
        }, 500);
        
    } catch (error) {
        alert("上傳失敗，請檢查網路或縮小圖檔後再試一次。");
        saveBtn.innerText = "確認儲存同步";
        saveBtn.disabled = false;
    }
}

async function deleteCard() {
    if (!confirm("確定要刪除此產品嗎？")) return;
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
        document.getElementById('carousel3d').style.transform = `rotateY(${currentRotation}deg)`;
    }
}