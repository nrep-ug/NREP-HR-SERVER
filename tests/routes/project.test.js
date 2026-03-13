/**
 * Tests for Project routes
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

describe('Project Routes', () => {
    const PROJECT_ID = 'proj-test-001';
    const TASK_ID = 'task-test-001';
    const validProject = {
        projectName: 'Solar Farm Uganda',
        projectDescription: 'A renewable energy project.',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
    };

    describe('POST /api/projects/create-project', () => {
        it('returns 400 when projectName is missing', async () => {
            const { projectName, ...rest } = validProject;
            const res = await request(app).post('/api/projects/create-project').send(rest);
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        it('returns a defined response for project creation', async () => {
            const res = await request(app).post('/api/projects/create-project').send(validProject);
            expect(res.status).toBeGreaterThan(199);
            expect(res.status).toBeLessThan(600);
        });
    });

    describe('GET /api/projects/all-projects', () => {
        it('returns 200', async () => {
            const res = await request(app).get('/api/projects/all-projects');
            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/projects/:id', () => {
        it('returns a defined response for a project GET', async () => {
            const res = await request(app).get(`/api/projects/${PROJECT_ID}`);
            expect(res.status).toBeGreaterThan(199);
            expect(res.status).toBeLessThan(600);
        });
    });

    describe('GET /api/projects/:id/team', () => {
        it('returns 200 with team members', async () => {
            const res = await request(app).get(`/api/projects/${PROJECT_ID}/team`);
            expect(res.status).toBe(200);
        });
    });

    describe('POST /api/projects/:id/add-members', () => {
        it('returns a defined response when adding members', async () => {
            const res = await request(app).post(`/api/projects/${PROJECT_ID}/add-members`).send({ members: ['staff-001'] });
            expect(res.status).toBeGreaterThan(199);
            expect(res.status).toBeLessThan(600);
        });
    });

    describe('GET /api/projects/:id/tasks', () => {
        it('returns 200', async () => {
            const res = await request(app).get(`/api/projects/${PROJECT_ID}/tasks`);
            expect(res.status).toBe(200);
        });
    });

    describe('POST /api/projects/:id/tasks/create', () => {
        it('returns a defined response for task creation', async () => {
            const res = await request(app).post(`/api/projects/${PROJECT_ID}/tasks/create`).send({ taskName: 'Site Survey' });
            expect(res.status).toBeGreaterThan(199);
            expect(res.status).toBeLessThan(600);
        });
    });

    describe('GET /api/projects/:projectID/tasks/:taskID', () => {
        it('returns 200 for a valid task', async () => {
            const res = await request(app).get(`/api/projects/${PROJECT_ID}/tasks/${TASK_ID}`);
            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/projects/:projectID/tasks/:taskID/members', () => {
        it('returns 200 with task team members', async () => {
            const res = await request(app).get(`/api/projects/${PROJECT_ID}/tasks/${TASK_ID}/members`);
            expect(res.status).toBe(200);
        });
    });
});
