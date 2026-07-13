require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

const randomEventsData = [
  {
    title: "Local Food Festival",
    description: "Taste the best local cuisines from top chefs in the district.",
    date: new Date("2026-07-22T10:00:00Z"),
    eventType: "Exhibition",
    location: {
      address: "Thirunakkara Maidan, Kottayam",
      lat: 9.5916,
      lng: 76.5222
    }
  },
  {
    title: "Photography Walk",
    description: "A guided photography walk through the heritage streets. Bring your DSLRs or smartphones!",
    date: new Date("2026-07-16T16:00:00Z"),
    eventType: "Meetup",
    location: {
      address: "Fort Kochi, Ernakulam",
      lat: 9.9816,
      lng: 76.2999
    }
  },
  {
    title: "Kids Painting Competition",
    description: "Annual painting competition for kids under 12. Colors and paper will be provided.",
    date: new Date("2026-07-24T09:30:00Z"),
    eventType: "Workshop",
    location: {
      address: "NSS School Auditorium, Kidangoor",
      lat: 9.6833,
      lng: 76.6000
    }
  },
  {
    title: "Yoga and Meditation Retreat",
    description: "A peaceful morning yoga session to rejuvenate your mind and body.",
    date: new Date("2026-07-27T06:00:00Z"),
    eventType: "Meetup",
    location: {
      address: "Ettumanoor Shiva Temple Ground, Ettumanoor",
      lat: 9.6700,
      lng: 76.5600
    }
  },
  {
    title: "Startup Pitch Night",
    description: "Watch local startups pitch their ideas to investors. Networking dinner to follow.",
    date: new Date("2026-07-29T18:00:00Z"),
    eventType: "Meetup",
    location: {
      address: "Kerala Startup Mission, Ernakulam",
      lat: 9.9816,
      lng: 76.2999
    }
  },
  {
    title: "Ettumanoor Marathon 5K",
    description: "Join the 5K run promoting health and wellness in our town.",
    date: new Date("2026-07-26T05:30:00Z"),
    eventType: "Sports",
    location: {
      address: "Ettumanoor Central Junction, Ettumanoor",
      lat: 9.6700,
      lng: 76.5600
    }
  },
  {
    title: "Classical Music Concert",
    description: "An evening of soulful Indian classical music featuring renowned artists.",
    date: new Date("2026-07-21T19:00:00Z"),
    eventType: "Concert",
    location: {
      address: "Mammen Mappillai Hall, Kottayam",
      lat: 9.5916,
      lng: 76.5222
    }
  },
  {
    title: "Organic Farming Workshop",
    description: "Learn the basics of organic farming and how to set up your own terrace garden.",
    date: new Date("2026-07-30T10:00:00Z"),
    eventType: "Workshop",
    location: {
      address: "Kidangoor Panchayat Hall, Kidangoor",
      lat: 9.6833,
      lng: 76.6000
    }
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    let organizer = await User.findOne();
    if (!organizer) {
      organizer = new User({
        name: "Admin User",
        email: "admin@example.com",
        password: "hashedpassword123",
        role: "admin",
        isApproved: true
      });
      await organizer.save();
    }
    console.log(`Using organizer: ${organizer._id}`);

    const eventsWithOrganizer = randomEventsData.map(event => ({
      ...event,
      organizer: organizer._id
    }));

    await Event.insertMany(eventsWithOrganizer);
    console.log("8 new random events successfully added to the database!");

    process.exit(0);
  } catch (err) {
    console.error("Error inserting events:", err);
    process.exit(1);
  }
}

seed();
