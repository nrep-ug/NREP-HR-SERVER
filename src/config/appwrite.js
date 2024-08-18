import { Client, Databases, ID, Query, Permission, Storage } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client();

client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

// HR-DATABASE
const hrDatabaseId = process.env.HR_DB_ID;
const staffTableId = process.env.STAFF_TABLE_ID;

// PROJECT DATABASE
const projectDatabaseId = process.env.PROJECT_DB_ID;
const projectTableId = process.env.PROJECT_TABLE_ID;
const projectTeamTableId = process.env.PROJECT_TEAM_TABLE_ID;

export {
    client,
    storage,
    databases,
    hrDatabaseId,
    staffTableId,
    projectDatabaseId,
    projectTableId,
    projectTeamTableId,
    ID,
    Query,
    Permission
};

