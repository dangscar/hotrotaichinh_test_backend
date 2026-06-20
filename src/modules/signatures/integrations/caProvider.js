import config from '../../../config/index.js';

export class CAProvider {
  constructor() {
    this.apiUrl = config.ca.apiUrl;
    this.apiKey = config.ca.apiKey;
  }

  async sign(documentBuffer, certificateId) {
    // TODO: Call external CA API
    return { success: true, signatureData: null };
  }

  async verify(signatureData) {
    // TODO: Call external CA verification API
    return { valid: true };
  }
}

export default new CAProvider();
