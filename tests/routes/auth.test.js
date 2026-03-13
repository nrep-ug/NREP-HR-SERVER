/**
 * Tests for POST /api/auth/signin and POST /api/auth/request-otp
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

describe('Auth Routes', () => {
    describe('POST /api/auth/signin', () => {
        it('returns 400 when userID is missing', async () => {
            const res = await request(app).post('/api/auth/signin').send({ password: 'test123' });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        it('returns 400 when password is missing', async () => {
            const res = await request(app).post('/api/auth/signin').send({ userID: 'user1' });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        it('returns 400 when both fields are missing', async () => {
            const res = await request(app).post('/api/auth/signin').send({});
            expect(res.status).toBe(400);
            expect(res.body.errors.length).toBeGreaterThanOrEqual(2);
        });

        it('returns a defined response (not a crash) with full valid input', async () => {
            const res = await request(app).post('/api/auth/signin').send({ userID: 'testUser', password: 'testPass' });
            expect([200, 201, 401]).toContain(res.status);
            expect(res.body).toHaveProperty('success');
        });
    });

    describe('POST /api/auth/request-otp', () => {
        it('returns 400 when email is missing', async () => {
            const res = await request(app).post('/api/auth/request-otp').send({ timeValidity: 10 });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        it('returns 400 when timeValidity is missing', async () => {
            const res = await request(app).post('/api/auth/request-otp').send({ email: 'test@nrep.ug' });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        it('returns handled failure for a non-nrep.ug email', async () => {
            const res = await request(app).post('/api/auth/request-otp').send({ email: 'someone@gmail.com', timeValidity: 10 });
            expect([200, 201, 400]).toContain(res.status);
        });
    });
});
