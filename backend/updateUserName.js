require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected to MongoDB.");
    const result = await User.updateOne({ name: "NASA" }, { $set: { name: "Organisation 1" } });
    console.log("Update result:", result);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
