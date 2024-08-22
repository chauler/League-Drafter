export function delay(milliseconds: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

export async function FetchWithRetry(
    input: string | URL | globalThis.Request,
    init?: RequestInit,
    retries: number = 1
): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(input, init);
            if (response.status === 200) {
                return response;
            }
            await delay(maxBackoffJitter(1000, 120000, i));
            console.log("retrying...");
        } catch (e) {}
    }
}

function maxBackoffJitter(base: number = 100, max: number = 10000, attempt: number) {
    const exponential = Math.pow(2, attempt) * base;
    const delay = Math.min(exponential, max);
    return Math.floor(Math.random() * delay);
}
