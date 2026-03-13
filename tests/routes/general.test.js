/**
 * Tests for POST /api/general/send-email
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

describe('General Routes', () => {
    const validPayload = {
        email: 'recipient@nrep.ug',
        subject: 'Test Subject',
        text: 'Hello from the test suite.',
    };

    describe('POST /api/general/send-email', () => {
        it('returns 400 when email is missing', async () => {
            const { email, ...rest } = validPayload;
            const res = await request(app).post('/api/general/send-email').send(rest);
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        it('returns 400 when email is invalid', async () => {
            const res = await request(app).post('/api/general/send-email').send({ ...validPayload, email: 'not-an-email' });
            expect(res.status).toBe(400);
        });

        it('returns 400 when subject is missing', async () => {
            const { subject, ...rest } = validPayload;
            const res = await request(app).post('/api/general/send-email').send(rest);
            expect(res.status).toBe(400);
        });

        it('returns 400 when text is missing', async () => {
            const { text, ...rest } = validPayload;
            const res = await request(app).post('/api/general/send-email').send(rest);
            expect(res.status).toBe(400);
        });

        it('returns 400 when cc is an invalid email', async () => {
            const res = await request(app).post('/api/general/send-email').send({ ...validPayload, cc: 'not-valid' });
            expect(res.status).toBe(400);
        });

        it('returns 200 with a valid payload', async () => {
            const res = await request(app).post('/api/general/send-email').send(validPayload);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        });

        it('returns 200 with valid cc included', async () => {
            const res = await request(app).post('/api/general/send-email').send({ ...validPayload, cc: 'cc@nrep.ug' });
            expect(res.status).toBe(200);
        });
    });
});
