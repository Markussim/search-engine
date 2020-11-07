const mongoose = require("mongoose");
import { verify } from "crypto";
import express from "express";
var url = require("url");
const fs = require("fs");
var ObjectID = require("mongodb").ObjectID;
var cookieParser = require("cookie-parser");
const app = express();
const port = 3000;
const clientdir = __dirname.substr(0, __dirname.length - 4) + "client";

mongoose.connect("mongodb://localhost/search", { useNewUrlParser: true });

const db = mongoose.connection;

const searchResultShema = new mongoose.Schema({
  link: String,
  siteName: String,
  description: String,
  approved: Boolean,
});

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connected");
});

app.use(
  express.urlencoded({
    limit: "5000mb",
    extended: true,
    parameterLimit: 50000,
  })
);

app.use(cookieParser());

const searchResult = mongoose.model("searchResult", searchResultShema);

security();

app.get("/insert", (req, res) => res.sendFile(clientdir + "/index.html"));
app.post("/", function (req, res) {
  db.collection("searchresults")
    .find({ link: req.body.link })
    .limit(1)
    .toArray(function (err: any, result: any) {
      if (err) throw err;
      if (result.length < 1) {
        fs.readFile(clientdir + "/security/security.txt", "utf8", function (
          err: any,
          data: any
        ) {
          if (err) {
            return console.log(err);
          }
          var link;

          if (req.cookies.auth == data) {
            console.log("Auth succsess");
            link = new searchResult({
              link: req.body.link,
              siteName: req.body.siteName,
              description: req.body.description,
              approved: true,
            });
          } else {
            console.log(req.body.auth);
            link = new searchResult({
              link: req.body.link,
              siteName: req.body.siteName,
              description: req.body.description,
              approved: false,
            });
          }

          link.save(function (err: Error, searchResult: any) {
            if (err) return console.error(err);
          });
          res.send("Added link");
        });
      } else {
        res.send("Link already exists");
      }
    });
});

app.get("/verify", (req, res) => {
  res.sendFile(clientdir + "/preverify.html");
});

app.post("/verify", (req, res) => {
  fs.readFile(clientdir + "/security/security.txt", "utf8", function (
    err: any,
    data: any
  ) {
    if (err) {
      return console.log(err);
    }
    var link;

    if (req.body.auth == data) {
      console.log("Auth succsess");
      //res.set("Set-Cookie", "auth=" + req.body.auth);
      res.cookie("auth", req.body.auth);
      res.sendFile(clientdir + "/verify.html");
    } else {
      res.send("Auth failed");
    }
  });
});

app.get("/verifyAuthed", (req, res) => {
  fs.readFile(clientdir + "/security/security.txt", "utf8", function (
    err: any,
    data: any
  ) {
    if (err) {
      return console.log(err);
    }
    var link;

    if (req.cookies.auth == data) {
      console.log("Auth succsess");
      res.sendFile(clientdir + "/verifyAuthed.html");
    } else {
      res.send("No auth");
    }
  });
});

app.get("/getAll", (req, res) => {
  fs.readFile(clientdir + "/security/security.txt", "utf8", function (
    err: any,
    data: any
  ) {
    if (err) {
      return console.log(err);
    }
    var link;

    if (req.cookies.auth == data) {
      console.log("Auth succsess");
      db.collection("searchresults")
        .find(
          {},
          {
            fields: {
              _id: 1,
              link: 1,
              siteName: 1,
              description: 1,
              approved: 1,
            },
          }
        )
        .toArray(function (err: any, result: any) {
          if (err) throw err;
          res.send(result);
        });
    } else {
      res.send("No auth");
    }
  });
});

app.post("/changeStatus", async (req, res) => {
  fs.readFile(clientdir + "/security/security.txt", "utf8", async function (
    err: any,
    data: any
  ) {
    if (err) {
      return console.log(err);
    }

    if (req.cookies.auth == data) {
      console.log("Auth succsess");
      console.log(req.body.id);

      if (req.body.approved == "true") {
        await db
          .collection("searchresults")
          .update(
            { _id: ObjectID(req.body.id) },
            { $set: { approved: true } }
          );
      } else {
        await db
        .collection("searchresults")
        .update(
          { _id: ObjectID(req.body.id) },
          { $set: { approved: false } }
        );
      }

      res.send("Done");
    } else {
      res.send("No auth");
    }
  });
});

app.get("/", (req, res) => {
  var url_parts = url.parse(req.url, true);
  var urlquery = url_parts.query;

  let query = urlquery.search ? urlquery.search : "";

  let limit = urlquery.limit ? +urlquery.limit : +5;

  if (limit > 50) {
    limit = 50;
  }

  if (limit < 1) {
    limit = 1;
  }

  let showUnapproved = !(urlquery.showUnapproved == "true");

  console.log(showUnapproved + " " + urlquery.showUnapproved);

  const regex = new RegExp(escapeRegex(query), "gi");
  db.collection("searchresults")
    .find(
      {
        $and: [
          {
            $or: [{ description: regex }, { link: regex }, { siteName: regex }],
          },
          { $or: [{ approved: showUnapproved }, { approved: true }] },
        ],
      },
      { fields: { _id: 0, link: 1, siteName: 1, description: 1 } }
    )
    .limit(limit)
    .toArray(function (err: any, result: any) {
      if (err) throw err;
      res.send(result);
    });
});

function escapeRegex(text: String) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

function security() {
  if (!fs.existsSync(clientdir + "/security/security.txt")) {
    console.log("File doesn't exist");

    fs.writeFile(clientdir + "/security/security.txt", generateP(), function (
      err: Error
    ) {
      if (err) return console.log(err);
      console.log("Created authentication string");
    });
  }
}

function generateP() {
  var pass = "";
  var str =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "abcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 1; i <= 32; i++) {
    var char = Math.floor(Math.random() * str.length + 1);

    pass += str.charAt(char);
  }

  return pass;
}
