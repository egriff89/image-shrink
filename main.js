const { app, BrowserWindow, Menu, globalShortcut } = require('electron');

// Set environment
process.env.NODE_ENV = 'development';

const isDev = process.env.NODE_ENV !== 'production' ? true : false;
const isMac = process.platform === 'darwin' ? true : false;

let mainWindow;
let aboutWindow;

function createMainWindow() {
   mainWindow = new BrowserWindow({
      title: 'ImageShrink',
      width: 500,
      height: 600,
      icon: `${__dirname}/assets/icons/Icon_256x256.png`,
      resizable: isDev,
   });

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

app.on('window-all-closed', () => {
   if (!isMac) {
      app.quit();
   }
});

app.on('activate', () => {
   if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
   }
});
