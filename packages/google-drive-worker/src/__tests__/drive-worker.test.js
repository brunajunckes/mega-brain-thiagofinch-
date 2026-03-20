'use strict';

const DriveExtractor = require('../drive-extractor');
const DriveDownloader = require('../drive-downloader');

describe('Google Drive Worker', () => {
  describe('DriveExtractor', () => {
    describe('extractFileId', () => {
      test('should extract file ID from /d/FILE_ID/view URL', () => {
        const url = 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view';
        const fileId = DriveExtractor.extractFileId(url);
        expect(fileId).toBe('1A2B3C4D5E6F7G8H9I0J');
      });

      test('should extract file ID from ?id=FILE_ID URL', () => {
        const url = 'https://docs.google.com/document/d/1A2B3C4D5E6F7G8H9I0J?id=abc123';
        const fileId = DriveExtractor.extractFileId(url);
        expect(fileId).toBe('1A2B3C4D5E6F7G8H9I0J');
      });

      test('should accept direct file ID string', () => {
        const fileId = '1A2B3C4D5E6F7G8H9I0J123456';
        const result = DriveExtractor.extractFileId(fileId);
        expect(result).toBe(fileId);
      });

      test('should return null for invalid input', () => {
        expect(DriveExtractor.extractFileId('')).toBe(null);
        expect(DriveExtractor.extractFileId(null)).toBe(null);
        expect(DriveExtractor.extractFileId('invalid')).toBe(null);
      });
    });

    describe('extractFolderId', () => {
      test('should extract folder ID from /folders/FOLDER_ID URL', () => {
        const url = 'https://drive.google.com/drive/folders/1FolderID123456789/';
        const folderId = DriveExtractor.extractFolderId(url);
        expect(folderId).toBe('1FolderID123456789');
      });

      test('should return null for invalid folder URL', () => {
        const url = 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view';
        const folderId = DriveExtractor.extractFolderId(url);
        expect(folderId).toBe(null);
      });
    });

    describe('getDirectDownloadUrl', () => {
      test('should generate direct download URL', () => {
        const fileId = '1A2B3C4D5E6F7G8H9I0J';
        const url = DriveExtractor.getDirectDownloadUrl(fileId);
        expect(url).toBe('https://drive.google.com/uc?export=download&id=1A2B3C4D5E6F7G8H9I0J');
      });

      test('should throw error for invalid input', () => {
        expect(() => {
          DriveExtractor.getDirectDownloadUrl('invalid');
        }).toThrow('Invalid Google Drive URL or File ID');
      });
    });

    describe('getExportUrl', () => {
      test('should generate PDF export URL for document', () => {
        const url = 'https://docs.google.com/document/d/1ABC/edit';
        const exportUrl = DriveExtractor.getExportUrl(url, 'pdf');
        expect(exportUrl).toContain('docs.google.com');
        expect(exportUrl).toContain('export');
        expect(exportUrl).toContain('format=pdf');
      });

      test('should generate CSV export URL for spreadsheet', () => {
        const url = 'https://docs.google.com/spreadsheets/d/1ABC/edit';
        const exportUrl = DriveExtractor.getExportUrl(url, 'csv');
        expect(exportUrl).toContain('spreadsheets');
        expect(exportUrl).toContain('format=csv');
      });

      test('should generate PPTX export URL for presentation', () => {
        const url = 'https://docs.google.com/presentation/d/1ABC/edit';
        const exportUrl = DriveExtractor.getExportUrl(url, 'pptx');
        expect(exportUrl).toContain('presentation');
        expect(exportUrl).toContain('format=pptx');
      });

      test('should default to PDF format', () => {
        const url = 'https://docs.google.com/document/d/1ABC/edit';
        const exportUrl = DriveExtractor.getExportUrl(url);
        expect(exportUrl).toContain('format=pdf');
      });
    });

    describe('parseUrl', () => {
      test('should parse file URL correctly', () => {
        const url = 'https://drive.google.com/file/d/1ABC/view';
        const parsed = DriveExtractor.parseUrl(url);
        expect(parsed.type).toBe('file');
        expect(parsed.id).toBe('1ABC');
        expect(parsed.isFolder).toBe(false);
      });

      test('should parse folder URL correctly', () => {
        const url = 'https://drive.google.com/drive/folders/1FolderID/';
        const parsed = DriveExtractor.parseUrl(url);
        expect(parsed.type).toBe('folder');
        expect(parsed.isFolder).toBe(true);
      });

      test('should parse document URL correctly', () => {
        const url = 'https://docs.google.com/document/d/1ABC/edit';
        const parsed = DriveExtractor.parseUrl(url);
        expect(parsed.type).toBe('document');
        expect(parsed.isDoc).toBe(true);
      });

      test('should parse spreadsheet URL correctly', () => {
        const url = 'https://docs.google.com/spreadsheets/d/1ABC/edit';
        const parsed = DriveExtractor.parseUrl(url);
        expect(parsed.type).toBe('spreadsheet');
        expect(parsed.isSheet).toBe(true);
      });

      test('should parse presentation URL correctly', () => {
        const url = 'https://docs.google.com/presentation/d/1ABC/edit';
        const parsed = DriveExtractor.parseUrl(url);
        expect(parsed.type).toBe('presentation');
        expect(parsed.isSlide).toBe(true);
      });

      test('should return error for empty URL', () => {
        const parsed = DriveExtractor.parseUrl('');
        expect(parsed.error).toBe('URL required');
      });
    });

    describe('isValidDriveUrl', () => {
      test('should validate Google Drive URLs', () => {
        expect(DriveExtractor.isValidDriveUrl('https://drive.google.com/file/d/1ABC')).toBe(true);
        expect(DriveExtractor.isValidDriveUrl('https://docs.google.com/document/d/1ABC')).toBe(true);
      });

      test('should reject invalid URLs', () => {
        expect(DriveExtractor.isValidDriveUrl('https://example.com')).toBe(false);
        expect(DriveExtractor.isValidDriveUrl('')).toBe(false);
        expect(DriveExtractor.isValidDriveUrl(null)).toBe(false);
      });
    });

    describe('getExportFormats', () => {
      test('should return document export formats', () => {
        const formats = DriveExtractor.getExportFormats('document');
        expect(formats).toContain('pdf');
        expect(formats).toContain('docx');
        expect(formats).toContain('txt');
      });

      test('should return spreadsheet export formats', () => {
        const formats = DriveExtractor.getExportFormats('spreadsheet');
        expect(formats).toContain('csv');
        expect(formats).toContain('xlsx');
      });

      test('should return presentation export formats', () => {
        const formats = DriveExtractor.getExportFormats('presentation');
        expect(formats).toContain('pptx');
        expect(formats).toContain('pdf');
      });

      test('should return empty array for unknown type', () => {
        const formats = DriveExtractor.getExportFormats('unknown');
        expect(formats).toEqual([]);
      });
    });
  });

  describe('DriveDownloader', () => {
    let downloader;

    beforeEach(() => {
      downloader = new DriveDownloader({
        maxRetries: 1,
        retryDelay: 100,
        timeout: 5000,
      });
    });

    describe('constructor', () => {
      test('should create downloader with default options', () => {
        const dl = new DriveDownloader();
        expect(dl.maxRetries).toBe(3);
        expect(dl.retryDelay).toBe(1000);
        expect(dl.timeout).toBe(30000);
      });

      test('should create downloader with custom options', () => {
        const dl = new DriveDownloader({
          maxRetries: 5,
          retryDelay: 2000,
          timeout: 60000,
        });
        expect(dl.maxRetries).toBe(5);
        expect(dl.retryDelay).toBe(2000);
        expect(dl.timeout).toBe(60000);
      });
    });

    describe('getFileInfo', () => {
      test('should return file info for file URL', () => {
        const url = 'https://drive.google.com/file/d/1ABC/view';
        const info = downloader.getFileInfo(url);
        expect(info.fileId).toBe('1ABC');
        expect(info.type).toBe('file');
        expect(info.isNativeDocument).toBe(false);
      });

      test('should return file info for document URL', () => {
        const url = 'https://docs.google.com/document/d/1ABC/edit';
        const info = downloader.getFileInfo(url);
        expect(info.type).toBe('document');
        expect(info.isNativeDocument).toBe(true);
        expect(info.availableFormats.length).toBeGreaterThan(0);
      });

      test('should return file info for spreadsheet URL', () => {
        const url = 'https://docs.google.com/spreadsheets/d/1ABC/edit';
        const info = downloader.getFileInfo(url);
        expect(info.type).toBe('spreadsheet');
        expect(info.isNativeDocument).toBe(true);
        expect(info.availableFormats).toContain('csv');
      });

      test('should return file info for presentation URL', () => {
        const url = 'https://docs.google.com/presentation/d/1ABC/edit';
        const info = downloader.getFileInfo(url);
        expect(info.type).toBe('presentation');
        expect(info.isNativeDocument).toBe(true);
        expect(info.availableFormats).toContain('pptx');
      });
    });

    describe('download', () => {
      test('should throw error for invalid URL', async () => {
        await expect(downloader.download('invalid')).rejects.toThrow('Invalid Google Drive URL or File ID');
      });

      test('should accept file ID directly', async () => {
        const fileId = '1A2B3C4D5E6F7G8H9I0J123456';
        // This will fail with network error, but not with validation error
        try {
          await downloader.download(fileId);
        } catch (error) {
          expect(error.message).not.toBe('Invalid Google Drive URL or File ID');
        }
      });
    });

    describe('downloadBatch', () => {
      test('should handle multiple URLs', async () => {
        const urls = [
          'https://drive.google.com/file/d/1ABC/view',
          'https://drive.google.com/file/d/2DEF/view',
        ];

        const result = await downloader.downloadBatch(urls);
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('errors');
      });
    });
  });
});
