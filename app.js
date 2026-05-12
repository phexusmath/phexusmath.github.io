async function loadGame(e) {
    let isCompleteGame = typeof e.url === "string" && e.url.includes("/complete/");
    let fetchUrl, baseHref;
    

    let targetFile = (activeBaseUrl === "githack") ? "githack.html" : "jsdelivr.html";

    if (isCompleteGame) {
        let t = e.url;
        t.endsWith("/") || (t += "/");
        fetchUrl = t;
        baseHref = t;
        targetFile = "index.html"; 
    } else {
        let cdnUrl = isCdnAvailable && e.cdn ? convertCdnUrl(e.cdn) : e.cdn;
        if (cdnUrl) {
            cdnUrl.endsWith("/") || (cdnUrl += "/");
            fetchUrl = cdnUrl;
            baseHref = cdnUrl;
        } else {
            let t = e.url;
            t.endsWith("/") || (t += "/");
            fetchUrl = t;
            baseHref = t;
        }
    }
}