const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const app = express();

app.use(bodyParser.json());
app.use(cookieParser());

const path = require("path");
const db = require("./db");
const collection = "topics";

db.connect(err => {
    if (err) {
        console.log("nie można połączyć z bazą");
        process.exit(1);
    } else {
        app.listen(3001, () => {
            console.log("połączono z bazą");
        });
    }
});

app.get("/", (req, res) => {
    res.send('<h1>Ni ma frontendu, zabrali złe człowieki</h1>')
});

app.get("/meetings", (req, res) => {
    db.getDB()
        .collection(collection)
        .find({})
        .toArray((err, documents) => {
            if (err) {
                console.log(err);
            } else {
                res.json(documents);
            }
        });
});

app.get("/meetings/sorted", (req, res) => {
    db.getDB()
        .collection(collection)
        .find({})
        .sort({ date: 1 })
        .toArray((err, documents) => {
            if (err) {
                console.log(err);
            } else {
                res.json(documents);
            }
        });
});

app.get("/meetings/incoming", (req, res) => {
    db.getDB()
        .collection(collection)
        .find({ date: { $gte: new Date().getTime() } })
        .sort({ date: 1 })
        .limit(1)
        .toArray((err, documents) => {
            if (err)
                console.log(err);
            else
                res.json(documents)
        })
});

app.get("/meetings/lastone", (req, res) => {
    db.getDB()
        .collection(collection)
        .find({ date: { $lte: new Date().getTime() } })
        .sort({ date: -1 })
        .limit(1)
        .toArray((err, documents) => {
            if (err)
                console.log(err);
            else
                res.json(documents)
        })
});

app.get("/meetings/archive", (req, res) => {
    db.getDB()
        .collection(collection)
        .find({ date: { $lte: new Date().getTime() } })
        .toArray((err, documents) => {
            if (err)
                console.log(err);
            else
                res.json(documents)
        })
});

app.put("/meetings/:id", (req, res) => {
    const topicID = req.params.id;
    const userInput = req.body;
    db.getDB()
        .collection(collection)
        .findOneAndUpdate(
            { _id: db.getPrimaryKey(topicID) },
            { $set: { topic: userInput.topic } },
            { returnOriginal: false },
            (err, result) => {
                if (err) console.log(err)
                else {
                    res.json(result)
                }
            }
        );
});

app.put("/meetings/vote/:id", (req, res) => {
    const topicID = req.params.id;
    const isVoted = Object.values(req.cookies).indexOf(topicID.toString()) > -1
    if (!isVoted) {
        db.getDB()
            .collection(collection)
            .findOneAndUpdate(
                { _id: db.getPrimaryKey(topicID) },
                { $inc: { votes: 1 } },
                { returnOriginal: false },
                (err, result) => {
                    if (err) console.log(err)
                    else {
                        res.cookie(topicID, topicID, { maxAge: 24 * 60 * 60 * 1000 })
                        res.json(result)
                    }
                }
            );
    }
});

// api udostępnia czas trwania hangouts

app.post('/meetings', (req, res) => {
    const userInput = req.body;
    db.getDB().collection(collection).insertOne(userInput, (err, result) => {
        if (err) console.log(err)
        else res.json({ result: result, document: result.ops[0] })
    })
})

app.delete('/meetings/:id', (req, res) => {
    const topicID = req.params.id;
    db.getDB().collection(collection).findOneAndDelete({ _id: db.getPrimaryKey(topicID) }, (err, result) => {
        if (err) console.log(err);
        else {
            res.clearCookie(topicID.toString())
            res.json(result)
        }
    })
});

// patch http, swager, jsdocs