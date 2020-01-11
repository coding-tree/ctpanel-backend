# Meet app

Meet app role is helping Coding Tree with organizing meetings.

## Installation

App to run needs local mongodb database or owner's permission to connect with mongo cloud.
```bash
npm install
```
To download all dependencies.

```bash
node index
```
To run server in server subdirectory.

## Features

Works

* Topic/meeting CRUD
* Voting for topic (simple cookie validation right now)
* Google oauth login

What don't we have
* User roles

## Technologies

ExpressJS + Mongoose

## Assumptions

- Time unit - timestamp (new Date().getTime())

## Endpoints
GET
- / - homepage
- /meetings - list of all meetings
- /meetings/:id - get specific meeting by id
- /meetings/sorted - all meetings sorted by date
- /meetings/last-one - last meeting
- /meetings/incoming - closest incoming meeting
- /meetings/archive - archive of meetings
- /topics - list of all topics
- /topics/:id - get specific topic by id
- /topics/top-rated - get top rated topic

PUT
- /meetings/:id - update meeting by id
- /topics/:id - update topic by id
- /topics/vote/:id - vote for topic

POST
- /meetings - add new meeting
- /topics - add new topic

DELETE
- /meetings/:id - delete meeting by id
- /topics/:id - delete topic by id

## Models
User
- username: String
- googleId: String
- thumbnail: String

Meeting
- date: Number
- topic: String
- leader: String
- duration: String
- resourcesURL: String

Topic
- topic: String
- votes: Number
- addedDate: Number
- usuerAdded: String

## License
[MIT](https://choosealicense.com/licenses/mit/)