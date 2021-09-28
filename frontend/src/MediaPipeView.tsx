import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import {
  FACEMESH_FACE_OVAL, FACEMESH_LEFT_EYE, FACEMESH_LIPS, FACEMESH_RIGHT_EYE
} from "@mediapipe/holistic";
import { FC, useCallback } from "react";
import useMediaPipe from "./hooks/useMediaPipe";

// const target = FACEMESH_FACE_OVAL.slice(29, 30).map(arr => arr[0])
// console.log(target)
interface MediaPipeProps {}

interface Vector3 {
  x: number;
  y: number;
  z: number;
}
function distance(v1: Vector3, v2: Vector3) {
  const dx = v1.x - v2.x;
  const dy = v1.y - v2.y;
  const dz = v1.z - v2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
function yaw(v1: Vector3, v2: Vector3) {
  const dx = v1.x - v2.x;
  const dz = v1.z - v2.z;
  return Math.atan2(dz, dx)
}
function pitch(v1: Vector3, v2: Vector3) {
  const dy = v2.y - v1.y;
  const dz = v2.z - v1.z;
  return Math.atan2(dz, dy)
}

function choose<T extends any>(array: T[], ...indices: number[]): T[] {
  const result = [];
  for (const idx of indices) {
    if (array[idx] != null) {
      result.push(array[idx]);
    }
  }
  return result;
}

const MediaPipeView: FC<MediaPipeProps> = () => {
  const [ref, result] = useMediaPipe();
  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (canvas == null) {
        return;
      }

      const ctx = canvas.getContext("2d");
      if (
        ctx == null ||
        result?.image == null ||
        result?.faceLandmarks == null
      ) {
        return;
      }
      // ctx.drawImage(result.image, 0, 0, canvas.width, canvas.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawConnectors(ctx, result.faceLandmarks, FACEMESH_RIGHT_EYE, {
        color: "red",
        lineWidth: 2,
      });
      drawConnectors(ctx, result.faceLandmarks, FACEMESH_LEFT_EYE, {
        color: "blue",
        lineWidth: 2,
      });
      drawConnectors(ctx, result.faceLandmarks, FACEMESH_LIPS, {
        color: "black",
        lineWidth: 2,
      });
      drawConnectors(ctx, result.faceLandmarks, FACEMESH_FACE_OVAL, {
        color: "black",
        lineWidth: 1,
      });
      const rightEyeDots = choose(
        result.faceLandmarks,
        13,
        14,
        145,
        159,
        374,
        386,
        10,
        356,
        152,
        127
      );
      drawLandmarks(ctx, rightEyeDots, {
        color: "gray",
        radius: 3,
        lineWidth: 1,
      });
    },
    [result]
  );
  let mouthOpen;
  let leftEyeOpen;
  let rightEyeOpen;
  let p, y;
  if (result?.faceLandmarks != null) {
    const lipTop = result.faceLandmarks[13];
    const lipBottom = result.faceLandmarks[14];
    mouthOpen = distance(lipTop, lipBottom);

    const rightEyeTop = result.faceLandmarks[159];
    const rightEyeBottom = result.faceLandmarks[145];
    rightEyeOpen = distance(rightEyeTop, rightEyeBottom);

    const leftEyeTop = result.faceLandmarks[386];
    const leftEyeBottom = result.faceLandmarks[374];
    leftEyeOpen = distance(leftEyeTop, leftEyeBottom);

    const faceRight = result.faceLandmarks[356]
    const faceLeft = result.faceLandmarks[127]
    y = yaw(faceRight, faceLeft);

    const faceTop = result.faceLandmarks[10]
    const faceBottom = result.faceLandmarks[152]
    p = pitch(faceTop, faceBottom);
  }
  return (
    <div>
      <video style={{ display: "none" }} ref={ref} width="640" height="480" />
      <canvas ref={canvasRef} width="640" height="480" />
      <div>mouthOpen: {mouthOpen?.toFixed(4)}</div>
      <div style={{ color: "red" }}>leftEyeOpen: {leftEyeOpen?.toFixed(4)}</div>
      <div style={{ color: "blue" }}>
        rightEyeOpen: {rightEyeOpen?.toFixed(4)}
      </div>
      <div>yaw: {y?.toFixed(4)}</div>
      <div>pitch: {p?.toFixed(4)}</div>
      {/* <pre>
        {JSON.stringify(result, null, 2)}
      </pre> */}
    </div>
  );
};

export default MediaPipeView;
