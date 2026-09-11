// steam-timeline.js
require('dotenv').config(); // 引入dotenv，解析.env文件
const axios = require('axios');
const https = require('https'); // 引入https模块处理证书验证
const fs = require('fs');
const path = require('path');

// 获取 Steam API Key 和 Steam64 ID（从.env读取）
const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_ID = process.env.STEAM_ID;
console.log('🔍 加载的 Steam API Key：', STEAM_API_KEY);
console.log('🔍 加载的 Steam ID：', STEAM_ID);

// 生成的本地 JSON 文件路径
const JSON_PATH = path.join(__dirname, '../source/_data/steam-timeline.json');

// 执行锁：防止Hexo钩子多次触发重复执行
let isExecuted = false;

// 创建禁用证书验证的代理（解决HTTPS证书报错）
const agent = new https.Agent({  
  rejectUnauthorized: false
});

// 工具函数：分钟转Steam风格小时（保留1位小数，和Steam商店一致）
function convertMinutesToHours(minutes) {
  if (minutes === 0) return '0.0';
  // 分钟转小时，保留1位小数（Steam特有的显示格式）
  return (minutes / 60).toFixed(1);
}

// Hexo 构建前执行：拉取 Steam 最近游玩数据并转换格式
hexo.on('generateBefore', async () => {
  // 执行锁：已执行过则直接返回
  if (isExecuted) {
    return;
  }

  try {
    // 检查环境变量是否配置
    if (!STEAM_API_KEY || !STEAM_ID) {
      throw new Error('❌ STEAM_API_KEY 或 STEAM_ID 未配置，请检查 .env 文件');
    }
    console.log('✅ 成功加载 Steam API Key 和 Steam ID');

    // 1. 调用 Steam 最近游玩API（你指定的接口）
    const res = await axios.get(`https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/`, {
      params: {
        key: STEAM_API_KEY,
        steamid: STEAM_ID,
        format: 'json'
      },
      httpsAgent: agent, // 禁用证书验证
      timeout: 10000 // 10秒超时保护
    });

    // 2. 解析API返回数据（兼容空数据）
    const games = res.data?.response?.games || [];
    console.log(`✅ 拉取到 ${games.length} 款Steam游戏数据`);

    // 3. 转换数据格式（仅保留你需要的3个字段，分钟转小时）
    const timelineData = games.map(game => {
      // 核心转换：分钟转Steam风格小时
      const playtime2Weeks = convertMinutesToHours(game.playtime_2weeks || 0);
      const playtimeForever = convertMinutesToHours(game.playtime_forever || 0);

      return {
        // 标题：游戏名 + 近两周时长 + 总时长（适配timeline渲染）
        title: `${game.name}`,
        // 副标题/详情：近两周+总计时间（单独字段，方便渲染）
        playtime_2weeks: playtime2Weeks,
        playtime_forever: playtimeForever,
        // 创建时间：API无最后游玩时间，用当前时间兜底（不影响排序）
        created_at: new Date().toISOString(),
      };
    });

    // 4. 按近两周游玩时长倒序排序（玩得最多的在前）
    timelineData.sort((a, b) => {
      return parseFloat(b.playtime_2weeks) - parseFloat(a.playtime_2weeks);
    });

    // 5. 生成本地JSON文件
    fs.mkdirSync(path.dirname(JSON_PATH), { recursive: true });
    fs.writeFileSync(JSON_PATH, JSON.stringify(timelineData, null, 2));
    console.log('✅ Steam 时间线数据已生成：', JSON_PATH);

    // 标记为已执行
    isExecuted = true;

  } catch (err) {
    console.error('❌ 拉取 Steam 数据失败：', err.message);
    // 失败时生成空数组，避免页面渲染报错
    fs.writeFileSync(JSON_PATH, JSON.stringify([], null, 2));
    isExecuted = true;
  }
});