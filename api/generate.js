// /api/generate.js
// Vercel Serverless Function

import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    // Step 1: Get Twitter profile screenshot using Siteshot
    // Using x.com instead of twitter.com and adding more parameters to avoid blocks
    const twitterUrl = `https://x.com/${username}`;
    const userAgent = encodeURIComponent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    const siteshotUrl = `https://api.site-shot.com/?url=${encodeURIComponent(twitterUrl)}&userkey=${process.env.SITESHOT_API_KEY}&width=1280&height=1280&response_type=json&delay_time=5000&format=png&user_agent=${userAgent}&no_cookie_popup=1`;

    const siteshotResponse = await fetch(siteshotUrl);
    
    if (!siteshotResponse.ok) {
      throw new Error('Failed to capture Twitter profile');
    }

    const siteshotData = await siteshotResponse.json();
    const screenshotBase64 = siteshotData.image;

    // Step 2: Use Anthropic to analyze and generate responses
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

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
                data: screenshotBase64.split(',')[1],
              },
            },
            {
              type: 'text',
              text: `This is a screenshot of a Twitter/X profile for @${username}. Based on what you can see (their name, bio, tweets, etc.), generate a humorous McDonald's job application for them. The context is that crypto/memecoin traders are leaving "the trenches" to work at McDonald's.

If this appears to be an error page or you cannot see the profile clearly, just use the username "@${username}" and create a generic but funny crypto-themed McDonald's application.

Please respond with ONLY a JSON object (no markdown, no extra text) with these fields:
{
  "name": "their display name from profile (or @${username} if unclear)",
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
        name: `@${username}`,
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

    // Step 3: Return the complete data including full screenshot for client-side cropping
    return res.status(200).json({
      screenshot: screenshotBase64, // Full screenshot for client-side cropping
      name: applicationData.name || username,
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
}
