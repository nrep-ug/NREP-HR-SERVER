// import { Client, Databases, ID, Query, Permission, Storage } from 'node-appwrite';
// import dotenv from 'dotenv';

// dotenv.config();

// const client = new Client();

// client
//     .setEndpoint(process.env.APPWRITE_ENDPOINT)
//     .setProject(process.env.APPWRITE_PROJECT_ID)
//     .setKey(process.env.APPWRITE_API_KEY);

// const databases = new Databases(client);
// const storage = new Storage(client);

// /* HR-DATABASE */
// const hrDatabaseId = process.env.HR_DB_ID;
// const staffTableId = process.env.STAFF_TABLE_ID;
// const otpRequestTableId = process.env.OTP_REQUEST_TABLE_ID;

// // PROJECT DATABASE
// const projectDatabaseId = process.env.PROJECT_DB_ID;
// const projectTableId = process.env.PROJECT_TABLE_ID;
// const projectTeamTableId = process.env.PROJECT_TEAM_TABLE_ID;
// const projectTaskTableId = process.env.PROJECT_TASK_TABLE_ID
// const projectTeamTaskTableId = process.env.PROJECT_TASK_TEAM_TABLE_ID

// // PROCUREMENT DATABASE
// const procureDatabaseId = process.env.PROCUREMENT_DB_ID
// const procurePostsTableId = process.env.PROCUREMENT_POSTS_TABLE_ID
// const procureSupplierApplicationTableId = process.env.PROCUREMENT_SUPPLIER_APPLICATION_TABLE_ID
// const procureSupplierTableId = process.env.PROCUREMENT_SUPPLIER_TABLE_ID
// const procureStaffTableId = process.env.PROCUREMENT_STAFF_TABLE_ID
// const procureCategoryTableId = process.env.PROCUREMENT_CATEGORY_TABLE_ID
// const procurePostBucketId = process.env.POSTED_PROCUREMENT_BUCKET_ID

// export {
//     client,
//     storage,
//     databases,
//     hrDatabaseId,
//     staffTableId,
//     otpRequestTableId,
//     projectDatabaseId,
//     projectTableId,
//     projectTeamTableId,
//     projectTaskTableId,
//     projectTeamTaskTableId,
//     procureDatabaseId,
//     procurePostsTableId,
//     procureSupplierApplicationTableId,
//     procureSupplierTableId,
//     procureStaffTableId,
//     procureCategoryTableId,
//     procurePostBucketId,
//     ID,
//     Query,
//     Permission,
// };

// appwrite.js
import { Client, Databases, ID, Query, Permission, Storage, Users } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);
const databases = new Databases(client);
const storage = new Storage(client);

// ——— HR Database ———
export const hrDb = {
    databaseId: process.env.HR_DB_ID,
    staffTableId: process.env.STAFF_TABLE_ID,
    otpRequestTableId: process.env.OTP_REQUEST_TABLE_ID,
};

// ——— Project Database ———
export const projectDb = {
    databaseId: process.env.PROJECT_DB_ID,
    projectTableId: process.env.PROJECT_TABLE_ID,
    projectTeamTableId: process.env.PROJECT_TEAM_TABLE_ID,
    projectTaskTableId: process.env.PROJECT_TASK_TABLE_ID,
    projectTeamTaskTableId: process.env.PROJECT_TASK_TEAM_TABLE_ID,
};

// ——— Procurement Database ———
export const procurementDb = {
    databaseId: process.env.PROCUREMENT_DB_ID,
    postsTableId: process.env.PROCUREMENT_POSTS_TABLE_ID,
    supplierApplicationTableId: process.env.PROCUREMENT_SUPPLIER_APPLICATION_TABLE_ID,
    supplierTableId: process.env.PROCUREMENT_SUPPLIER_TABLE_ID,
    staffTableId: process.env.PROCUREMENT_STAFF_TABLE_ID,
    categoryTableId: process.env.PROCUREMENT_CATEGORY_TABLE_ID,
    postBucketId: process.env.POSTED_PROCUREMENT_BUCKET_ID,
};

export {
    users,
    client,
    storage,
    databases,
    ID,
    Query,
    Permission,
};
