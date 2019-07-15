const express = require('express');
const bodyparser = require('body-parser');
const bcrypt= require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');


const db= knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'michaelalemayehu',
      password : '',
      database : 'smart-brain'
    }
  });

  db.select('*').from('users').then(data =>{
      console.log(data);
  });

const app= express();

const database ={
    users : [
        {
            id: '123',
            name: 'john',
            email: 'john@gmail.com',
            password: 'password',
            entries: 0,
            joined: new Date()
        },{
            id: '124',
            name: 'mike',
            email: 'mike@gmail.com',
            password: 'password123',
            entries: 0,
            joined: new Date()
        }
    ]
}

app.use(bodyparser.json());
app.use(cors())

app.get('/', (req, res) =>{
    res.send(database.users);
})

app.post('/signin', (req, res) =>{
    db.select('email', 'hash').from('login')
    .where('email', '=', req.body.email)
    .then(data =>{
        const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
        console.log(isValid);
        if(isValid){
            return db.select('*').from('users')
            .where('email', '=', req.body.email)
            .then(user=>{
                res.json(user[0])
            })
            .catch(err =>res.status(400).json('unable to get user'))
        }
        else {
            res.status(400).json('wrong credientials');
        }
    })
    .catch(err => res.status(400).json('wrong credientials'))
})

app.post('/register', (req, res) =>{
    const{email, name, password} = req.body;
    const hash = bcrypt.hashSync(password);
    db.transaction(trx =>{
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginemail =>{
            return trx('users')
            .returning('*')
            .insert({
                email: loginemail[0],
                name: name,
                joined: new Date()
            })
            .then(user =>{
                res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('unable to register'))
})

app.get('/profile/:id', (req,res)=>{
    const {id} =req.params;
    db.select('*').from('users').where({
        id: id
    })
    .then(user =>{
        if(user.length){
       res.json(user[0])
        }
        else{
            res.status(400).json('not found');
        }
    })
    .catch(err => res.status(400).json('err getting user '))
})

app.put('/image', (req, res) =>{
    const {id} =req.body;
    db('users').where('id', '=', id)
    .increment('entries',1)
    .returning('entries')
    .then(entries =>{
        res.json(entries[0]);
    })
    .catch(err => res.status(400).json('unable to get entries'))
})

app.listen(3000, ()=>{
    console.log('app is running on port 3000');
})

