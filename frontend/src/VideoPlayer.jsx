import { useEffect, useRef, useState } from "react"
import videojs from "video.js"

import "video.js/dist/video-js.css"

const VIDEO_BASE_URL = "http://localhost:2000/hls-output"

const VideoPlayer = ({ videoId }) => {
    const videoRef = useRef(null)
    const playerRef = useRef(null)
    const [availableResolutions, setAvailableResolutions] = useState([])

    const masterFileSource = {
        src: `${VIDEO_BASE_URL}/${videoId}/index.m3u8`,
        type: "application/x-mpegURL",
    }

    const options = {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: true,
        sources: [masterFileSource],
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
        const fetchMasterPlaylist = async () => {
            const response = await fetch(masterFileSource.src)
            const masterFileContent = await response.text()
            const resolutions = parseMasterPlaylist(masterFileContent)
            setAvailableResolutions(resolutions)
        }

        const parseMasterPlaylist = (text) => {
            const resolutions = []
            if (text.includes("360p/index.m3u8")) {
                resolutions.push({
                    src: `${VIDEO_BASE_URL}/${videoId}/360p/index.m3u8`,
                    label: "360p",
                })
            }
            if (text.includes("480p/index.m3u8")) {
                resolutions.push({
                    src: `${VIDEO_BASE_URL}/${videoId}/480p/index.m3u8`,
                    label: "480p",
                })
            }
            if (text.includes("720p/index.m3u8")) {
                resolutions.push({
                    src: `${VIDEO_BASE_URL}/${videoId}/720p/index.m3u8`,
                    label: "720p",
                })
            }
            if (text.includes("1080p/index.m3u8")) {
                resolutions.push({
                    src: `${VIDEO_BASE_URL}/${videoId}/1080p/index.m3u8`,
                    label: "1080p",
                })
            }
            return resolutions
        }

        fetchMasterPlaylist()
    }, [videoId])

    useEffect(() => {
        // Make sure Video.js player is only initialized once
        if (!playerRef.current) {
            // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode.
            const videoElement = document.createElement("video-js")

            videoElement.classList.add("vjs-big-play-centered")
            videoRef.current.appendChild(videoElement)

            const player = (playerRef.current = videojs(videoElement, options))

            // Append buttons for changing resolution

            availableResolutions.forEach((source, index) => {
                player.getChild("ControlBar").addChild("button", {
                    controlText: source.label,
                    className: "vjs-visible-text",
                    clickHandler: () => {
                        handleResolutionChange(index)
                    },
                })
            })
        } else {
            const player = playerRef.current
            player.autoplay(options.autoplay)
            player.src([masterFileSource])
        }

        return () => {
            const player = playerRef.current
            if (player && !player.isDisposed()) {
                player.dispose()
                playerRef.current = null
            }
        }
    }, [videoId, videoRef, availableResolutions])

    return (
        <div data-vjs-player={true}>
            <div ref={videoRef} />
        </div>
    )
}

export default VideoPlayer
