const path = require('path');
const os = require('os');

const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const slash = require('slash');
const log = require('electron-log');
const {
   app,
   BrowserWindow,
   Menu,
   globalShortcut,
   ipcMain,
   shell,
} = require('electron');

// Set environment
process.env.NODE_ENV = 'production';

const isDev = process.env.NODE_ENV !== 'production' ? true : false;
const isMac = process.platform === 'darwin' ? true : false;

let mainWindow;
let aboutWindow;

function createMainWindow() {
   mainWindow = new BrowserWindow({
      title: 'ImageShrink',
      width: isDev ? 700 : 500,
      height: 600,
      icon: `${__dirname}/assets/icons/Icon_256x256.png`,
      resizable: isDev,
      webPreferences: {
         nodeIntegration: true, // Enable use of node modules in browser
      },
   });

   // Open Chrome Dev Tools by default if we're in development mode
   if (isDev) {
      mainWindow.webContents.openDevTools();
   }

   mainWindow.loadFile(`${__dirname}/app/index.html`);
}

function createAboutWindow() {
   aboutWindow = new BrowserWindow({
      title: 'About ImageShrink',
      width: 300,
      height: 300,
      icon: `${__dirname}/assets/icons/Icon_256x256.png`,
      resizable: false,
   });

   aboutWindow.loadFile(`${__dirname}/app/about.html`);
}

app.on('ready', () => {
   createMainWindow();

   const mainMenu = Menu.buildFromTemplate(menu);
   Menu.setApplicationMenu(mainMenu);

   mainWindow.on('closed', () => (mainWindow = null));
});

// App menu
// TODO: Move to separate file to reduce clutter
const menu = [
   ...(isMac
      ? [
           {
              label: app.name,
              submenu: [
                 {
                    label: 'About',
                    click: () => createAboutWindow(),
                 },
              ],
           },
        ]
      : []),
   {
      role: 'fileMenu',
   },
   ...(!isMac
      ? [
           {
              label: 'Help',
              submenu: [
                 {
                    label: 'About',
                    click: () => createAboutWindow(),
                 },
              ],
           },
        ]
      : []),
   ...(isDev
      ? [
           {
              label: 'Developer',
              submenu: [
                 { role: 'reload' },
                 { role: 'forcereload' },
                 { type: 'separator' },
                 { role: 'toggledevtools' },
              ],
           },
        ]
      : []),
];

// Receive and process minimize event from browser
ipcMain.on('image:minimize', (e, options) => {
   options.dest = path.join(os.homedir(), 'imageshrink');
   shrinkImage(options);
});

async function shrinkImage({ imgPath, quality, dest }) {
   try {
      const pngQuality = quality / 100;

      const files = await imagemin([slash(imgPath)], {
         destination: dest,
         plugins: [
            imageminMozjpeg({ quality }),
            imageminPngquant({
               quality: [pngQuality, pngQuality],
            }),
         ],
      });

      log.info(files);

      // Open destination after shrinking image
      shell.openPath(dest);

      // Send done event to browser
      mainWindow.webContents.send('image:done');
   } catch (err) {
      log.error(err);
   }
}

app.on('window-all-closed', () => {
   if (!isMac) {
      // Kill main process if not running on Mac
      // and all app windows are closed
      app.quit();
   }
});

app.on('activate', () => {
   if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
   }
});
