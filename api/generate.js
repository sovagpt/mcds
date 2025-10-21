// /api/generate.js
// Vercel Serverless Function - Chinese Version

const Anthropic = require('@anthropic-ai/sdk');

module.exports = async function handler(req, res) {
  // Debug endpoint to view screenshot
  if (req.method === 'GET' && req.query.debug === 'screenshot' && req.query.username) {
    const cleanUsername = req.query.username.replace('@', '').toLowerCase();
    const siteshotKey = process.env.SITESHOT_API_KEY;
    const userAgent = encodeURIComponent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    const screenshotUrl = `https://api.site-shot.com/?url=https://twitter.com/${cleanUsername}&userkey=${siteshotKey}&width=1200&height=1600&format=png&fresh=true&user_agent=${userAgent}&delay_time=5000&proxy_rotation=1&no_cookie_popup=1`;
    
    const screenshotResponse = await fetch(screenshotUrl);
    const screenshotBuffer = await screenshotResponse.arrayBuffer();
    
    res.setHeader('Content-Type', 'image/png');
    return res.send(Buffer.from(screenshotBuffer));
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const cleanUsername = username.replace('@', '').toLowerCase();
    console.log(`Processing application for: ${cleanUsername}`);
    
    // Step 1: Take screenshot using working parameters with enhanced bypass
    const siteshotKey = process.env.SITESHOT_API_KEY;
    const userAgent = encodeURIComponent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    const screenshotUrl = `https://api.site-shot.com/?url=https://twitter.com/${cleanUsername}&userkey=${siteshotKey}&width=1200&height=1600&format=png&fresh=true&user_agent=${userAgent}&delay_time=5000&proxy_rotation=1&no_cookie_popup=1`;
    
    console.log(`Requesting screenshot with enhanced parameters...`);
    
    const screenshotResponse = await fetch(screenshotUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!screenshotResponse.ok) {
      throw new Error(`Screenshot failed with status ${screenshotResponse.status}`);
    }
    
    // Convert to base64
    const screenshotBuffer = await screenshotResponse.arrayBuffer();
    const screenshotBase64 = Buffer.from(screenshotBuffer).toString('base64');
    const screenshotDataUrl = `data:image/png;base64,${screenshotBase64}`;
    
    console.log(`Screenshot captured: ${Math.round(screenshotBase64.length / 1024)}KB`);

    // Step 2: Extract profile image URL from screenshot
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    let profileImageUrl = null;
    
    try {
      console.log('Extracting profile image URL from screenshot...');
      const imageExtractMessage = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: screenshotBase64,
              },
            },
            {
              type: 'text',
              text: `Look at this Twitter/X profile screenshot. Find the profile picture URL. Look for URLs containing "pbs.twimg.com" in the page.

Respond with ONLY the direct image URL, nothing else. The URL should be a complete link to the actual image file (like https://pbs.twimg.com/profile_images/123456789/abcdef_400x400.jpg).

If no profile image URL is found, respond with exactly "NONE".`
            }
          ]
        }]
      });
      
      const extractedUrl = imageExtractMessage.content[0].text.trim();
      
      if (extractedUrl !== 'NONE' && extractedUrl.startsWith('http') && extractedUrl.includes('pbs.twimg.com')) {
        profileImageUrl = extractedUrl;
        console.log(`Extracted profile image: ${profileImageUrl}`);
      }
    } catch (e) {
      console.log('Failed to extract profile image:', e.message);
    }

    // Step 2.5: If URL extraction failed, crop PFP directly from screenshot
    if (!profileImageUrl && screenshotBase64) {
      console.log('URL extraction failed, cropping PFP from screenshot...');
      
      try {
        const sharp = require('sharp');
        const screenshotBuffer = Buffer.from(screenshotBase64, 'base64');
        
        // Move significantly up and left to capture the profile picture
        const croppedBuffer = await sharp(screenshotBuffer)
          .extract({ 
            left: 192, 
            top: 205, 
            width: 88,
            height: 88
          })
          .resize(140, 140)
          .toBuffer();
        
        const croppedBase64 = croppedBuffer.toString('base64');
        profileImageUrl = `data:image/png;base64,${croppedBase64}`;
        console.log('Successfully cropped PFP from screenshot');
      } catch (e) {
        console.log('Screenshot cropping failed:', e.message);
        console.error(e);
      }
    }

    // Step 2.6: Direct image fetching fallback
    if (!profileImageUrl) {
      console.log('Trying direct image fetching...');
      
      const imageUrls = [
        `https://unavatar.io/twitter/${cleanUsername}?fallback=false&fresh=true`,
        `https://unavatar.io/x/${cleanUsername}?fallback=false&fresh=true`,
      ];

      for (const imageUrl of imageUrls) {
        try {
          console.log(`Trying: ${imageUrl}`);
          
          const response = await fetch(imageUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'image/webp,image/png,image/jpeg,image/*;q=0.8',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
            profileImageUrl = imageUrl;
            console.log(`Successfully got image from: ${imageUrl}`);
            break;
          }
        } catch (error) {
          console.log(`Failed ${imageUrl}:`, error.message);
          continue;
        }
      }
    }

    // Step 3: Use Anthropic to analyze and generate responses IN CHINESE
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: screenshotBase64,
              },
            },
            {
              type: 'text',
              text: `这是推特用户 @${cleanUsername} 的个人资料截图。请为他们创建一份幽默的麦当劳求职申请。幽默应该是巧妙和观察性的，而不仅仅是加密货币术语。如果可见的话，请查看他们的实际推文、兴趣和个性。

如果这是一个错误页面，请使用用户名并创建一些有趣但实际的内容。

请仅用中文回复一个JSON对象（不要用markdown格式），包含以下字段：
{
  "name": "他们的显示名称（或 @${cleanUsername}）",
  "bio": "个人资料中的简短简介或编造一个（最多50个中文字符）",
  "position": "基于他们个人资料的具体有趣的麦当劳职位（例如：'深夜麦旋风机器操作员'、'得来速高级协调员'、'冰淇淋机危机管理员'）",
  "whyMcdonalds": "1-2句话。要具体和巧妙，如果可以看到的话，引用他们的实际兴趣或活动。不要只说通用的加密货币内容。让它感觉个性化和有趣。用中文表达。",
  "experience": "1-2句话关于相关的'以往经验' - 将其与他们实际发布的内容联系起来。要有创意和具体，而非通用。用中文表达。",
  "skills": "基于他们个人资料的4-5个具体、有趣的技能。避免通用术语。例如：'能在200条未读Discord通知的压力下工作'，而不是'多任务处理'。用中文表达。",
  "startDate": "创意回答，如'立即'、'在我的推特休息之后'、'一旦群聊停止通知'等。用中文表达。",
  "comments": "1-2句话。招聘经理冷静、机智的观察。要巧妙，不要刻薄。如果可以的话，引用一些具体的东西。用中文表达。"
}

重要提示：通过具体性和巧妙性来表达幽默，而不是通过列举术语或泛泛而谈。如果可见的话，阅读他们的实际个人资料并引用关于他们的真实内容。所有回复必须用中文。`
            }
          ],
        },
      ],
    });

    // Parse the AI response
    const aiResponse = message.content[0].text;
    let applicationData;
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        applicationData = JSON.parse(jsonMatch[0]);
      } else {
        applicationData = JSON.parse(aiResponse);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', aiResponse);
      
      // If AI couldn't parse the profile, create a generic funny application in Chinese
      applicationData = {
        name: `@${cleanUsername}`,
        bio: '加密货币交易员转行快餐专业人士',
        position: '薯条厨师',
        whyMcdonalds: '图表下跌了，所以我不得不转行。至少油炸锅总是热的。',
        experience: '在监控波动资产和在压力下快速决策方面有丰富的经验。熟悉夜班工作。',
        skills: '多任务处理、客户服务、处理高压情况、优雅地接受失败',
        startDate: '立即',
        comments: '申请人似乎急于离开之前的工作。显示出潜力。'
      };
    }

    // Generate random employee ID
    const employeeId = Math.floor(100000 + Math.random() * 900000).toString();

    // Step 4: Return the complete data
    return res.status(200).json({
      screenshot: screenshotDataUrl, // Full screenshot for debugging
      profileImageUrl: profileImageUrl, // Extracted profile image URL
      name: applicationData.name || cleanUsername,
      bio: applicationData.bio || '推特用户',
      position: applicationData.position || '员工',
      whyMcdonalds: applicationData.whyMcdonalds || '寻找稳定的职业道路。',
      experience: applicationData.experience || '各种数字领域的经验。',
      skills: applicationData.skills || '客户服务、多任务处理、食品准备',
      startDate: applicationData.startDate || '立即',
      comments: applicationData.comments || '显示出巨大的潜力。',
      employeeId: employeeId
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate application', 
      details: error.message 
    });
  }
};
