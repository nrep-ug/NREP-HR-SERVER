import express from 'express';
import { createProject, getProject, getAllProjects, getProjectTeam, addProjectMembers } from '../controllers/projectController.js';
import { createProject as createProjectValidation } from '../validations/projectValidation.js';

const router = express.Router();

router.post('/create-project', createProjectValidation, createProject);
router.get('/all-projects', getAllProjects);
router.get('/:id', getProject);
router.get('/:id/team', getProjectTeam);
router.post('/:id/add-members', addProjectMembers);

export default router;