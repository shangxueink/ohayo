import { JSDOM } from 'jsdom'
import { CodeforcesAPI } from "codeforces-api-ts"
import { Contest } from 'codeforces-api-ts/dist/types';
import exp from 'constants';

// html转DOM元素进行操作的依赖
const { window } = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);

/**
 * 牛客相关函数
 */
export namespace Niuke {
    /**
     * 查询牛客竞赛最近的竞赛名称及时间
     * @param index 下标，范围为0-2
     * @returns 查询后的字符串
     */
    export async function getNiukeContest(index: number) {
        let text = "";
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
                const contest_name = acm_items[index].getElementsByTagName('a')[0];
                text += `${contest_name.innerHTML}\n`;
                const contest_time = acm_items[index].getElementsByClassName('acm-item-time')[0];
                text += contest_time.innerHTML.trim();
            }).catch(error => {
                console.error(error)
                text = error.toString();
            });
        return text;
    }

    /**
     * 查询牛客竞赛用户的个人信息
     * @param userName 用户名
     * @returns 查询后的字符串
     */
    export async function getNiukeProfile(userName: string) {
        let text = "Niuke Profile:\n"

        // 根据用户名获取用户ID
        let userID = ""
        await fetch(`https://ac.nowcoder.com/acm/contest/rating-index?searchUserName=${userName}`)
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

                const table = doc.getElementsByTagName('table')[0];
                const td = table.getElementsByTagName('tr')[1].getElementsByTagName('td')[1];
                let profileURL = td.getElementsByTagName('a')[0].getAttribute('href').split('/');
                userID = profileURL[profileURL.length - 1];
            }).catch(error => {
                console.error(error)
                text = error.toString();
            });

        await fetch(`https://ac.nowcoder.com/acm/contest/profile/${userID}`)
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

                const user = doc.getElementsByClassName('coder-info-wrap clearfix')[0];
                text += `昵称: ${userName}\n`;
                // const rating = user.getElementsByClassName('status-item')[0].getElementsByTagName('a')[0].innerHTML;
                // const rank = user.getElementsByClassName('status-item')[1].getElementsByTagName('a')[0].innerHTML;

                const contest_state_items = doc.getElementsByClassName('my-state-main')[0].getElementsByClassName('my-state-item');
                const rating = contest_state_items[0].getElementsByTagName('div')[0].innerHTML;
                const rank = contest_state_items[1].getElementsByTagName('div')[0].innerHTML;
                text += `rating: ${rating}\n`;
                const contest_number_rated = contest_state_items[2].getElementsByTagName('div')[0].innerHTML;
                text += `排名: ${rank}名\n`;
                const contest_number_unrated = contest_state_items[3].getElementsByTagName('div')[0].innerHTML;
                text += `参与场次：Rated${contest_number_rated}场，Unrated${contest_number_unrated}场\n`
            }).catch(error => {
                console.error(error)
                text = error.toString();
            });

        await fetch(`https://ac.nowcoder.com/acm/contest/profile/${userID}/practice-coding`)
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

                const state_items = doc.getElementsByClassName('my-state-main')[0].getElementsByClassName('my-state-item');
                const pass_number = state_items[1].getElementsByTagName('div')[0].innerHTML;
                text += `已过题数：${pass_number}\n`
            }).catch(error => {
                console.error(error)
                text = error.toString();
            });
        return text;
    }
}

/**
 * Atcoder相关函数
 */
export namespace Atcoder {
    /**
     * 查询Atcoder竞赛最近的竞赛名称及时间
     * @param index 下标，范围为0-12
     * @returns 查询后的字符串
     */
    export async function getAtcoderContest(index: number) {
        let text = "";
        const url = 'https://atcoder.jp/home?lang=ja';
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

                const contest_upcoming = doc.getElementById('contest-table-upcoming');
                const contest_upcoming_table = contest_upcoming.getElementsByTagName('table')[0];
                const contests = contest_upcoming_table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
                const contest_name = contests[index].getElementsByTagName('a')[1];
                text += `${contest_name.innerHTML}\n`;
                const contests_time = contests[index].getElementsByTagName('a')[0].getElementsByTagName('time')[0];

                // 将获取到的原始时间转换成牛客一样的倒计时
                const date = new Date(contests_time.innerHTML);
                const now = new Date();
                const diff = new Date(date.getTime() - now.getTime());
                text += `${(diff.getDate() == 1) ? "今天" : (diff.getDate() - 1 + "天后")}     ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            }).catch(error => {
                console.error(error)
                text = error.toString();
            });
        return text;
    }

    /**
     * 查询Atcoder用户的个人信息
     * @param userName Atcoder中的用户名
     * @returns 查询后的字符串
     */
    export async function getAtcoderProfile(userName: string) {
        let text = "Atcoder Profile:\n";
        const url = `https://atcoder.jp/users/${userName}`;
        await fetch(url)
            .then(response => {
                if (response.status === 200) {
                    return response.text()
                } else {
                    text = `HTTP:${response.status} error`;
                }
            })
            .then(htmlText => {
                const parser = new window.DOMParser();
                const doc: Document = parser.parseFromString(htmlText, 'text/html');

                const main = doc.getElementById('main-container');
                const main_div = main.getElementsByTagName('div')[0];
                const name = main_div.getElementsByTagName('div')[1].getElementsByTagName('span')[0];
                text += `用户名：${name.innerHTML}\n`;

                const content = main_div.getElementsByTagName('div')[2].getElementsByTagName('table')[0];
                const now_rating = content.getElementsByTagName('td')[1].getElementsByTagName('span')[0];
                text += `当前rating：${now_rating.innerHTML}\n`
                const highest_rating = content.getElementsByTagName('td')[2].getElementsByTagName('span')[0];
                text += `最高rating：${highest_rating.innerHTML}\n`

                const rank = content.getElementsByTagName('td')[0];
                text += `排名：${rank.innerHTML}\n`

                if (parseInt(now_rating.innerHTML) >= 2000)
                    text += "大神啊！";
            }).catch(error => {
                console.error(error)
                text = error.toString();
            });
        return text;
    }
}

/**
 * Codeforces相关函数
 */
export namespace Codeforces {
    /**
     * 查询Codeforces竞赛最近的竞赛名称及时间
     * @param index 查询即将到来的竞赛的下标
     * @param key cf网站使用api需要的key
     * @param secret cf网站使用api需要的secret
     * @returns 查询后的字符串
     */
    export async function getCodeForcesContest(index: number, key: string, secret: string) {
        let text = "";
        CodeforcesAPI.setCredentials({
            API_KEY: key,
            API_SECRET: secret,
        });

        await CodeforcesAPI.call("contest.list", {})
            .then(response => {
                if (response.status == "OK") {
                    const contests: Contest[] = response.result;
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
     * 查询CodeForces用户的个人信息
     * @param userName 用户名
     * @param key cf网站使用api需要的key
     * @param secret cf网站使用api需要的secret
     * @returns 查询后的字符串
     */
    export async function getCodeForcesProfile(userName: string, key: string, secret: string) {
        let text = "CodeForces Profile:\n";
        CodeforcesAPI.setCredentials({
            API_KEY: key,
            API_SECRET: secret,
        });

        await CodeforcesAPI.call("user.info", { handles: userName }).then(response => {
            if (response.status === "OK") {
                const user = response.result[0];
                if (user.rating === undefined) {
                    text = "此用户不存在";
                    return;
                }
                text += `name: ${user.handle}\n`
                text += `rating: ${user.rating}\n`
                text += `rank: ${user.rank}\n`
                text += `maxRating: ${user.maxRating}\n`
                text += `maxRank: ${user.maxRank}\n`
                if (user.rating >= 2600) {
                    text += '大神啊！'
                }
            } else {
                if (response.comment === "apiKey: Incorrect signature") {
                    text = "配置项的secret不正确"
                } else if (response.comment === "apiKey: Incorrect API key") {
                    text = "配置项的key不正确"
                } else if (response.comment === "handles: Field should not be empty") {
                    text = "用户名不能为空值"
                } else {
                    text = response.comment;
                }
            }
        }).catch(error => {
            console.error(error)
            text = error.toString();
        });
        return text;
    }
}