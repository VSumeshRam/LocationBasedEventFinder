require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');

const MONGO_URI = process.env.MONGO_URI;

const updates = [
  {
    regex: /varaal house/i,
    newTitle: "Sapphire Convention Center",
    newAddress: "Downtown Business District"
  },
  {
    regex: /joC house/i,
    newTitle: "Oasis Events Pavilion",
    newAddress: "Riverside Promenade"
  },
  {
    regex: /bas6th/i,
    newTitle: "Tech Innovation Hub",
    newAddress: "Silicon Park Avenue"
  }
];

async function updateSpecificNames() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const events = await Event.find();
    let updatedCount = 0;

    for (const event of events) {
      for (const update of updates) {
        if (update.regex.test(event.title) || update.regex.test(event.location.address)) {
          console.log(`Matched: ${event.title} (${event.location.address}) with ${update.regex}`);
          event.title = update.newTitle;
          event.location.address = update.newAddress;
          await event.save();
          console.log(` -> Updated to: ${event.title} at ${event.location.address}`);
          updatedCount++;
          break;
        }
      }
    }

    console.log(`Finished! Updated ${updatedCount} events.`);
    process.exit(0);
  } catch (err) {
    console.error("Error updating names:", err);
    process.exit(1);
  }
}

updateSpecificNames();
