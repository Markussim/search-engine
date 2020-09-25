const mongoose = require('mongoose');
import express from 'express';
const app = express()
const port = 3000
const clientdir = __dirname.substr(0, __dirname.length - 4) + "/client"

mongoose.connect('mongodb://localhost/search', { useNewUrlParser: true });

const db = mongoose.connection;

const searchResultShema = new mongoose.Schema({
    link: String,
    description: String
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
    console.log(req.body.link + "\n" + req.body.description)
    //res.send("<meta http-equiv=\"Refresh\" content=\"0; url='/'\" />")

    const link = new searchResult({ link: req.body.link, description: req.body.description })


    link.save(function (err: Error, searchResult: any) {
        if (err) return console.error(err);
    });

    db.collection("searchresults").find({}).toArray(function (err: any, result: any) {
        if (err) throw err;
        res.send(result)
        db.close();
    });
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))