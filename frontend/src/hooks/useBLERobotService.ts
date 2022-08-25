import { useEffect, useRef, useState } from "react";

const DEVICE_NAME = 'stackchan'
const SERVICE_UUID = '450f932b-bb09-4fe3-9856-6f66ddcc43ec'
const CHARACTERISTIC_UUID = 'a2abc192-26aa-45d9-aa17-42db27585c57'

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

type ConnectOption = {
  onDisconnected: () => void
  onConnected: (char: BluetoothRemoteGATTCharacteristic, server: BluetoothRemoteGATTServer) => void
}
async function connectBLE({ onDisconnected, onConnected }: ConnectOption): Promise<void> {
  if (navigator.bluetooth == null) {
    console.warn('bluetooth not available')
    return
  }
  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: false,
      filters: [{ name: DEVICE_NAME }, { services: [SERVICE_UUID] }]
    })
    if (device.gatt == null) {
      console.warn('device has no gatt property')
      return
    }
    device.addEventListener('gattserverdisconnected', () => {
      onDisconnected()
    })
    const server = await device.gatt.connect().catch((reason) => {
      console.log(`gatt.connect failed. ${reason}`)
    })
    if (server == null) {
      return
    }
    const service = await server.getPrimaryService(SERVICE_UUID)
    const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID)
    onConnected(characteristic, server)
  } catch (e) {
    console.log(e)
  }
}
export default function useBLERobotService(initialUrl?: string): [
  RobotServiceReturnType["connect"],
  RobotServiceReturnType["sendState"],
  RobotServiceReturnType["disconnect"],
  RobotServiceReturnType["isConnected"],
] {
  const serverRef = useRef<BluetoothRemoteGATTServer>();
  const [charasteristic, setCharasteristic] = useState<BluetoothRemoteGATTCharacteristic | undefined>(undefined)
  const [isConnected, setConnected] = useState<boolean>(false)
  const onConnected = (char: BluetoothRemoteGATTCharacteristic, server: BluetoothRemoteGATTServer) => {
    console.log('connected')
    setConnected(true)
    setCharasteristic(char)
    serverRef.current = server
  }
  const onDisconnected = () => {
    console.log('disconnected')
    setConnected(false)
    setCharasteristic(undefined)
    serverRef.current = undefined
  }
  const connect = () => {
    connectBLE({onConnected, onDisconnected})
  }
  const disconnect = () => {
    if (serverRef.current != null) {
      serverRef.current.disconnect()
    }
  }
  const sendState = async (obj: RobotState) => {
    if (charasteristic == null) {
      return;
    }
    if (!serverRef.current?.connected) {
      // server is not connected
      return;
    }
    const encoder = new TextEncoder()
    const buf = encoder.encode(JSON.stringify(obj))
    await charasteristic.writeValue(buf).catch(reason => {
      console.warn(`write failed: ${reason}`)
    })
  };
  return [connect, sendState, disconnect, isConnected];
}
