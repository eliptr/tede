// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { ValidationPipe } from '@nestjs/common';
// import { join } from 'path';
// import { NestExpressApplication } from '@nestjs/platform-express';

// async function bootstrap() {
//   const app = await NestFactory.create<NestExpressApplication>(AppModule);

//   app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

//   app.enableCors({
//     origin: 'http://localhost:4200',
//     credentials: true,
//   });

//   // Serve uploaded files
//   app.useStaticAssets(join(__dirname, '..', 'uploads'), {
//     prefix: '/uploads',
//   });

//   const port = process.env.PORT || 3000;
//   await app.listen(port);
//   console.log(`Application running on http://localhost:${port}`);
// }
// bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // SSL/TLS configuration — required by assignment (SSL/TLS encryption of all interactions)
  // In development: use self-signed certs from ./ssl/
  // In production:  use certs from Let's Encrypt or a trusted CA
  const sslKeyPath  = process.env.SSL_KEY_PATH  || join(__dirname, '..', 'ssl', 'key.pem');
  const sslCertPath = process.env.SSL_CERT_PATH || join(__dirname, '..', 'ssl', 'cert.pem');

  const useHttps = existsSync(sslKeyPath) && existsSync(sslCertPath);

  const httpsOptions = useHttps
    ? { key: readFileSync(sslKeyPath), cert: readFileSync(sslCertPath) }
    : undefined;

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions,
    logger: ['log', 'warn', 'error'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Allow Angular dev server (HTTPS) and production origin
  const allowedOrigins = [
    'https://localhost:4200',
    'https://localhost',
    process.env.FRONTEND_URL || 'https://localhost:4200',
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Serve uploaded files
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  const port = process.env.PORT || 3000;
  const protocol = useHttps ? 'https' : 'http';
  await app.listen(port);
  console.log(`✅ Application running on ${protocol}://localhost:${port}`);
  if (useHttps) {
    console.log('🔒 SSL/TLS enabled');
  } else {
    console.warn('⚠️  SSL certs not found — running without HTTPS (development fallback)');
  }
}
bootstrap();
