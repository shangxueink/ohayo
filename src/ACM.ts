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
    await fetch("https://ac.nowcoder.com", { method: 'GET' })
        .then(response => response.text())
        .then(htmlText => {
            // html文本转DOM
            const parser = new window.DOMParser();
            const doc: Document = parser.parseFromString(htmlText, 'text/html');

            const acm_list = doc.getElementsByClassName('acm-list');
            const acm_items = acm_list[0].getElementsByClassName('acm-item');
            const contest_name = acm_items[index].getElementsByTagName('a')[0];
            text += contest_name.innerHTML + '\n';
            const contest_time = acm_items[index].getElementsByClassName('acm-item-time')[0];
            text += contest_time.innerHTML.trim();
        })
        .catch(error => console.error(error));
    return text;
}

/**
 * 查询Atcoder竞赛最近的竞赛名称及时间（当前为日本时间）
 * @param index 下标，范围为0-12
 * @returns 查询后的字符串
 */
export async function getAtcoderContest(index: number) {
    let text = "";
    await fetch("https://atcoder.jp/home?lang=ja", { method: 'GET' })
        .then(response => response.text())
        .then(htmlText => {
            // html文本转DOM
            const parser = new window.DOMParser();
            const doc: Document = parser.parseFromString(htmlText, 'text/html');

            const contest_upcoming = doc.getElementById('contest-table-upcoming');
            const contest_upcoming_table = contest_upcoming.getElementsByTagName('table')[0];
            const contests = contest_upcoming_table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
            const contest_name = contests[index].getElementsByTagName('a')[1];
            text += contest_name.innerHTML + '\n';
            const contests_time = contests[index].getElementsByTagName('a')[0].getElementsByTagName('time')[0];
            text += contests_time.innerHTML;
        })
        .catch(error => console.error(error));
    return text;
}