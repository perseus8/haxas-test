// src/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Initialize SQLite database
const db = new sqlite3.Database('haxas.db');

// Create users table
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (rec_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE, balance INTEGER)");
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('transact', (data) => {
        const { user, amount } = data;
        db.get("SELECT balance FROM users WHERE user_id = ?", [user], (err, row) => {
            if (err) {
                console.error('Error fetching user balance:', err.message);
                socket.emit('error', {user, message: 'Database error. Please try again later.' });
                return;
            }

            if (row) {
                // User exists, check balance and update
                const newBalance = row.balance + amount;
                if (newBalance < 0) {
                    socket.emit('error', {user, message: 'Transaction failed: Insufficient balance.' });
                    return;
                }
                db.run("UPDATE users SET balance = ? WHERE user_id = ?", [newBalance, user], (err) => {
                    if (err) {
                        console.error('Error updating balance:', err.message);
                        socket.emit('error', {user, message: 'Database error. Please try again later.' });
                    } else {
                        console.log(`User ${user} balance updated to ${newBalance}`);
                        socket.emit('balanceUpdated', { user, balance: newBalance });
                    }
                });
            } else {
                // User does not exist, create new user
                if (amount < 0) {
                    socket.emit('error', {user, message: 'Transaction failed: Insufficient balance.' });
                    return;
                }
                db.run("INSERT INTO users (user_id, balance) VALUES (?, ?)", [user, 1000 + amount], function(err) {
                    if (err) {
                        console.error('Error creating user:', err.message);
                        socket.emit('error', {user, message: 'Database error. Please try again later.' });
                    } else {
                        console.log(`User ${user} created with balance ${1000 + amount}`);
                        socket.emit('userCreated', { user, balance: 1000 + amount });
                    }
                });
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
