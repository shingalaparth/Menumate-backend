const qruser = require('../models/qruser');

const registerUser = async function(req, res){
    try {
        const { username, number } = req.body;

        // Validation
        if (!username || !number) {
            return res.status(400).json({ message: 'Username and number are required' });
        }

        // Create user
        await qruser.create({ username, number });
        console.log('User registered');
        res.status(201).json({ message: 'User registered successfully' });

    } catch (err) { 
        console.error('Error registering user:', err);

        // Handle duplicate key (MongoDB error code 11000)
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Phone number already exists' });
        }

        res.status(500).json({ message: 'Server error' });
    }

};

module.exports = { registerUser };