/**
 * Tests for POST /api/contact
 */
vi.mock('../../src/config/appwrite.js', () => {
    const mockFn = () => Promise.resolve({});
    return {
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
    };
});

vi.mock('postmark', () => {
    class ServerClient {
        sendEmail() { return Promise.resolve({ MessageID: 'msg-test-123' }); }
    }
    return { default: { ServerClient } };
});

vi.mock('nodemailer', () => ({
    default: {
        createTransport: () => ({
            sendMail: () => Promise.resolve({ messageId: 'nm-test-123' }),
        }),
    },
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

describe('Contact Routes', () => {
    const validPayload = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Inquiry',
        message: 'Hello, I have a question.',
        from: 'procurement',
    };

    describe('POST /api/contact', () => {
        it('returns 400 when name is missing', async () => {
            const { name, ...rest } = validPayload;
            const res = await request(app).post('/api/contact').send(rest);
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        it('returns 400 when email is missing', async () => {
            const { email, ...rest } = validPayload;
            const res = await request(app).post('/api/contact').send(rest);
            expect(res.status).toBe(400);
        });

        it('returns 400 when email is invalid', async () => {
            const res = await request(app).post('/api/contact').send({ ...validPayload, email: 'not-an-email' });
            expect(res.status).toBe(400);
        });

        it('returns 400 when subject is missing', async () => {
            const { subject, ...rest } = validPayload;
            const res = await request(app).post('/api/contact').send(rest);
            expect(res.status).toBe(400);
        });

        it('returns 400 when message is missing', async () => {
            const { message, ...rest } = validPayload;
            const res = await request(app).post('/api/contact').send(rest);
            expect(res.status).toBe(400);
        });

        it('returns 400 when from is missing', async () => {
            const { from, ...rest } = validPayload;
            const res = await request(app).post('/api/contact').send(rest);
            expect(res.status).toBe(400);
        });

        it('returns 200 and success:true with valid payload', async () => {
            const res = await request(app).post('/api/contact').send(validPayload);
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({ success: true });
        });
    });
});
