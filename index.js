import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = 3000;

// Dados em memória
const data = {
    users: [], // { name, birthDate, nickname, password }
    messages: [] // { user, message, timestamp }
};

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    secret: 'chatroom_secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 60 * 1000 } // Sessão válida por 30 minutos
}));

// Página inicial: Cadastro de Usuários e Login
app.get('/', (req, res) => {
    if (req.session.loggedIn) {
        return res.redirect('/menu');
    }
    res.send(`
        <h1>Bem-vindo à Sala de Bate-Papo</h1>
        <h2>Cadastro de Usuário</h2>
        <form method="POST" action="/cadastrarUsuario">
            <label>Nome:</label>
            <input type="text" name="name" required>
            <label>Data de Nascimento:</label>
            <input type="date" name="birthDate" required>
            <label>Nickname:</label>
            <input type="text" name="nickname" required>
            <label>Senha:</label>
            <input type="password" name="password" required>
            <button type="submit">Cadastrar</button>
        </form>
        <h2>Login</h2>
        <form method="POST" action="/login">
            <label>Nickname:</label>
            <input type="text" name="nickname" required>
            <label>Senha:</label>
            <input type="password" name="password" required>
            <button type="submit">Entrar</button>
        </form>
    `);
});

// Cadastro de usuários
app.post('/cadastrarUsuario', (req, res) => {
    const { name, birthDate, nickname, password } = req.body;
    if (!name || !birthDate || !nickname || !password) {
        return res.status(400).send('Todos os campos são obrigatórios!');
    }

    const userExists = data.users.some(u => u.nickname === nickname);
    if (userExists) {
        return res.status(409).send('Nickname já cadastrado!');
    }

    data.users.push({ name, birthDate, nickname, password });
    res.send(`
        <h1>Usuário cadastrado com sucesso!</h1>
        <a href="/">Voltar para Login</a>
    `);
});

// Login
app.post('/login', (req, res) => {
    const { nickname, password } = req.body;
    const user = data.users.find(u => u.nickname === nickname && u.password === password);

    if (user) {
        req.session.loggedIn = true;
        req.session.user = user.nickname;
        res.cookie('lastAccess', new Date().toLocaleString());
        res.redirect('/menu');
    } else {
        res.status(401).send(`
            <h1>Login ou senha inválidos!</h1>
            <a href="/">Tentar novamente</a>
        `);
    }
});

// Menu principal
app.get('/menu', (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/');
    }
    const lastAccess = req.cookies.lastAccess || 'Nenhum acesso registrado';
    res.send(`
        <h1>Bem-vindo, ${req.session.user}!</h1>
        <p>Último acesso: ${lastAccess}</p>
        <a href="/batePapo">Ir para Bate-papo</a><br>
        <form method="POST" action="/logout"><button type="submit">Logout</button></form>
    `);
});

// Logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Bate-papo
app.get('/batePapo', (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/');
    }
    res.send(`
        <h1>Bate-Papo</h1>
        <form method="POST" action="/postarMensagem">
            <label>Usuário:</label>
            <select name="user" required>
                ${data.users.map(u => `<option value="${u.nickname}">${u.nickname}</option>`).join('')}
            </select>
            <label>Mensagem:</label>
            <input type="text" name="message" required>
            <button type="submit">Enviar</button>
        </form>
        <h2>Mensagens:</h2>
        <ul>
            ${data.messages.map(m => `<li>${m.user} (${m.timestamp}): ${m.message}</li>`).join('')}
        </ul>
        <a href="/menu">Voltar ao menu</a>
    `);
});

app.post('/postarMensagem', (req, res) => {
    const { user, message } = req.body;
    if (!user || !message) {
        return res.status(400).send('Usuário e mensagem são obrigatórios!');
    }

    data.messages.push({
        user,
        message,
        timestamp: new Date().toLocaleString()
    });
    res.redirect('/batePapo');
});

// Inicialização do servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
