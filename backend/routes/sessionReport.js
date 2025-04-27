import express from 'express';
import { saveSessionReport } from '../controller/SessionReportController.js';

const router = express.Router();

router.post('/save', saveSessionReport);

export default router; 