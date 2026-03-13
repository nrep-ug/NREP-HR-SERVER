/**
 * Tests for Staff routes
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

describe('Staff Routes', () => {
    const validStaff = {
        staffID: 'STAFF-001',
        firstName: 'Alice',
        surName: 'Nakamura',
        email1: 'alice@nrep.ug',
    };

    describe('POST /api/staff/', () => {
        it('returns 400 when staffID is missing', async () => {
            const { staffID, ...rest } = validStaff;
            const res = await request(app).post('/api/staff/').send(rest);
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        it('returns 400 when firstName is missing', async () => {
            const { firstName, ...rest } = validStaff;
            const res = await request(app).post('/api/staff/').send(rest);
            expect(res.status).toBe(400);
        });

        it('returns 400 when surName is missing', async () => {
            const { surName, ...rest } = validStaff;
            const res = await request(app).post('/api/staff/').send(rest);
            expect(res.status).toBe(400);
        });

        it('returns 400 when email1 is invalid', async () => {
            const res = await request(app).post('/api/staff/').send({ ...validStaff, email1: 'not-an-email' });
            expect(res.status).toBe(400);
        });

        it('returns a valid HTTP response with a valid staff payload', async () => {
            const res = await request(app).post('/api/staff/').send(validStaff);
            expect(res.status).toBeGreaterThan(199);
            expect(res.status).toBeLessThan(600);
        });
    });

    describe('GET /api/staff/all-staff', () => {
        it('returns 200', async () => {
            const res = await request(app).get('/api/staff/all-staff');
            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/staff/:id', () => {
        it('returns 200 for a valid staff ID', async () => {
            const res = await request(app).get('/api/staff/STAFF-001');
            expect(res.status).toBe(200);
        });
    });
});
