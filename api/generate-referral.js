// /api/generate-referral.js
const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "polymarket-675a5",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    }),
    databaseURL: "https://polymarket-675a5-default-rtdb.firebaseio.com"
  });
}

const db = admin.database();

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, employeeId, referredBy } = req.body;

  if (!name || !employeeId) {
    return res.status(400).json({ error: 'Name and employeeId required' });
  }

  try {
    // Generate unique referral code
    const referralCode = `MC-${employeeId}`;
    
    // Create user entry in database
    const userRef = db.ref(`users/${referralCode}`);
    await userRef.set({
      name: name,
      employeeId: employeeId,
      referralCode: referralCode,
      referrals: 0,
      createdAt: Date.now()
    });

    // If user was referred by someone, increment their referral count
    if (referredBy) {
      const referrerRef = db.ref(`users/${referredBy}`);
      const referrerSnapshot = await referrerRef.once('value');
      
      if (referrerSnapshot.exists()) {
        const currentReferrals = referrerSnapshot.val().referrals || 0;
        await referrerRef.update({
          referrals: currentReferrals + 1
        });
      }
    }

    return res.status(200).json({
      referralCode: referralCode,
      message: 'Referral code generated successfully'
    });

  } catch (error) {
    console.error('Error generating referral:', error);
    return res.status(500).json({ 
      error: 'Failed to generate referral code',
      details: error.message 
    });
  }
};
