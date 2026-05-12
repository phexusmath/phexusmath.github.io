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
    isCdnAvailable = false;

const normalize = e => e.toLowerCase().trim().replace(/\s+/g, "-");

async function checkConnectivity() {
    statusText.textContent = "Negotiating connection...";
    const routes = [
        { name: "jsDelivr", url: "https://cdn.jsdelivr.net/gh/phexusmath/phexusmath.github.io@main/index.html", base: "jsdelivr" },
        { name: "GitHack", url: "https://raw.githack.com/phexusmath/phexusmath.github.io/main/index.html", base: "githack" }
    ];

    const parser = new DOMParser();
    for (const route of routes) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(route.url, { method: "GET", cache: "no-cache", signal: controller.signal });
            clearTimeout(timeoutId);

            if (response.ok) {
                const htmlString = await response.text();
                const doc = parser.parseFromString(htmlString, "text/html");
                if ((doc.querySelector("title")?.textContent || "").includes("Phexus Math")) {
                    activeBaseUrl = route.base;
                    isCdnAvailable = true;
                    statusText.textContent = `Verified: ${route.name}`;
                    statusDot.className = "dot online";
                    return;
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
    statusText.textContent = "Offline / Complete Games Only";
    statusDot.className = "dot warning";
    statusDot.style.backgroundColor = "#ff9800";
    isCdnAvailable = false;
}

function convertCdnUrl(jsdelivrUrl) {
    if (!jsdelivrUrl) return null;
    if (activeBaseUrl === "jsdelivr") return jsdelivrUrl;
    let stripped = jsdelivrUrl.replace("https://cdn.jsdelivr.net/gh/", "").replace("@", "/");
    if (activeBaseUrl === "githack") return "https://raw.githack.com/" + stripped;
    return jsdelivrUrl;
}

async function loadGame(e) {
    let isCompleteGame = typeof e.url === "string" && e.url.includes("/complete/");
    let fetchUrl;
    let targetFile = (activeBaseUrl === "githack") ? "githack.html" : "jsdelivr.html";

    if (isCompleteGame) {
        let t = e.url;
        t.endsWith("/") || (t += "/");
        fetchUrl = t;
        targetFile = "index.html";
    } else {
        let cdnUrl = isCdnAvailable && e.cdn ? convertCdnUrl(e.cdn) : e.cdn;
        if (cdnUrl) {
            cdnUrl.endsWith("/") || (cdnUrl += "/");
            fetchUrl = cdnUrl;
        } else {
            let t = e.url;
            t.endsWith("/") || (t += "/");
            fetchUrl = t;
        }
    }

    try {
        gameFrame.src = `${fetchUrl}${targetFile}`;
        libraryEl.style.display = "none";
        viewportEl.style.display = "flex";
    } catch (i) {
        console.error(i);
    }
}

async function init() {
    await checkConnectivity();
    try {
        let t = await fetch("all.json");
        let a = await t.json();
        allGames = a.sort((e, t) => e.name.localeCompare(t.name));
        
        if (!isCdnAvailable) {
            renderGrid(allGames.filter(g => g.url && g.url.includes("/complete/")));
        } else {
            renderGrid(allGames);
        }
    } catch (l) {
        gridEl.innerHTML = '<p style="color:white;">Error: Could not load library</p>';
    }
}

function renderGrid(e) {
    gridEl.innerHTML = "";
    gridEl.classList.remove("loading-state");
    e.forEach(game => {
        let t = document.createElement("div");
        t.className = "game-card";
        t.innerHTML = `<h3>${game.name}</h3> <i class="fas fa-play-circle"></i>`;
        t.onclick = () => loadGame(game);
        gridEl.appendChild(t);
    });
}

searchInput.oninput = e => {
    let t = e.target.value.toLowerCase();
    let sourceList = isCdnAvailable ? allGames : allGames.filter(g => g.url.includes("/complete/"));
    let a = sourceList.filter(game => game.name.toLowerCase().includes(t));
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