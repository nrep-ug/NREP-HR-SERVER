/**
 * Tests for DELETE /api/hr/delete-user-account/:id
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

describe('HR Routes', () => {
    describe('DELETE /api/hr/delete-user-account/:id', () => {
        it('returns 404 for missing id param segment', async () => {
            const res = await request(app).delete('/api/hr/delete-user-account/');
            expect(res.status).toBe(404);
        });

        it('returns 200 when a valid user ID is provided', async () => {
            const res = await request(app).delete('/api/hr/delete-user-account/user-abc-123');
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({ success: true });
        });

        it('returns a response with success and message properties', async () => {
            const res = await request(app).delete('/api/hr/delete-user-account/some-valid-id');
            expect(res.body).toHaveProperty('success');
            expect(res.body).toHaveProperty('message');
        });
    });
});
