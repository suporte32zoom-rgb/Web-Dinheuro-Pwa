declare module "finnhub" {
  export class DefaultApi {
    constructor(apiKey?: string);
    quote(symbol: string, callback: (error: any, data: any, response: any) => void): void;
    stockCandles(
      symbol: string,
      resolution: string,
      from: number,
      to: number,
      callback: (error: any, data: any, response: any) => void
    ): void;
    companyNews(
      symbol: string,
      from: string,
      to: string,
      callback: (error: any, data: any, response: any) => void
    ): void;
    companyProfile2(
      opts: { symbol?: string; isin?: string; cusip?: string },
      callback: (error: any, data: any, response: any) => void
    ): void;
    marketNews(
      category: string,
      opts: any,
      callback: (error: any, data: any, response: any) => void
    ): void;
    recommendationTrends(
      symbol: string,
      callback: (error: any, data: any, response: any) => void
    ): void;
    priceTarget(
      symbol: string,
      callback: (error: any, data: any, response: any) => void
    ): void;
    companyBasicFinancials(
      symbol: string,
      metric: string,
      callback: (error: any, data: any, response: any) => void
    ): void;
    cryptoCandles(
      symbol: string,
      resolution: string,
      from: number,
      to: number,
      callback: (error: any, data: any, response: any) => void
    ): void;
    forexCandles(
      symbol: string,
      resolution: string,
      from: number,
      to: number,
      callback: (error: any, data: any, response: any) => void
    ): void;
    indicesConstituents(
      symbol: string,
      callback: (error: any, data: any, response: any) => void
    ): void;
    etfsProfile(
      opts: { symbol?: string },
      callback: (error: any, data: any, response: any) => void
    ): void;
  }

  const finnhub: {
    DefaultApi: typeof DefaultApi;
  };

  export default finnhub;
}
