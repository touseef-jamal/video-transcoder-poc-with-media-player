### About - Backend

This project has an API endpoint /api/upload that takes a video as input and transcodes the video to generate different resolutions of the video like 360p, 470p, 720p and 1080p.

### About - Frontend

This project has a media player in which you need to pass the video id generated after video uploading to the server. It will play the HLS video and if the video is not played in your browser, then please try to use another browser(I've tested it on brave and safari).

### How to run (Frontend)

1. Install project dependencies using `npm install`

2. Run the project using `npm run dev`

### How to run (Backend)

1. Install ffmpeg in your PC from `https://ffmpeg.org/download.html`

2. Install project dependencies using `npm install`

3. Create a `uploads` folder in root directory

4. Run server using nodemon while development using command `npm run dev`.

5. For testing the API, stop the nodemon server because the uploading and transcoding process takes a lot of time and nodemon will restart the server forcefully if it takes too much time to respond to the request and your upload request will be cancelled. So run server using `ts-node ./src/index.ts`

6. Use postman or thunder client and hit `http://localhost:2000/api/upload` with a field named `video` along with a video file.
