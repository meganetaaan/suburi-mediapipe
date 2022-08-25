import { useEffect, useRef, useState } from "react";

export interface RobotState {
  mouthOpen: number;
  leftEyeOpen: number;
  rightEyeOpen: number;
  pitch: number;
  yaw: number;
  emotion: string;
  hooray?: boolean;
}

interface RobotServiceReturnType {
  connect: (param?: { url: string, option?: any }) => void,
  disconnect: () => void,
  sendState: (state: RobotState) => void,
  isConnected: boolean
}

export default function useRobotService(initialUrl?: string): [
  RobotServiceReturnType["connect"],
  RobotServiceReturnType["sendState"],
  RobotServiceReturnType["disconnect"],
  RobotServiceReturnType["isConnected"],
] {
  const [url, setUrl] = useState<string | undefined>(initialUrl)
  const socketRef = useRef<WebSocket>();
  const [isConnected, setConnected] = useState<boolean>(false)
  // TODO: make hooks
  useEffect(() => {
    if (url == null) {
      return
    }
    const socket = new WebSocket(url);
    socket.addEventListener("error", (error) => {
      console.error(error)
    })
    socket.addEventListener("open", () => {
      console.log("connected");
      setConnected(true)
      socketRef.current = socket
    });
    socket.addEventListener("close", () => {
      console.log("disconnected");
      setConnected(false)
      socketRef.current = undefined
    })
    return () => {
      socketRef.current?.close();
    };
  }, [url]);
  const connect = (param?: { url: string, option?: any }) => {
    setUrl(param?.url)
  }
  const disconnect = () => {
    setUrl(undefined)
  }
  const sendState = (obj: RobotState) => {
    if (
      socketRef.current == null ||
      socketRef.current.readyState != WebSocket.OPEN
    ) {
      return;
    }
    socketRef.current?.send(JSON.stringify(obj));
  };
  return [connect, sendState, disconnect, isConnected];
}
