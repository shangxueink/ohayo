import { Context, Schema, h } from 'koishi'

export const name = 'ohayo'

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

/**
 * 预设的早安回复语句
 */
const ohayo: string[] = ['ohayo', '哦哈哟', '早', '早安呀', '你也早', '早上好', '早尚郝']

/**
 * 整数限制范围版随机数函数
 * @param min 随机数最小值
 * @param max 随机数最大值
 * @returns 返回一个min-max之间的随机整数
 */
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * 早安判断函数,判断用户的输入满不满足回复条件
 */
function isOhayo(message: string): boolean {
  const ohayoMessage = ['早', '早上好', 'ohayo', '哦哈哟', 'zao']
  return ohayoMessage.indexOf(message) !== -1;
}

/**
 * 将Date对象转换成给用户读的字符串形式
 * @param time Date对象
 * @returns 返回转换后的字符串
 */
function dateToString(time: Date): string {
  // 分行累加主要是方便读
  let timeMessage: string = '现在是';
  timeMessage += time.getFullYear() + '年';
  timeMessage += (time.getMonth() + 1) + '月';
  timeMessage += time.getDate() + '日，';
  timeMessage += '星期' + ['日', '一', '二', '三', '四', '五', '六'][time.getDay()] + '，';
  timeMessage += "北京时间" + time.getHours() + '点' + time.getMinutes() + '分';
  return timeMessage;
}

export function apply(ctx: Context) {
  /**
   * 实现早安功能
   */
  ctx.on('message', session => {
    if (isOhayo(session.content)) {
      const now: Date = new Date();
      const nowHour: number = now.getHours();
      if (nowHour < 6) {
        session.send("早什么早，快去睡觉（早安时间在上午6点-12点）");
        return;
      }
      if (nowHour > 12) {
        session.send("早什么早，不许早（早安时间在上午6点-12点）");
        return;
      }
      const nowMinute: number = now.getMinutes();
      session.send(ohayo[getRandomInt(0, ohayo.length - 1)] + "，现在是上午" + nowHour + "时" + nowMinute + "分，祝你有一个愉快的早晨。");
      session.send(h('image', { src: "https://api.lolimi.cn/API/image-zw/api.php" }));  // 调用了一个早安图片api
    }
  });

  /** 
   * 报时指令，回复当前时间
   */
  ctx.command('报时')
    .action((_, message) => {
      const now: Date = new Date();
      return dateToString(now);
    });

  /**
   * 随机选择指令，随机选中用户传入的参数中的一个返回，若没有参数则返回1-10的随机数
   */
  ctx.command('roll [..args]').alias('帮我选')
    .action((_, ...args: string[]) => {
      if (args.length === 0) {
        return "这边建议您选择 " + getRandomInt(1, 10) + " 呢";
      }

      return "这边建议您选择 " + args[getRandomInt(0, args.length - 1)] + " 呢";
    });

  ctx.command('echo <text:message>').alias('复读')
    .action((_, message) => message);
}
