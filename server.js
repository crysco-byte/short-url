require("dotenv").config();
const dns = require("dns");
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const { Schema } = mongoose;

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

// body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const urlSchema = new Schema({
  url: String,
  hash: Number,
});

let urlModel = mongoose.model("urlModel", urlSchema);

const createNewUrl = (urlInput) => {
  urlModel.create({ url: urlInput, hash: genHash(urlInput) });
};

const genHash = (s) => {
  return s.split("").reduce(function (a, b) {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
};

const getUrl = (hashCode) => {
  let urlResult;
  urlModel.findOne({ hash: hashCode }, (err, doc) => {
    if (err) return console.log(err);
    urlResult = doc.url;
  });
  return urlResult;
};

app.post("/api/shorturl/new", (req, res) => {
  const { url } = req.body;
  const urlRegex = /^(http*.:\/\/)+/;
  if (urlRegex.test(url)) {
    const cleanUrl = url.replace(urlRegex, "");
    dns.lookup(cleanUrl, (err, add, fam) => {
      if (err === null) {
        createNewUrl(url);
        res.json({ url: url, hash: genHash(url) });
      } else {
        res.json({ url: "Invalid Hostname" });
      }
    });
  } else {
    res.json({ url: "Invalid Hostname" });
  }
});

app.get("/api/shorturl/:hashUrl", (req, res) => {
  const hashUrl = req.params.hashUrl;
  urlModel.find({ hash: hashUrl }, (err, result) => {
    if (err) return console.log(err);
    res.redirect(result[0].url);
  });
});
