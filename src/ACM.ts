import { Context, Logger, segment } from 'koishi'
import { } from "koishi-plugin-puppeteer"
import { Config } from './index';
import { JSDOM } from 'jsdom'
import { CodeforcesAPI } from "codeforces-api-ts"
import { User } from 'codeforces-api-ts/dist/types';

// html转DOM元素进行操作的依赖
const { window } = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);

export const name = 'ACM'

declare module 'koishi' {
    interface Binding {
        niukeName: string,
        atcName: string,
        cfName: string
    }
}

export const logger = new Logger("ACM");

/**
 * 算法竞赛插件主体
 * @param ctx 
 * @param config 配置参数
 */
export function apply(ctx: Context, config: Config) {
    ctx.model.extend('binding', {
        niukeName: 'string',
        atcName: 'string',
        cfName: 'string'
    })

    Codeforces.setCredentials(config.key, config.secret);

    // 算法竞赛总指令，方便统一查看指令，以及让help菜单不那么臃肿
    ctx.command('算法竞赛', '使用"help 算法竞赛"查看更多指令')
        .action(({ session }) => {
            return '使用"help 算法竞赛"查看更多指令';
        })

    ctx.command('算法竞赛')
        .subcommand('最近竞赛', '查看最近竞赛').alias('acm')
        .usage('目前支持查询的竞赛oj：牛客、Atcoder、CodeForces')
        .usage('总查询只会查各个oj的最近一场竞赛，想看更多请单独查找')
        .action(async ({ session }) => {
            return `最近的竞赛：\n牛客： \n${await Niuke.getContest(0)}\n\nAtcoder： \n${await Atcoder.getContest(0)}\n\nCodeforces：\n${await Codeforces.getContest(0)}`;
        })

    ctx.command('算法竞赛')
        .subcommand('牛客竞赛', '查看牛客最近竞赛').alias('niuke')
        .usage('查询牛客竞赛的最近三场比赛')
        .action(async ({ session }) => {
            try {
                let page = await ctx.puppeteer.page();
                await page.setViewport({ width: 1920, height: 1080 });
                await page.goto('https://ac.nowcoder.com/')
                await page.waitForNetworkIdle();
                const contestBox = await page.$('.home-match-item');
                return segment.image(await contestBox.screenshot(), "image/png");
            } catch (e) {
                console.error(e);
            }
        });

    ctx.command('算法竞赛')
        .subcommand('牛客绑定 <userName:string>', '绑定牛客昵称').alias('niukebind')
        .usage('绑定成功后可以通过"/牛客个人信息"指令不传入参数查到对应信息')
        .action(async ({ session }, userName) => {
            if (userName == undefined) return `给个名字吧朋友，不然我查谁呢`
            let userId: string = session.event.user.id;
            await ctx.database.set('binding', { pid: userId }, { niukeName: userName })
            return "绑定成功";
        })

    ctx.command('算法竞赛')
        .subcommand('牛客个人信息 <userName:string>', '查询牛客上指定用户的信息').alias('niukeProfile')
        .action(async ({ session }, userName) => {
            if (userName === undefined) {
                let userId: string = session.event.user.id;
                let userData = await ctx.database.get('binding', { pid: userId })
                if (userData.length === 0 || userData[0].niukeName === undefined) {
                    return `给个名字吧朋友，不然我查谁呢`;
                }
                userName = userData[0].niukeName;
            }
            return Niuke.getProfile(userName);
        })

    ctx.command('算法竞赛')
        .subcommand('Atcoder竞赛', '查看Atcoder最近竞赛').alias('atc')
        .usage('查询Atcoder的最近十场比赛')
        .action(async ({ session }) => {
            try {
                let page = await ctx.puppeteer.page();
                await page.setViewport({ width: 1920, height: 1080 });
                await page.goto('https://atcoder.jp/contests?lang=ja')
                await page.waitForNetworkIdle();
                const contestBox = await page.$('#contest-table-upcoming');
                return segment.image(await contestBox.screenshot(), "image/png");
            } catch (e) {
                console.error(e);
            }
        })

    ctx.command('算法竞赛')
        .subcommand('Atcoder绑定 <userName:string>', '绑定Atcoder昵称').alias('atcbind')
        .usage('绑定成功后可以通过"/Atcoder个人信息"指令不传入参数查到对应信息')
        .action(async ({ session }, userName) => {
            if (userName == undefined) return `给个名字吧朋友，不然我查谁呢`
            let userId: string = session.event.user.id;
            await ctx.database.set('binding', { pid: userId }, { atcName: userName })
            return "绑定成功";
        })

    ctx.command('算法竞赛')
        .subcommand('Atcoder个人信息 <userName:string>', '查询Atcoder上指定用户的信息').alias('atcprofile')
        .action(async ({ session }, userName: string) => {
            if (userName === undefined) {
                let userId: string = session.event.user.id;
                let userData = await ctx.database.get('binding', { pid: userId })
                if (userData.length === 0 || userData[0].atcName === undefined) {
                    return `给个名字吧朋友，不然我查谁呢`;
                }
                userName = userData[0].atcName;
            }
            return await Atcoder.getProfile(userName);
        })

    ctx.command('算法竞赛')
        .subcommand('Codeforces竞赛', '查看Codeforces最近竞赛').alias('cf')
        .usage('查询Codeforces竞赛的最近三场比赛')
        .action(async ({ session }) => {
            let contests: string[] = ['', '', ''];
            for (let i: number = 0; i < 3; i++) {
                contests[i] = await Codeforces.getContest(i);
            }

            return `最近的Codeforces竞赛：\n${contests[0]}\n\n${contests[1]}\n\n${contests[2]}`;
        });

    ctx.command('算法竞赛')
        .subcommand('Codeforces绑定 <userName:string>', '绑定Codeforces昵称').alias('cfbind')
        .usage('绑定成功后可以通过"/Codeforces个人信息"指令不传入参数查到对应信息')
        .action(async ({ session }, userName) => {
            if (userName == undefined) return `给个名字吧朋友，不然我查谁呢`
            let userId: string = session.event.user.id;
            await ctx.database.set('binding', { pid: userId }, { cfName: userName })
            return "绑定成功";
        })

    ctx.command('算法竞赛')
        .subcommand('Codeforces个人信息 <userName:string>', '查询Codeforces上指定用户的信息').alias('cfprofile')
        .action(async ({ session }, userName) => {
            if (userName === undefined) {
                let userId: string = session.event.user.id;
                let userData = await ctx.database.get('binding', { pid: userId })
                if (userData.length === 0 || userData[0].cfName === undefined) {
                    return `给个名字吧朋友，不然我查谁呢`;
                }
                userName = userData[0].cfName;
            }
            return Codeforces.getProfile(userName);
        })

    ctx.command('算法竞赛')
        .subcommand('洛谷竞赛', '查看洛谷最近竞赛').alias('luogu')
        .usage('查询洛谷的最近六场比赛')
        .action(async ({ session }) => {
            try {
                let page = await ctx.puppeteer.page();
                await page.setViewport({ width: 1060, height: 1080 });
                await page.goto('https://www.luogu.com.cn/')
                await page.waitForNetworkIdle();
                const contestBox = await (await page.$('.am-u-lg-9')).$(".lg-article");
                return segment.image(await contestBox.screenshot(), "image/png");
            } catch (e) {
                console.error(e);
            }
        })
}

/**
 * 牛客相关函数
 */
export namespace Niuke {
    class UserProfile {
        userName: string;
        userID: string;
        rating: number;
        rank: string;
        contestNumberRated: number;
        contestNumberUnrated: number;
        passNumber: number;

        constructor(userName: string) {
            this.userName = userName;
        }

        toString() {
            let res: string = "";
            res += `昵称: ${this.userName}\n`;
            res += `rating: ${this.rating}\n`;
            res += `排名: ${this.rank}名\n`;
            res += `参与场次：Rated${this.contestNumberRated}场，Unrated${this.contestNumberUnrated}场\n`
            res += `已过题数：${this.passNumber}\n`
            return res;
        }
    }

    class Contest {
        contestName: string;
        countdown: string;

        toString() {
            return `${this.contestName}\n${this.countdown}`;
        }
    }

    /**
     * 查询牛客竞赛最近的竞赛名称及时间
     * @param index 下标，范围为0-2
     * @returns 查询后的字符串
     */
    export async function getContest(index: number) {
        let message = "";
        let contest = new Contest();
        const url = "https://ac.nowcoder.com";
        await fetch(url, { method: 'GET' })
            .then(response => {
                if (response.status === 200) {
                    return response.text()
                } else {
                    message = `HTTP:${response.status} error`;
                }
            })
            .then(htmlText => {
                // html文本转DOM
                const parser = new window.DOMParser();
                const doc: Document = parser.parseFromString(htmlText, 'text/html');

                const acmList = doc.getElementsByClassName('acm-list');
                const acmItems = acmList[0].getElementsByClassName('acm-item');
                contest.contestName = acmItems[index].getElementsByTagName('a')[0].innerHTML;
                contest.countdown = acmItems[index].getElementsByClassName('acm-item-time')[0].innerHTML.trim();
            }).catch(error => {
                console.error(error)
                message = error.toString();
            });
        message += contest.toString();
        return message;
    }

    /**
     * 通过用户名获取用户在牛客上的刷题/竞赛数据
     * @param user UserProfile对象，userName需要提前存入
     * @returns 异步程序的执行状态，无异常返回'OK'，否则返回错误信息
     */
    async function getProfileData(user: UserProfile) {
        let status: string = 'OK';
        // 通过用户名获取用户ID
        // 需要6个月内参加过一场牛客竞赛才能查到
        await fetch(`https://ac.nowcoder.com/acm/contest/rating-index?searchUserName=${user.userName}`)
            .then(response => {
                if (response.status === 200) {
                    return response.text()
                } else {
                    status = `HTTP:${response.status} error`;
                }
            })
            .then(htmlText => {
                if (status != 'OK') return status;
                // html文本转DOM
                const parser = new window.DOMParser();
                const doc: Document = parser.parseFromString(htmlText, 'text/html');

                const table = doc.getElementsByTagName('table')[0];
                if (table === undefined) {
                    status = '查无此人，请确认名称输入正确且6个月内参加过至少一场牛客竞赛';
                    return;
                }
                const td = table.getElementsByTagName('tr')[1].getElementsByTagName('td')[1];
                let profileURL = td.getElementsByTagName('a')[0].getAttribute('href').split('/');
                user.userID = profileURL[profileURL.length - 1];
            }).catch(error => {
                console.error(error)
                status = error.toString();
            });
        if (status != 'OK') return status;

        await fetch(`https://ac.nowcoder.com/acm/contest/profile/${user.userID}`)
            .then(response => {
                if (response.status === 200) {
                    return response.text()
                } else {
                    status = `HTTP:${response.status} error`;
                }
            })
            .then(htmlText => {
                // html文本转DOM
                const parser = new window.DOMParser();
                const doc: Document = parser.parseFromString(htmlText, 'text/html');

                const contestStateItems = doc.getElementsByClassName('my-state-main')[0].getElementsByClassName('my-state-item');
                const rating = contestStateItems[0].getElementsByTagName('div')[0].innerHTML;
                user.rating = parseInt(rating);
                user.rank = contestStateItems[1].getElementsByTagName('div')[0].innerHTML;
                user.contestNumberRated = parseInt(contestStateItems[2].getElementsByTagName('div')[0].innerHTML);
                user.contestNumberUnrated = parseInt(contestStateItems[3].getElementsByTagName('div')[0].innerHTML);
            }).catch(error => {
                console.error(error)
                status = error.toString();
            });
        if (status != 'OK') return status;

        await fetch(`https://ac.nowcoder.com/acm/contest/profile/${user.userID}/practice-coding`)
            .then(response => {
                if (response.status === 200) {
                    return response.text()
                } else {
                    status = `HTTP:${response.status} error`;
                }
            })
            .then(htmlText => {
                // html文本转DOM
                const parser = new window.DOMParser();
                const doc: Document = parser.parseFromString(htmlText, 'text/html');

                const stateItems = doc.getElementsByClassName('my-state-main')[0].getElementsByClassName('my-state-item');
                user.passNumber = parseInt(stateItems[1].getElementsByTagName('div')[0].innerHTML);
            }).catch(error => {
                console.error(error)
                status = error.toString();
            });
        return status;
    }

    /**
     * 查询牛客竞赛用户的个人信息
     * @param userName 用户名
     * @returns 查询后的字符串
     */
    export async function getProfile(userName: string) {
        let message = "Niuke Profile:\n"
        let user: UserProfile = new UserProfile(userName);
        let status = await getProfileData(user);
        if (status !== 'OK') {
            return status;
        }
        message += user.toString();
        return message;
    }
}

/**
 * Atcoder相关函数
 */
export namespace Atcoder {
    class UserProfile {
        userName: string
        nowRating: number
        maxRating: number
        rank: string
        contestNumber: number

        constructor(userName: string) {
            this.userName = userName;
        }

        toString() {
            let res: string = `用户名：${this.userName}\n`
            res += `当前rating：${this.nowRating}\n`
            res += `最高rating：${this.maxRating}\n`
            res += `排名：${this.rank}\n`
            res += `参与场次：Rated${this.contestNumber}场`
            if (this.nowRating >= 2000) {
                res += '大神啊！\n';
            }
            return res;
        }
    }

    class Contest {
        contestName: string;
        time: Date;

        toString() {
            let res: string = '';
            res += `${this.contestName}\n`
            const now: Date = new Date();
            const diff: Date = new Date(this.time.getTime() - now.getTime());
            res += `${(diff.getDate() === 1) ? "今天" : (diff.getDate() - 1 + "天后")}     ${String(this.time.getHours()).padStart(2, '0')}:${String(this.time.getMinutes()).padStart(2, '0')}`;
            return res;
        }
    }

    /**
     * 查询Atcoder竞赛最近的竞赛名称及时间
     * @param index 下标，范围为0-12
     * @returns 查询后的字符串
     */
    export async function getContest(index: number) {
        let message = "";
        let contest: Contest = new Contest();
        await fetch('https://atcoder.jp/home?lang=ja')
            .then(response => {
                if (response.status === 200) {
                    return response.text()
                } else {
                    message = `HTTP:${response.status} error`;
                }
            })
            .then(htmlText => {
                // html文本转DOM
                const parser = new window.DOMParser();
                const doc: Document = parser.parseFromString(htmlText, 'text/html');

                const contestUpcoming = doc.getElementById('contest-table-upcoming');
                const contestUpcomingTable = contestUpcoming.getElementsByTagName('table')[0];
                const contests = contestUpcomingTable.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
                contest.contestName = contests[index].getElementsByTagName('a')[1].innerHTML;
                const contestTime = contests[index].getElementsByTagName('a')[0].getElementsByTagName('time')[0];
                contest.time = new Date(contestTime.innerHTML);
            }).catch(error => {
                console.error(error)
                message = error.toString();
            });
        message += contest.toString();
        return message;
    }

    /**
     * 通过用户名获取用户在Atcoder上的竞赛数据
     * @param user UserProfile对象，userName需要提前存入
     * @returns 异步程序的执行状态，无异常返回'OK'，否则返回错误信息
     */
    async function getProfileData(user: UserProfile) {
        let status = 'OK'
        await fetch(`https://atcoder.jp/users/${user.userName}`)
            .then(response => {
                if (response.status === 200) {
                    return response.text()
                } else {
                    status = `HTTP:${response.status} error`;
                }
            })
            .then(htmlText => {
                if (status != 'OK') return status;
                // html文本转DOM
                const parser = new window.DOMParser();
                const doc: Document = parser.parseFromString(htmlText, 'text/html');

                const main = doc.getElementById('main-container');
                const mainDiv = main.getElementsByTagName('div')[0];
                const content = mainDiv.getElementsByTagName('div')[2].getElementsByTagName('table')[0];
                // 匹配用户存在但是没有rating信息的情况
                if (content === undefined) {
                    user.nowRating = 0;
                    user.maxRating = 0;
                    user.rank = 'NaN';
                    user.contestNumber = 0;
                    return;
                }
                const tds = content.getElementsByTagName('td');
                user.nowRating = parseInt(tds[1].getElementsByTagName('span')[0].innerHTML);
                user.maxRating = parseInt(tds[2].getElementsByTagName('span')[0].innerHTML);
                user.rank = tds[0].innerHTML;
                user.contestNumber = parseInt(tds[3].innerHTML);
            }).catch(error => {
                console.error(error)
                status = error.toString();
            });
        return status;
    }

    /**
     * 查询Atcoder用户的个人信息
     * @param userName Atcoder中的用户名
     * @returns 查询后的字符串
     */
    export async function getProfile(userName: string) {
        let message = "Atcoder Profile:\n";
        let user = new UserProfile(userName);
        let status = await getProfileData(user);
        if (status !== 'OK') {
            return status;
        }
        message += user.toString();
        return message;
    }
}

/**
 * Codeforces相关函数
 */
export namespace Codeforces {
    /**
     * 为API设置key和secret，否则无法正常使用Codeforces的官方API
     * @param key 使用API需要的key
     * @param secret 使用API需要的secret
     */
    export function setCredentials(key: string, secret: string) {
        CodeforcesAPI.setCredentials({
            API_KEY: key,
            API_SECRET: secret,
        });
    }

    class UserProfile {
        userName: string;
        nowRating: number;
        maxRating: number;
        rank: string;
        maxRank: string;
        iconUrl: string;

        constructor(userName: string) {
            this.userName = userName;
        }

        setValueByUser(user: User): void {
            this.userName = user.handle;
            this.nowRating = (user.rating === undefined) ? 0 : user.rating;
            this.maxRating = (user.maxRating === undefined) ? 0 : user.maxRating;
            this.rank = (user.rank === undefined) ? "Unrated" : user.rank;
            this.maxRank = (user.maxRank === undefined) ? "Unrated" : user.maxRank;
            this.iconUrl = user.titlePhoto;
        }

        toString() {
            let res: string = "";
            res += `昵称: ${this.userName}\n`
            res += `rating: ${this.nowRating}\n`
            res += `等级: ${this.rank}\n`
            res += `最高rating: ${this.maxRating}\n`
            res += `最高等级: ${this.maxRank}\n`
            if (this.nowRating >= 2600) {
                res += '大神啊！\n'
            }
            return res;
        }
    }

    /**
     * 查询Codeforces竞赛最近的竞赛名称及时间
     * @param index 查询即将到来的竞赛的下标
     * @returns 查询后的字符串
     */
    export async function getContest(index: number) {
        let message = "";

        await CodeforcesAPI.call("contest.list", {})
            .then(response => {
                if (response.status == "OK") {
                    const contests = response.result;
                    let begin: number = 0;
                    while (contests[begin + 1].phase !== 'FINISHED') {
                        begin++;
                    }

                    let name: string = contests[begin - index].name;
                    for (let i: number = 0; i < name.length - 1; i++) {
                        if (name[i] === '.' && name[i + 1] !== ' ') {
                            // 此举是为了防止竞赛名含有url被qq识别然后被ban
                            name = name.slice(0, i + 1) + ' ' + name.slice(i + 1);
                        }
                    }

                    message += `${name}\n`;
                    const date: Date = new Date(contests[begin - index].startTimeSeconds * 1000);
                    const diff = new Date(Math.abs(contests[begin - index].relativeTimeSeconds * 1000));
                    message += `${(diff.getDate() === 1) ? "今天" : (diff.getDate() - 1 + "天后")}     ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                } else {
                    message = response.comment;
                }
            }).catch(error => {
                console.error(error)
                message = error.toString();
            });
        return message;
    }

    /**
     * 通过用户名获取用户在Codeforces上的竞赛数据
     * @param user UserProfile对象，userName需要提前存入
     * @returns 异步程序的执行状态，无异常返回'OK'，否则返回错误信息
     */
    async function getProfileData(userProfile: UserProfile) {
        let status = "OK";
        await CodeforcesAPI.call("user.info", { handles: userProfile.userName }).then(response => {
            if (response.status === "OK") {
                const user: User = response.result[0];
                userProfile.setValueByUser(user);
            } else {
                if (response.comment === "apiKey: Incorrect signature") {
                    status = "配置项的secret不正确"
                } else if (response.comment === "apiKey: Incorrect API key") {
                    status = "配置项的key不正确"
                } else if (response.comment === `handles: User with handle ${userProfile.userName} not found`) {
                    status = `此用户不存在`
                } else {
                    status = response.comment;
                }
            }
        }).catch(error => {
            console.error(error);
            status = error.toString();
        });
        return status;
    }

    /**
     * 查询CodeForces用户的个人信息
     * @param userName 用户名
     * @returns 查询后的字符串
     */
    export async function getProfile(userName: string) {
        let message = "CodeForces Profile:\n";
        let user: UserProfile = new UserProfile(userName);
        let status = await getProfileData(user);
        if (status !== 'OK') {
            return status;
        }
        message += user.toString();
        return message;
    }
}