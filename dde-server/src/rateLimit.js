export function makeSimpleRpmLimiter({ rpmLimit = 10 } = {}) {
    let windowStart = Date.now();
    let count = 0;

    return function rateLimit(req, res, next) {
        const now = Date.now();

        // reset each minute
        if (now - windowStart > 60_000) {
            windowStart = now;
            count = 0;
        }

        count += 1;

        if (count > rpmLimit) {
            return res.status(429).json({
                error: `Rate limit exceeded: ${rpmLimit} requests per minute. Please wait.`,
            });
        }

        next();
    };
}
