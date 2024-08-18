import { validationResult } from 'express-validator';
import * as projectService from '../services/projectService.js';

export const createProject = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const project = await projectService.createProject(req.body);
        res.status(201).json(project);
    } catch (error) {
        next(error);
    }
};

export const getProject = async (req, res, next) => {
    try {
        console.log('Getting project: ', req.params)
        const project = await projectService.getProject(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.status(200).json(project);
    } catch (error) {
        next(error);
    }
};

export const getAllProjects = async (req, res, next) => {
    try {
        const projects = await projectService.getAllProjects(req.params.query);
        if (!projects) {
            return res.status(404).json({ message: 'Projects not found' });
        }
        res.status(200).json(projects);
    } catch (error) {
        next(error);
    }
}

export const getProjectTeam = async (req, res, next) => {
    try {
        console.log('Getting project Team: ', req.params)
        const projectTeam = await projectService.getProjectTeam(req.params.id);
        if (!projectTeam) {
            return res.status(404).json({ message: 'Project Team not found' });
        }
        res.status(200).json(projectTeam);
    } catch (error) {
        next(error);
    }
}

export const addProjectMembers = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const projectMembers = await projectService.addProjectMembers(req.body);
        res.status(201).json(projectMembers);
    } catch (error) {
        next(error);
    }
};