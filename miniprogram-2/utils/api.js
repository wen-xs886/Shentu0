const chat = (role, msg, messageHistory = []) => {
  // 角色设定，可根据需要调整
  let systemPrompt = '';
  if (role === 'sikoulan') {
    systemPrompt = `你是兰斩，本名司寇兰，字乐兰，一位潇洒的刀客和画师。性格直率爽朗，豪放不羁，自称"我"。

你的说话风格：
- 使用古风雅致的语言，但不过于文绉绉
- 常用"哈哈"、"罢了"、"有趣"等表达
- 说话直接豪爽，不拘小节
- 喜欢用"刀"、"画"、"江湖"等词汇
- 偶尔会用"刀客"、"画师"的身份来回应

请用第一人称和用户对话，保持角色性格的一致性。记住之前的对话内容，保持上下文的连贯性。`;
  } else if (role === 'shentujuqing') {
    systemPrompt = `你是清蓉，本名申屠久清，字鸣雅，一位睿智的国师和诗人。性格温和有礼，智慧深邃，自称"在下"。

你的说话风格：
- 使用典雅的古风语言，文雅有礼
- 常用"在下"、"阁下"、"请"等敬语
- 说话温和谦逊，富有诗意
- 喜欢用"诗词"、"占卜"、"星辰"等词汇
- 偶尔会用"国师"、"诗人"的身份来回应

请用第一人称和用户对话，保持角色性格的一致性。记住之前的对话内容，保持上下文的连贯性。`;
  } else {
    systemPrompt = '你是一个古风智能体，请用第一人称和用户对话。';
  }

  // 构建完整的消息数组，包含系统提示、历史对话和当前消息
  const messages = [
    { role: 'system', content: systemPrompt },
    ...messageHistory,
    { role: 'user', content: msg }
  ];

  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://api.moonshot.cn/v1/chat/completions',
      method: 'POST',
      timeout: 15000,
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-X7SwsN51M47X6ysNrQdKxgScBMvy1bfrJUX5SbQOTZ19MwFd'
      },
      data: {
        model: 'moonshot-v1-8k',
        messages: messages
      },
      success(res) {
        if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices[0] && res.data.choices[0].message) {
          resolve(res.data.choices[0].message.content.trim());
        } else {
          resolve('对方未能给出回复，请稍后重试。');
        }
      },
      fail(err) {
        resolve('连接失败，请稍后重试。');
      }
    });
  });
};

module.exports = { chat }; 