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

app.get('/', (req, res) => res.sendFile(clientdir + "/index.html"))
app.post('/', function (req, res) {
    console.log(req.body.name + "\n" + req.body.email)
    res.send("<meta http-equiv=\"Refresh\" content=\"0; url='/'\" />")

    //const user = new person({ name: req.body.name, email: req.body.email})
    

    /*user.save(function (err: Error, person: any) {
        if (err) return console.error(err);
    });*/
})


const searchResult = mongoose.model('person', searchResultShema)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))