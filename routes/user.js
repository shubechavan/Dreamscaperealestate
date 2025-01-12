const express = require("express");
const userMiddleware = require("../middlewares/user");
const { User, Property } = require("../db");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const sendEmail = require('../services/mailer');  

const getSignupMessage = (username) => {
    return `Dear ${username},

Thank you for signing up to Dreamscape Realty. We're thrilled to have you with us! 
Start exploring a wide variety of properties and find your dream home today.

If you have any questions, feel free to reach out to our support team at support@dreamscaperealty.com.

Best regards,
The Dreamscape Team`;
};

const getPurchaseMessage = (username, PropertyId) => {
    return `Dear ${username},

Thank you for purchasing a property on Dreamscape Realty. Your property purchase (ID: ${PropertyId}) has been confirmed. 
We wish you the best of luck with your new property, and we're here to assist you with anything you need.

You can view your purchased properties in your dashboard.

Best regards,
The Dreamscape Team`;
};

// User Routes
router.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
        await User.create({ username, password });
        
        // Send welcome email
        const subject = "Welcome to Dreamscape Realty!";
<<<<<<< HEAD
        const message = `Dear ${username},\n\nThank you for signing up to Dreamscape Realty.\nWe're excited to have you onboard!\n\nBest Regards,\nThe Dreamscape Team`;
        await sendEmail(username, subject, message);  
=======
        const message = getSignupMessage(username);  // Use helper function to generate the message
        await sendEmail(username, subject, message);  // Send email to user
>>>>>>> b7c871b (Initial commit - added task master files)

        res.json({ msg: "User signup successful. Welcome email sent!" });
    } catch (error) {
        res.status(500).json({ msg: "Error during signup", error: error.message });
    }
});

router.post('/signin', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });

    if (user) {
        const token = jwt.sign({ username }, JWT_SECRET);
        res.json({ token });
    } else {
        res.status(401).json({ msg: "Incorrect username or password" });
    }
});

// Fetch all properties
router.get('/property', userMiddleware, async (req, res) => {
    try {
        const properties = await Property.find({});
        res.json({ properties });
    } catch (error) {
        res.status(500).json({ msg: "Error fetching properties", error: error.message });
    }
});

// Purchase a property
router.post('/property/:PropertyId', userMiddleware, async (req, res) => {
    const PropertyId = req.params.PropertyId;
    const username = req.headers.username;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        if (user.purchasedProperties.includes(PropertyId)) {
            return res.status(400).json({ msg: "Property already purchased" });
        }

        // Add property to user's purchasedProperties
        await User.updateOne(
            { username },
            { "$push": { purchasedProperties: PropertyId } }
        );

        // Send purchase confirmation email
        const subject = "Property Purchase Confirmation";
        const message = getPurchaseMessage(username, PropertyId);  // Use helper function to generate the message
        await sendEmail(username, subject, message);  // Send email to user

        res.json({ message: "Purchase complete! Confirmation email sent." });
    } catch (error) {
        res.status(500).json({ msg: "Error occur during property purchase", error: error.message });
    }
});

// Fetch purchased properties
router.get('/purchased-property', userMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.headers.username });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Fetch the properties using the purchasedProperties array
        const properties = await Property.find({
            _id: { $in: user.purchasedProperties }
        });

        res.json({ properties });
    } catch (error) {
        res.status(500).json({ msg: "Error fetching purchased properties", error: error.message });
    }
});

module.exports = router;
