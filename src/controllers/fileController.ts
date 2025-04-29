import { NextFunction, Request, Response } from 'express';
import { param, body, validationResult } from 'express-validator';
import multer from 'multer';
import * as fs from 'fs';
import { v2 as cloudinary } from 'cloudinary'
import prismaClient from "../prismaClient.js";
import { User } from '@prisma/client';

const upload = multer({ dest: 'uploads/' });
cloudinary.config({
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
    cloud_name: process.env.CLOUDINARY_NAME
});

export function createFileGet(req: Request, res: Response) {
    res.render('file-form');
}

export const createFilePost = [
    upload.single('file'),
    async function (req: Request, res: Response, next: NextFunction) {
        const user = (req.user as User);
        let folderId;

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
            return next(new Error('Root folder not found'));
        } else {
            if (!req.file) {
                return next(new Error('No file uploaded'));
            }

            try {
                const localPath = req.file?.path;
                const [{nextval}] = await prismaClient.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('files_id_seq')`;
                const fileId = Number(nextval);
                await cloudinary.uploader.upload(localPath, {
                    public_id: fileId.toString()
                });
                
                prismaClient.file.create({
                    data: {
                        id: fileId,
                        name: req.file?.originalname,
                        size: req.file?.size,
                        folderId
                    }
                })
                .then(() => res.redirect('/'))
                .catch(next)
                .finally(() => fs.unlinkSync(localPath));
            } catch (err) {
                next(err);
            }
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
    res.render('name-form', {
        name: file?.name,
        url: 'files/update/' + id
    })
}

export const updateFilePost = [
    param('id').isNumeric().toInt(),
    body('name').trim().not().isEmpty().withMessage('Name is required'),
    function (req: Request, res: Response, next: NextFunction) {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            return res.render('name-form', {
                errors: errors.mapped()
            });
        }

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

export async function deleteFile(req: Request, res: Response, next: NextFunction) {
    const id = Number(req.params.id);
    try {
    await cloudinary.uploader.destroy(id.toString());
    prismaClient.file.delete({
        where: {
            id
        }        
    })
    .then(() => res.redirect('/'))
    .catch(next);
    } catch (err) {
        next(err);
    }
}