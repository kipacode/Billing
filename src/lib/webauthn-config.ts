export function getRpConfig() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = new URL(appUrl);
    return {
        rpName: "ANFIELDNET Billing",
        rpID: url.hostname,
        origin: `${url.protocol}//${url.host}`,
    };
}
