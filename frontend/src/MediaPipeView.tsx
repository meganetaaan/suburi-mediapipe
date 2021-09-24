import { FC } from "react";
import useMediaPipe from "./hooks/useMediaPipe";

interface MediaPipeProps {}

const MediaPipeView: FC<MediaPipeProps> = () => {
  const [ref, result] = useMediaPipe()
  return (
    <div>
      <video ref={ref} width="640" height="480"/>
      <pre>
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  )
};

export default MediaPipeView;
