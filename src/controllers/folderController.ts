import { NextFunction, Request, Response } from 'express';
import { param, body, validationResult } from 'express-validator';
import prismaClient from "../prismaClient.js";
import { User } from '@prisma/client';

export const getAllItems = [ 
    param('id').isNumeric().toInt(),
    async function (req: Request, res: Response) {
        const user = (req.user as User);
        const id = Number(req.params.id);
        const rootFolder = await prismaClient.folder.findFirst({
            where: {
                name: user.username,
                parentId: null
            },
            include: {
                files: true,
                childFolders: true
            }
        });

        let folder = rootFolder;
        let currentFolder;
        if (id) {
            folder = await prismaClient.folder.findUnique({
                where: {
                    id
                },
                include: {
                    files: true,
                    childFolders: true,
                }
            });
            currentFolder = await prismaClient.folder.findUnique({
                where: {
                    id,
                },
                include: {
                    parentFolder: true
                }
            });
        }
        
        const items = [
            ...(folder?.files ? folder.files : []), 
            ...(folder?.childFolders ? folder.childFolders : [])
        ];

        const breadCrumbs = [];
        while (currentFolder) {
            breadCrumbs.unshift(currentFolder);
            currentFolder = currentFolder.parentId ? await prismaClient.folder.findUnique({
                where: {
                    id: currentFolder.parentId,
                    NOT: {
                        parentId: null
                    }
                },
                include: {
                    parentFolder: true
                }
            }) : null;
        }
        res.render('items-list', {
            breadCrumbs,
            items,
            id
        });
    }
];

export function createFolderGet(req: Request, res: Response) {
    const id = Number(req.params.id);
    res.render('folder-form', {
        id,
        url: `/folders/create/${id ? id : ''}`
    });
}

export const createFolderPost = [
    body('name').trim().not().isEmpty().withMessage('Name is required'),
    async function (req: Request, res: Response, next: NextFunction) {
        const errors = validationResult(req);
        const user = (req.user as User);

        if (!errors.isEmpty()) {
            return res.render('folder-form', {
                errors: errors.mapped()
            });
        }

        let parentId;

        if (req.params.id) {
            parentId = Number(req.params.id);
        } else {
            const rootFolder = await prismaClient.folder.findFirst({
                where: {
                    name: user.username,
                    parentId: null
                }
            });
            parentId = rootFolder?.id;
        }

        prismaClient.folder.create({
            data: {
                name: req.body.name,
                userId: user.id,
                parentId
            }
        })
        .then(() => res.redirect('/'))
        .catch(next);
    }
];

export async function updateFolderGet(req: Request, res: Response) {
    const id = Number(req.params.id);
    const folder = await prismaClient.folder.findUnique({
        where: {
            id
        }
    });
    res.render('folder-form', {
        id,
        name: folder?.name,
        url: `/folders/update/${id ? id : ''}`
    })
}

export const updateFolderPost = [
    param('id').isNumeric().toInt(),
    body('name').trim().not().isEmpty().withMessage('Name is required'),
    function (req: Request, res: Response, next: NextFunction) {
        const id = Number(req.params.id);
        const name = req.body.name;

        prismaClient.folder.update({
            where: {
                id
            },
            data: {
                name
            }       
        })
        .then(() => res.redirect('/'))
        .catch(next);
    }
];

export function deleteFolder(req: Request, res: Response, next: NextFunction) {
    const id = Number(req.params.id);
    console.log(id);
    
    prismaClient.folder.delete({
        where: {
            id
        }        
    })
    .then(() => res.redirect('/'))
    .catch(next);
}