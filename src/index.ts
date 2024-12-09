import { Context, Schema, h, Logger } from 'koishi'
import { Tools } from './Tools'

export const name = 'ohayo'

export interface Config { }

export const logger = new Logger("ohayo");

// 参数
export const Config: Schema<Config> = Schema.object({});

// 预设的早安回复语句
const ohayo: string[] = ['ohayo', '哦哈哟', '早', '早安呀', '你也早', '早上好', '早尚郝']
// 早安（晚安）图片url
const aisatsuURL = "https://api.lolimi.cn/API/image-zw/api.php";
let ohayoMemo = {};

/**
 * 早安判断函数,判断用户的输入满不满足回复条件
 * @param message 接收的消息
 */
function isOhayo(message: string): boolean {
  const ohayoMessage = ['早', '早上好', 'ohayo', '哦哈哟', 'zao', '起床', '起了']
  return ohayoMessage.indexOf(message) !== -1;
}

/**
 * 晚安判断函数,判断用户的输入满不满足回复条件
 * @param message 接收的消息
 */
function isOyasumi(message: string): boolean {
  const oyasumiMessage = ['晚', 'wan', 'oyasumi', '哦呀斯密', '睡觉', '睡了', '眠了'];
  return oyasumiMessage.indexOf(message) !== -1;
}

namespace DailyTask {
  //每天早上6点定时清理ohayoData数据
  let clearOhayoData;

  /**
   * 初始化定时任务
   */
  export function init(): void {
    const now = new Date()
    const time_6am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, now.getMinutes(), now.getSeconds());
    if (time_6am.getTime() < now.getTime()) {
      time_6am.setDate(time_6am.getDate() + 1);
    }
    const diff_6am = time_6am.getTime() - now.getTime();
    setTimeout(() => {
      ohayoMemo = {}
      clearOhayoData = setInterval(() => {
        ohayoMemo = {}
      }, 24 * 60 * 60 * 1000);
    }, diff_6am)
  }

  /**
   * 停止定时任务
   */
  export function stop(): void {
    clearInterval(clearOhayoData);
  }
}

/**
 * ohayo插件主体
 * @param ctx 
 * @param config 配置参数
 */
export function apply(ctx: Context, config: Config) {
  ctx.on('message', session => {
    // 判断收到的消息可不可以触发早安回复
    if (isOhayo(session.content)) {
      session.execute('早安');
    }

    // 判断收到的消息可不可以触发晚安回复
    if (isOyasumi(session.content)) {
      session.execute('晚安');
    }
  });

  // 删除开头对机器人的at文本，让message监听在qq群聊环境中能正常工作
  ctx.middleware((session, next) => {
    session.content = Tools.deleteSelfAdd(session.content, session.bot.selfId);
    return next();
  }, true)

  DailyTask.init()

  ctx.on('dispose', () => { DailyTask.stop() })

  ctx.command('早安')
    .action(async ({ session }) => {
      const now: Date = new Date();
      const nowHour: number = now.getHours();
      const nowMinute: number = now.getMinutes();
      if (ohayoMemo[session.userId] === undefined) {
        ohayoMemo[session.userId] = {
          hasOhayo: true,
          ohayoTime: now,
          hasOyasumi: false,
          oyasumiTime: new Date(),
        }
      } else if (ohayoMemo[session.userId].hasOhayo) {
        return `今天你已经早安过了哦`
      }

      let message = `${ohayo[Tools.getRandomInt(0, ohayo.length - 1)]}，现在是北京时间${String(nowHour).padStart(2, '0')}:${String(nowMinute).padStart(2, '0')}，你是今天第${Object.keys(ohayoMemo).length}个起床的哦。\n`
      if (nowHour < 6) {
        message += `你起得真早哇，或者你还没睡？不要熬夜哦`
      } else if (nowHour < 12) {
        message += `祝你有一个愉快的早晨。`
      } else if (nowHour < 18) {
        message += `都下午啦，起床后想做些什么呢`
      } else {
        message += `已经是晚上了，这么晚起床是想直接睡觉吗`
      }
      session.send(message);

      if (nowHour >= 6 && nowHour < 12) {
        session.send(await h('image', { src: aisatsuURL }));
      }
    });

  ctx.command('晚安')
    .action(async ({ session }) => {
      const now: Date = new Date();
      const nowHour: number = now.getHours();
      const nowMinute: number = now.getMinutes();
      let wakeTime;
      if (ohayoMemo[session.userId] === undefined) {
        return `你还没有早安哦，先道早安吧`
      } else if (ohayoMemo[session.userId].hasOyasumi) {
        return `今天你已经晚安过了哦`
      } else {
        ohayoMemo[session.userId].hasOyasumi = true;
        ohayoMemo[session.userId].oyasumiTime = now;
        wakeTime = Math.ceil((ohayoMemo[session.userId].oyasumiTime.getTime() - ohayoMemo[session.userId].ohayoTime.getTime()) / 1000);
      }

      let message = `晚安，现在是北京时间${String(nowHour).padStart(2, '0')}:${String(nowMinute).padStart(2, '0')}，`
      message += `你今日的清醒时间为${Math.floor(wakeTime / 60 / 60)}时${Math.floor(wakeTime / 60 % 60)}分${wakeTime % 60}秒，`
      if (nowHour < 6) {
        message += `下次别熬夜了哦`
      } else if (nowHour < 12) {
        message += `这个点道晚安，你不会是选在上课时间睡觉吧`
      } else if (nowHour < 18) {
        message += `现在作为睡觉时间稍微有点早了，你没有什么想做的事了吗`
      } else if (nowHour >= 18) {
        message += `要保持精致睡眠哦`
      }
      session.send(message);

      if (nowHour >= 18 || nowHour < 6) {
        session.send(await h('image', { src: aisatsuURL }))
      }
    });

  ctx.command('报时', '回复当前时间')
    .usage('使用北京时间')
    .action(({ session }) => {
      const now: Date = new Date();
      const year: number = now.getFullYear();
      const month: number = now.getMonth() + 1;
      const date: number = now.getDate();
      const day: string = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
      const hour: number = now.getHours();
      const minute: number = now.getMinutes();
      return `现在是${year}年${month}月${date}日，星期${day}，北京时间${hour}:${String(minute).padStart(2, '0')}。`;
    });

  ctx.command('帮我选 [..args]', '拿不定主意试试让bot帮你选吧').alias('roll')
    .usage('将想要选择的选项使用空格隔开，bot将会随机选择其一，如果什么都不传则返回0-10之间的随机数')
    .action(({ session }, ...args: string[]) => {
      if (args.length === 0) {
        return `这边建议您选择 ${Tools.getRandomInt(1, 10)} 呢`;
      }

      return `这边建议您选择 ${Tools.roll(args)} 呢`;
    });

  logger.info('open success');
}