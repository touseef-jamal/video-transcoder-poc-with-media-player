import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import fs from 'fs'
import { exec } from 'child_process'
import { v4 as uuid } from 'uuid'
import path from 'path'

import { uploader } from './middlewares/uploader'

const port = process.env.PORT || 2000

const app: Express = express()

app.use(cors())

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use('/hls-output', express.static(path.join(process.cwd(), 'hls-output')))

app.post('/api/upload', uploader('video'), (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).send('Video not sent!')
    }

    const videoId = uuid()
    const uploadedVideoPath = req.file.path

    const outputFolderRootPath = `./hls-output/${videoId}`

    const outputFolderSubDirectoryPath = {
        '360p': `${outputFolderRootPath}/360p`,
        '480p': `${outputFolderRootPath}/480p`,
        '720p': `${outputFolderRootPath}/720p`,
        '1080p': `${outputFolderRootPath}/1080p`,
    }

    // Create directories for storing output video
    if (!fs.existsSync(outputFolderRootPath)) {
        fs.mkdirSync(outputFolderSubDirectoryPath['360p'], { recursive: true })
        fs.mkdirSync(outputFolderSubDirectoryPath['480p'], { recursive: true })
        fs.mkdirSync(outputFolderSubDirectoryPath['720p'], { recursive: true })
        fs.mkdirSync(outputFolderSubDirectoryPath['1080p'], { recursive: true })
    }

    // Commands to convert video to HLS format for 360p, 480p, 720p, 1080p resolutions
    const ffmpegCommands = [
        `ffmpeg -i ${uploadedVideoPath} -vf "scale=w=640:h=360" -c:v libx264 -b:v 800k -c:a aac -b:a 96k -f hls -hls_time 15 -hls_playlist_type vod -hls_segment_filename "${outputFolderSubDirectoryPath['360p']}/segment%03d.ts" -start_number 0 "${outputFolderSubDirectoryPath['360p']}/index.m3u8"`,
        `ffmpeg -i ${uploadedVideoPath} -vf "scale=w=854:h=480" -c:v libx264 -b:v 1400k -c:a aac -b:a 128k -f hls -hls_time 15 -hls_playlist_type vod -hls_segment_filename "${outputFolderSubDirectoryPath['480p']}/segment%03d.ts" -start_number 0 "${outputFolderSubDirectoryPath['480p']}/index.m3u8"`,
        `ffmpeg -i ${uploadedVideoPath} -vf "scale=w=1280:h=720" -c:v libx264 -b:v 2800k -c:a aac -b:a 128k -f hls -hls_time 15 -hls_playlist_type vod -hls_segment_filename "${outputFolderSubDirectoryPath['720p']}/segment%03d.ts" -start_number 0 "${outputFolderSubDirectoryPath['720p']}/index.m3u8"`,
        `ffmpeg -i ${uploadedVideoPath} -vf "scale=w=1920:h=1080" -c:v libx264 -b:v 5000k -c:a aac -b:a 192k -f hls -hls_time 15 -hls_playlist_type vod -hls_segment_filename "${outputFolderSubDirectoryPath['1080p']}/segment%03d.ts" -start_number 0 "${outputFolderSubDirectoryPath['1080p']}/index.m3u8"`,
    ]

    // run the ffmpeg command in a queue
    const executeCommand = (command: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`)
                    reject(error)
                } else {
                    resolve()
                }
            })
        })
    }

    Promise.all(ffmpegCommands.map((cmd) => executeCommand(cmd)))
        .then(() => {
            const videoUrls = {
                '360p': `http://localhost:${port}/hls-output/${videoId}/360p/index.m3u8`,
                '480p': `http://localhost:${port}/hls-output/${videoId}/480p/index.m3u8`,
                '720p': `http://localhost:${port}/hls-output/${videoId}/720p/index.m3u8`,
            }

            return res.status(200).json({ videoId, videoUrls })
        })
        .catch((error) => {
            console.error(`HLS conversion error: ${error}`)

            // Delete the uploaded video file
            try {
                fs.unlinkSync(uploadedVideoPath)
            } catch (err) {
                console.error(`Failed to delete original video file: ${err}`)
            }

            // Delete the generated HLS files and folders
            try {
                fs.unlinkSync(outputFolderRootPath)
            } catch (err) {
                console.error(`Failed to delete generated HLS files: ${err}`)
            }

            return res.status(500).send('HLS conversion failed!')
        })
})

app.listen(port, () => {
    console.log(`Server is running at ${port}`)
})
