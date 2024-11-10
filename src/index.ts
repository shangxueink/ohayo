import { Context, Schema, h } from 'koishi'
import { Tools } from './Tools'
import * as ACM from './ACM'

export const name = 'ohayo'

export interface Config {
  key: string
  secret: string
}

// 参数
export const Config: Schema<Config> = Schema.object({
  key: Schema.string().role('secret')
    .description('从Codeforces上获取的使用官方api使用的key'),
  secret: Schema.string().role('secret')
    .description('从Codeforces上获取的使用官方api使用的secret')
}).description('Codeforces访问设置');

/**
 * 预设的早安回复语句
 */
const ohayo: string[] = ['ohayo', '哦哈哟', '早', '早安呀', '你也早', '早上好', '早尚郝']

/**
 * 早安判断函数,判断用户的输入满不满足回复条件
 * @param message 接收的消息
 */
function isOhayo(message: string): boolean {
  const ohayoMessage = ['早', '早上好', 'ohayo', '哦哈哟', 'zao']
  return ohayoMessage.indexOf(message) !== -1;
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
  });

  // 删除开头对机器人的at文本，让message监听在qq群聊环境中能正常工作
  ctx.middleware((session, next) => {
    session.content = Tools.deleteSelfAdd(session.content, session.bot.selfId);
    return next();
  }, true)

  ctx.command('早安')
    .action((_, message) => {
      const now: Date = new Date();
      const nowHour: number = now.getHours();
      if (nowHour < 6) {
        return "早什么早，快去睡觉（早安时间在上午6点-12点）";
      }
      if (nowHour >= 12) {
        return "早什么早，不许早（早安时间在上午6点-12点）";
      }
      const nowMinute: number = now.getMinutes();
      return `${ohayo[Tools.getRandomInt(0, ohayo.length - 1)]}，现在是上午${nowHour}时${nowMinute}分，祝你有一个愉快的早晨。\n${h('image', { src: "https://api.lolimi.cn/API/image-zw/api.php" })}`;
      // 调用了一个早安图片api
    });

  ctx.command('晚安')
    .action((_, message) => {
      const now: Date = new Date();
      const nowHour: number = now.getHours();
      if (nowHour < 6) {
        return '晚安，下次别熬夜了哦';
      } else if (nowHour >= 18) {
        return '晚安，好梦';
      } else {
        return '晚安时间为下午6点到次日早上6点哦';
      }
    });

  ctx.command('报时', '回复当前时间')
    .usage('使用北京时间')
    .action((_, message) => {
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
    .action((_, ...args: string[]) => {
      if (args.length === 0) {
        return `这边建议您选择 ${Tools.getRandomInt(1, 10)} 呢`;
      }

      return `这边建议您选择 ${Tools.roll(args)} 呢`;
    });

  // 算法竞赛插件
  ctx.plugin(ACM, config);
}
