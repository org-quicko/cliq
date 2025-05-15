/* eslint-disable no-use-before-define */
export class Endpoint {
  static build(
    baseUrl: string,
    endpoint: string,
    args: unknown,
    queryParams?: Record<string, string | number | boolean>
  ) {
    let url = baseUrl.concat(endpoint.toString());
    const regex = '\\{(\\w*)\\}';

    let i = 0;

    let matches: RegExpMatchArray | null;
    const argsArray: Array<unknown> = args instanceof Array ? args : [args];
    do {
      matches = url.match(regex);
      if (matches != null) {
        url = url.replace(
          matches[0],
          args != null &&
            argsArray.length > i &&
            argsArray[i] != null &&
            (argsArray[i] as string).toString() !== ''
            ? (argsArray[i] as string).toString()
            : ''
        );
      }

      i += 1;
    } while (matches != null);

    const constructedUrl = new URL(url);
    // Append query parameters.
    if (queryParams) {
      Object.keys(queryParams).forEach((key) => {
        if (queryParams[key] === undefined) return;
        const value = queryParams[key];
        if (Array.isArray(value)) {
          value.forEach((item) => {
            constructedUrl.searchParams.append(key, item);
          });
        } else { 
          constructedUrl.searchParams.append(key, value.toString());
        }
      });
    }
    return constructedUrl.toString();
  }
}

export enum APIURL {
	CREATE_PROMOTER = '/programs/{program_id}/promoters',
	GET_PROMOTER = '/programs/{program_id}/promoters/{promoter_id}',
	REGISTER_PROMOTER_IN_PROGRAM = '/programs/{program_id}/promoters/{promoter_id}/register',
	CREATE_LINK = '/programs/{program_id}/promoters/{promoter_id}/links',
	GET_LINK_ANALYTICS = '/programs/{program_id}/promoters/{promoter_id}/link_analytics',
  CREATE_PURCHASE = '/purchases',
  CREATE_SIGNUP = '/signups',
}
