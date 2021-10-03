import { FACEMESH_LIPS } from "@mediapipe/holistic";
import { FC, useCallback, useEffect, useState } from "react";
import useMediaPipe from "../hooks/useMediaPipe";
import useRobotService, { RobotState } from "../hooks/useRobotService";
import { calculateRobotState, drawMesh, drawStackchan } from "../utils";

interface MediaPipeProps {}
const INITIAL_WS_URL = "ws://localhost:8080";
const INITIAL_STATE: RobotState = Object.freeze({
  mouthOpen: 0,
  leftEyeOpen: 0,
  rightEyeOpen: 0,
  yaw: 0,
  pitch: 0,
  emotion: "NEUTRAL",
});

const MediaPipeView: FC<MediaPipeProps> = () => {
  const [ref, results] = useMediaPipe(process.env.REACT_APP_HOLISTIC_ROOT);
  const [connect, sendState, disconnect, isConnected] = useRobotService();
  const [url, setUrl] = useState(INITIAL_WS_URL);
  const [isDebugging, setDebugging] = useState(false);
  const [pointIdx, setPointIdx] = useState<number>(0);
  const handleCanvasDoubleClick = () => {
    setDebugging(!isDebugging);
  };
  const state: RobotState =
    results?.faceLandmarks != null
      ? calculateRobotState(results)
      : INITIAL_STATE;
  useEffect(() => {
    sendState(state);
  }, [results]);
  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (canvas == null) {
        return;
      }

      const ctx = canvas.getContext("2d");
      if (ctx == null) {
        /* canvas is not ready*/
        return;
      } else if (results == null) {
        /* facemesh is not ready */
        ctx.fillText("Please wait...", canvas.width / 2, canvas.height / 2);
        return;
      } else if (results.image == null || results.faceLandmarks == null) {
        /* facemesh failed to detect human face */
        return;
      }
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
      if (isDebugging) {
        drawMesh(ctx, results, pointIdx);
      } else {
        drawStackchan(ctx, results, state);
      }
    },
    [results]
  );
  return (
    <div>
      <video style={{ display: "none" }} ref={ref} width="640" height="480" />
      <canvas
        onDoubleClick={handleCanvasDoubleClick}
        style={{
          height: isDebugging ? "" : "100vh",
        }}
        ref={canvasRef}
        width="640"
        height="480"
      />
      <div className="form">
        <input
          type="string"
          value={url}
          disabled={isConnected}
          onChange={(ev) => {
            setUrl(ev.target.value);
          }}
        />
        <input
          type="button"
          value={isConnected ? "disconnect" : "connect"}
          onClick={() => {
            if (isConnected) {
              disconnect();
            } else {
              connect({ url });
            }
          }}
        />
      </div>
      <div>mouthOpen: {state.mouthOpen.toFixed(4)}</div>
      <div style={{ color: "red" }}>
        leftEyeOpen: {state.leftEyeOpen.toFixed(4)}
      </div>
      <div style={{ color: "blue" }}>
        rightEyeOpen: {state.rightEyeOpen.toFixed(4)}
      </div>
      <div>yaw: {state.yaw.toFixed(4)}</div>
      <div>pitch: {state.pitch.toFixed(4)}</div>
      <div style={{ color: "green" }}>
        highlithing mesh {FACEMESH_LIPS[pointIdx][0]} and{" "}
        {FACEMESH_LIPS[pointIdx][1]}
      </div>
      <input
        type="number"
        value={pointIdx}
        max={FACEMESH_LIPS.length - 1}
        min="0"
        onChange={(ev) => {
          setPointIdx(Number(ev.target.value));
        }}
      />
    </div>
  );
};

export default MediaPipeView;
