import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) { }
}