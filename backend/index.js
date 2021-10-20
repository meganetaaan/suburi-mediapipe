const Express = require('express')
const app = Express()
require('express-ws')(app)

const PORT = 8080
const YAW_OFFSET = 27
let sockets = []

function currentDataToRobotState(currentData, yawOffset = YAW_OFFSET) {
  const {blinkSpeed, yaw, pitch} = currentData
  const eyeOpen = blinkSpeed > 0 ? 0 : 1
  const robotPitch = pitch * Math.PI / 180
  const y = yaw > 180 ? yaw - 360 : yaw
  const robotYaw = (y  - yawOffset) * Math.PI / 180
  return {
    mouthOpen: 0,
    leftEyeOpen: eyeOpen,
    rightEyeOpen: eyeOpen,
    pitch: robotPitch,
    yaw: robotYaw,
    emotion: "NEUTRAL"
  }
}

// publicディレクトリ配下を配信する
app.use(Express.static('static'))

// WebSocketエンドポイントの設定
app.ws('/', function (socket) {
  sockets.push(socket)
  console.log(`connected. current # of connection: ${sockets.length}`)

  socket.on('message', function (message) {
    try {
      message = JSON.parse(message)
      message = message.eyeMoveUp == null ? message : currentDataToRobotState(message)
      console.log(`sending: ${JSON.stringify(message)}`)
      // 他のコネクションにメッセージを送る
      sockets.filter(s => {
        return s !== socket
      }).forEach(s => {
        s.send(JSON.stringify(message))
      })
    } catch (e) {
      console.error(e.message)
    }
  })

  socket.on('close', () => {
    // 閉じたコネクションを取り除く
    sockets = sockets.filter(s => {
      return s !== socket
    })
    console.log(`closed. current # of connection: ${sockets.length}`)
  })
})
// ポート8080で接続を待ち受ける
app.listen(PORT, function () {
  console.log(`listening on port ${PORT}`)
})
