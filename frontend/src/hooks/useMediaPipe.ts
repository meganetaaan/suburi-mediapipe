import { Camera } from "@mediapipe/camera_utils";
import { FACEMESH_LIPS, Holistic, Results } from "@mediapipe/holistic";
import { Ref, useCallback, useState } from "react";

export default function useMediaPipe(filePath?: string): [
  Ref<HTMLVideoElement>,
  Results | null
] {
  const [results, setResults] = useState<Results | null>(null);
  const ref = useCallback(async (videoElement: HTMLVideoElement | null) => {
    console.log(FACEMESH_LIPS)
    if (videoElement == null) {
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    videoElement.srcObject = stream;
    const holistic = new Holistic({
      locateFile: (file) => {
        return `${window.location.href}/holistic/${file}`;
        // return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.4/${file}`;
      },
    });
    holistic.setOptions({
      selfieMode: true,
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    holistic.onResults((results) => {
      setResults(results);
    });
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await holistic.send({ image: videoElement });
      },
    });
    camera.start();
    return () => {
      camera?.stop();
      holistic?.close();
    };
  }, []);
  return [ref, results];
}
