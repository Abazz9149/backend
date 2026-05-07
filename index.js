const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin with Service Account from Environment Variables
// On Render, add FIREBASE_SERVICE_ACCOUNT as an environment variable
// and paste the entire JSON content of your service account key file.
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
}

// Route: Notify Co-diners about a Bill Split
app.post('/api/notify/bill-split', async (req, res) => {
  const { tokens, amountPerPerson, initiatorName, cafeName } = req.body;

  if (!tokens || tokens.length === 0) return res.status(400).send('No tokens provided');

  const message = {
    notification: {
      title: 'Bill Split Request ☕',
      body: `${initiatorName} requested ₹${amountPerPerson} for your table at ${cafeName}.`,
    },
    tokens: tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    res.status(200).json({ success: true, sentCount: response.successCount });
  } catch (error) {
    console.error('Error sending split notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route: Notify about a new Table Join
app.post('/api/notify/table-join', async (req, res) => {
  const { tokens, newDinerName, cafeName } = req.body;

  if (!tokens || tokens.length === 0) return res.status(400).send('No tokens provided');

  const message = {
    notification: {
      title: 'New Table Mate! 👋',
      body: `${newDinerName} just joined your table at ${cafeName}.`,
    },
    tokens: tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    res.status(200).json({ success: true, sentCount: response.successCount });
  } catch (error) {
    console.error('Error sending join notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route: Notify Cafe Owner about a new Booking
app.post('/api/notify/owner-booking', async (req, res) => {
  const { ownerToken, customerName, tableName, timeSlot } = req.body;

  if (!ownerToken) return res.status(400).send('No owner token provided');

  const message = {
    notification: {
      title: 'New Booking! ☕',
      body: `${customerName} just booked ${tableName} for ${timeSlot}.`,
    },
    token: ownerToken,
  };

  try {
    const response = await admin.messaging().send(message);
    res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    console.error('Error sending owner notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// Basic health check route
app.get('/', (req, res) => res.send('CafeMeet Notification API is Active!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Notification API running on port ${PORT}`));
