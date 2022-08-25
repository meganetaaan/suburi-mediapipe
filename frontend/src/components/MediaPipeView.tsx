import { FACEMESH_LIPS } from "@mediapipe/holistic";
import { FC, useCallback, useEffect, useState } from "react";
import useBLERobotService from "../hooks/useBLERobotService";
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

const CONNECTION_METHOD = {
  WIFI: 0,
  BLUETOOTH: 1
}

const MediaPipeView: FC<MediaPipeProps> = () => {
  const [ref, results] = useMediaPipe(process.env.REACT_APP_HOLISTIC_ROOT);
  const [connect, sendState, disconnect, isConnected] = useRobotService();
  const [connectBLE, sendStateBLE, disconnectBLE, isConnectedBLE] = useBLERobotService();
  const [connectionMethod, setConnectionMethod] = useState<number>(CONNECTION_METHOD.WIFI)
  const [url, setUrl] = useState(INITIAL_WS_URL);
  const [isDebugging, setDebugging] = useState(false);
  const [pointIdx, setPointIdx] = useState<number>(0);
  const [drawEnabled, setDrawEnabled] = useState(true);
  const handleCanvasDoubleClick = () => {
    setDebugging(!isDebugging);
  };
  const state: RobotState =
    results?.faceLandmarks != null
      ? calculateRobotState(results)
      : INITIAL_STATE;
  useEffect(() => {
    connectionMethod === CONNECTION_METHOD.BLUETOOTH ? sendStateBLE(state) : sendState(state);
  }, [results]);
  const handleConnectionMethodChange = useCallback((event) => {
    setConnectionMethod(Number(event.target.value));
  }, [])
  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (canvas == null || !drawEnabled) {
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
  const handleConnectClick = () => {
    if (isConnectedBLE) {
      disconnectBLE();
    } else if (isConnected) {
      disconnect();
    } else {
      connectionMethod === CONNECTION_METHOD.BLUETOOTH ? connectBLE() : connect({ url })
    }
  }
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
        <label>
          Connection Method:
          <select value={connectionMethod} onChange={handleConnectionMethodChange}>
            <option value={CONNECTION_METHOD.WIFI}>WebSocket</option>
            <option value={CONNECTION_METHOD.BLUETOOTH}>Bluetooth</option>
          </select>
        </label>
        {
          connectionMethod === CONNECTION_METHOD.WIFI && (
            <>
              <input
                type="string"
                value={url}
                disabled={isConnectedBLE}
                onChange={(ev) => {
                  setUrl(ev.target.value);
                }}
              />
            </>
          )
        }
        <input
          type="button"
          value={(isConnectedBLE || isConnected) ? "disconnect" : "connect"}
          onClick={handleConnectClick}
        />
        <input
          type="checkbox"
          checked={drawEnabled}
          onClick={() => {
            setDrawEnabled(!drawEnabled)
          }}
        ></input>
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
