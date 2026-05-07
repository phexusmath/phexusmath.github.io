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
    isCdnAvailable = !1;
const normalize = e => e.toLowerCase().trim().replace(/\s+/g, "-");
async function checkConnectivity() {
    for (let e of (statusText.textContent = "Checking bypass routes...", [{
            name: "jsDelivr",
            url: "https://cdn.jsdelivr.net/gh/phexusmath/phexusmath.github.io@main/index.html",
            base: "jsdelivr"
        }, {
            name: "GitHack",
            url: "https://raw.githack.com/phexusmath/phexusmath.github.io/main/index.html",
            base: "githack"
        }])) try {
        let t = await fetch(e.url, {
            method: "GET",
            cache: "no-cache"
        });
        if (t.ok) {
            let a = await t.text();
            if (a.includes("<html") || a.includes("<!DOCTYPE")) {
                e.base && (activeBaseUrl = e.base, isCdnAvailable = !0), statusText.textContent = `${e.name} Linked`, statusDot.className = "dot online";
                return
            }
        }
    } catch (l) {
        console.warn(`${e.name} failed or blocked by CORS/Network.`)
    }
    statusText.textContent = "Local Mode Only", statusDot.style.backgroundColor = "#ff9800"
}

function toCdnUrl(pageUrl) {
    // Convert https://phexusmath.github.io/path to jsDelivr or GitHack URL
    let path = pageUrl.replace("https://phexusmath.github.io/", "");
    if ("githack" === activeBaseUrl) {
        return `https://raw.githack.com/phexusmath/phexusmath.github.io/main/${path}/`;
    }
    return `https://cdn.jsdelivr.net/gh/phexusmath/phexusmath.github.io@main/${path}/`;
}

async function loadGame(e) {
    let t = e.url;
    t.endsWith("/") || (t += "/");

    let fetchUrl = t;
    let baseHref = "https://phexusmath.github.io/";
    let isCompleteGame = /\/complete\//.test(e.url);

    if (isCompleteGame) {
        // Games in the /complete folder always use their full phexusmath.github.io path as the base URL.
        // Fetch via CDN if available (for bypass), but keep the base href on the original game path.
        if (isCdnAvailable) {
            fetchUrl = toCdnUrl(e.url);
        }
        baseHref = t;
    } else if (e.cdn) {
        fetchUrl = e.cdn;
        baseHref = e.cdn;
    } else if (isCdnAvailable) {
        let cdnUrl = toCdnUrl(e.url);
        fetchUrl = cdnUrl;
        baseHref = cdnUrl;
    }

    try {
        let a = await fetch(`${fetchUrl}index.html`),
            l = await a.text();

        let baseTag = `<base href="${baseHref}">`;

        l = l.replace(/<base[^>]*>/gi, "");
        if (l.includes("<head>")) {
            l = l.replace("<head>", `<head>\n    ${baseTag}`);
        } else {
            l = baseTag + l;
        }

        currentBlobUrl && URL.revokeObjectURL(currentBlobUrl);
        let s = new Blob([l], {
            type: "text/html"
        });

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
        let t = await fetch("combined_games.json");
        if (!t.ok) throw Error("combined_games.json not found");
        let a = await t.json();
        allGames = a.sort((e, t) => e.name.localeCompare(t.name)), renderGrid(allGames)
    } catch (l) {
        gridEl.innerHTML = '<p style="color:white;">Error: Could not load list.json</p>'
    }
}

function renderGrid(e) {
    gridEl.innerHTML = "", gridEl.classList.remove("loading-state"), e.forEach(e => {
        let t = document.createElement("div");
        t.className = "game-card", t.innerHTML = `<h3>${e.name}</h3> <i class="fas fa-play-circle"></i>`, t.onclick = () => loadGame(e), gridEl.appendChild(t)
    })
}
searchInput.oninput = e => {
    let t = e.target.value.toLowerCase(),
        a = allGames.filter(e => e.name.toLowerCase().includes(t));
    renderGrid(a)
}, document.getElementById("fullscreen-btn").onclick = () => {
    gameFrame.requestFullscreen ? gameFrame.requestFullscreen() : gameFrame.webkitRequestFullscreen && gameFrame.webkitRequestFullscreen()
}, document.getElementById("back-to-hub").onclick = () => {
    viewportEl.style.display = "none", libraryEl.style.display = "block", gameFrame.src = "about:blank"
}, init();