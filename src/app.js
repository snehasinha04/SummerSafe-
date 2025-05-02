const express = require("express");
const path = require("path");
const exphbs = require('express-handlebars');
const session = require('express-session');
const Register = require("./models/registers");
const Booking = require("./models/booking"); // Require 
const app = express();
const hbs = require("hbs");
require("./db/conn");

const port = process.env.PORT || 8000;
const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(static_path));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

app.set("view engine", "hbs");
app.set("views", template_path);
hbs.registerPartials(partials_path);

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/partner", (req, res) => {
    res.render("partner");
});

app.get("/booking-summary", (req, res) => {
    res.render("order-summary");
});

app.get("/order-success", (req, res) => {
    res.render("order-success");
});

app.get("/contact", (req, res) => {
    res.render("contact");
});

app.get("/profile", async (req, res) => {
    try {
        const userEmail = req.session.userEmail;
        if (!userEmail) {
            return res.status(404).send("User not found");
        }

        const user = await Register.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).send("User not found");
        }

        const bookings = await Booking.find({ userEmail: userEmail });
        res.render("profile", { userData: user, bookings: bookings });
    } catch (error) {
        console.log("Error fetching user data:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/register", async (req, res) => {
    try {
        const { email, password, confirmpassword, mobile } = req.body;

        if (password === confirmpassword) {
            const registerUser = new Register({
                email,
                password,
                confirmpassword,
                mobile
            });

            const registered = await registerUser.save();
            console.log("User registered successfully:", registered);

            req.session.userEmail = email;
            res.status(201).redirect("/");
        } else {
            console.log("Passwords do not match");
            res.send("Passwords do not match");
        }
    } catch (error) {
        console.log("Error during registration:", error);
        res.status(400).send(error);
    }
});

app.post("/login", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const user = await Register.findOne({ email: email });

        if (!user) {
            return res.status(404).send("User not found");
        }

        if (user.password === password) {
            req.session.userEmail = email;
            return res.status(201).redirect("/");
        } else {
            return res.status(401).send("Passwords do not match");
        }
    } catch (error) {
        console.log("Error during login:", error);
        res.status(500).send("Internal Server Error");
    }
});

const PRICE_PER_LUGGAGE = 10;

app.post('/booking-summary', async (req, res) => {
    try {
        const { location, checkInDate, checkOutDate, luggageItems } = req.body;

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const numberOfDays = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

        const totalPrice = numberOfDays * luggageItems * PRICE_PER_LUGGAGE;
        const userEmail = req.session.userEmail;

        const booking = new Booking({
            userEmail,
            location,
            checkInDate,
            checkOutDate,
            luggageItems,
            totalPrice
        });

        await booking.save();
        const user = await Register.findOne({ email: userEmail });
        user.bookings.push(booking);
        await user.save();

        res.render('booking-summary', {
            orderSummary: {
                location,
                checkInDate,
                checkOutDate,
                luggageItems
            },
            numberOfDays,
            totalPrice
        });
    } catch (error) {
        console.error("Error saving booking:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/checkout', async (req, res) => {
    res.redirect('/order-success');
});

app.listen(port, () => {
    console.log(`server is running at port no ${port}`);
});


