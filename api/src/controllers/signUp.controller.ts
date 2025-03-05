import { Controller, Post, Body, 
    // Logger
 } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { CreateSignUpDto } from '../dtos';
import { SignUpService } from 'src/services/signUp.service';
import { LoggerService } from 'src/services/logger.service';

@ApiTags('SignUp')
@Controller('/signups')
export class SignUpController {

    constructor(
        private readonly signUpService: SignUpService,
        private logger: LoggerService,
    ) { }


    /**
     * Create contact
     */
    @ApiResponse({ status: 201, description: 'Created' })
    @Post()
    async createSignUp(@Body() body: CreateSignUpDto) {
        this.logger.info('START: createSignUp controller');

        const signUpResult = await this.signUpService.createSignUp(body);

        this.logger.info('END: createSignUp controller');
        return { message: 'Successfully created signup.', result: signUpResult };
    }
}
