import { Context, Schema, h } from 'koishi'
import { Niuke, Atcoder, Codeforces } from './ACM'
import { Tools } from './Tools'

export const name = 'ohayo'

export interface Config {
  codeforcesKey: string
  codeforcesSecret: string
}

// 参数
export const Config: Schema<Config> = Schema.object({
  codeforcesKey: Schema.string().role('secret'),
  codeforcesSecret: Schema.string().role('secret')
})

/**
 * 预设的早安回复语句
 */
const ohayo: string[] = ['ohayo', '哦哈哟', '早', '早安呀', '你也早', '早上好', '早尚郝']

/**
 * 早安判断函数,判断用户的输入满不满足回复条件
 */
function isOhayo(message: string): boolean {
  const ohayoMessage = ['早', '早上好', 'ohayo', '哦哈哟', 'zao']
  return ohayoMessage.indexOf(message) !== -1;
}

/**
 * 插件主体
 * @param ctx 
 * @param config 配置参数
 */
export function apply(ctx: Context, config: Config) {
  ctx.on('message', session => {
    if (isOhayo(session.content)) {
      session.execute('早安');
    }
  });

  /**
   * 实现早安功能
   */
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

  /**
   * 实现简单的晚安功能
   */
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

  /** 
   * 报时指令，回复当前时间
   */
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

  /**
   * 随机选择指令，随机选中用户传入的参数中的一个返回，若没有参数则返回1-10的随机数
   */
  ctx.command('帮我选 [..args]', '拿不定主意试试让bot帮你选吧').alias('roll')
    .usage('将想要选择的选项使用空格隔开，bot将会随机选择其一，如果什么都不传则返回0-10之间的随机数')
    .action((_, ...args: string[]) => {
      if (args.length === 0) {
        return `这边建议您选择 ${Tools.getRandomInt(1, 10)} 呢`;
      }

      return `这边建议您选择 ${Tools.roll(args)} 呢`;
    });

  /**
   * 算法竞赛指令，调用相关函数获取支持查询的oj最近的一场竞赛，总结起来返回
   */
  ctx.command('算法竞赛', '查看最近竞赛').alias('acm')
    .usage('目前支持查询的竞赛oj：牛客、Atcoder、CodeForces')
    .usage('总查询只会查各个oj的最近一场竞赛，想看更多请单独查找')
    .action(async (_, message) => {
      const key = config.codeforcesKey;
      const secret = config.codeforcesSecret;
      return `最近的竞赛：\n牛客： \n${await Niuke.getNiukeContest(0)}\n\nAtcoder： \n${await Atcoder.getAtcoderContest(0)}\n\nCodeforces：\n${await Codeforces.getCodeForcesContest(0, key, secret)}`;
    })

  /**
   * 牛客竞赛指令，调用相关函数获取牛客竞赛最近的三场竞赛
   */
  ctx.command('牛客竞赛', '查看牛客最近竞赛').alias('niuke')
    .usage('查询牛客竞赛的最近三场比赛')
    .action(async (_, message) => {
      let contests: string[] = ['', '', ''];
      for (let i: number = 0; i < 3; i++) {
        contests[i] = await Niuke.getNiukeContest(i);
      }

      return `最近的牛客竞赛：\n${contests[0]}\n\n${contests[1]}\n\n${contests[2]}`;
    });

  ctx.command('牛客个人信息 <userName:string>', '查询牛客上指定用户的信息').alias('niukeProfile')
    .action(async (_, userName) => {
      return Niuke.getNiukeProfile(userName);
    })

  /**
   * Atcoder竞赛指令，调用相关函数获取Atcoder最近的三场竞赛
   */
  ctx.command('Atcoder竞赛', '查看Atcoder最近竞赛').alias('atc')
    .usage('查询Atcoder的最近三场比赛')
    .usage('注：bot显示时间为北京时间，在Atcoder上看到的可能是日本时间或是别的什么时间，想参加竞赛务必确认好时间')
    .action(async (_, message) => {
      let contests: string[] = ['', '', '']
      for (let i: number = 0; i < 3; i++) {
        contests[i] = await Atcoder.getAtcoderContest(i);
      }

      return `最近的Atcoder竞赛：\n${contests[0]}\n\n${contests[1]}\n\n${contests[2]}`;
    })

  /**
   * 查询Atcoder用户的个人信息
   * 有待添加默认值功能
   */
  ctx.command('Atcoder个人信息 <userName:string>', '查询Atcoder上指定用户的信息').alias('atcprofile')
    .action(async (_, userName: string) => {
      if (userName === undefined) {
        return '给个名字吧朋友，不然我查谁呢';
      }

      return await Atcoder.getAtcoderProfile(userName);
    })

  /**
   * Codeforces竞赛指令，调用相关函数获取Codeforces竞赛最近的三场竞赛
   */
  ctx.command('Codeforces竞赛', '查看Codeforces最近竞赛').alias('cf')
    .usage('查询Codeforces竞赛的最近三场比赛')
    .action(async (_, message) => {
      const key = config.codeforcesKey;
      const secret = config.codeforcesSecret;
      let contests: string[] = ['', '', ''];
      for (let i: number = 0; i < 3; i++) {
        contests[i] = await Codeforces.getCodeForcesContest(i, key, secret);
      }

      return `最近的Codeforces竞赛：\n${contests[0]}\n\n${contests[1]}\n\n${contests[2]}`;
    });


  /**
   * 查询CodeForces用户的个人信息
   */
  ctx.command('Codeforces个人信息 <userName:string>', '查询Codeforces上指定用户的信息').alias('cfprofile')
    .action(async (_, userName) => {
      const key = config.codeforcesKey;
      const secret = config.codeforcesSecret;
      return Codeforces.getCodeForcesProfile(userName, key, secret);
    });
}
