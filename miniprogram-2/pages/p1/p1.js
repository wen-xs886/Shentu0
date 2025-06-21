Page({
  data: {
    selected: null,
    hasChosen: false,
    showIntro: false,
    touchStartY: 0,
    circleExpanding: false
  },
  selectRole(e) {
    const role = e.currentTarget.dataset.role;
    if (this.data.selected === role) return;
    this.setData({ showIntro: false });
    setTimeout(() => {
      this.setData({ selected: role, hasChosen: true, showIntro: true });
    }, 50);
    
    // 显示选择提示
    wx.showToast({
      title: role === 'sikoulan' ? '已选择兰斩' : '已选择清蓉',
      icon: 'success',
      duration: 1000
    });
  },
  onTouchStart(e) {
    this.setData({ touchStartY: e.touches[0].clientY });
  },
  onTouchEnd(e) {
    if (!this.data.selected) {
      wx.showToast({
        title: '请先选择角色',
        icon: 'none'
      });
      return;
    }
    
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = this.data.touchStartY - touchEndY;
    
    // 判断上滑（向上滑动距离大于50px）
    if (deltaY > 50 && !this.data.circleExpanding) {
      // 触发圆形向上拉伸动画并立即跳转
      this.setData({ circleExpanding: true });
      
      // 立即跳转页面，不等待动画完成
      wx.navigateTo({
        url: '/pages/chat/chat?role=' + this.data.selected,
        fail: (err) => {
          console.error('页面跳转失败：', err);
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    }
  },
  onLoad() {
    this.setData({ showIntro: false });
  },
  onShow() {
    // 页面显示时重置所有状态到最初
    this.setData({
      selected: null,
      hasChosen: false,
      showIntro: false,
      circleExpanding: false
    });
  }
}); 