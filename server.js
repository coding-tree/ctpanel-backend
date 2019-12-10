const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());

const path = require("path");
const db = require("./db");
const collection = "topics";



db.connect(err => {
    if (err) {
        console.log("nie można połączyć z bazą");
        process.exit(1);
    } else {
        app.listen(3000, () => {
            console.log("połączono z bazą");
        });
    }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});
app.use(express.static(__dirname + '/public'));


app.get("/getTopics", (req, res) => {
    db.getDB()
        .collection(collection)
        .find({})
        .toArray((err, documents) => {
            if (err) {
                console.log(err);
            } else {
                console.log(documents);
                res.json(documents);
            }
        });
});

app.put("/:id", (req, res) => {
    const topicID = req.params.id;
    const userInput = req.body;

    db.getDB()
        .collection(collection)
        .findOneAndUpdate(
            { _id: db.getPrimaryKey(topicID) },
            { $set: { topic: userInput.topic }, $inc: { votes: 1 } },
            { returnOriginal: false },
            (err, result) => {
                if (err) console.log(err)
                else res.json(result)
            }
        );
});

app.post('/', (req, res) => {
    const userInput = req.body;
    db.getDB().collection(collection).insertOne(userInput, (err, result) => {
        if (err) console.log(err)
        else res.json({ result: result, document: result.ops[0] })
    })
})

app.delete('/:id', (req, res) => {
    const topicID = req.params.id;
    db.getDB().collection(collection).findOneAndDelete({ _id: db.getPrimaryKey(topicID) }, (err, result) => {
        if (err) console.log(err);
        else res.json(result)
    })
});