import express from 'express';
import {assignRole} from '../controllers/roleAssignments.controller.js'

const router=express.Router();
router
    .post('/assign',assignRole);


export default router;