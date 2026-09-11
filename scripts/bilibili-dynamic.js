// bilibili-dynamic.js
const axios = require('axios');
const https = require('https'); // 新增：处理HTTPS证书验证
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // 解析.env文件中的环境变量

// 执行锁：防止Hexo钩子多次触发导致重复请求
let isExecuted = false;

// 从环境变量读取B站敏感配置（统一变量名，避免拼写错误）
const BILIBILI_COOKIE = process.env.BILIBILI_COOKIE;
const BILIBILI_API_URL = process.env.BILIBILI_API_URL;
const BILIBILI_UID = process.env.BILIBILI_UID;
// 生成的JSON文件路径（和Steam保持同目录）
const JSON_PATH = path.join(__dirname, '../source/_data/bilibili-dynamic.json');

// 检查必要环境变量是否配置
if (!BILIBILI_COOKIE || !BILIBILI_API_URL) {
  console.error('❌ [B站动态] 请在 .env 文件中配置 BILIBILI_COOKIE 和 BILIBILI_API_URL！');
  // 非强制退出（避免因B站配置缺失导致Hexo整体构建失败）
  // process.exit(1); 
}

// 创建禁用证书验证的代理（解决unable to verify the first certificate错误）
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Hexo构建前执行（替换ready钩子，和Steam脚本保持一致，时机更合适）
hexo.on('generateBefore', async () => {
  // 执行锁：已执行过则直接返回
  if (isExecuted) {
    return;
  }

  // 变量缺失时直接标记为已执行，避免重试
  if (!BILIBILI_COOKIE || !BILIBILI_API_URL) {
    console.warn('⚠️ [B站动态] 环境变量未配置，跳过数据拉取');
    // 生成空JSON文件，避免timeline.js读取时报错
    fs.writeFileSync(JSON_PATH, JSON.stringify([], null, 2));
    isExecuted = true;
    return;
  }

  try {
    console.log('🔍 [B站动态] 开始拉取数据...');
    // 调用B站动态API（带证书兼容+Cookie+UA）
    const res = await axios.get(BILIBILI_API_URL, {
      params: {
        uid: BILIBILI_UID, // 传递UID参数（API需要）
        platform: 'web',
        offset: 0,
        count: 10 // 拉取20条动态（可根据需要调整）
      },
      headers: {
        'Cookie': BILIBILI_COOKIE,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://space.bilibili.com/', // 补充Referer，避免API拦截
        'Accept': 'application/json, text/plain, */*'
      },
      httpsAgent: httpsAgent, // 禁用证书验证
      timeout: 10000 // 10秒超时，避免请求挂起
    });

    // 提取动态数据（兼容API返回结构）
    const dynamics = res.data?.data?.items || [];
    console.log(`✅ [B站动态] 拉取到 ${dynamics.length} 条原始数据`);

    // 转换为timeline.js能解析的格式
    const timelineData = dynamics.map(item => {
      if (!item?.modules?.module_dynamic) return null; // 过滤无效数据

      const dynamicType = item.modules.module_dynamic.type;
      let title = '';
      let link = '';
      let image = '';

      // 按动态类型解析内容
      switch (dynamicType) {
        // 1. 发布视频
        case 'DYNAMIC_TYPE_AV':
          title = `📺 发布了视频《${item.modules.module_dynamic.major.archive.title || '无标题'}》`;
          link = `https://www.bilibili.com/video/${item.modules.module_dynamic.major.archive.bvid || ''}`;
          image = item.modules.module_dynamic.major.archive.cover || '';
          break;
        // 2. 收藏视频
        case 'DYNAMIC_TYPE_FAV_VIDEO':
          title = `⭐ 收藏了视频《${item.modules.module_dynamic.major.archive.title || '无标题'}》`;
          link = `https://www.bilibili.com/video/${item.modules.module_dynamic.major.archive.bvid || ''}`;
          image = item.modules.module_dynamic.major.archive.cover || '';
          break;
        // 3. 点赞视频
        case 'DYNAMIC_TYPE_LIKE_AV':
          title = `👍 点赞了视频《${item.modules.module_dynamic.major.archive.title || '无标题'}》`;
          link = `https://www.bilibili.com/video/${item.modules.module_dynamic.major.archive.bvid || ''}`;
          image = item.modules.module_dynamic.major.archive.cover || '';
          break;
        // 4. 追番
        case 'DYNAMIC_TYPE_BANGUMI':
          title = `📺 追番《${item.modules.module_dynamic.major.bangumi.title || '无标题'}》至第${item.modules.module_dynamic.major.bangumi.episode_index_title || '未知'}话`;
          link = item.modules.module_dynamic.major.bangumi.jump_url || '';
          image = item.modules.module_dynamic.major.bangumi.cover || '';
          break;
        // 5. 发布专栏
        case 'DYNAMIC_TYPE_ARTICLE':
          title = `📝 发布了专栏《${item.modules.module_dynamic.major.article.title || '无标题'}》`;
          link = `https://www.bilibili.com/read/cv${item.modules.module_dynamic.major.article.id || ''}`;
          image = item.modules.module_dynamic.major.article.cover || '';
          break;
        // 6. 发布图片动态
        case 'DYNAMIC_TYPE_DRAW':
          title = `🖼️ 发布了图片动态`;
          link = `https://t.bilibili.com/${item.id_str || ''}`;
          // 取第一张图片作为封面
          if (item.modules.module_dynamic.major.draw_item?.pictures?.length > 0) {
            image = item.modules.module_dynamic.major.draw_item.pictures[0].img_src;
          }
          break;
        // 7. 转发动态
        case 'DYNAMIC_TYPE_REPOST':
          title = `🔄 转发了动态：${item.modules.module_dynamic.major.repost_item?.desc?.text || '无内容'}`;
          link = `https://t.bilibili.com/${item.id_str || ''}`;
          break;
        // 默认：其他类型动态（文字动态等）
        default:
          title = `💬 发布了${item.modules.module_dynamic.desc?.text || '文字动态'}`;
          link = `https://t.bilibili.com/${item.id_str || ''}`;
          break;
      }

      // 时间戳转换（兼容空值）
      const pubTime = item.modules.module_author?.pub_ts || Date.now() / 1000;
      const created_at = new Date(pubTime * 1000).toISOString();

      return {
        title: title,
        created_at: created_at,
        html_url: link,
        image: image
      };
    }).filter(Boolean); // 过滤null值（无效数据）

    // 按发布时间倒序排序
    timelineData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // 确保目录存在，写入JSON文件
    fs.mkdirSync(path.dirname(JSON_PATH), { recursive: true });
    fs.writeFileSync(JSON_PATH, JSON.stringify(timelineData, null, 2));

    console.log(`✅ [B站动态] 数据生成完成：${JSON_PATH}（有效数据${timelineData.length}条）`);
    isExecuted = true; // 标记为已执行

  } catch (err) {
    console.error('❌ [B站动态] 拉取失败：', err.message);
    // 失败时生成空数组，避免timeline.js解析JSON报错
    fs.writeFileSync(JSON_PATH, JSON.stringify([], null, 2));
    isExecuted = true; // 标记为已执行，避免重试
  }
});