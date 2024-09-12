const express = require('express');
const http = require('http');
const {Server} = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

let esperandoUsuario = null;

io.on('connection', (socket) => {
    console.log('Um usuário se conectou');

    socket.on('set username', (username) => {
        socket.username = username; // captura o nome do usuário
        console.log(`${username} entrou na sala.`);

        if (esperandoUsuario) {
            // se a usuário conecta os dois
            socket.partner = esperandoUsuario;
            esperandoUsuario.partner = socket;
            // notificar os usuários conectados
            esperandoUsuario.emit('Chat start', `Você esta falando com: ${socket.username}`);
            socket.emit('Chat start', `Falando com: ${esperandoUsuario.username}`);

            esperandoUsuario = null;
        }else {
            // se nao tem ninguem esperando, colocar ele como proximo
            esperandoUsuario = socket;
            socket.emit('waiting', 'Aguardando por um usuário para parear...');
        }
        
    });

    socket.on('chat message', (msg) => {
        if(socket.partner){
            socket.partner.emit('chat message', `${socket.username}: ${msg}`);
        }
    });
    

    socket.on('manual disconnect', () => {
        if (socket.partner) {
            socket.partner.emit('chat end', `${socket.username} desconectou.`);
            socket.partner.partner = null;
            socket.partner = null;
        }
        socket.emit('chat end', 'Você desconectou.')
    });
     
    socket.on('disconnect', () => {
        console.log('Usuário se desconectou');
        if (socket.partner) {
            socket.partner.emit('chat end', `${socket.username} desconectou`);
        }
        if (esperandoUsuario === socket) {
            esperandoUsuario = null;
        }
        
    });
});

server.listen(3001, () => { 
    console.log('Servidor na porta 3000');
    
})
