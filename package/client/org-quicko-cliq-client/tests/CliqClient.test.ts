import 'dotenv/config';
import { CreateLink, CreatePromoter, CreatePurchase, CreateSignUp, RegisterForProgram } from "@org-quicko/cliq-core";
import { CliqCredentials } from "../src/beans";
import { Cliq } from '../src/client/Cliq';

let promoterId: string;
let refVal: string;

// dev
const baseUrl = "https://dev-cliq.quicko.com/api";
const programId = 'a3cef210-7b2c-4554-92ca-b7e02e64ccb8';
const apiKey = process.env.CLIQ_API_KEY || '';
const apiSecret = process.env.CLIQ_API_SECRET || '';

describe('Cliq Client tests.', () => {
    
    it('should create promoter.', async () => {
        const credentials = new CliqCredentials(apiKey, apiSecret);

        const cliqClient = new Cliq(credentials, baseUrl);

        const body = new CreatePromoter();
        body.name = `Client Test User`;
        body.logoUrl = 'https://quicko.com/logo.png';

        const response = await cliqClient.PROMOTERS.createPromoter(programId, body);
        promoterId = response.promoterId;
    });

    it('should register promoter.', async () => {

        const credentials = new CliqCredentials(apiKey, apiSecret);

        const cliqClient = new Cliq(credentials, baseUrl);

        const body = new RegisterForProgram();
        body.acceptedTermsAndConditions = true;

        if (!promoterId) {
            throw new Error(`Promoter ID wasn't set`);
        }
        await cliqClient.PROMOTERS.registerPromoter(programId, promoterId, body);
    });

    it('should get promoter.', async () => {

        const credentials = new CliqCredentials(apiKey, apiSecret);

        const cliqClient = new Cliq(credentials, baseUrl);

        if (!promoterId) {
            throw new Error(`Promoter ID wasn't set`);
        }

        await cliqClient.PROMOTERS.getPromoter(programId, promoterId);
    });

    it('should create link.', async () => {

        const credentials = new CliqCredentials(apiKey, apiSecret);

        const cliqClient = new Cliq(credentials, baseUrl);

        const random4AlphaNumChars = Math.random().toString(36).substring(2, 6).toLowerCase();

        if (!promoterId) {
            throw new Error(`Promoter ID wasn't set`);
        }

        const body = new CreateLink();
        body.name = `Client Test User's Link`;
        body.refVal = `testrefval-${  random4AlphaNumChars}`;
        refVal = body.refVal;

        await cliqClient.LINK.createLink(programId, promoterId, body);
    });

    it('should get link analytics.', async () => {

        const credentials = new CliqCredentials(apiKey, apiSecret);

        const cliqClient = new Cliq(credentials, baseUrl);

        if (!promoterId) {
            throw new Error(`Promoter ID wasn't set`);
        }

        await cliqClient.LINK.getLinkAnalytics(programId, promoterId);
    });

    it('should get create signup.', async () => {

        const credentials = new CliqCredentials(apiKey, apiSecret);

        const cliqClient = new Cliq(credentials, baseUrl);

        if (!promoterId) {
            throw new Error(`Promoter ID wasn't set`);
        }

        const body = new CreateSignUp();
        const random4AlphaNumChars = Math.random().toString(36).substring(2, 6).toLowerCase();
        body.email = `testmail${random4AlphaNumChars}@mail.com`;
        body.phone = `1234567898`;
        body.refVal = refVal;

        await cliqClient.SIGNUP.createSignUp(body);
    });

    it('should get create purchase.', async () => {

        const credentials = new CliqCredentials(apiKey, apiSecret);

        const cliqClient = new Cliq(credentials, baseUrl);

        if (!promoterId) {
            throw new Error(`Promoter ID wasn't set`);
        }

        const body = new CreatePurchase();
        const random4AlphaNumChars = Math.random().toString(36).substring(2, 6).toLowerCase();
        body.email = `testmail${random4AlphaNumChars}@mail.com`;
        body.phone = `1234567891`;
        body.refVal = refVal;
        body.amount = 101;
        body.itemId = 'item123';

        await cliqClient.PURCHASE.createPurchase(body);
    });
});
