// app.js
App({
  onLaunch() {
    try {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    } catch (e) {
      console.error('存储操作失败：', e)
    }

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
      fail: err => {
        console.error('登录失败：', err)
      }
    })
  },
  globalData: {
    userInfo: null
  }
})
