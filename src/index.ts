const mongoose = require('mongoose');
import express from 'express';
var url = require('url');
const app = express()
const port = 3000
const clientdir = __dirname.substr(0, __dirname.length - 4) + "/client"

mongoose.connect('mongodb://localhost/search', { useNewUrlParser: true });

const db = mongoose.connection;

const searchResultShema = new mongoose.Schema({
    link: String,
    siteName: String,
    description: String,
    approved: Boolean
})

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("Connected")
});

app.use(express.urlencoded({
    limit: "5000mb",
    extended: true,
    parameterLimit: 50000
}))

const searchResult = mongoose.model('searchResult', searchResultShema)

app.get('/', (req, res) => res.sendFile(clientdir + "/index.html"))
app.post('/', function (req, res) {
    db.collection("searchresults").find({ "link": req.body.link }).limit(1).toArray(function (err: any, result: any) {
        if (err) throw err;
        if (result.length < 1) {
            const link = new searchResult({ link: req.body.link, siteName: req.body.siteName, description: req.body.description, approved: false })

            link.save(function (err: Error, searchResult: any) {
                if (err) return console.error(err);
            });
            res.send("Added link")
        } else {
            res.send("Link already exists")
        }

    });


})

app.get('/results', (req, res) => {
    var url_parts = url.parse(req.url, true);
    var urlquery = url_parts.query;

    let query = urlquery.search ? urlquery.search : ""

    let limit = urlquery.limit ? +urlquery.limit : +5

    if(limit > 50) {
        limit = 50
    }

    if (limit < 1) {
        limit = 1
    }

    const regex = new RegExp(escapeRegex(query), 'gi');
    db.collection("searchresults").find({ $and: [{$or: [{ "description": regex }, { "link": regex }, { "siteName": regex }]}, {"approved": true}] }, { fields: { _id: 0, link: 1, siteName:1, description: 1 } }).limit(limit).toArray(function (err: any, result: any) {
        if (err) throw err;
        res.send(result)
    });
})

function escapeRegex(text: String) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

app.listen(port, () => console.log(`Example app listening on port ${port}!`))