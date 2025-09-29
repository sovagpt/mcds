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
    const twitterUrl = `https://twitter.com/${username}`;
    const siteshotUrl = `https://api.site-shot.com/?url=${encodeURIComponent(twitterUrl)}&userkey=${process.env.SITESHOT_API_KEY}&width=1280&height=1280&response_type=json&delay_time=3000&format=png`;

    const siteshotResponse = await fetch(siteshotUrl);
    
    if (!siteshotResponse.ok) {
      throw new Error('Failed to capture Twitter profile');
    }

    const siteshotData = await siteshotResponse.json();
    const screenshotBase64 = siteshotData.image;

    // Step 2: Crop PFP from screenshot
    // Twitter PFP is typically at these coordinates for a 1280px wide screenshot
    const pfpCropped = await cropImage(screenshotBase64, 48, 48, 133, 133);

    // Step 3: Use Anthropic to analyze and generate responses
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
              text: `This is a screenshot of a Twitter profile for @${username}. Based on what you can see (their name, bio, tweets, etc.), generate a humorous McDonald's job application for them. The context is that crypto/memecoin traders are leaving "the trenches" to work at McDonald's.

Please respond with ONLY a JSON object (no markdown, no extra text) with these fields:
{
  "name": "their display name from profile",
  "bio": "their bio from profile (keep it short, under 100 chars)",
  "position": "a funny position like 'Fry Cook', 'Drive-Thru Specialist', 'Ice Cream Machine Technician', etc",
  "whyMcdonalds": "1-2 sentences about why they want to work here (crypto/degen jokes welcome)",
  "experience": "1-2 sentences about their 'previous experience' (reference their Twitter activity humorously)",
  "skills": "comma-separated list of 3-5 funny skills",
  "startDate": "when they can start (like 'Immediately', 'ASAP', 'Yesterday', etc)",
  "comments": "1-2 sentence light roast from the 'hiring manager' about their profile/tweets"
}

Keep it playful and funny, not mean. Focus on crypto/trading humor if their profile suggests that.`
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
      throw new Error('Failed to parse AI response');
    }

    // Generate random employee ID
    const employeeId = Math.floor(100000 + Math.random() * 900000).toString();

    // Step 4: Return the complete data
    return res.status(200).json({
      pfp: pfpCropped,
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

// Helper function to crop image from base64
async function cropImage(base64Image, x, y, width, height) {
  // Remove data URL prefix if present
  const base64Data = base64Image.includes(',') 
    ? base64Image.split(',')[1] 
    : base64Image;

  // For server-side, we'll use canvas (need to install canvas package)
  // Or we can use sharp library for better performance
  // For now, return a placeholder - you'll need to implement actual cropping
  
  // If using Node canvas:
  const { createCanvas, loadImage } = await import('canvas');
  
  const buffer = Buffer.from(base64Data, 'base64');
  const img = await loadImage(buffer);
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
  
  return canvas.toDataURL('image/png');
}