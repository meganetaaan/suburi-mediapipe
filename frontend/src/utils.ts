import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { FACEMESH_LEFT_EYE, FACEMESH_LIPS, FACEMESH_RIGHT_EYE, FACEMESH_TESSELATION, Results } from "@mediapipe/holistic";
import { RobotState } from "./hooks/useRobotService";

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}
export function distance(v1: Vector3, v2: Vector3) {
  const dx = v1.x - v2.x;
  const dy = v1.y - v2.y;
  const dz = v1.z - v2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
export function yaw(v1: Vector3, v2: Vector3) {
  const dx = v1.x - v2.x;
  const dz = v1.z - v2.z;
  return Math.atan2(dz, dx);
}
export function pitch(v1: Vector3, v2: Vector3) {
  const dy = v2.y - v1.y;
  const dz = v2.z - v1.z;
  return Math.atan2(dz, dy);
}
export function isSmiling(
  left: Vector3,
  right: Vector3,
  faceTop: Vector3,
  faceBottom: Vector3
): boolean {
  const ly1 = faceBottom.y - left.y;
  const ly2 = left.y - faceTop.y;
  const ry1 = faceBottom.y - right.y;
  const ry2 = right.y - faceTop.y;
  return (ly1 + ry1) / (ly2 + ry2) > 0.4;
}
export function average(v1: Vector3, v2: Vector3) {
  return {
    x: (v2.x + v1.x) / 2,
    y: (v2.y + v1.y) / 2,
  };
}
export function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}
export function normalize(v: number, min: number, max: number) {
  return (clamp(v, min, max) - min) / (max - min);
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

export function drawStackchan(
  ctx: CanvasRenderingContext2D,
  results: Results,
  state: RobotState
) {
  const { width: w, height: h } = ctx.canvas;
  const leftEyeTop = results.faceLandmarks[386];
  const leftEyeBottom = results.faceLandmarks[374];
  const leftEye = average(leftEyeTop, leftEyeBottom);

  const rightEyeTop = results.faceLandmarks[159];
  const rightEyeBottom = results.faceLandmarks[145];
  const rightEye = average(rightEyeTop, rightEyeBottom);

  const lipTop = results.faceLandmarks[13];
  const lipBottom = results.faceLandmarks[14];
  const mouth = average(lipTop, lipBottom);

  const xs = results.faceLandmarks.map((m) => m.x);
  const ys = results.faceLandmarks.map((m) => m.y);
  const ext = {
    top: Math.min(...ys),
    right: Math.max(...xs),
    bottom: Math.max(...ys),
    left: Math.min(...xs),
  };
  ctx.fillStyle = "black";
  ctx.fillRect(
    w * ext.left,
    h * ext.top,
    w * (ext.right - ext.left),
    h * (ext.bottom - ext.top)
  );
  ctx.fillStyle = "white";
  const mw = clamp(60 - state.mouthOpen * 30, 30, 60);
  const mh = clamp(50 * state.mouthOpen, 6, 50);
  const offsetY = (ext.bottom - ext.top) * 0.2 * h;
  ctx.fillRect(w * mouth.x - mw / 2, h * mouth.y - mh / 2 - offsetY, mw, mh);

  const startAngle = state.emotion === "HAPPY" ? Math.PI : 0;
  ctx.beginPath();
  ctx.arc(w * leftEye.x, h * leftEye.y, 7, startAngle, 2 * Math.PI, false);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(w * rightEye.x, h * rightEye.y, 7, startAngle, 2 * Math.PI, false);
  ctx.fill();

  if (state.emotion !== "HAPPY") {
    ctx.fillStyle = "black";
    ctx.fillRect(
      w * leftEye.x - 8,
      h * leftEye.y - 8,
      16,
      14 * (1 - state.leftEyeOpen)
    );
    ctx.fillRect(
      w * rightEye.x - 8,
      h * rightEye.y - 8,
      16,
      14 * (1 - state.rightEyeOpen)
    );
  }
}

export function calculateRobotState(results: Results): RobotState {

  const faceTop = results.faceLandmarks[10];
  const faceBottom = results.faceLandmarks[152];
  const faceHeight = distance(faceTop, faceBottom);

  const lipTop = results.faceLandmarks[13];
  const lipBottom = results.faceLandmarks[14];
  const mouthOpen = normalize(
    distance(lipTop, lipBottom) / faceHeight,
    MOUTHOPEN_MIN,
    MOUTHOPEN_MAX
  );

  const rightEyeTop = results.faceLandmarks[159];
  const rightEyeBottom = results.faceLandmarks[145];
  const rightEyeOpen = normalize(
    distance(rightEyeTop, rightEyeBottom) / faceHeight,
    EYEOPEN_MIN,
    EYEOPEN_MAX
  );

  const leftEyeTop = results.faceLandmarks[386];
  const leftEyeBottom = results.faceLandmarks[374];
  const leftEyeOpen = normalize(
    distance(leftEyeTop, leftEyeBottom) / faceHeight,
    EYEOPEN_MIN,
    EYEOPEN_MAX
  );

  const faceRight = results.faceLandmarks[356];
  const faceLeft = results.faceLandmarks[127];
  const y = yaw(faceRight, faceLeft);

  const p = pitch(faceTop, faceBottom);

  const lipLeft = results.faceLandmarks[61];
  const lipRight = results.faceLandmarks[291];
  const emotion = isSmiling(lipLeft, lipRight, faceTop, faceBottom)
    ? "HAPPY"
    : "NEUTRAL";

  return {
    leftEyeOpen,
    rightEyeOpen,
    mouthOpen,
    yaw: y,
    pitch: p,
    emotion,
  }
}

export function drawMesh(
  ctx: CanvasRenderingContext2D,
  results: Results,
  pointIdx: number
) {
  drawConnectors(ctx, results.faceLandmarks, FACEMESH_TESSELATION, {
    color: "#FAFAFA88",
    lineWidth: 1,
  });
  drawConnectors(ctx, results.faceLandmarks, FACEMESH_RIGHT_EYE, {
    color: "red",
    lineWidth: 2,
  });
  drawConnectors(ctx, results.faceLandmarks, FACEMESH_LEFT_EYE, {
    color: "blue",
    lineWidth: 2,
  });
  drawConnectors(ctx, results.faceLandmarks, FACEMESH_LIPS, {
    color: "black",
    lineWidth: 2,
  });
  const featureDots = choose(
    results.faceLandmarks,
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
  drawLandmarks(ctx, featureDots, {
    color: "gray",
    radius: 3,
    lineWidth: 1,
  });
  drawConnectors(
    ctx,
    results.faceLandmarks,
    FACEMESH_LIPS.slice(pointIdx, pointIdx + 1),
    {
      color: "green",
      lineWidth: 3,
      radius: 3,
    }
  );
}
const EYEOPEN_MAX = 0.05;
const EYEOPEN_MIN = 0.04;
const MOUTHOPEN_MAX = 0.1;
const MOUTHOPEN_MIN = 0.0;
