const express = require('express')
const port = parseInt(process.env.PORT, 10) || 3000

const { Client } = require('pg')

const DB_CONNECTION = {
    user: 'ddss',        
    database: 'ddss',
    password: 'ddss',
    host: process.env.DB_HOST || 'localhost',
    port: 5432
}

const session = require('express-session')
const app = express()

app.use(session({
    /* FIXME creating a vulnerability on purpose. Now I am able to acess cookies in the browser */
    cookie: { httpOnly: false },
    secret: 'ddss',
    resave: false,
    saveUninitialized: true
}));

app.use(express.urlencoded());

app.get('/', (req, res) => {
    console.log('Session ID: ', req.sessionID);

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
})

app.get('/signup', (req, res) => {
    console.log('Session ID: ', req.sessionID);

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
})

app.get('/me', (req, res) => {   
    console.log('Session ID: ', req.sessionID); 

    res.send(`<html>
        <main>
            <aside id="sidebar">
                <a href="/payments">Payments</a>
            </aside>
            <p>Welcome Home</p>
            <form method="POST" action="/logout">
                <button type="submit">Logout</button>
            </form>
        </main>
    </html>`)
})

app.post('/sessions', async (req, res) => {
    console.log('Session ID: ', req.sessionID);

    const client = new Client(DB_CONNECTION)
    const { email, password } = req.body;
    
    try {      
        client.connect()
        
        // TODO create transaction

        // TODO protection to destroy previous session. Leave it open as a vulnerability

        // const destroySessionQuery = `DELETE from user_session where user_email='${email}'`;
        // await client.query(destroySessionQuery);

        // console.log('Destroy session query: ', destroySessionQuery);

        // const selectQuery = `select * from ddss_user where email='${email}' AND password = '${password}'`;        
        // console.log('Login query: ', selectQuery);

        const selectQuery = {
            text: 'select * from ddss_user where email=$1 AND password = $2',
            values: [email, password],
        };

        const dbRes = await client.query(selectQuery);
        const isAuthValid = !!(dbRes && dbRes.rowCount > 0);

        if (isAuthValid) {
            const destroySessionQuery = `DELETE from user_session where session_id='${req.sessionID}'`;
            await client.query(destroySessionQuery);

            const createSessionQuery = `insert into user_session values('${req.sessionID}', '${email}')`;
            await client.query(createSessionQuery);

            res.redirect('/me');
        } else {
            // TODO invalidate session
            req.session.destroy();
            res.redirect('/');
        }

    } catch {
        res.redirect('/');
    } finally {
        client.end()
    }   
  }
)

app.post('/users', (req, res) => {
    console.log('Session ID: ', req.sessionID);

    const client = new Client(DB_CONNECTION)
    const { name, email, password } = req.body;
    
    client.connect()
    
    const insertQuery = `insert into ddss_user values('${email}', '${password}', '${name}')`;
    console.log('Insert User: ', insertQuery);
    client.query(insertQuery, (dbErr, dbRes) => {
        if (dbErr) {
            // TODO
            console.log('Error: ', dbErr)
            res.redirect('/signup');
        } else {
            res.redirect('/');
        }
        
        client.end()
    })
  }
)

app.get('/payments', (req, res) => { 
    console.log('Session ID: ', req.sessionID);

    return res.send(`<html>
        <main>
            <form method="GET" action="/search_payments">
                <input name="date" type="text"/>
                <button type="submit">Search</button>
            </form>
            <a href="/me">Home</a>
        </main>
    </html>`)}
);

app.get('/search_payments', async (req, res) => {
    console.log('Session ID: ', req.sessionID);

    const client = new Client(DB_CONNECTION)
    const { date } = req.query;

    try {      
        client.connect()
        
        const currentSessionQuery = `select * from user_session where session_id = '${req.sessionID}'`;

        const sessionRows = await client.query(currentSessionQuery);

        const authUserEmail = sessionRows.rows[0]['user_email'];

        const selectQuery = `select * from payment where user_email = '${authUserEmail}' AND validity = '${date}'`;
        console.log('Search payments: ', selectQuery);
        const paymentRecords = await client.query(selectQuery);
            
        let tableRowsHtml = '';
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
        </html>`
        
        // TODO to remove, letting an open vulnerability for reflected XSS
        res.set('X-XSS-Protection', 0);

        res.send(htmlResponse)

    } catch(error) {
        res.redirect('/');
    } finally {
        client.end()
    } 
})

app.post('/logout', (req, res) => {
    console.log('Session ID: ', req.sessionID);
    const client = new Client(DB_CONNECTION)

    req.session.destroy();
    
    client.connect()
    
    const destroySessionQuery = `DELETE from user_session where session_id='${req.sessionID}'`;

    client.query(destroySessionQuery, (dbErr, dbRes) => {
        if (dbErr) {
            // TODO handle error
        }

        res.redirect('/');

        client.end()
    })    
  }
)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
