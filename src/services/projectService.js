import { response } from 'express';
import { storage, databases, ID, Query, projectDatabaseId, projectTableId, projectTeamTableId, projectTaskTableId, projectTeamTaskTableId } from '../config/appwrite.js';
import moment from 'moment-timezone';

export const createProject = async (data) => {
    let projectData = { ...data }; // Create a shallow copy of the data object

    console.log('Project DB id: ', projectDatabaseId + '\n Project table id: ', projectTableId);
    console.log('Project data: ', data);

    const projectID = ID.unique();
    const createdAt = moment().tz('Africa/Nairobi');

    // Create new project in database table
    delete projectData.leadName; // Remove leadName since it's not required in the database table. Only pass what's required
    const response = await databases.createDocument(
        projectDatabaseId,
        projectTableId,
        projectID,
        {
            ...projectData, // Use the modified projectData
            projectID: projectID,
            createdAt: createdAt
        }
    );

    // Create project storage in bucket
    const result = await storage.createBucket(
        projectID, // bucketId
        projectData.name,
        [], // permissions (optional)
        false, // fileSecurity (optional)
        true, // enabled (optional)
        30000000, // maximumFileSize (optional)
        [] // allowedFileExtensions (optional)
    );

    // Add Project Lead to Project Team Table if available
    if (data.managedBy) {
        await addProjectMembers({ members: [{ role: 'Project Lead', staffID: data.managedBy, name: data.leadName, projectID: projectID }], projectID: projectID });
    }

    return response;
};

export const getProject = async (projectId) => {
    console.log('Project ID: ', projectId);
    const response = await databases.getDocument(
        projectDatabaseId,
        projectTableId,
        projectId
    );
    return response;
};

export const getAllProjects = async (query = []) => {
    console.log('getting all projects...');
    const response = await databases.listDocuments(
        projectDatabaseId,
        projectTableId,
        query
    );
    // console.log('all projects: ', response);
    return response;
}

export const addProjectMembers = async (data) => {
    console.log('members: ', data.members)
    for (const member of data.members) {
        console.log('adding member: ', member + ' ProjectID: ', data.projectID);
        const response = await databases.createDocument(
            projectDatabaseId,
            projectTeamTableId,
            'unique()',
            {
                projectID: data.projectID,
                staffID: member.staffID,
                name: member.name,
                role: member.role
            }
        )
    }

    // TODO: Handle cases where a project team member is not added successfully

    return { message: 'Project Team Member(s) added successfully' }
}

export const getProjectTeam = async (projectID) => {
    const response = await databases.listDocuments(
        projectDatabaseId,
        projectTeamTableId,
        [
            Query.limit(1000),
            Query.equal('projectID', projectID)
        ]
    )

    return response
}

//TODO: Function to modify/add Project Leader in case wasn't added during project creation

/* PROJECT TASKS */
export const addProjectTask = async (data) => {
    console.log('tasks: ', data)

    const taskID = ID.unique();
    const createdAt = moment().tz('Africa/Nairobi');

    let response;

    for (const task of data) {
        console.log('adding task: ', task);
        response = await databases.createDocument(
            projectDatabaseId,
            projectTaskTableId,
            taskID,
            {
                projectID: task.projectID,
                taskID: taskID,
                name: task.name,
                description: task.description,
                createdBy: task.createdBy,
                createdAt: createdAt,
                startDate: task.startDate,
                endDate: task.endDate,
                documents: task.documents
            }
        )
    }

    //Send back a response of the task is only 1
    if (data.length === 1) {

        console.log('Created Task: ', response);

        return { task: response }
    }

    // TODO: Will later on be passing the entire task object to the database when all fields like document upload is available
    // TODO: Handle cases where a project team member is not added successfully

    return { message: 'Project Team Member(s) added successfully' }
}
export const getAllProjectTasks = async (projectID) => {
    console.log('Getting all project tasks for ', projectID)
    const response = await databases.listDocuments(
        projectDatabaseId,
        projectTaskTableId,
        [
            Query.limit(1000),
            Query.equal('projectID', projectID)
        ]
    )

    return response
}

export const getProjectTask = async (projectID, taskID) => {
    console.log('Getting Task ', taskID + ' for Project ', projectID)
    const response = await databases.listDocuments(
        projectDatabaseId,
        projectTaskTableId,
        [
            Query.limit(1000),
            Query.equal('taskID', taskID),
            Query.equal('projectID', projectID)
        ]
    )

    return response
}

export const addProjectTaskMembers = async (projectID, taskID, data) => {
    console.log('members: ', data.members)
    for (const member of data.members) {
        console.log('adding member: ', member + ' ProjectID: ', projectID + ' taskID: ', taskID);
        const response = await databases.createDocument(
            projectDatabaseId,
            projectTeamTaskTableId,
            'unique()',
            {
                projectID: projectID,
                taskID: taskID,
                staffID: member.staffID,
                name: member.name,
                role: member.role
            }
        )
    }

    // TODO: Handle cases where a project team member is not added successfully

    return { message: 'Project Task Team Member(s) added successfully' }
}

export const getProjectTaskTeam = async (projectID, taskID) => {
    const response = await databases.listDocuments(
        projectDatabaseId,
        projectTeamTaskTableId,
        [
            Query.limit(10000),
            Query.equal('projectID', projectID),
            Query.equal('taskID', taskID)
        ]
    )

    return response
}