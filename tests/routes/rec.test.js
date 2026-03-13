/**
 * Tests for POST /api/rec/send-reg-confirmation-email
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

describe('REC (Renewable Energy Conference) Routes', () => {
    const validPayload = {
        email: 'attendee@example.com',
        subject: 'REC2025 Registration Confirmation',
        text: '<p>Thank you for registering.</p>',
        year: 2025,
        eventStart: '2025-09-01T08:00:00.000Z',
        eventEnd: '2025-09-01T17:00:00.000Z',
    };

    describe('POST /api/rec/send-reg-confirmation-email', () => {
        it('returns 400 when email is missing', async () => {
            const { email, ...rest } = validPayload;
            const res = await request(app).post('/api/rec/send-reg-confirmation-email').send(rest);
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        it('returns 400 when email is invalid', async () => {
            const res = await request(app).post('/api/rec/send-reg-confirmation-email').send({ ...validPayload, email: 'not-an-email' });
            expect(res.status).toBe(400);
        });

        it('returns 400 when subject is missing', async () => {
            const { subject, ...rest } = validPayload;
            const res = await request(app).post('/api/rec/send-reg-confirmation-email').send(rest);
            expect(res.status).toBe(400);
        });

        it('returns 400 when text is missing', async () => {
            const { text, ...rest } = validPayload;
            const res = await request(app).post('/api/rec/send-reg-confirmation-email').send(rest);
            expect(res.status).toBe(400);
        });

        it('returns 400 when eventStart is missing', async () => {
            const { eventStart, ...rest } = validPayload;
            const res = await request(app).post('/api/rec/send-reg-confirmation-email').send(rest);
            expect(res.status).toBe(400);
        });

        it('returns 400 when eventEnd is missing', async () => {
            const { eventEnd, ...rest } = validPayload;
            const res = await request(app).post('/api/rec/send-reg-confirmation-email').send(rest);
            expect(res.status).toBe(400);
        });

        it('returns 400 when eventStart is not a valid ISO date', async () => {
            const res = await request(app).post('/api/rec/send-reg-confirmation-email').send({ ...validPayload, eventStart: 'not-a-date' });
            expect(res.status).toBe(400);
        });

        it('returns 400 when year is out of range (before 2000)', async () => {
            const res = await request(app).post('/api/rec/send-reg-confirmation-email').send({ ...validPayload, year: 1999 });
            expect(res.status).toBe(400);
        });

        it('returns 200 with a valid payload', async () => {
            const res = await request(app).post('/api/rec/send-reg-confirmation-email').send(validPayload);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        });
    });
});
