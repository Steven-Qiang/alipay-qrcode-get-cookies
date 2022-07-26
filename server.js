/**
 * @file: server.js
 * @description:  支付宝扫码登录获取cookie
 * @package: alipay-qrcode-get-cookies
 * @create: 2021-05-23 12:12:32
 * @author: qiangmouren (2962051004@qq.com)
 * -----
 * @last-modified: 2022-07-26 03:13:56
 * -----
 */

const express = require('express');
const app = express();
const router = express.Router({ caseSensitive: true });

const { EventEmitter } = require('events');
EventEmitter.defaultMaxListeners = 100;

/** @type {{[key:string]:{page:import("puppeteer").Page, browser:import("puppeteer").Browser, state:string, time:number}} */
let task_page_map = {};

const _log = console.log;
console.log = () => {};

const mainFrameUrl = 'https://auth.alipay.com/login/homeB.htm?redirectType=parent';
router.get('/api/create', async (req, res, next) => {
  const id = (() => {
    function S4() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
    return `${S4() + S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`;
  })();

  const { browser, page } = await newTask();
  try {
    task_page_map[id] = { page, state: '', time: Date.now(), browser };

    page.on('response', async (response) => {
      if (response.url().includes('barcodeProcessStatus')) {
        const resp = await response.text();
        const state = /"barcodeStatus":"(.*?)"/.exec(resp).pop();
        if (state === 'confirmed') {
          task_page_map[id].cookies = await page
            .cookies()
            .then((x) => x.map(({ name, value }) => `${name}=${value}`).join(';'));
          task_page_map[id].browser = null;
          task_page_map[id].page = null;
          browser.close();
        }
        task_page_map[id].state = state;
      }
    });

    await page.goto(mainFrameUrl);
    await page.waitForSelector('.barcode');
    const element = await page.$('.barcode');
    const image = await element.screenshot().then((x) => `data:image/png;base64,${x.toString('base64')}`);
    const length = getTaskLength();
    res.json({ code: 1, image, id, tasks: length });
  } catch (error) {
    Reflect.deleteProperty(task_page_map, id);

    const length = getTaskLength();
    res.json({ code: 0, msg: '服务器正忙，请稍候重试', tasks: length });
    browser.close();
  }
});

router.get('/api/status/:id', async ({ params }, res, next) => {
  const task = task_page_map[params.id];
  const length = getTaskLength();
  if (!task) {
    res.json({
      code: 0,
      msg: 'id不存在或任务已结束',
      tasks: length,
    });
    return;
  }

  task.cookies = task.cookies || '';
  if (!task.cookies && task.page.url() !== mainFrameUrl) {
    task.cookies = await task.page.cookies().then((x) => x.map(({ name, value }) => `${name}=${value}`).join(';'));
    await task.browser.close();
    /** 清理内存 */
    task_page_map[params.id] = { cookies: task.cookies, state: task.state };
  }

  res.json({ code: 1, state: task.state, cookies: task.cookies || undefined, tasks: length });
});

setInterval(() => {
  _log('开始检测过期任务.', '目前任务后台有效任务数量', getTaskLength());
  Object.keys(task_page_map).forEach((id) => {
    const { time, browser } = task_page_map[id];
    if (Date.now() - time > 1000 * 60 * 5) {
      _log('过期任务:', id, '已被关闭');
      browser.close();
      Reflect.deleteProperty(task_page_map, id);
    }
  });
}, 5 * 1000);

function getTaskLength() {
  return Object.keys(task_page_map).filter((x) => task_page_map[x].browser).length;
}
/**
 * @return {PromiseLike<{browser:import("puppeteer").Browser,page:import("puppeteer").Page}>}
 */
async function newTask() {
  const browser = await revisionInfo.puppeteer.launch({
    args: [
      '--no-sandbox',
      '--start-maximized',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certifcate-errors',
      '--ignore-certifcate-errors-spki-list',
      '--user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.104 Safari/537.36"',
    ],
    executablePath: revisionInfo.executablePath,
    defaultViewport: { width: 375, height: 812 },

    ignoreHTTPSErrors: true,
    headless: true,
    timeout: 0,
    pipe: true,
  });

  const [page] = await browser.pages();
  return { browser, page };
}

(async () => {
  revisionInfo = await require('puppeteer-chromium-resolver')({ hosts: ['https://npm.taobao.org/mirrors'] });
  app.set('json spaces', 40);
  app.use(router);
  app.listen(3005);

  _log('程序已经运行，接口地址 http://127.0.0.1:3005/api/create');
})();
