import { validationResult } from 'express-validator';
import * as projectService from '../services/projectService.js';

export const createProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const project = await projectService.createProject(req.body);
    res.status(201).json(project);
};

export const getProject = async (req, res) => {
    console.log('Getting project: ', req.params);
    const project = await projectService.getProject(req.params.id);
    if (!project) {
        return res.status(404).json({ message: 'Project not found' });
    }
    res.status(200).json(project);
};

export const getAllProjects = async (req, res) => {
    const projects = await projectService.getAllProjects(req.params.query);
    if (!projects) {
        return res.status(404).json({ message: 'Projects not found' });
    }
    res.status(200).json(projects);
};

export const getProjectTeam = async (req, res) => {
    console.log('Getting project Team: ', req.params);
    const projectTeam = await projectService.getProjectTeam(req.params.id);
    if (!projectTeam) {
        return res.status(404).json({ message: 'Project Team not found' });
    }
    res.status(200).json(projectTeam);
};

export const addProjectMembers = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const projectMembers = await projectService.addProjectMembers(req.body);
    res.status(201).json(projectMembers);
};

/* PROJECT TASKS */
export const addProjectTask = async (req, res) => {
    const projectTask = await projectService.addProjectTask(req.body);
    res.status(201).json(projectTask);
};

export const getAllProjectTasks = async (req, res) => {
    const tasks = await projectService.getAllProjectTasks(req.params.id);
    if (!tasks) {
        return res.status(404).json({ message: 'Tasks not found' });
    }
    res.status(200).json(tasks);
};

export const getProjectTask = async (req, res) => {
    console.log('Getting project: ', req.params);
    const task = await projectService.getProjectTask(req.params.projectID, req.params.taskID);
    if (!task) {
        return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json(task);
};

export const addProjectTaskMembers = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const projectMembers = await projectService.addProjectTaskMembers(req.params.projectID, req.params.taskID, req.body);
    res.status(201).json(projectMembers);
};

export const getProjectTaskTeam = async (req, res) => {
    console.log('Getting project Task Team: ', req.params);
    const projectTeam = await projectService.getProjectTaskTeam(req.params.projectID, req.params.taskID);
    if (!projectTeam) {
        return res.status(404).json({ message: 'Project Task Team not found' });
    }
    res.status(200).json(projectTeam);
};