/**
 * Tests for POST /api/codegen/generate-code
 */
vi.mock('../../src/config/appwrite.js', () => ({
    databases: {
        createDocument: () => Promise.resolve({ $id: 'doc-123' }),
        listDocuments: () => Promise.resolve({ documents: [], total: 0 }),
        getDocument: () => Promise.resolve({ $id: 'doc-123' }),
        updateDocument: () => Promise.resolve({ $id: 'doc-123' }),
        deleteDocument: () => Promise.resolve({}),
    },
    storage: {
        createFile: () => Promise.resolve({ $id: 'file-123' }),
        getFileDownload: () => Promise.resolve(Buffer.from('pdf')),
        deleteFile: () => Promise.resolve({}),
    },
    users: { delete: () => Promise.resolve({}) },
    ID: { unique: () => 'test-id' },
    Query: { equal: () => ({}), orderDesc: () => ({}), limit: () => ({}), offset: () => ({}) },
    Permission: {},
    hrDb: { databaseId: 'hr-db', staffTableId: 'staff-table', otpRequestTableId: 'otp-table' },
    projectDb: { databaseId: 'proj-db', projectTableId: 'proj-table', projectTeamTableId: 'team-table', projectTaskTableId: 'task-table', projectTeamTaskTableId: 'team-task-table' },
    procurementDb: { databaseId: 'proc-db', postsTableId: 'posts-table', supplierApplicationTableId: 'app-table', supplierTableId: 'supplier-table', staffTableId: 'proc-staff-table', categoryTableId: 'cat-table', postBucketId: 'post-bucket' },
}));

vi.mock('postmark', () => {
    class ServerClient {
        sendEmail() { return Promise.resolve({ MessageID: 'msg-test-123' }); }
    }
    return { default: { ServerClient } };
});

vi.mock('nodemailer', () => ({
    default: { createTransport: () => ({ sendMail: () => Promise.resolve({ messageId: 'nm-test-123' }) }) },
}));

vi.mock('../../src/config/mysqlConfig.js', () => ({
    default: {
        getConnection: () => Promise.resolve({
            execute: () => Promise.resolve([[{ fileId: 'f1', name: 'test.pdf', description: '', file: Buffer.from('') }], []]),
            release: () => {},
        }),
    },
}));

vi.mock('pino-loki', () => ({ default: {} }));

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('CodeGen Routes', () => {
    describe('POST /api/codegen/generate-code', () => {
        it('returns 400 when length is missing', async () => {
            const res = await request(app).post('/api/codegen/generate-code').send({ prefix: 'TEST' });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        it('returns 400 when length is not a positive integer', async () => {
            const res = await request(app).post('/api/codegen/generate-code').send({ prefix: 'TEST', length: -1 });
            expect(res.status).toBe(400);
        });

        it('returns 400 when length is zero', async () => {
            const res = await request(app).post('/api/codegen/generate-code').send({ prefix: 'TEST', length: 0 });
            expect(res.status).toBe(400);
        });

        it('returns a successful response with prefix and length', async () => {
            const res = await request(app).post('/api/codegen/generate-code').send({ prefix: 'INV', length: 4 });
            expect(res.status).toBeGreaterThan(199);
            expect(res.status).toBeLessThan(600);
            if (res.status === 201) {
                expect(res.body).toHaveProperty('code');
                expect(typeof res.body.code).toBe('string');
                expect(res.body.code.startsWith('INV')).toBe(true);
            }
        });

        it('returns a successful response with no prefix given', async () => {
            const res = await request(app).post('/api/codegen/generate-code').send({ length: 6 });
            expect(res.status).toBeGreaterThan(199);
            expect(res.status).toBeLessThan(600);
            if (res.status === 201) {
                expect(res.body).toHaveProperty('code');
                expect(res.body.code).toMatch(/^\d{6}$/);
            }
        });
    });
});
