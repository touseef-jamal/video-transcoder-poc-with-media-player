import { useEffect, useRef } from "react"
import videojs from "video.js"

import "video.js/dist/video-js.css"

const BASE_URL = "http://localhost:2000/hls-output"

const VideoPlayer = ({ videoId }) => {
    const videoRef = useRef(null)
    const playerRef = useRef(null)

    const masterFileSrc = `${BASE_URL}/${videoId}/index.m3u8`

    const availableResolutions = [
        {
            label: "360p",
            src: `${BASE_URL}/${videoId}/360p/index.m3u8`,
        },
        {
            label: "480p",
            src: `${BASE_URL}/${videoId}/480p/index.m3u8`,
        },
        {
            label: "720p",
            src: `${BASE_URL}/${videoId}/720p/index.m3u8`,
        },
        {
            label: "1080p",
            src: `${BASE_URL}/${videoId}/1080p/index.m3u8`,
        },
    ]

    const options = {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: true,
        sources: [
            {
                src: masterFileSrc,
                type: "application/x-mpegURL",
            },
        ],
    }

    const handleResolutionChange = (index) => {
        const player = playerRef.current
        const currentTime = player.currentTime()

        player.src({
            src: availableResolutions[index].src,
            type: "application/x-mpegURL",
        })
        player.ready(() => {
            player.currentTime(currentTime)
        })
    }

    useEffect(() => {
        // Make sure Video.js player is only initialized once
        if (!playerRef.current) {
            const videoElement = document.createElement("video-js")
            videoElement.classList.add("vjs-big-play-centered")
            videoRef.current.appendChild(videoElement)

            const player = (playerRef.current = videojs(videoElement, options))

            // Append video resolution button

            availableResolutions.forEach((resolution, index) => {
                player.getChild("ControlBar").addChild("button", {
                    controlText: resolution.label,
                    className: "vjs-visible-text",
                    clickHandler: () => {
                        handleResolutionChange(index)
                    },
                })
            })
        } else {
            const player = playerRef.current
            player.autoplay(options.autoplay)
            player.src([options.sources])
        }
    }, [videoRef])

    // Dispose the Video.js player when the functional component unmounts
    useEffect(() => {
        const player = playerRef.current

        return () => {
            if (player && !player.isDisposed()) {
                player.dispose()
                playerRef.current = null
            }
        }
    }, [playerRef])

    return (
        <div data-vjs-player>
            <div ref={videoRef} />
        </div>
    )
}
export default VideoPlayer
