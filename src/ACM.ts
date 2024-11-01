import { JSDOM } from 'jsdom'
import { CodeforcesAPI } from "codeforces-api-ts"
import { User } from 'codeforces-api-ts/dist/types';

// html转DOM元素进行操作的依赖
const { window } = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);

/**
 * 牛客相关函数
 */
export namespace Niuke {
    class UserProfile {
        user_name: string;
        userID: string;
        rating: number;
        rank: string;
        contest_number_rated: number;
        contest_number_unrated: number;
        pass_number: number;

        constructor(user_name: string) {
            this.user_name = user_name;
        }

        toString() {
            let res: string = "";
            res += `昵称: ${this.user_name}\n`;
            res += `rating: ${this.rating}\n`;
            res += `排名: ${this.rank}名\n`;
            res += `参与场次：Rated${this.contest_number_rated}场，Unrated${this.contest_number_unrated}场\n`
            res += `已过题数：${this.pass_number}\n`
            return res;
        }
    }

    class Contest {
        contest_name: string;
        countdown: string;

        toString() {
            return `${this.contest_name}\n${this.countdown}`;
        }
    }

    /**
     * 查询牛客竞赛最近的竞赛名称及时间
     * @param index 下标，范围为0-2
     * @returns 查询后的字符串
     */
    export async function getContest(index: number) {
        let text = "";
        let contest = new Contest();
        const url = "https://ac.nowcoder.com";
        await fetch(url, { method: 'GET' })
            .then(response => {
                if (response.status === 200) {
                    return response.text()
                } else {
                    text = `HTTP:${response.status} error`;
                }
            })
            .then(htmlText => {
                // html文本转DOM
                const parser = new window.DOMParser();
                const doc: Document = parser.parseFromString(htmlText, 'text/html');

                const acm_list = doc.getElementsByClassName('acm-list');
                const acm_items = acm_list[0].getElementsByClassName('acm-item');
                contest.contest_name = acm_items[index].getElementsByTagName('a')[0].innerHTML;
                contest.countdown = acm_items[index].getElementsByClassName('acm-item-time')[0].innerHTML.trim();
            }).catch(error => {
                console.error(error)
                text = error.toString();
            });
        text += contest.toString();
        return text;
    }

    /**
     * 通过用户名获取用户在牛客上的刷题/竞赛数据
     * @param user UserProfile对象，user_name需要提前存入
     * @returns 异步程序的执行状态，无异常返回'OK'，否则返回错误信息
     */
    async function getProfileData(user: UserProfile) {
        let status: string = 'OK';
        // 通过用户名获取用户ID
        // 需要6个月内参加过一场牛客竞赛才能查到
        await fetch(`https://ac.nowcoder.com/acm/contest/rating-index?searchUserName=${user.user_name}`)
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

                const contest_state_items = doc.getElementsByClassName('my-state-main')[0].getElementsByClassName('my-state-item');
                const rating = contest_state_items[0].getElementsByTagName('div')[0].innerHTML;
                user.rating = parseInt(rating);
                user.rank = contest_state_items[1].getElementsByTagName('div')[0].innerHTML;
                user.contest_number_rated = parseInt(contest_state_items[2].getElementsByTagName('div')[0].innerHTML);
                user.contest_number_unrated = parseInt(contest_state_items[3].getElementsByTagName('div')[0].innerHTML);
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

                const state_items = doc.getElementsByClassName('my-state-main')[0].getElementsByClassName('my-state-item');
                user.pass_number = parseInt(state_items[1].getElementsByTagName('div')[0].innerHTML);
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
        user_name: string
        now_rating: number
        highest_rating: number
        rank: string
        contest_number: number

        constructor(user_name: string) {
            this.user_name = user_name;
        }

        toString() {
            let res: string = `用户名：${this.user_name}\n`
            res += `当前rating：${this.now_rating}\n`
            res += `最高rating：${this.highest_rating}\n`
            res += `排名：${this.rank}\n`
            res += `参与场次：Rated${this.contest_number}场`
            if (this.now_rating >= 2000) {
                res += '大神啊！\n';
            }
            return res;
        }
    }

    class Contest {
        contest_name: string;
        time: Date;

        toString() {
            let res: string = '';
            res += `${this.contest_name}\n`
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
        let text = "";
        let contest: Contest = new Contest();
        await fetch('https://atcoder.jp/home?lang=ja')
            .then(response => {
                if (response.status === 200) {
                    return response.text()
                } else {
                    text = `HTTP:${response.status} error`;
                }
            })
            .then(htmlText => {
                // html文本转DOM
                const parser = new window.DOMParser();
                const doc: Document = parser.parseFromString(htmlText, 'text/html');

                const contest_upcoming = doc.getElementById('contest-table-upcoming');
                const contest_upcoming_table = contest_upcoming.getElementsByTagName('table')[0];
                const contests = contest_upcoming_table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
                contest.contest_name = contests[index].getElementsByTagName('a')[1].innerHTML;
                const contests_time = contests[index].getElementsByTagName('a')[0].getElementsByTagName('time')[0];
                contest.time = new Date(contests_time.innerHTML);
            }).catch(error => {
                console.error(error)
                text = error.toString();
            });
        text += contest.toString();
        return text;
    }

    /**
     * 通过用户名获取用户在Atcoder上的竞赛数据
     * @param user UserProfile对象，user_name需要提前存入
     * @returns 异步程序的执行状态，无异常返回'OK'，否则返回错误信息
     */
    async function getProfileData(user: UserProfile) {
        let status = 'OK'
        await fetch(`https://atcoder.jp/users/${user.user_name}`)
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
                const title = doc.getElementsByTagName('head')[0].innerHTML;

                const main = doc.getElementById('main-container');
                const main_div = main.getElementsByTagName('div')[0];
                const content = main_div.getElementsByTagName('div')[2].getElementsByTagName('table')[0];
                const tds = content.getElementsByTagName('td');
                user.now_rating = parseInt(tds[1].getElementsByTagName('span')[0].innerHTML);
                user.highest_rating = parseInt(tds[2].getElementsByTagName('span')[0].innerHTML);
                user.rank = tds[0].innerHTML;
                user.contest_number = parseInt(tds[3].innerHTML);
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
        user_name: string;
        now_rating: number;
        max_rating: number;
        rank: string;
        max_rank: string;

        constructor(user_name: string) {
            this.user_name = user_name;
        }

        setValueByUser(user: User): void {
            this.user_name = user.handle;
            this.now_rating = user.rating;
            this.max_rating = user.maxRating;
            this.rank = user.rank;
            this.max_rank = user.maxRank;
        }

        toString() {
            let res: string = "";
            res += `昵称: ${this.user_name}\n`
            res += `rating: ${this.now_rating}\n`
            res += `等级: ${this.rank}\n`
            res += `最高rating: ${this.max_rating}\n`
            res += `最高等级: ${this.max_rank}\n`
            if (this.now_rating >= 2600) {
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
        let text = "";

        await CodeforcesAPI.call("contest.list", {})
            .then(response => {
                if (response.status == "OK") {
                    const contests = response.result;
                    let begin: number = 0;
                    while (contests[begin + 1].phase !== 'FINISHED') {
                        begin++;
                    }

                    text += `${contests[begin - index].name}\n`;
                    const date: Date = new Date(contests[begin - index].startTimeSeconds * 1000);
                    const now = new Date();
                    const diff = new Date(Math.abs(contests[begin - index].relativeTimeSeconds * 1000));
                    text += `${(diff.getDate() == 1) ? "今天" : (diff.getDate() - 1 + "天后")}     ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                } else {
                    text = response.comment;
                }
            }).catch(error => {
                console.error(error)
                text = error.toString();
            });
        return text;
    }

    /**
     * 通过用户名获取用户在Codeforces上的竞赛数据
     * @param user UserProfile对象，user_name需要提前存入
     * @returns 异步程序的执行状态，无异常返回'OK'，否则返回错误信息
     */
    async function getProfileData(userProfile: UserProfile) {
        let status = "OK";
        await CodeforcesAPI.call("user.info", { handles: userProfile.user_name }).then(response => {
            if (response.status === "OK") {
                const user: User = response.result[0];
                if (user.rating === undefined) {
                    status = "此用户不存在";
                    return;
                }
                userProfile.setValueByUser(user);
            } else {
                if (response.comment === "apiKey: Incorrect signature") {
                    status = "配置项的secret不正确"
                } else if (response.comment === "apiKey: Incorrect API key") {
                    status = "配置项的key不正确"
                } else if (response.comment === "handles: Field should not be empty") {
                    status = "用户名不能为空值"
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