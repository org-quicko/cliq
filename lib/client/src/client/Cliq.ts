// eslint-disable-next-line import/no-extraneous-dependencies
import { CliqCredentials } from '../beans';
import { Link, Promoter } from './methods';
import { Purchase } from './methods/Purchase';
import { SignUp } from './methods/Signup';

export class Cliq { 
  public PROMOTERS: Promoter;

  public LINK: Link;

  public PURCHASE: Purchase;
  
  public SIGNUP: SignUp;


  constructor(config: CliqCredentials, baseUrl: string) {
    this.PROMOTERS = new Promoter(config, baseUrl);
    this.LINK = new Link(config, baseUrl);
    this.PURCHASE = new Purchase(config, baseUrl);
    this.SIGNUP = new SignUp(config, baseUrl);
  }
}
