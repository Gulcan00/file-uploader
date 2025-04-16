import { Router } from 'express';
import { createFolderGet, createFolderPost, deleteFolder, getAllItems, updateFolderGet, updateFolderPost } from '../controllers/folderController.js';

const folderRouter = Router();

folderRouter.get('/', getAllItems);
folderRouter.get('/create', createFolderGet);
folderRouter.post('/create', createFolderPost);
folderRouter.get('/update/:id', updateFolderGet);
folderRouter.post('/update/:id', updateFolderPost);
folderRouter.post('/delete/:id', deleteFolder);

export default folderRouter;