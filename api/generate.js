// /api/generate.js
// Vercel Serverless Function - Updated

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
    // Step 2.5: If URL extraction failed, crop PFP directly from screenshot
if (!profileImageUrl && screenshotBase64) {
  console.log('URL extraction failed, cropping PFP from screenshot...');
  
  try {
    const sharp = require('sharp');
    const screenshotBuffer = Buffer.from(screenshotBase64, 'base64');
    
    // Corrected coordinates to actually capture the circular profile picture
    const croppedBuffer = await sharp(screenshotBuffer)
      .extract({ 
        left: 147, 
        top: 145, 
        width: 115, 
        height: 115 
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

    // Step 2.6: Direct image fetching fallback (from your old code)
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

    // Step 3: Use Anthropic to analyze and generate responses
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
              text: `This is a screenshot of a Twitter profile for @${cleanUsername}. Create a humorous McDonald's job application for them. The humor should be clever and observational, not just crypto buzzwords. Look at their actual tweets, interests, and personality if visible.

If this is an error page, use the username and create something funny but grounded.

Respond with ONLY a JSON object (no markdown) with these fields:
{
  "name": "their display name (or @${cleanUsername})",
  "bio": "short bio from profile or make one (max 100 chars)",
  "position": "a specific funny McDonald's position based on their profile (e.g., 'Overnight McFlurry Machine Operator', 'Senior Drive-Thru Coordinator', 'Ice Cream Machine Crisis Manager')",
  "whyMcdonalds": "1-2 sentences. Be specific and clever, reference their actual interests or activity if you can see it. Don't just say generic crypto stuff. Make it feel personal and funny.",
  "experience": "1-2 sentences about relevant 'previous experience' - tie it to what they actually post about. Be creative and specific, not generic.",
  "skills": "4-5 specific, funny skills based on their profile. Avoid generic buzzwords. Think: 'Can operate under pressure of 200 unread Discord notifications', not 'multitasking'",
  "startDate": "creative answer like 'Immediately', 'After my Twitter break', 'Once the group chat stops pinging', etc",
  "comments": "1-2 sentences. The hiring manager's dry, witty observation. Be clever, not mean. Reference something specific if you can."
}

IMPORTANT: Be funny through specificity and cleverness, not through listing buzzwords or being generic. Read their actual profile if visible and reference real things about them.`
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
      
      // If AI couldn't parse the profile, create a generic funny application
      applicationData = {
        name: `@${cleanUsername}`,
        bio: 'Crypto trader turned fast food professional',
        position: 'Fry Cook',
        whyMcdonalds: 'The charts went down, so I had to pivot. At least the fryers are always hot.',
        experience: 'Extensive experience monitoring volatile assets and making quick decisions under pressure. Familiar with working the night shift.',
        skills: 'Multitasking, customer service, dealing with high-stress situations, accepting defeat gracefully',
        startDate: 'Immediately',
        comments: 'Applicant seems eager to leave their previous line of work. Shows promise.'
      };
    }

    // Generate random employee ID
    const employeeId = Math.floor(100000 + Math.random() * 900000).toString();

    // Step 4: Return the complete data
    return res.status(200).json({
      screenshot: screenshotDataUrl, // Full screenshot for debugging
      profileImageUrl: profileImageUrl, // Extracted profile image URL
      name: applicationData.name || cleanUsername,
      bio: applicationData.bio || 'Twitter User',
      position: applicationData.position || 'Crew Member',
      whyMcdonalds: applicationData.whyMcdonalds || 'Looking for a stable career path.',
      experience: applicationData.experience || 'Various digital ventures.',
      skills: applicationData.skills || 'Customer service, multitasking, food preparation',
      startDate: applicationData.startDate || 'Immediately',
      comments: applicationData.comments || 'Shows great potential.',
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





