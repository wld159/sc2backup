const {app, BrowserWindow, Tray, Menu} = require('electron')
const path = require('path')
const url = require('url')

// 윈도우 객체를 전역에 유지합니다. 만약 이렇게 하지 않으면
// 자바스크립트 GC가 일어날 때 창이 멋대로 닫혀버립니다.
let win
let tray
// let automode = false

function createWindow () {
  // 새로운 브라우저 창을 생성합니다.
  win = new BrowserWindow({
        title: '스타2 저장소 백업툴',
        icon: path.join(__dirname, 'icon.png'),
        width: 400,
        height: 600,
        frame:false,
        resizable:false
    });

  // 그리고 현재 디렉터리의 index.html을 로드합니다.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // 개발자 도구를 엽니다.
//   win.webContents.openDevTools()
  win.on('minimize', function(event){
    event.preventDefault();
    win.setSkipTaskbar(true);
    tray = createTray();
    // win.hide();
  }
  )

  win.on('restore', function(event){
    win.show();
    win.setSkipTaskbar(false);
    tray.destroy();
  })

  win.on('closed', () => {
    win = null
  })
}

function createTray() {
  tray = new Tray (path.join (__dirname, 'icon.png' ) ) // sets tray icon image
  const contextMenu = Menu.buildFromTemplate([   // define menu items
      //  {
      //      label: 'Auto-saving',
      //      type : "checkbox",    // type property which defines a checkbox
      //      click(){
      //        automode = contextMenu.items[1].checked
      //        win.send('autosave', automode)
      //      }
      //     //  click: () => console.log ('autosave')  // click event handler
      //  },
      {
        label: 'Show App', click: function () {
          win.show();
        }
      },
      {
          label: 'Exit', click: function() {
            app.quit();
          }
      }
  ])

  tray.on('double-click', function(event){
    win.show();
  })
  tray.setContextMenu(contextMenu) 
return tray;
}

// 이 메서드는 Electron의 초기화가 끝나면 실행되며 브라우저
// 윈도우를 생성할 수 있습니다. 몇몇 API는 이 이벤트 이후에만
// 사용할 수 있습니다.
app.on('ready', () => {
  isQuiting = true;
  createWindow()

})

// 모든 창이 닫히면 애플리케이션 종료.
app.on('window-all-closed', () => {
  // macOS의 대부분의 애플리케이션은 유저가 Cmd + Q 커맨드로 확실하게
  // 종료하기 전까지 메뉴바에 남아 계속 실행됩니다.
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // macOS에선 보통 독 아이콘이 클릭되고 나서도
  // 열린 윈도우가 없으면, 새로운 윈도우를 다시 만듭니다.
  if (win === null) {
    createWindow()
  }
})

// 이 파일엔 제작할 애플리케이션에 특화된 메인 프로세스 코드를
// 포함할 수 있습니다. 또한 파일을 분리하여 require하는 방법으로
// 코드를 작성할 수도 있습니다.
