declare module "pdf-parse" {
  interface PdfParseResult {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }
  function pdf(buffer: Buffer | Uint8Array): Promise<PdfParseResult>;
  export default pdf;
}