// /api/generate.js
// Vercel Serverless Function

const Anthropic = require('@anthropic-ai/sdk');

module.exports = async function handler(req, res) {
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
    
    // Step 1: Take screenshot using working parameters
    const siteshotKey = process.env.SITESHOT_API_KEY;
    const screenshotUrl = `https://api.site-shot.com/?url=https://twitter.com/${cleanUsername}&userkey=${siteshotKey}&width=1200&height=1600&format=png&fresh=true`;
    
    console.log(`Requesting screenshot...`);
    
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
              text: `This is a screenshot of a Twitter profile for @${cleanUsername}. Based on what you can see (their name, bio, tweets, etc.), generate a humorous McDonald's job application for them. The context is that crypto/memecoin traders are leaving "the trenches" to work at McDonald's.

If this appears to be an error page or you cannot see the profile clearly, just use the username "@${cleanUsername}" and create a generic but funny crypto-themed McDonald's application.

Please respond with ONLY a JSON object (no markdown, no extra text) with these fields:
{
  "name": "their display name from profile (or @${cleanUsername} if unclear)",
  "bio": "their bio from profile (or make up a crypto trader bio if unclear - keep under 100 chars)",
  "position": "a funny position like 'Fry Cook', 'Drive-Thru Specialist', 'Ice Cream Machine Technician', etc",
  "whyMcdonalds": "1-2 sentences about why they want to work here (crypto/degen jokes)",
  "experience": "1-2 sentences about their 'previous experience' (crypto trading humor)",
  "skills": "comma-separated list of 3-5 funny skills",
  "startDate": "when they can start (like 'Immediately', 'ASAP', 'Yesterday', etc)",
  "comments": "1-2 sentence light roast from the 'hiring manager'"
}

Keep it playful and funny, not mean. Focus on crypto/trading humor.`
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
