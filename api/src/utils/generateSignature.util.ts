import * as crypto from 'crypto';

export function generateSignature(payload: object, secret: string) {
    
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadString);
    const signature = hmac.digest('hex');
    
    return signature;
}