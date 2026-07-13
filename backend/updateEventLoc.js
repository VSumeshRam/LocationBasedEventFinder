require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');

const MONGO_URI = process.env.MONGO_URI;

async function updateEvent() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const eventTitle = "Startup Pitch Night";
    
    // Find and update the event
    const event = await Event.findOne({ title: eventTitle });
    
    if (event) {
      // Update location to Marine Drive, Ernakulam (very central city spot)
      event.location = {
        address: "Marine Drive Ground, Ernakulam City Center",
        lat: 9.9800,
        lng: 76.2750
      };
      
      await event.save();
      console.log(`Successfully moved '${eventTitle}' to Marine Drive, Ernakulam City Center.`);
    } else {
      console.log(`Event '${eventTitle}' not found.`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Error updating event:", err);
    process.exit(1);
  }
}

updateEvent();
