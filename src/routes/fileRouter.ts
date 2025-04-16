import { Router } from 'express';
import { createFileGet, createFilePost, deleteFile, updateFileGet, updateFilePost } from '../controllers/fileController.js';

const fileRouter = Router();

fileRouter.get('/create', createFileGet);
fileRouter.post('/create', createFilePost);
fileRouter.get('/update/:id', updateFileGet);
fileRouter.post('/update/:id', updateFilePost);
fileRouter.post('/delete/:id', deleteFile);

export default fileRouter;