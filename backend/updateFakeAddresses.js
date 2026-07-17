require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');

const MONGO_URI = process.env.MONGO_URI;

const fakeAddresses = {
  "Kerala Hackathon 2026": "Cyberia Tech Arena, Ernakulam",
  "FIFA Mock Tournament": "Global Goals eStadium, Kottayam",
  "FIFA World Cup Final Streaming": "The Grand Viewing Plaza, Ettumanoor",
  "Kidangoor Badminton Championship": "Smashers Dome, Kidangoor",
  "Local Food Festival": "Flavorville Open Grounds, Kottayam",
  "Photography Walk": "Pixel Hunters Lane, Ernakulam",
  "Kids Painting Competition": "Rainbow Canvas Hall, Kidangoor",
  "Startup Pitch Night": "Innovators Cove, Ernakulam",
  "Ettumanoor Marathon 5K": "Endurance Central, Ettumanoor",
  "Classical Music Concert": "Harmony Grand Theatre, Kottayam",
  "Organic Farming Workshop": "Green Earth Pavilion, Kidangoor",
  "Pala Book Fair": "Literary Legends Center, Pala"
};

async function updateAddresses() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const events = await Event.find();

    for (const event of events) {
      if (fakeAddresses[event.title]) {
        event.location.address = fakeAddresses[event.title];
        await event.save();
        console.log(`Updated address for '${event.title}' to: ${event.location.address}`);
      }
    }

    console.log("All addresses successfully updated to fake names!");
    process.exit(0);
  } catch (err) {
    console.error("Error updating addresses:", err);
    process.exit(1);
  }
}

updateAddresses();
