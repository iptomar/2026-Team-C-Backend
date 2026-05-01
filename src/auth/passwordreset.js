const { sendEmail } = require("../email/transporter");
const { hashPassword } = require ("./password");
require('dotenv').config();
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function resetPassword(token, newPassword) {
    const record = await prisma.passwordResetToken.findFirst({
        where: { token: hashToken(token) },
        select: { 
            user: true,
            expiresAt: true
        }
    })

    if (!record) {
        throw new Error('Token inválido');
    }

    if (record.expiresAt < new Date()) {
        await prisma.passwordResetToken.delete({ 
            where: { token: hashToken(token) } 
        });
        throw new Error('Token expirado');
    }

    await prisma.user.update({
        where: { id: record.user.id },
        data: { password: await hashPassword(newPassword) }
    });

    // delete the token after successful use
    await prisma.passwordResetToken.delete({
        where: { token: hashToken(token) }
    });
}
function generateToken() {
    return (require("crypto").randomBytes(64).toString('hex'));
}


async function generateLinkforResetPassword(email) {
    const user = await prisma.user.findFirst({
        where: { email: email },
    });
    console.log("USER ENCONTRADO:", user);

    if (!user) {
        throw new Error('email nao encontrado');
    }

    const token = generateToken(); // Função para gerar um token único
    console.log("TOKEN GERADO:", token);
    await prisma.passwordResetToken.create({
    data: {
        token: hashToken(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600000) // Token válido por 1 hora
    }});
    console.log("TOKEN GERADO E SALVO:", token);

    const ourdomain = 'http://localhost:5173/';
    const resetLink = `${ourdomain}passwd/${token}`;



    sendEmail(
        email,
        'Link para reset de password',
        `Olá ${user.name},\n\nRecebemos um pedido para reiniciar a sua password. Clique no link abaixo para criar uma nova password:\n\n${resetLink}\n\nSe você não solicitou este reset, por favor ignore este email.\n\nAtenciosamente,\nEquipa Lusobites`
    );

    
}

function hashToken(token) {
    return require('crypto').createHash('sha512').update(token).digest('hex');
}


module.exports = {resetPassword, generateLinkforResetPassword};