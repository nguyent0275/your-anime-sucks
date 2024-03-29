const router = require("express").Router();
const withAuth = require("../../utils/auth");
const { User } = require("../../models");
const bcrypt = require("bcrypt");

// the application end point is /api/user

// creates user
router.post("/", async (req, res) => {
  try {
    const newUser = req.body;

    // checking for empty fields and returning appropriate message corresponding to the missing field
    // model already checks for unique emails and username (maybe add error message if field is not unique)
    if (!newUser.email) {
      res.status(400).json({ message: "Please enter a valid email" });
    } else if (!newUser.user_name) {
      res.status(400).json({ message: "Please enter a valid username" });
    } else if (!newUser.password) {
      res.status(400).json({ message: "Please enter a valid password" });
    } else {
      // creates the user if all fields pass, the password is being hashed before the create with a hook on the model
      const userData = await User.create(req.body);

      req.session.save(() => {
        req.session.user_id = userData.id;
        req.session.logged_in = true;
        req.session.user_name = userData.user_name;

        res.status(200).json(userData);
        console.log(req.session);
      });
    }
  } catch (err) {
    const errors = err.errors.map((x) => x.path);
    // res.status(400).json(err);

    if (errors.indexOf("user_name") !== -1) {
      res.status(400).json({ message: "This username is taken." });
    } else if (errors.indexOf("email") !== -1) {
      res
        .status(400)
        .json({ message: "This is not an email or email is unavailable." });
    } else if (errors.indexOf("password") !== -1) {
      res
        .status(400)
        .json({ message: "This password does not meet requirements." });
    }
  }
});

// login route (finds a user by email then checks the input password against the database's stored password)
router.post("/login", async (req, res) => {
  try {
    // finds one user by the request email (user input email when logging in)
    const userData = await User.findOne({
      where: {
        email: req.body.email,
      },
    });
    console.log(userData);
    // if no user data is returned, serves a login failure message and ends the route with the 'return'
    if (!userData) {
      res.status(404).json({ message: "Login failed. Please try again!" });
      return;
    }
    // we are checking the user's inputted password towards the hashed password saved in the database that's associated with the findOne's email.
    const validPassword = await bcrypt.compare(
      req.body.password,
      userData.password
    );

    // if the passwords do not match, login fails and route ends
    if (!validPassword) {
      res
        .status(400)
        .json({ message: "Incorrect email or password, please try again" });
      return;
    }

    req.session.user_id = userData.id;
    req.session.logged_in = true;
    req.session.user_name = userData.user_name;

    res.json({ user: userData, message: "You are now logged in!" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// gets rid of session when logging out
router.post("/logout", (req, res) => {
  if (req.session.logged_in) {
    req.session.destroy(() => {
      res.status(204).end();
    });
  } else {
    res.status(404).end();
  }
});

// deletes user by id // STILL NEEDS TO BE TESTED
router.delete("/delete", withAuth, async (req, res) => {
  try {
    if (req.session.logged_in) {
      const userData = await User.destroy({
        where: {
          id: req.session.user_id,
        },
      });

      req.session.destroy(() => {
        console.log("worked");
        res.status(204).end();
      });

      console.log("You have success");

      res.status(200).json(userData);
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
