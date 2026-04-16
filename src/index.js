const express = require('express');
const authRouter = require('./routes/auth');

const app = express();
app.use(express.json());

app.use('/api/auth', authRouter);

app.listen(3000, () => { console.log('Server running on port 3000') });

///Implementar resposta de sucesso e erro da API
///devolver respostas da api
///endpoint de registo
///controlo de permissoes
///Endpoint reset password
