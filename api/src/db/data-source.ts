import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
	type: 'postgres',
	host: 'localhost',
	port: parseInt(process.env.DB_PORT ?? '5432'),
	username: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	entities: ['dist/entities/*.entity.js'],
	migrations: ['./migrations'],
	logging: true,
	poolSize: 10,
	connectTimeoutMS: 2000,
	maxQueryExecutionTime: 5000,
});
