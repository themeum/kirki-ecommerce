export class Cookie {
    static get(name: string, defaultValue: string | null = null): string | null {
        const value = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`));

        return value
            ? decodeURIComponent(value.split('=')[1])
            : defaultValue;
    }

    static set(
        name: string,
        value: string,
        days = 30,
        path = '/',
    ): void {
        const expires = new Date();
        expires.setDate(expires.getDate() + days);

        document.cookie = [
            `${name}=${encodeURIComponent(value)}`,
            `expires=${expires.toUTCString()}`,
            `path=${path}`,
        ].join('; ');
    }

    static delete(name: string, path = '/'): void {
        document.cookie = [
            `${name}=`,
            'expires=Thu, 01 Jan 1970 00:00:00 GMT',
            `path=${path}`,
        ].join('; ');
    }
}