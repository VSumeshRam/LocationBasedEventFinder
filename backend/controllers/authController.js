const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- REGISTER LOGIC ---
exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        // Note: isApproved defaults to false in the Model, 
        // which is why Garry had to be manually approved in Atlas.
        user = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'Attendee',
            isApproved: role === 'Admin' ? true : false // Only Admins start approved
        });

        await user.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- LOGIN LOGIC ---
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // 1. Find user by email
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // 2. Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // 3. Generate Security Token (JWT)
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // 4. SEND EVERYTHING TO FRONTEND
        // This is the data that localStorage in your browser will save
        res.json({
            token,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,           // <--- Allows App.jsx to show Admin Panel
            isApproved: user.isApproved // <--- Allows Organizers to post
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};