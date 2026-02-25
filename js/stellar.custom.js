document.addEventListener('DOMContentLoaded', function() {
  const subtitleEl = document.querySelector('.sub.cap');
  if (!subtitleEl) {
    console.error('❌ 未找到目标元素：.sub.cap');
    return;
  }

  // 核心：记录当前显示的文字状态（解决翻转后还原问题）
  let currentText = '欢迎来访'; 
  const originalText = '欢迎来访';
  const hoverText = '祝您愉快';
  let isAnimating = false; // 仅防止动画叠加，不拦截正常触发

  // 统一翻转逻辑：根据当前文字决定切换方向
  function flipText() {
    if (isAnimating) return;
    isAnimating = true;

    // 重置动画（保留你原有的强制重绘逻辑，保证动画触发）
    subtitleEl.classList.remove('flip-animation');
    void subtitleEl.offsetWidth;
    subtitleEl.classList.add('flip-animation');

    // 动画50%时切换文字（和动画严格同步）
    setTimeout(() => {
      currentText = currentText === originalText ? hoverText : originalText;
      subtitleEl.textContent = currentText;
    }, 300);

    // 动画结束后解锁（0.6s动画时长，精准解锁）
    setTimeout(() => {
      subtitleEl.classList.remove('flip-animation');
      isAnimating = false;
    }, 600);
  }

  // 绑定事件：鼠标进入/离开都触发翻转（根据状态自动切换）
  subtitleEl.addEventListener('mouseenter', flipText);
  subtitleEl.addEventListener('mouseleave', flipText);
});