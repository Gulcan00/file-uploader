import { NextFunction, Request, Response } from 'express';
import { param, body, validationResult } from 'express-validator';
import prismaClient from "../prismaClient.js";
import { User } from '@prisma/client';

export function createFileGet(req: Request, res: Response) {
    res.render('file-form');
}

export const createFilePost = [
    body('name').trim().not().isEmpty().withMessage('Name is required'),
    async function (req: Request, res: Response, next: NextFunction) {
        const user = (req.user as User);
        const errors = validationResult(req);
        let folderId;

        if (!errors.isEmpty()) {
            return res.render('file-form');
        }
        
        if (req.params.id) {
            folderId = Number(req.params.id);
        } else {
            const rootFolder = await prismaClient.folder.findFirst({
                where: {
                    name: user.username,
                    parentId: null
                }
            });
            folderId = rootFolder?.id;
        }

        if (!folderId) {
            next(new Error('Root folder not found'));
        } else {
            prismaClient.file.create({
                data: {
                    name: req.body.name,
                    folderId
                }
            })
            .then(() => res.redirect('/'))
            .catch(next);
        }
    }
];

export async function updateFileGet(req: Request, res: Response) {
    const id = Number(req.params.id);
    const file = await prismaClient.file.findUnique({
        where: {
            id
        }
    });
    res.render('file-form', {
        name: file?.name
    })
}

export const updateFilePost = [
    param('id').isNumeric().toInt(),
    body('name').trim().not().isEmpty().withMessage('Name is required'),
    function (req: Request, res: Response, next: NextFunction) {
        const id = Number(req.params.id);
        const name = req.body.name;

        prismaClient.file.update({
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

export function deleteFile(req: Request, res: Response, next: NextFunction) {
    const id = Number(req.params.id);
    prismaClient.file.delete({
        where: {
            id
        }        
    })
    .then(() => res.redirect('/'))
    .catch(next);
}