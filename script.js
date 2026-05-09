const carousel = document.getElementById('carousel');
const cards = document.querySelectorAll('.card-inner');

let isDragging = false;
let startX;
let currentRotation = 0;
let lastRotation = 0;

// --- 1. 輪播旋轉互動 ---

window.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.pageX;
    carousel.style.transition = 'none'; // 拖動時關閉過渡，達到實時跟隨
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const moveX = e.pageX - startX;
    // 0.2 為旋轉靈敏度，可調整
    currentRotation = lastRotation + moveX * 0.2;
    carousel.style.transform = `rotateY(${currentRotation}deg)`;
});

window.addEventListener('mouseup', () => {
    isDragging = false;
    lastRotation = currentRotation;
    carousel.style.transition = 'transform 0.5s ease-out'; // 放開後平滑回彈感
});

// 觸控支援 (手機)
window.addEventListener('touchstart', (e) => {
    isDragging = true;
    startX = e.touches[0].pageX;
    carousel.style.transition = 'none';
});

window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const moveX = e.touches[0].pageX - startX;
    currentRotation = lastRotation + moveX * 0.2;
    carousel.style.transform = `rotateY(${currentRotation}deg)`;
});

window.addEventListener('touchend', () => {
    isDragging = false;
    lastRotation = currentRotation;
});


// --- 2. 卡片翻面互動 ---

cards.forEach(card => {
    card.addEventListener('click', (e) => {
        // 防止拖動時誤觸發翻面（判斷移動距離極小時才算點擊）
        if (Math.abs(startX - e.pageX) > 5 && e.type === 'mouseup') return;
        
        card.classList.toggle('is-flipped');
    });
});