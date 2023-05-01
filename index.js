const {app, BrowserWindow, Tray, Menu, ipcMain} = require('electron')
const path = require('path')
const url = require('url');

var windowsUtils = _interopRequireWildcard(require("./windowsUtils"));
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

// 윈도우 객체를 전역에 유지합니다. 만약 이렇게 하지 않으면
// 자바스크립트 GC가 일어날 때 창이 멋대로 닫혀버립니다.
let win
let tray

let autoStartChecked = false

const appName = path.basename(process.execPath, '.exe');
const fullExeName = path.basename(process.execPath);

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
  win.loadFile('index.html')

  win.on('minimize', function(event){
    event.preventDefault();
    win.setSkipTaskbar(true);
    tray = createTray();
  })

  win.on('restore', function(event){
    win.show();
    win.setSkipTaskbar(false);
    tray.destroy();
  })

  win.on('closed', () => {
    win = null
  })

}

ipcMain.on('get-autostart-status', (event) => {
  isInstalled(installed => {
    event.sender.send('autostart-status', installed);
  })
});

ipcMain.on('autostart-change', (event, checked) => {
    if(checked) {
      uninstall();
    } else {
      install();
    }
});

function createTray() {
  tray = new Tray (path.join (__dirname, 'icon.png' ) ) // sets tray icon image
  isInstalled();

  const contextMenu = Menu.buildFromTemplate([   // define menu items
      {
        label: 'Show App', click: function () {
          win.show();
        }
      },
      {
        label: '윈도우 시작 시 자동 실행',
        type: 'checkbox',
        checked: autoStartChecked,
        click: function () {
          const shouldRunOnLogin = !autoStartChecked;
          setLoginItemSettings(shouldRunOnLogin);
          autoStartChecked = !autoStartChecked;
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

function setLoginItemSettings(shouldRunOnLogin) {  
  if (shouldRunOnLogin) {
    // 체크가 되어 있다면 시작 프로그램으로 등록
    install(() => {
      // 업데이트 완료 후 추가 작업 수행
      console.log('Started as a startup program');
    });
  } else {
    // 체크가 해제되어 있다면 시작 프로그램에서 제거
    uninstall(() => {
      // 업데이트 완료 후 추가 작업 수행
      console.log('Removed from startup programs');
    });
  }
}

// 시작 프로그램 등록 함수
function install(callback) {
  let execPath = `"${path.join(path.dirname(process.execPath), fullExeName)}"`;
  execPath = `${execPath} --process-start-args --start-minimized`;
  const queue = [['HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', '/v', appName, '/d', execPath]];
  windowsUtils.addToRegistry(queue, callback);
}

// 시작 프로그램 등록 여부 확인 함수
function isInstalled() {
  const queryValue = ['HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', '/v', appName];
  queryValue.unshift('query');
  windowsUtils.spawnReg(queryValue, (error, stdout) => {
    const doesOldKeyExist = stdout.indexOf(appName) >= 0;
    // callback(doesOldKeyExist);
    autoStartChecked = doesOldKeyExist
  });
}

// 시작 프로그램 제거 함수
function uninstall(callback) {
  const queryValue = ['HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', '/v', appName, '/f'];
  queryValue.unshift('delete');
  windowsUtils.spawnReg(queryValue, (error, stdout) => {
    callback();
  });
}

// 이 메서드는 Electron의 초기화가 끝나면 실행되며 브라우저
// 윈도우를 생성할 수 있습니다. 몇몇 API는 이 이벤트 이후에만
// 사용할 수 있습니다.
app.on('ready', () => {
  isQuiting = true;
  createWindow();
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
