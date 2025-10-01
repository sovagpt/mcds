// /api/leaderboard.js
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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const usersRef = db.ref('users');
    const snapshot = await usersRef.orderByChild('referrals').limitToLast(10).once('value');
    
    const leaderboard = [];
    snapshot.forEach((child) => {
      const user = child.val();
      if (user.referrals > 0) {
        leaderboard.push({
          name: user.name,
          referrals: user.referrals,
          employeeId: user.employeeId
        });
      }
    });

    // Sort by referrals descending
    leaderboard.sort((a, b) => b.referrals - a.referrals);

    return res.status(200).json({
      leaderboard: leaderboard,
      total: leaderboard.length
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch leaderboard',
      details: error.message 
    });
  }
};
