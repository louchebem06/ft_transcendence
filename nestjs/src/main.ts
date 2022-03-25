import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter(),
	  );
	app.setGlobalPrefix('api');
	const port = 3000;
	app.enableCors({
		origin: "http://localhost",
		credentials: true,
	});
	await app.listen(port, () => console.log(`Server started on http://localhost:${port}`));
  }
  
bootstrap();
