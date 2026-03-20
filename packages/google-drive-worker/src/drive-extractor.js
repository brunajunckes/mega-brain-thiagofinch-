'use strict';

/**
 * DriveExtractor — Extract and generate direct links from Google Drive URLs
 *
 * Techniques:
 * - Extract File ID from share links
 * - Generate direct download URLs
 * - Handle folder links
 * - Convert docs/sheets/slides to downloadable formats
 *
 * @class DriveExtractor
 * @version 1.0.0
 */
class DriveExtractor {
  /**
   * Extract file ID from Google Drive URL
   * @param {string} url Google Drive URL
   * @returns {string|null} File ID or null
   */
  static extractFileId(url) {
    if (!url) return null;

    // Pattern 1: /d/FILE_ID/view or /d/FILE_ID/
    const pattern1 = /\/d\/([a-zA-Z0-9-_]+)/;
    const match1 = url.match(pattern1);
    if (match1) return match1[1];

    // Pattern 2: ?id=FILE_ID
    const pattern2 = /[?&]id=([a-zA-Z0-9-_]+)/;
    const match2 = url.match(pattern2);
    if (match2) return match2[1];

    // Pattern 3: Direct ID (already extracted)
    if (/^[a-zA-Z0-9-_]{20,}$/.test(url)) return url;

    return null;
  }

  /**
   * Extract folder ID from Google Drive URL
   * @param {string} url Google Drive folder URL
   * @returns {string|null} Folder ID or null
   */
  static extractFolderId(url) {
    if (!url) return null;

    // Pattern: /folders/FOLDER_ID
    const pattern = /\/folders\/([a-zA-Z0-9-_]+)/;
    const match = url.match(pattern);
    if (match) return match[1];

    // Pattern: ?id=FOLDER_ID (in context)
    const idPattern = /[?&]id=([a-zA-Z0-9-_]{20,})/;
    const idMatch = url.match(idPattern);
    if (idMatch) return idMatch[1];

    return null;
  }

  /**
   * Generate direct download URL for file
   * @param {string} fileIdOrUrl File ID or full URL
   * @returns {string} Direct download URL
   */
  static getDirectDownloadUrl(fileIdOrUrl) {
    const fileId = this.extractFileId(fileIdOrUrl);
    if (!fileId) {
      throw new Error(`Invalid Google Drive URL or File ID: ${fileIdOrUrl}`);
    }

    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  /**
   * Get export URL for Google Docs/Sheets/Slides
   * @param {string} fileIdOrUrl File ID or URL
   * @param {string} format Export format (pdf, csv, xlsx, pptx, docx, etc)
   * @returns {string} Export URL
   */
  static getExportUrl(fileIdOrUrl, format = 'pdf') {
    const fileId = this.extractFileId(fileIdOrUrl);
    if (!fileId) {
      throw new Error(`Invalid Google Drive URL or File ID: ${fileIdOrUrl}`);
    }

    // Detect document type from URL if available
    let docType = 'document'; // default

    if (typeof fileIdOrUrl === 'string') {
      if (fileIdOrUrl.includes('/spreadsheets/')) docType = 'spreadsheets';
      if (fileIdOrUrl.includes('/presentation/')) docType = 'presentation';
    }

    const baseUrl = `https://docs.google.com/${docType}/d/${fileId}/export`;
    return `${baseUrl}?format=${format}`;
  }

  /**
   * Get folder view URL with proper permissions
   * @param {string} folderId Folder ID
   * @returns {string} Folder URL
   */
  static getFolderUrl(folderId) {
    const id = this.extractFolderId(folderId);
    if (!id) {
      throw new Error(`Invalid Google Drive Folder ID: ${folderId}`);
    }

    return `https://drive.google.com/drive/folders/${id}?usp=sharing`;
  }

  /**
   * Parse Google Drive info from URL
   * @param {string} url Drive URL
   * @returns {Object} Parsed info
   */
  static parseUrl(url) {
    if (!url) return { error: 'URL required' };

    const result = {
      originalUrl: url,
      type: null,
      id: null,
      isFolder: false,
      isDoc: false,
      isSheet: false,
      isSlide: false,
      directUrl: null,
    };

    // Check type
    if (url.includes('/folders/')) {
      result.type = 'folder';
      result.isFolder = true;
      result.id = this.extractFolderId(url);
      result.directUrl = this.getFolderUrl(result.id);
    } else if (url.includes('/spreadsheets/')) {
      result.type = 'spreadsheet';
      result.isSheet = true;
      result.id = this.extractFileId(url);
      result.directUrl = this.getExportUrl(url, 'csv');
    } else if (url.includes('/presentation/')) {
      result.type = 'presentation';
      result.isSlide = true;
      result.id = this.extractFileId(url);
      result.directUrl = this.getExportUrl(url, 'pptx');
    } else if (url.includes('/document/')) {
      result.type = 'document';
      result.isDoc = true;
      result.id = this.extractFileId(url);
      result.directUrl = this.getExportUrl(url, 'pdf');
    } else {
      result.type = 'file';
      result.id = this.extractFileId(url);
      result.directUrl = this.getDirectDownloadUrl(url);
    }

    return result;
  }

  /**
   * Validate if URL is Google Drive link
   * @param {string} url URL to validate
   * @returns {boolean} Is valid Google Drive URL
   */
  static isValidDriveUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  }

  /**
   * Get all export format options for a file
   * @param {string} type File type (document, spreadsheet, presentation)
   * @returns {Array} Available formats
   */
  static getExportFormats(type = 'document') {
    const formats = {
      document: ['pdf', 'docx', 'odt', 'rtf', 'txt', 'epub', 'zip'],
      spreadsheet: ['csv', 'tsv', 'xlsx', 'ods', 'pdf', 'xls', 'zip'],
      presentation: ['pptx', 'odp', 'pdf', 'txt', 'zip'],
    };

    return formats[type] || [];
  }
}

module.exports = DriveExtractor;
