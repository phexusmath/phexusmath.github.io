const gridEl = document.getElementById("game-grid"),
    viewportEl = document.getElementById("game-viewport"),
    libraryEl = document.getElementById("library-hub"),
    gameFrame = document.getElementById("gameFrame"),
    searchInput = document.getElementById("gameSearch"),
    statusText = document.getElementById("statusText"),
    statusDot = document.querySelector(".dot");
let allGames = [],
    currentBlobUrl = null,
    activeBaseUrl = "",
    isCdnAvailable = false,
    shimSource = null;

async function getShimSource() {
    if (shimSource !== null) return shimSource;
    try {
        let r = await fetch("shim.js", { cache: "no-cache" });
        if (r.ok) {
            shimSource = await r.text();
        } else {
            shimSource = "";
            console.warn("shim.js fetch returned non-OK status:", r.status);
        }
    } catch (err) {
        shimSource = "";
        console.warn("Could not load shim.js:", err);
    }
    return shimSource;
}

const normalize = e => e.toLowerCase().trim().replace(/\s+/g, "-");

async function checkConnectivity() {
    statusText.textContent = "Negotiating connection...";
    
    const routes = [
        { name: "jsDelivr", url: "https://cdn.jsdelivr.net/gh/phexusmath/phexusmath.github.io@main/index.html", base: "jsdelivr" },
        { name: "GitHack", url: "https://raw.githack.com/phexusmath/phexusmath.github.io/main/index.html", base: "githack" },
        { name: "GitHub Raw", url: "https://raw.githubusercontent.com/phexusmath/phexusmath.github.io/main/index.html", base: "rawgithub" }
    ];

    const parser = new DOMParser();

    for (const route of routes) {
        try {
            // Using a timeout to prevent the UI from hanging too long on a dead route
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(route.url, { 
                method: "GET", 
                cache: "no-cache",
                signal: controller.signal 
            });
            
            clearTimeout(timeoutId);

            if (response.ok) {
                const htmlString = await response.text();
                const doc = parser.parseFromString(htmlString, "text/html");
                const pageTitle = doc.querySelector("title")?.textContent || "";

                // Verification: Ensure it's actually our app and not a block page
                if (pageTitle.includes("Phexus Math")) {
                    activeBaseUrl = route.base;
                    isCdnAvailable = true;
                    
                    statusText.textContent = `Verified: ${route.name}`;
                    statusDot.className = "dot online";
                    console.log(`%c[Connected] %cHandshake successful via ${route.name}`, "color: #4caf50; font-weight: bold", "color: inherit");
                    return;
                } else {
                    console.warn(`[Security] ${route.name} returned an unrecognized page. Possible interception.`);
                }
            }
        } catch (error) {
            console.error(`[Network] ${route.name} is unreachable. (Mode: ${error.name === 'AbortError' ? 'Timeout' : 'Blocked'})`);
        }
    }

    // Fallback State
    statusText.textContent = "Offline / Local Mode";
    statusDot.className = "dot warning"; // Assuming you have a CSS class for warning colors
    statusDot.style.backgroundColor = "#ff9800"; 
}

// Convert a jsDelivr URL to the active CDN provider's equivalent.
// jsDelivr format: https://cdn.jsdelivr.net/gh/{user}/{repo}@{ref}/{path}
function convertCdnUrl(jsdelivrUrl) {
    if (!jsdelivrUrl) return null;
    if (activeBaseUrl === "jsdelivr") return jsdelivrUrl;
    let stripped = jsdelivrUrl
        .replace("https://cdn.jsdelivr.net/gh/", "")
        .replace("@", "/");
    if (activeBaseUrl === "githack") return "https://raw.githack.com/" + stripped;
    if (activeBaseUrl === "rawgithub") return "https://raw.githubusercontent.com/" + stripped;
    return jsdelivrUrl;
}

async function loadGame(e) {
    let isCompleteGame = typeof e.url === "string" && e.url.includes("/complete/");
    let fetchUrl, baseHref;

    if (isCompleteGame) {
        // Complete games: always use the phexusmath.github.io URL directly.
        let t = e.url;
        t.endsWith("/") || (t += "/");
        fetchUrl = t;
        baseHref = t;
    } else {
        // Files games: use e.cdn (a jsDelivr URL), converted to whichever CDN is reachable.
        let cdnUrl = isCdnAvailable && e.cdn ? convertCdnUrl(e.cdn) : e.cdn;
        if (cdnUrl) {
            cdnUrl.endsWith("/") || (cdnUrl += "/");
            fetchUrl = cdnUrl;
            baseHref = cdnUrl;
        } else {
            // No cdn value in json — fall back to the direct phexusmath.github.io URL.
            let t = e.url;
            t.endsWith("/") || (t += "/");
            fetchUrl = t;
            baseHref = t;
        }
    }

    try {
        let a = await fetch(`${fetchUrl}index.html`),
            l = await a.text();

        let baseTag = `<base href="${baseHref}">`;
        let shimTag = "";
        if (e.inject === true) {
            let src = await getShimSource();
            if (src) {
                let safeSrc = src.replace(/<\/script>/gi, "<\\/script>");
                shimTag = `<script>${safeSrc}</script>`;
            }
        }

        l = l.replace(/<base[^>]*>/gi, "");
        let injection = `${baseTag}${shimTag ? "\n    " + shimTag : ""}`;
        if (l.includes("<head>")) {
            l = l.replace("<head>", `<head>\n    ${injection}`);
        } else {
            l = injection + l;
        }

        currentBlobUrl && URL.revokeObjectURL(currentBlobUrl);
        let s = new Blob([l], { type: "text/html" });
        currentBlobUrl = URL.createObjectURL(s);
        gameFrame.src = currentBlobUrl;
        libraryEl.style.display = "none";
        viewportEl.style.display = "flex";

    } catch (i) {
        console.error("Load Error:", i);
    }
}

async function init() {
    await checkConnectivity();
    try {
        let t = await fetch("all.json");
        if (!t.ok) throw Error("all.json not found");
        let a = await t.json();
        allGames = a.sort((e, t) => e.name.localeCompare(t.name));
        renderGrid(allGames);
    } catch (l) {
        gridEl.innerHTML = '<p style="color:white;">Error: Could not load all.json</p>';
    }
}

function renderGrid(e) {
    gridEl.innerHTML = "";
    gridEl.classList.remove("loading-state");
    e.forEach(e => {
        let t = document.createElement("div");
        t.className = "game-card";
        t.innerHTML = `<h3>${e.name}</h3> <i class="fas fa-play-circle"></i>`;
        t.onclick = () => loadGame(e);
        gridEl.appendChild(t);
    });
}

searchInput.oninput = e => {
    let t = e.target.value.toLowerCase(),
        a = allGames.filter(e => e.name.toLowerCase().includes(t));
    renderGrid(a);
};

document.getElementById("fullscreen-btn").onclick = () => {
    gameFrame.requestFullscreen ? gameFrame.requestFullscreen() : gameFrame.webkitRequestFullscreen && gameFrame.webkitRequestFullscreen();
};

document.getElementById("back-to-hub").onclick = () => {
    viewportEl.style.display = "none";
    libraryEl.style.display = "block";
    gameFrame.src = "about:blank";
};

init();
