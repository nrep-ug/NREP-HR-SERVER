import express from 'express';
import { createProject, getProject, getAllProjects, getProjectTeam, addProjectMembers, getProjectTask, getAllProjectTasks, addProjectTask, addProjectTaskMembers, getProjectTaskTeam } from '../controllers/projectController.js';
import { createProject as createProjectValidation } from '../validations/projectValidation.js';

const router = express.Router();

//Project General Routes
router.post('/create-project', createProjectValidation, createProject);
router.get('/all-projects', getAllProjects);
router.get('/:id', getProject);

// Poject Team Routes
router.get('/:id/team', getProjectTeam);
router.post('/:id/add-members', addProjectMembers);

// Project Task Routes
router.get('/:id/tasks', getAllProjectTasks);
router.post('/:id/tasks/create', addProjectTask);
router.get('/:projectID/tasks/:taskID', getProjectTask);
router.post('/:projectID/tasks/:taskID/assign-members', addProjectTaskMembers);
router.get('/:projectID/tasks/:taskID/members', getProjectTaskTeam);

//TODO: Add validation for all `POST` requests

export default router;