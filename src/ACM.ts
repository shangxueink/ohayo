import { JSDOM } from 'jsdom'

// html转DOM元素进行操作的依赖
const { window } = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);

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
        })
        .catch(error => { console.log(error) });
    return text;
}

/**
 * 查询Atcoder竞赛最近的竞赛名称及时间（当前为日本时间）
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
        })
        .catch(error => { console.log(error) });
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
        })
        .catch(error => { console.log(error) });
    return text;
}