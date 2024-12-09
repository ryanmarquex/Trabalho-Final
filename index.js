import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = 3000;

// Dados armazenados em memória (pode ser substituído por arquivo ou banco de dados)
const data = {
    users: [],
    messages: []
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

// Rotas
app.get('/', (req, res) => {
    if (req.session.loggedIn) {
        res.redirect('/menu');
    } else {
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Login</title>
            </head>
            <body>
                <h1>Login</h1>
                <form method="POST" action="/login">
                    <label>Usuário:</label>
                    <input type="text" name="username" required>
                    <label>Senha:</label>
                    <input type="password" name="password" required>
                    <button type="submit">Entrar</button>
                </form>
            </body>
            </html>
        `);
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const user = data.users.find(u => u.nickname === username && u.password === password);
    if (user) {
        req.session.loggedIn = true;
        req.session.user = user.nickname;
        res.cookie('lastAccess', new Date().toLocaleString());
        res.redirect('/menu');
    } else {
        res.status(401).send('Login falhou! Usuário ou senha incorretos.');
    }
});

app.get('/menu', (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/');
    }
    const lastAccess = req.cookies.lastAccess || 'Nenhum acesso anterior registrado';
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Menu</title>
        </head>
        <body>
            <h1>Bem-vindo, ${req.session.user}!</h1>
            <p>Último acesso: ${lastAccess}</p>
            <a href="/cadastroUsuario">Cadastrar Usuário</a><br>
            <a href="/batePapo">Ir para Bate-papo</a><br>
            <form method="POST" action="/logout"><button type="submit">Logout</button></form>
        </body>
        </html>
    `);
});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/cadastroUsuario', (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/');
    }
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cadastro de Usuário</title>
        </head>
        <body>
            <h1>Cadastro de Usuário</h1>
            <form method="POST" action="/cadastrarUsuario">
                <label>Nome:</label>
                <input type="text" name="nome" required>
                <label>Data de Nascimento:</label>
                <input type="date" name="dataNascimento" required>
                <label>Nickname:</label>
                <input type="text" name="nickname" required>
                <label>Senha:</label>
                <input type="password" name="password" required>
                <button type="submit">Cadastrar</button>
            </form>
        </body>
        </html>
    `);
});

app.post('/cadastrarUsuario', (req, res) => {
    const { nome, dataNascimento, nickname, password } = req.body;
    if (!nome || !dataNascimento || !nickname || !password) {
        return res.status(400).send('Todos os campos são obrigatórios!');
    }

    const userExists = data.users.some(u => u.nickname === nickname);

    if (userExists) {
        return res.status(409).send('Nickname já está em uso!');
    }

    data.users.push({ nome, dataNascimento, nickname, password });
    res.send(`
        <h1>Usuário cadastrado com sucesso!</h1>
        <a href="/menu">Voltar ao menu</a>
    `);
});

// Iniciando o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
