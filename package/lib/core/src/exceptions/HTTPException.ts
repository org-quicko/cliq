import { BaseException } from './BaseException'

export abstract class HTTPException extends BaseException {

    constructor(message: string, cause?: unknown, code: number = 500) {
        super(message, cause, code)
    }

}