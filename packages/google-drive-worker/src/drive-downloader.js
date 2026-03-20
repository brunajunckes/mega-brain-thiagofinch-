'use strict';

const https = require('https');
const { URL } = require('url');
const DriveExtractor = require('./drive-extractor');

/**
 * DriveDownloader — Download files from Google Drive links
 *
 * Techniques:
 * - Direct download via uc?export=download endpoint
 * - Confirmation cookie handling for large files
 * - Export format conversion for Google native documents
 * - Retry logic with exponential backoff
 *
 * @class DriveDownloader
 * @version 1.0.0
 */
class DriveDownloader {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.timeout = options.timeout || 30000;
    this.confirmationCookie = null;
  }

  /**
   * Download file from Google Drive URL
   * @param {string} urlOrFileId Google Drive URL or File ID
   * @param {string} format Export format (for Google docs)
   * @returns {Promise<Buffer>} File contents as buffer
   */
  async download(urlOrFileId, format = null) {
    const fileId = DriveExtractor.extractFileId(urlOrFileId);
    if (!fileId) {
      throw new Error(`Invalid Google Drive URL or File ID: ${urlOrFileId}`);
    }

    // Detect if it's a Google native document and needs export
    if (format || this._isGoogleNativeUrl(urlOrFileId)) {
      return this._downloadExport(urlOrFileId, format);
    }

    return this._downloadDirect(fileId);
  }

  /**
   * Download with retry logic
   * @private
   */
  async _downloadWithRetry(fetchFn, attempt = 0) {
    try {
      return await fetchFn();
    } catch (error) {
      if (attempt < this.maxRetries && this._isRetryableError(error)) {
        const delay = this.retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._downloadWithRetry(fetchFn, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Download file directly from drive.google.com
   * @private
   */
  async _downloadDirect(fileId) {
    return this._downloadWithRetry(async () => {
      const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
      return new Promise((resolve, reject) => {
        https.get(url, { timeout: this.timeout }, (response) => {
          // Handle confirmation cookie for large files
          if (response.statusCode === 303 && response.headers.location) {
            const redirectUrl = response.headers.location;
            return this._followRedirect(redirectUrl, resolve, reject);
          }

          // Extract confirmation cookie if present
          const setCookie = response.headers['set-cookie'];
          if (setCookie) {
            const cookieMatch = setCookie[0]?.match(/download_warning=([^;]+)/);
            if (cookieMatch) {
              this.confirmationCookie = cookieMatch[1];
            }
          }

          // If we got a confirmation page, retry with cookie
          if (response.statusCode === 200 && this.confirmationCookie) {
            return this._downloadWithCookie(fileId, resolve, reject);
          }

          if (response.statusCode !== 200) {
            reject(new Error(`HTTP ${response.statusCode} from Google Drive`));
            return;
          }

          const chunks = [];
          response.on('data', chunk => chunks.push(chunk));
          response.on('end', () => resolve(Buffer.concat(chunks)));
          response.on('error', reject);
        }).on('error', reject);
      });
    });
  }

  /**
   * Follow redirect and download
   * @private
   */
  _followRedirect(redirectUrl, resolve, reject) {
    https.get(redirectUrl, { timeout: this.timeout }, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} on redirect`));
        return;
      }

      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  }

  /**
   * Download with confirmation cookie (for large files)
   * @private
   */
  async _downloadWithCookie(fileId, resolve, reject) {
    const url = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${this.confirmationCookie}`;

    https.get(url, { timeout: this.timeout }, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} with cookie`));
        return;
      }

      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  }

  /**
   * Download exported file (for Google Docs/Sheets/Slides)
   * @private
   */
  async _downloadExport(urlOrFileId, format = 'pdf') {
    return this._downloadWithRetry(async () => {
      const fileId = DriveExtractor.extractFileId(urlOrFileId);

      // Detect document type from URL
      let docType = 'document';
      if (typeof urlOrFileId === 'string') {
        if (urlOrFileId.includes('/spreadsheets/')) docType = 'spreadsheets';
        if (urlOrFileId.includes('/presentation/')) docType = 'presentation';
      }

      const exportUrl = DriveExtractor.getExportUrl(fileId, format);

      return new Promise((resolve, reject) => {
        https.get(exportUrl, { timeout: this.timeout }, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`HTTP ${response.statusCode} on export`));
            return;
          }

          const chunks = [];
          response.on('data', chunk => chunks.push(chunk));
          response.on('end', () => resolve(Buffer.concat(chunks)));
          response.on('error', reject);
        }).on('error', reject);
      });
    });
  }

  /**
   * Check if URL is a Google native document
   * @private
   */
  _isGoogleNativeUrl(url) {
    if (typeof url !== 'string') return false;
    return url.includes('/document/')
      || url.includes('/spreadsheets/')
      || url.includes('/presentation/');
  }

  /**
   * Check if error is retryable
   * @private
   */
  _isRetryableError(error) {
    if (!error) return false;
    // Retry on network errors and rate limiting
    return error.code === 'ECONNRESET'
      || error.code === 'ETIMEDOUT'
      || error.code === 'ECONNREFUSED'
      || error.message?.includes('429')
      || error.message?.includes('503');
  }

  /**
   * Download multiple files in sequence
   * @param {Array<string>} urls Google Drive URLs
   * @param {Object} options Download options
   * @returns {Promise<Object>} Map of URL to buffer
   */
  async downloadBatch(urls, options = {}) {
    const results = {};
    const errors = {};

    for (const url of urls) {
      try {
        results[url] = await this.download(url, options.format);
      } catch (error) {
        errors[url] = error.message;
      }
    }

    return { success: results, errors };
  }

  /**
   * Get file info without downloading
   * @param {string} urlOrFileId Google Drive URL or File ID
   * @returns {Object} File info
   */
  getFileInfo(urlOrFileId) {
    const parsed = DriveExtractor.parseUrl(urlOrFileId);
    return {
      fileId: parsed.id,
      type: parsed.type,
      isNativeDocument: parsed.isDoc || parsed.isSheet || parsed.isSlide,
      availableFormats: parsed.isDoc
        ? DriveExtractor.getExportFormats('document')
        : parsed.isSheet
          ? DriveExtractor.getExportFormats('spreadsheet')
          : parsed.isSlide
            ? DriveExtractor.getExportFormats('presentation')
            : [],
      directUrl: parsed.directUrl,
    };
  }
}

module.exports = DriveDownloader;
