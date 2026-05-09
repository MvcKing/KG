let currDegree = 0;
const carousel = document.querySelector(".carousel");

// 如果想手動控制旋轉（例如點擊按鈕或滑動）
function rotateCarousel(direction) {
  if(direction === 'next') {
    currDegree -= 45;
  } else {
    currDegree += 45;
  }
  carousel.style.transform = `rotateY(${currDegree}deg)`;
  // 注意：若要手動控制，需移除 CSS 中的 animation 屬性
}