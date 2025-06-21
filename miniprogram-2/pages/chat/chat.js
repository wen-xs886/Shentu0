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
  }
}); 