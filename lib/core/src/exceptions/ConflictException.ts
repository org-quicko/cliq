import { HTTPException } from "./HTTPException";

export class ConflictException extends HTTPException {
    transactionBlockIndex?: number

    /**
     * Creates an instance of ConflictException.
     * @param {string} message
     * @param {number} [transactionBlockIndex] Indicate the index of the transactGet/transactWrite item where the error occurred during the execution of the transactGet/transactWrite operation
     * @param {number} code
     * @param {unknown} cause
     * @memberof ConflictException
     */
    constructor(message: string, transactionBlockIndex?: number, cause?: unknown) {
        super(message, cause, 409);
        this.transactionBlockIndex = transactionBlockIndex

    }
}
