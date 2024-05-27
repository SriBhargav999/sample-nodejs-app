const express = require('express');
const app = express();
const port = 3001;
const bcrypt = require("bcrypt");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

var serviceAccount = require('./key.json');

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

app.set("view engine", "ejs");

app.get('/home', (req, res) => {
  res.render('home');
});

app.get('/signin', (req, res) => {
  res.render("signin");
});

app.get('/signupsubmit', (req, res) => {
  const fname = req.query.fname;
  const lname = req.query.lname;
  const email = req.query.email;
  const password = req.query.password;

  // Check if email already exists
  db.collection('users')
    .where("email", "==", email)
    .get()
    .then((docs) => {
      if (docs.size > 0) {
        // Email already exists, send error message
        res.render("signfail");
      } else {
        // Email doesn't exist, proceed with signup
        bcrypt.hash(password, 10)
          .then((hashedPassword) => {
            return db.collection('users').add({
              name: fname + lname,
              email: email,
              password: hashedPassword,
            });
          })
          .then(() => {
            res.render("signin");
          })
          .catch((error) => {
            console.error("Error signing up:", error);
            res.send("Signup failed");
          });
      }
    })
    .catch((error) => {
      console.error("Error checking for existing email:", error);
      res.send("Signup failed");
    });
});


app.get('/signinsubmit', (req, res) => {
  const email = req.query.email;
  const password = req.query.password;

  db.collection('users')
    .where("email", "==", email)
    .get()
    .then((docs) => {
      if (docs.size > 0) {
        const userData = docs.docs[0].data();
        bcrypt.compare(password, userData.password)
          .then((result) => {
            if (result) {
              res.render("home", { userData: userData });
            } else {
              res.send("Login failed");
            }
          })
          .catch((error) => {
            console.error("Error comparing passwords:", error);
            res.send("Login failed");
          });
      } else {
        res.send("Login failed");
      }
    })
    .catch((error) => {
      console.error("Error retrieving user data:", error);
      res.send("Login failed");
    });
});

app.get('/signup', (req, res) => {
  res.render("signup");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
