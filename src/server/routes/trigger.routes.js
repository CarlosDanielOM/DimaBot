const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');

const STREAMERS = require('../../../class/streamer');

const triggerSchema = require('../../../schema/trigger');
const triggerFileSchema = require('../../../schema/triggerfile');

const acceptableMimeTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/flv', 'video/wmv', 'video/webm', 'video/mkv', 'image/gif', 'image/jpg', 'image/jpeg', 'image/png', 'image/bmp', 'image/tiff', 'image/svg', 'image/webp', 'audio/mp3', 'audio/flac', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/wma', 'audio/m4a'];

router.get('/:channelID', async (req, res) => {
    const channelID = req.params.channelID;
    const query = req.query;
    const id = query.id || null;
    let trigger = [];

    if(id) {
        trigger = await triggerSchema.find({channelID: channelID, _id: id});
    } else {
        trigger = await triggerSchema.find({channelID: channelID});
    }

    res.status(200).send({
        data: trigger,
        total: trigger.length
    });
    
});

router.post('/:channelID', async (req, res) => {});

router.post('/:channelID/upload', async (req, res) => {
    const { channelID } = req.params;
    const streamer = await STREAMERS.getStreamerById(channelID);
    if(!streamer) {
        return res.status(404).send({
            error: 'Not Found',
            message: 'Streamer not found',
            status: 404
        });
    }

    let MB = 5;
    if(streamer.premium == "true") {
        MB = 10;
    }
    if(streamer.premium_plus == "true") {
        MB = 20;
    }

    const MAX_FILE_SIZE = MB * 1024 * 1024;

    let folderExists = fs.existsSync(`${__dirname}/public/uploads/triggers/${streamer.name}`);
    if(!folderExists) {
        fs.mkdirSync(`${__dirname}/public/uploads/triggers/${streamer.name}`);
    }
    
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, `${__dirname}/public/uploads/triggers/${streamer.name}`);
        },
        filename: (req, file, cb) => {
            cb(null, `${req.body.triggerName}.${file.mimetype.split('/')[1]}`);
        },
        limits: {
            fileSize: MAX_FILE_SIZE
        }
    });

    const fileFilter = async (req, file, cb) => {
        if(acceptableMimeTypes.includes(file.mimetype)) {
            if(await triggerFileSchema.exists({
                name: req.body.triggerName,
                fileType: file.mimetype,
            })) {
                cb(null, false);
                console.log(`File ${req.body.triggerName} already exists from ${streamer.name}`);
            } else {
                cb(null, true);
            }
        } else {
            cb(null, false);
            console.log(`File type ${file.mimetype} not allowed from ${streamer.name}`);
        }
    }
    
    multer({
        storage: storage,
        fileFilter: fileFilter
    }).single('trigger')(req, res, async err => {
        if(err) {
            console.log({
                error: 'Bad Request',
                message: 'Error uploading file',
                status: 400,
                err
            });
            return res.status(400).send({
                error: 'Bad Request',
                message: 'Error uploading file',
                status: 400
            });
        }

        if(!req.file) {
            console.log({
                error: 'Bad Request',
                message: 'File type not allowed or file already exists',
                status: 400,
                channelID
            });
            return res.status(400).send({
                error: 'Bad Request',
                message: 'File type not allowed or file already exists',
                status: 400
            });
        }

        let exists = await triggerFileSchema.exists({
            name: req.body.triggerName,
            fileType: req.file.mimetype,
        });

        if(exists) {
            console.log({
                error: 'Bad Request',
                message: 'File already exists',
                status: 400,
                channelID
            });
            return res.status(400).send({
                error: 'Bad Request',
                message: 'File already exists',
                status: 400
            });
        }

        let fileNameURLEncoded = encodeURIComponent(req.file.filename);
        let fileData = {
            name: req.body.triggerName,
            fileName: req.file.filename,
            fileSize: req.file.size,
            fileType: req.file.mimetype,
            fileUrl: `https://api.domdimabot.com/media/${streamer.name}/${fileNameURLEncoded}`,
            channel: streamer.name,
            channelID: channelID
        }

        let newFile = new triggerFileSchema(fileData);

        try {
            await newFile.save();
        } catch (error) {
            console.log({
                error: 'Internal Server Error',
                message: 'Error saving file',
                status: 500,
                error
            });
            return res.status(500).send({
                error: 'Internal Server Error',
                message: 'Error saving file',
                status: 500
            });
        }

        res.status(201).send({
            data: fileData,
            status: 201
        });
        
    });
    
});

module.exports = router;