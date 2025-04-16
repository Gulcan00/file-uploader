import { NextFunction, Request, Response } from 'express';
import { param, body, validationResult } from 'express-validator';
import prismaClient from "../prismaClient.js";
import { User } from '@prisma/client';

export const getAllItems = [ 
    param('id').isNumeric().toInt(),
    async function (req: Request, res: Response) {
        const user = (req.user as User);
        const id = Number(req.params.id);
        let folder;
        if (id) {
            folder = await prismaClient.folder.findUnique({
                where: {
                    id
                },
                include: {
                    files: true,
                    childFolders: true
                }
            })
        } else {
            folder = await prismaClient.folder.findFirst({
                where: {
                    name: user.username,
                    parentId: null
                },
                include: {
                    files: true,
                    childFolders: true
                }
            });
        }
        
        const items = [
            ...(folder?.files ? folder.files : []), 
            ...(folder?.childFolders ? folder.childFolders : [])
        ];

        res.render('items-list', {
            items
        });
    }
];

export function createFolderGet(req: Request, res: Response) {
    res.render('folder-form');
}

export const createFolderPost = [
    body('name').trim().not().isEmpty().withMessage('Name is required'),
    function (req: Request, res: Response, next: NextFunction) {
        const errors = validationResult(req);
        const user = (req.user as User);

        if (!errors.isEmpty()) {
            return res.render('folder-form');
        }

        prismaClient.folder.create({
            data: {
                name: req.body.name,
                userId: user.id
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
        name: folder?.name
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
    prismaClient.folder.delete({
        where: {
            id
        }        
    })
    .then(() => res.redirect('/'))
    .catch(next);
}