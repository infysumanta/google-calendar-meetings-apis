const express = require('express');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const port = 5002;
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI,
);

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
  });
  res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  res.redirect('/create-meeting');
});

app.get('/create-meeting', async (req, res) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const meetingData = {
    summary: 'My Meeting',
    start: {
      dateTime: '2023-05-28T10:00:00',
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: '2023-05-28T11:00:00',
      timeZone: 'Asia/Kolkata',
    },
    attendees: [
      { email: 'kabi.sumanta22@gmail.com' },
      { email: 'sumantablog@gmail.com' },
      { email: 'kabi.paritosh22@gmail.com', optional: true },
    ],
    sendUpdates: 'all',
    visibility: 'public',
  };

  try {
    const meeting = await calendar.events.insert({
      calendarId: 'primary',
      resource: meetingData,
      sendUpdates: 'all',
    });
    res.json({ meeting });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
