## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Variables de entorno

Copia el archivo de ejemplo y configura la URL de la base de datos:

```bash
$ cp .env.example .env
```

Edita el `.env` con las credenciales de la base de datos proporcionadas por el equipo:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

---

## 🗄️ Base de datos y Prisma

Este proyecto usa una base de datos PostgreSQL compartida en la nube. Todo el equipo apunta a la misma instancia.

### Comandos disponibles

```bash
# Genera el Prisma Client (tipos y métodos ORM) a partir del schema.prisma
$ npm run prisma:generate

# Crea una nueva migración Y la aplica en la DB (solo quien hace el cambio)
$ npm run prisma:migrate -- --name nombre_descriptivo

# Aplica migraciones pendientes sin generar ni resetear nada (todos los demás)
$ npm run prisma:deploy
```

---

### 🟢 Soy nuevo en el proyecto

Estos son los únicos comandos que debes correr para dejar la DB lista:

```bash
$ npm run prisma:deploy    # aplica todas las migraciones existentes en la DB
$ npm run prisma:generate  # genera el cliente con los tipos actuales
```

> ⚠️ **Nunca corras `prisma:migrate` si no hiciste un cambio al schema, y nunca corras `prisma migrate reset` — eso borra todos los datos de la base de datos compartida.**

---

### 🔵 Hice pull y alguien modificó el schema

Cuando hagas `git pull` y veas cambios en `prisma/schema.prisma` o en `prisma/migrations/`, ejecuta:

```bash
$ npm run prisma:deploy    # sincroniza las migraciones nuevas con la DB
$ npm run prisma:generate  # regenera el cliente con los nuevos tipos
```

---

### 🟡 Necesito modificar el schema de la base de datos

1. Edita `prisma/schema.prisma` con tus cambios
2. Crea y aplica la migración en la DB:

```bash
$ npm run prisma:migrate -- --name descripcion_del_cambio
```

3. Commitea **ambos** archivos, esto es obligatorio:

```bash
$ git add prisma/schema.prisma
$ git add prisma/migrations/
$ git commit -m "feat: descripcion del cambio"
$ git push
```

> El resto del equipo solo necesita hacer `git pull` y luego correr `prisma:deploy` + `prisma:generate`.

---

### Resumen del flujo

| Situación | Comandos |
|---|---|
| Soy nuevo en el proyecto | `prisma:deploy` → `prisma:generate` |
| Hice pull con cambios de otro | `prisma:deploy` → `prisma:generate` |
| Modifiqué el schema | `prisma:migrate -- --name <nombre>` → commit y push |

---

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```


## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
