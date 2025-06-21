const api = require('../../utils/api.js');
Page({
  data: {
    role: 'sikoulan',
    messages: [],
    input: '',
    roleAvatar: '',
    userAvatar: '',
    loading: false,
    scrollToView: '',
    showRoleModal: false
  },
  onLoad(options) {
    // 设置角色头像
    let roleAvatar = '';
    if (options.role === 'sikoulan') {
      roleAvatar = '/images/role1.jpg';
    } else {
      roleAvatar = '/images/role2.jpg';
    }
    this.setData({ role: options.role, roleAvatar });

    // 获取微信头像
    wx.getUserProfile({
      desc: '用于展示用户头像',
      success: res => {
        // 只用https头像，否则用默认头像
        const avatar = res.userInfo.avatarUrl && res.userInfo.avatarUrl.startsWith('https')
          ? res.userInfo.avatarUrl
          : '/images/user.jpg';
        this.setData({
          userAvatar: avatar
        });
      },
      fail: () => {
        this.setData({
          userAvatar: '/images/user.jpg'
        });
      }
    });
  },
  onInput(e) {
    this.setData({ input: e.detail.value });
  },
  sendMsg() {
    const msg = this.data.input.trim();
    if (!msg || this.data.loading) return;
    
    // 立即显示用户消息和AI占位
    const newMsgs = [
      ...this.data.messages,
      { from: 'user', content: msg },
      { from: 'bot', content: '对方正在撰写回复...' }
    ];
    this.setData({
      messages: newMsgs,
      input: '',
      loading: true
    }, this.scrollToBottom);
    
    // 构建对话历史，转换为API需要的格式
    const messageHistory = this.data.messages.map(item => ({
      role: item.from === 'user' ? 'user' : 'assistant',
      content: item.content
    }));
    
    // 请求AI，传递对话历史
    api.chat(this.data.role, msg, messageHistory).then(res => {
      const msgs = this.data.messages;
      msgs[msgs.length - 1] = { from: 'bot', content: res };
      this.setData({ messages: msgs, loading: false }, this.scrollToBottom);
      // 失败友好提示
      if (res.indexOf('连接失败') !== -1 || res.indexOf('未能给出回复') !== -1) {
        wx.showToast({ title: res, icon: 'none' });
      }
    });
  },
  scrollToBottom() {
    this.setData({ scrollToView: 'msg-bottom' });
  },
  // 显示角色简介
  showRoleInfo() {
    this.setData({ showRoleModal: true });
  },
  // 隐藏角色简介
  hideRoleInfo() {
    this.setData({ showRoleModal: false });
  },
  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  },
  // 导出聊天记录
  exportChatRecord() {
    if (this.data.messages.length === 0) {
      wx.showToast({
        title: '暂无聊天记录',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '正在导出...'
    });

    // 使用微信小程序的截图API
    wx.createSelectorQuery()
      .select('.chat-bg')
      .boundingClientRect((rect) => {
        if (!rect) {
          wx.hideLoading();
          wx.showToast({
            title: '导出失败',
            icon: 'none'
          });
          return;
        }

        // 计算需要分几页
        this.calculatePages(rect);
      })
      .exec();
  },

  // 计算需要分几页
  calculatePages(rect) {
    const messages = this.data.messages;
    const maxHeight = rect.height * 2 - 200; // 减去标题和日期的空间
    const lineHeight = 40;
    const padding = 20;
    const messageSpacing = 20;
    
    let currentHeight = 0;
    let currentPageMessages = [];
    const pages = [];
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const text = msg.content;
      const maxWidth = rect.width * 2 - 120;
      
      // 计算文字换行后的行数
      const tempCanvas = wx.createOffscreenCanvas({ type: '2d', width: 100, height: 100 });
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.font = '28px sans-serif';
      const lines = this.wrapText(tempCtx, text, maxWidth);
      
      const bgHeight = lines.length * lineHeight + padding * 2;
      const totalMessageHeight = bgHeight + messageSpacing;
      
      // 检查是否需要新页
      if (currentHeight + totalMessageHeight > maxHeight && currentPageMessages.length > 0) {
        pages.push([...currentPageMessages]);
        currentPageMessages = [];
        currentHeight = 0;
      }
      
      currentPageMessages.push(msg);
      currentHeight += totalMessageHeight;
    }
    
    // 添加最后一页
    if (currentPageMessages.length > 0) {
      pages.push(currentPageMessages);
    }
    
    // 开始导出多页
    this.exportPages(pages, rect, 0);
  },

  // 导出多页图片
  exportPages(pages, rect, currentPageIndex) {
    if (currentPageIndex >= pages.length) {
      wx.hideLoading();
      wx.showToast({
        title: `导出完成，共${pages.length}张图片`,
        icon: 'success',
        duration: 2000
      });
      return;
    }

    const pageMessages = pages[currentPageIndex];
    this.drawChatPage(pageMessages, rect, currentPageIndex + 1, pages.length, () => {
      // 递归导出下一页
      this.exportPages(pages, rect, currentPageIndex + 1);
    });
  },

  // 绘制单页聊天记录
  drawChatPage(messages, rect, pageNum, totalPages, callback) {
    // 创建离屏canvas
    const canvas = wx.createOffscreenCanvas({
      type: '2d',
      width: rect.width * 2,
      height: rect.height * 2
    });
    const ctx = canvas.getContext('2d');

    // 设置背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, rect.height * 2);
    gradient.addColorStop(0, '#FFF9E3');
    gradient.addColorStop(1, '#FFE4B5');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width * 2, rect.height * 2);

    // 绘制标题
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#5a3a29';
    ctx.textAlign = 'center';
    const title = `与${this.data.role === 'sikoulan' ? '兰斩' : '清蓉'}的书信记录`;
    ctx.fillText(title, rect.width, 60);

    // 绘制页码
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#8B7355';
    ctx.textAlign = 'center';
    const pageInfo = `第${pageNum}页 / 共${totalPages}页`;
    ctx.fillText(pageInfo, rect.width, 100);

    // 绘制聊天记录
    let y = 140;
    const maxHeight = rect.height * 2 - 200; // 为日期留出空间
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const isBot = msg.from === 'bot';
      
      // 设置文字样式
      ctx.font = '28px sans-serif';
      ctx.fillStyle = '#5a3a29';
      ctx.textAlign = isBot ? 'left' : 'right';
      
      // 绘制消息背景
      const text = msg.content;
      const maxWidth = rect.width * 2 - 120;
      
      // 文字换行处理
      const lines = this.wrapText(ctx, text, maxWidth);
      const lineHeight = 40;
      const padding = 20;
      const bgHeight = lines.length * lineHeight + padding * 2;
      
      // 检查是否会超出页面底部
      if (y + bgHeight > maxHeight) {
        break; // 停止绘制，避免与日期重叠
      }
      
      // 绘制消息背景
      ctx.fillStyle = isBot ? 'rgba(255, 251, 230, 0.8)' : 'rgba(245, 230, 216, 0.8)';
      const bgWidth = Math.max(...lines.map(line => ctx.measureText(line).width)) + padding * 2;
      const bgX = isBot ? 60 : rect.width * 2 - 60 - bgWidth;
      ctx.fillRect(bgX, y - lineHeight, bgWidth, bgHeight);
      
      // 绘制文字
      ctx.fillStyle = '#5a3a29';
      for (let j = 0; j < lines.length; j++) {
        const lineX = isBot ? 80 : rect.width * 2 - 80;
        ctx.fillText(lines[j], lineX, y + j * lineHeight);
      }
      
      y += bgHeight + 20; // 消息间距
    }

    // 绘制日期
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}年${month}月${day}日`;
    
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#8B7355';
    ctx.textAlign = 'center';
    ctx.fillText(dateStr, rect.width, rect.height * 2 - 40);

    // 导出为图片
    wx.canvasToTempFilePath({
      canvas: canvas,
      success: (res) => {
        // 保存到相册
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            console.log(`第${pageNum}页导出成功`);
            callback(); // 继续导出下一页
          },
          fail: (err) => {
            console.error('保存失败：', err);
            if (err.errMsg.includes('auth deny')) {
              wx.showModal({
                title: '提示',
                content: '需要您授权保存到相册',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.openSetting();
                  }
                }
              });
            } else {
              wx.showToast({
                title: '保存失败',
                icon: 'none'
              });
            }
            callback(); // 即使失败也继续下一页
          }
        });
      },
      fail: (err) => {
        console.error('导出失败：', err);
        wx.showToast({
          title: '导出失败',
          icon: 'none'
        });
        callback(); // 即使失败也继续下一页
      }
    });
  },

  // 文字换行处理
  wrapText(ctx, text, maxWidth) {
    const words = text.split('');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i];
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine !== '') {
      lines.push(currentLine);
    }
    
    return lines;
  }
}); 