// Initialize dependencies
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose')
var cors = require('cors');
var bodyParser = require("body-parser");
var dns = require('dns');
var app = express();

app.use(cors());
app.use(bodyParser.urlencoded({'extended': false}));
app.use('/public', express.static(process.cwd() + '/public'));

// Connect to mongoose, establish schema
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser : true, useUnifiedTopology : true});
var Schema = mongoose.Schema;

// URL Schema and Model
var AddUrl = new Schema({
  id: {type: Number, required: true},
  url: {type: String, required: true}
});

var UrlModel = mongoose.model('Url', AddUrl);

// This brings up the front-end
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// The Regex to test for valid URLs
let urlRegex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm


app.post('/api/shorturl/new', (req, res) => {
  
  // Assigns a random number between 0 and 999999 for the URL index
  // The drawback to this approach is that it allows for duplicate links to the same URL, and also allows for the remote chance of overwriting another link
  // In the context of this project, however, it is unlikely that many links will be created and it's more efficient than making a counter schema
  var shortId = Math.floor(Math.random()*1000000);
  
  dns.lookup(req.body.url.replace(urlRegex, ''), (err, address, family) => {
    // Check the URL vs. the regex - if it is an invalid link, display an error message
    if (err) {
      res.json({"error": "Invalid link entered."});
    } else {
      // Create a new url/id pair and save it
      UrlModel.find()
      .exec()
      .then(links => {
        var link = new UrlModel({ "id": shortId, "url": req.body.url });
        link.save()
        .then(result => {
          res.json(result)
          })
        }
      )
      .catch(err => {
        res.json({"error": err})
      });
    }
  // Display to the user the url they entered, and the short ID they can find it at.
  res.json({"original_url": req.body.url, "short_url": "https://maddening-homburg.glitch.me/api/shorturl/"+shortId})
  });
});

// Going to this link gives you the .json file containing all the url's and their respective redirects
app.get("/api/shorturl", (req, res) => {
  UrlModel.find()
  .exec()
  .then(links => {
    res.json(links)
  })
  .catch(err => {
    res.json({"error":err});
  });
});

// This redirects you from the new url to the link it corresponds to
app.get("/api/shorturl/:short", (req, res) => {
  UrlModel.find({ "id": req.params.short }).exec()
  .then(links => {
    res.redirect(links[0]["url"]);
  })
  .catch(err => {
    console.log(err)
    res.json({"error": err})
  })
})

app.listen(process.env.PORT || 3000, () => {
  console.log('Node.js listening ...');
});