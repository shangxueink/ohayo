export namespace Tools {
    /**
     * 整数限制范围版随机数函数
     * @param min 随机数最小值
     * @param max 随机数最大值
     * @returns 返回一个min-max之间的随机整数
     */
    export function getRandomInt(min: number, max: number): number {
        if (min > max) {
            let tmp: number = min;
            min = max;
            max = tmp;
        }
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    /**
     * 随机选一个参数返回
     * @param args 需要选择的参数
     * @returns 随机选择一个参数当做返回值
     */
    export function roll(args: string[]): string {
        let length: number = args.length;
        return args[getRandomInt(0, length - 1)];
    }
}