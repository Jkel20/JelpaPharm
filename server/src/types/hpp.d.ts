declare module 'hpp' {
  import { RequestHandler } from 'express';
  
  interface HppOptions {
    checkBody?: boolean;
    checkBodyOnlyForContentType?: string[];
    checkQuery?: boolean;
    whitelist?: string[];
    whitelistFn?: (value: string) => boolean;
  }
  
  function hpp(options?: HppOptions): RequestHandler;
  export = hpp;
}
