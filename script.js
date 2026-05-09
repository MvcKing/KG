// 如果你想要增加點擊卡片旋轉或手動拖拽的功能，可以在這裡擴充
const carousel = document.getElementById('carousel');

// 範例：點擊畫面任何地方時，切換自動旋轉狀態 (選用)
document.body.addEventListener('click', () => {
    const isPaused = getComputedStyle(carousel).animationPlayState === 'paused';
    carousel.style.animationPlayState = isPaused ? 'running' : 'paused';
});

// 提示：若要開發「拖動旋轉」功能，需要更複雜的 MouseEvent 監聽，
// 目前的 CSS 動畫已能達成影片中的無限自動旋轉效果。
console.log("3D Carousel 載入成功！");