const express = require("express");
const { google } = require("googleapis");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = 5002;
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.get("/auth/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.events.readonly",
      "https://www.googleapis.com/auth/calendar.addons.execute",
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
      "email",
    ],
  });
  res.redirect(url);
});

app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  res.redirect("/create-meeting");
});

app.get("/create-meeting", async (req, res) => {
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const meetingData = {
    summary: "My Meeting",
    start: {
      dateTime: "2023-05-31T10:00:00",
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: "2023-05-31T11:00:00",
      timeZone: "Asia/Kolkata",
    },
    attendees: [
      { email: "kabi.sumanta22@gmail.com" },
      { email: "sumantablog@gmail.com" },
      { email: "kabi.paritosh22@gmail.com", optional: true },
    ],

    // conferenceData: {
    //   createRequest: { requestId: uuidv4() },
    // },
    conferenceData: {
      createRequest: {
        requestId: "randomstring", // Use a unique string for each meeting
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
      conferenceSolution: {
        key: {
          type: "hangoutsMeet",
        },
      },
      entryPoints: [
        {
          entryPointType: "video",
          uri: "https://meet.google.com/abcd-efgh-ijkl",
          label: "Google Meet",
        },
      ],
      conferenceId: "abcd-efgh-ijkl",
      conferenceDataVersion: 1,
    },
  };

  try {
    const meeting = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      resource: meetingData,
      sendUpdates: "all",
    });

    const eventId = meeting.data.id;

    console.log(meeting.data.hangoutLink);

    // // Add the Google Meet link to the event description
    const eventUpdate = {
      description: `Please join the meeting using the following link: ${meeting.data.hangoutLink}`,
      sendUpdates: "all",
      visibility: "public",
      sendNotifications: true,
    };

    // const update = await calendar.events.patch({
    //   calendarId: "primary",
    //   eventId: eventId,
    //   resource: eventUpdate,
    //   conferenceDataVersion: 1,
    //   sendUpdates: "all",
    // });

    res.json({ meeting });
  } catch (error) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ error: "Failed to create meeting" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
