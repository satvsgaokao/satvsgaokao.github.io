import { SessionState } from "$lib/state.js";

export interface AHost {
    hostname: string;
    acode: string;
}


export interface Server { 
    name: string;
    hostname: string;
    path: string;
    priority: number;
    protocol: "http" | "https";
}



export let AHosts: AHost[] = [{
    hostname: "ccported.github.io",
    acode: "e/4/500442-526a-41af-9981-22db9286cd37.js"
}, {
    hostname: "ccported.click",
    acode: "5/2/0ff0b7-11f3-4bd8-b154-cfeed8597df1.js"
}];
export function setAHosts(ahosts: AHost[]) {
    AHosts = ahosts;
}

export const Servers: Server[] = [{
    name: "Charlie",
    hostname: "ccgstatic.com",
    path: "/games/",
    priority: 1,
    protocol: "https"
}, {
    name: "Bell",
    hostname: "ccportedgames.s3.us-west-2.amazonaws.com",
    path: "/",
    priority: 6,
    protocol: "https"
},
{
    name: "Olympic",
    hostname: "d1yh00vn2fvto7.cloudfront.net",
    path: "/games/",
    priority: 3,
    protocol: "https"
}, {
    name: "Shafiyoon",
    hostname: "d1cp3xh9gda0oe.cloudfront.net",
    path: "/games/",
    priority: 4,
    protocol: "https"
}, {
    name: "Racecar",
    hostname: "d1vqjbyryjpk97.cloudfront.net",
    path: "/games/",
    priority: 5,
    protocol: "https"
}, {
    name: "Ellay",
    hostname: "ccported.click",
    path: "/games/",
    priority: 2,
    protocol: "https"
}]


export const findSingleServer = async (): Promise<Server | null> => {
    try {
        const isSecureContext = typeof window !== "undefined" && window.isSecureContext;
        
        if (isSecureContext) {
            // For HTTPS sites, just return the first server from the local list
            const servers = await findServers();
            return servers && servers.length > 0 ? servers[0] : null;
        } else {
            // For HTTP sites, use the proxy endpoint
            const response = await fetch("https://z67jfipy20.execute-api.us-west-2.amazonaws.com/prod/servers/game", {
                mode: "cors"
            });
            if (!response.ok) {
                return null;
            }
            const text = await response.text();
            // Example response: "<GAMES> 44.243.124.75 proxy-1758086342367 /games/"
            // "<TYPE> HOST NAME PATh"
            const parts = text.trim().split(/\s+/);
            if (parts.length < 4) {
                return null;
            }
            return {
                name: parts[2],
                hostname: parts[1],
                path: parts[3],
                priority: 1,
                protocol: "http"
            };
        }
    } catch {
        return null;
    }
};

export const findServers = async (): Promise<Server[] | null> => {
    try {
        const isSecureContext = typeof window !== "undefined" && window.isSecureContext;

        // Define fetch URLs
        const localUrl = "/servers.txt";
        const proxyUrl = "https://z67jfipy20.execute-api.us-west-2.amazonaws.com/prod/servers";

        // Fetch both in parallel
        const fetches = [
            fetch(localUrl).catch(() => null),
            // fetch(proxyUrl, {
            //     mode: "cors"
            // }).catch(() => null)
        ];

        const [localRes, proxyRes] = await Promise.all(fetches);

        let servers: Server[] = [];

        // Parse local servers.txt (HTTPS)
        if (localRes && localRes.ok) {
            const text = await localRes.text();
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            const localServers: Server[] = lines.map((line, i) => {
                if (line.startsWith("#")) return null;
                const parts = line.split(',').map(p => p.trim());
                if (parts.length < 3) return null;
                return {
                    name: parts[1],
                    hostname: parts[0],
                    path: parts[2],
                    priority: i + 1,
                    protocol: "https"
                };
            }).filter(s => s !== null) as Server[];
            servers = servers.concat(localServers);
        }

        // Parse proxy servers.txt (HTTP)
        if (proxyRes && proxyRes.ok) {
            const text = await proxyRes.text();
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            const proxyServers: Server[] = lines.map((line, i) => {
                if (line.startsWith("#")) return null;
                if (!line.startsWith("<GAMES>")) return null;
                const parts = line.split(/\s+/);
                if (parts.length < 4) return null;
                return {
                    name: parts[2],
                    hostname: parts[1],
                    path: parts[3],
                    priority: i + 1,
                    protocol: "http"
                };
            }).filter(s => s !== null) as Server[];
            servers = servers.concat(proxyServers);
        }

        if (servers.length === 0) {
            return null;
        }
        return servers;
    } catch {
        return null;
    }
};


export const findAHosts = async (): Promise<AHost[]> => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/ahosts.txt` : "https://ccgstatic.com/ahosts.txt";
    const response = await fetch(url);
    if (!response.ok) {
        return AHosts;
    }
    const text = await response.text();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const ahosts: AHost[] = lines.map((line) => {
        const parts = line.split(',').map(p => p.trim());
        return {
            hostname: parts[0],
            acode: parts[1]
        };
    });
    return ahosts;
}