const express = require('express')
const port = parseInt(process.env.PORT, 10) || 3000

const { Client } = require('pg')

const session = require('express-session')
const app = express()

app.use(session({
    secret: 'ddss',
    resave: false,
    saveUninitialized: true
}));

app.use(express.urlencoded());

app.get('/', (req, res) => res.send(`<html>
    <main>
        <form method="POST" action="/sessions">
            <input name="email" type="email"/>
            <input name="password" type="password"/>
            <button type="submit">Login</button>
        </form>
        <a href="/signup">Create Account</a>
    </main>
</html>`))

app.get('/signup', (req, res) => res.send(`<html>
    <main>
        <form method="POST" action="/users">
            <input name="name" type="text"/>
            <input name="email" type="email"/>
            <input name="password" type="password"/>
            <button type="submit">Sign Up</button>
        </form>
        <a href="/">Login</a>
    </main>
</html>`))

app.get('/me', (req, res) => {    
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
    const { email, password } = req.body;
    
    const client = new Client({
        user: 'ddss',
        host: 'localhost',
        database: 'ddss',
        password: 'ddss',
        port: 5432,
    })

    try {      
        client.connect()
        
        // TODO create transaction

        const destroySessionQuery = `DELETE from user_session where user_email='${email}'`;
        await client.query(destroySessionQuery);

        const selectQuery = `select * from ddss_user where email='${email}' AND password = '${password}'`;

        const dbRes = await client.query(selectQuery);
        const isAuthValid = !!(dbRes && dbRes.rowCount === 1);

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
    const { name, email, password } = req.body;
    
    const client = new Client({
        user: 'ddss',
        host: 'localhost',
        database: 'ddss',
        password: 'ddss',
        port: 5432,
    })
  
    client.connect()
    
    const insertQuery = `insert into ddss_user values('${email}', '${password}', '${name}')`;

    client.query(insertQuery, (dbErr, dbRes) => {
        if (dbErr) {
            // TODO
            res.redirect('/signup');
        } else {
            res.redirect('/');
        }
        
        client.end()
    })
  }
)

app.get('/payments', (req, res) => res.send(`<html>
    <main>
        <form method="GET" action="/search_payments">
            <input name="date" type="text"/>
            <button type="submit">Search</button>
        </form>
        <a href="/me">Home</a>
    </main>
</html>`))

app.get('/search_payments', async (req, res) => {
    const { date } = req.query;
    
    const client = new Client({
        user: 'ddss',
        host: 'localhost',
        database: 'ddss',
        password: 'ddss',
        port: 5432,
    })

    try {      
        client.connect()
        
        const currentSessionQuery = `select * from user_session where session_id = '${req.sessionID}'`;

        const sessionRows = await client.query(currentSessionQuery);

        const authUserEmail = sessionRows.rows[0]['user_email'];

        const selectQuery = `select * from payment where user_email = '${authUserEmail}' AND validity = '${date}'`;
    
        const paymentRecords = await client.query(selectQuery);
            
        let tableRowsHtml = '';
        paymentRecords.rows.forEach(({ card_number, validity, security_code }) => {
            tableRowsHtml += `<tr>
                <td>${card_number}</td>
                <td>${validity}</td>
                <td>${security_code}</td>
            </tr>`;
        });
        
        res.send(`<html>
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
        </html>`)

    } catch(error) {
        res.redirect('/');
    } finally {
        client.end()
    } 
})

app.post('/logout', (req, res) => {
    req.session.destroy();
    
    const client = new Client({
        user: 'ddss',
        host: 'localhost',
        database: 'ddss',
        password: 'ddss',
        port: 5432,
    })
  
    client.connect()
    
    const destroySessionQuery = `DELETE from user_session where session_id='${req.sessionID}'`;

    client.query(destroySessionQuery, (dbErr, dbRes) => {
        if (dbErr) {
            // TODO handle erro
        }

        res.redirect('/');

        client.end()
    })    
  }
)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
