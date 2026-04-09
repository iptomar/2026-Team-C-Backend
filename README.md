# 2026-Team-C-Backend

## Pré-requisitos

- Node.js v18+
- Docker

## Instalação

### 1. Clonar o repositório

```bash
git clone 
cd 2026-Team-C-Backend
npm install
```

### 2. Variáveis de ambiente
Cria um ficheiro `.env` na raiz do projeto:
```env
DATABASE_URL="postgresql://gp:gp@localhost:5432/gp"
JWT_SECRET="um_segredo_muito_secreto"
```

Para gerar um JWT_SECRET seguro com openssl:
```bash
openssl rand -base64 32
```
Copia o output e cola no `JWT_SECRET` do `.env`.

### 3. Base de dados (Docker)

```bash
docker run --name gp-db \
  -e POSTGRES_PASSWORD=gp \
  -e POSTGRES_DB=gp \
  -e POSTGRES_USER=gp \
  -p 5432:5432 \
  -d postgres
```

### 4. Migrações (Prisma)

```bash
npx prisma migrate dev
```

### 5. Arrancar o servidor

```bash
npm run dev
```

## Base de dados

Para aceder à base de dados diretamente:

```bash
docker exec -it gp-db psql -U gp -d gp
```

Sempre que o schema for alterado, corre:

```bash
npx prisma migrate dev --name 
```
